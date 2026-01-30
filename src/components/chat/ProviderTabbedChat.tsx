import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  Mic, 
  Loader2, 
  Users,
  Play,
  Pause,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { useChatRoom } from '@/hooks/useChatRoom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { validateChatMessage } from '@/utils/chatValidation';
import { useToast } from '@/hooks/use-toast';

interface Participant {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface ProviderTabbedChatProps {
  roomId: string;
  participants: Participant[];
}

export const ProviderTabbedChat = ({ roomId, participants }: ProviderTabbedChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { room, messages, isLoading, isSending, sendMessage, uploadFile } = useChatRoom(roomId);
  
  // Get only provider participants (exclude organizer/client)
  const providers = participants.filter(p => p.role === 'provider');
  
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || '');
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter messages for the selected provider conversation
  // Show messages between current user and selected provider only
  const filteredMessages = messages.filter(msg => {
    const isFromMe = msg.sender_id === user?.id;
    const isFromSelectedProvider = msg.sender_id === selectedProviderId;
    return isFromMe || isFromSelectedProvider;
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages]);

  // Set first provider as default when participants load
  useEffect(() => {
    if (providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (inputError) setInputError(null);
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const validation = validateChatMessage(input.trim());
    if (!validation.isValid) {
      setInputError(validation.message || 'Message invalide');
      toast({
        title: 'Message non autorisé',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    const success = await sendMessage(input.trim(), 'text');
    if (success) {
      setInput('');
      setInputError(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file);
    if (url) {
      await sendMessage('', type, url, file.name, file.size);
    }
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = await uploadFile(new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }));
        if (url) {
          await sendMessage('', 'voice', url, undefined, undefined, recordingTime);
        }
        setRecordingTime(0);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playVoice = (url: string) => {
    if (playingVoice === url) {
      setPlayingVoice(null);
    } else {
      setPlayingVoice(url);
      const audio = new Audio(url);
      audio.onended = () => setPlayingVoice(null);
      audio.play();
    }
  };

  const getProviderMessageCount = (providerId: string) => {
    return messages.filter(msg => 
      msg.sender_id === providerId || 
      (msg.sender_id === user?.id && messages.some(m => m.sender_id === providerId))
    ).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full py-16">
          <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Aucun prestataire</p>
          <p className="text-sm text-muted-foreground/70">Ajoutez des prestataires pour démarrer la conversation</p>
        </CardContent>
      </Card>
    );
  }

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{room?.name || 'Discussion'}</CardTitle>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{providers.length} prestataire(s)</span>
          </div>
        </div>
        
        {/* Security Warning */}
        <Alert variant="destructive" className="mt-3 py-2">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Il est interdit de partager vos contacts et emails. Utilisez cette messagerie sécurisée.
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Provider Tabs */}
        <Tabs value={selectedProviderId} onValueChange={setSelectedProviderId} className="flex flex-col h-full">
          <div className="border-b px-4 pt-2">
            <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
              {providers.map((provider) => (
                <TabsTrigger
                  key={provider.id}
                  value={provider.id}
                  className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={provider.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {provider.full_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate max-w-[100px]">
                    {provider.full_name || 'Prestataire'}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={selectedProviderId} className="flex-1 flex flex-col m-0 overflow-hidden">
            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              <div className="space-y-4 py-4">
                {filteredMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Avatar className="h-16 w-16 mx-auto mb-4">
                      <AvatarImage src={selectedProvider?.avatar_url || undefined} />
                      <AvatarFallback className="text-xl">
                        {selectedProvider?.full_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{selectedProvider?.full_name || 'Prestataire'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Démarrez la conversation avec ce prestataire
                    </p>
                  </div>
                )}

                {filteredMessages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  const senderName = msg.sender?.full_name || 'Utilisateur';

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-3',
                        isMe ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!isMe && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.sender?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {senderName[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={cn('max-w-[70%]', isMe ? 'text-right' : 'text-left')}>
                        {!isMe && (
                          <p className="text-xs text-muted-foreground mb-1">{senderName}</p>
                        )}
                        
                        <div
                          className={cn(
                            'rounded-lg px-4 py-2',
                            isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          )}
                        >
                          {msg.message_type === 'text' && (
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          )}

                          {msg.message_type === 'image' && msg.file_url && (
                            <img 
                              src={msg.file_url} 
                              alt="Image" 
                              className="max-w-full rounded cursor-pointer"
                              onClick={() => window.open(msg.file_url!, '_blank')}
                            />
                          )}

                          {msg.message_type === 'file' && msg.file_url && (
                            <a 
                              href={msg.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 underline"
                            >
                              <Paperclip className="h-4 w-4" />
                              {msg.file_name || 'Fichier'}
                            </a>
                          )}

                          {msg.message_type === 'voice' && msg.file_url && (
                            <button
                              onClick={() => playVoice(msg.file_url!)}
                              className="flex items-center gap-2"
                            >
                              {playingVoice === msg.file_url ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                              <span className="text-sm">
                                Note vocale {msg.voice_duration ? `(${formatTime(msg.voice_duration)})` : ''}
                              </span>
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                        </p>
                      </div>

                      {isMe && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-secondary">Moi</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendText} className="flex gap-2">
                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'file')}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant={isRecording ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <span className="text-xs">{formatTime(recordingTime)}</span>
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>

                <div className="flex-1 flex flex-col">
                  <Input
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={`Message à ${selectedProvider?.full_name || 'ce prestataire'}...`}
                    disabled={isSending || isRecording}
                    className={cn("flex-1", inputError && "border-destructive")}
                  />
                  {inputError && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {inputError}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isSending || !input.trim() || isRecording}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
