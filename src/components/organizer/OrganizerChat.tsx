import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Image, Paperclip, Mic, MicOff, Users, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { useChatRoom } from '@/hooks/useChatRoom';
import { useAuth } from '@/hooks/useAuth';
import { validateChatMessage } from '@/utils/chatValidation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Reservation } from './OrganizerConversationList';

const EVENT_TYPE_LABELS: Record<string, string> = {
  mariage: 'Mariage',
  bapteme: 'Baptême',
  anniversaire: 'Anniversaire',
  fete_entreprise: "Fête d'entreprise",
  communion: 'Communion',
  fiancailles: 'Fiançailles',
  autre: 'Autre',
};

interface Props {
  selectedReservation: Reservation | null;
}

export const OrganizerChat = ({ selectedReservation }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { messages, sendMessage, isSending, uploadFile } = useChatRoom(
    selectedReservation?.chatRoomId || null
  );
  const [newMessage, setNewMessage] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (inputError) setInputError(null);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const validation = validateChatMessage(newMessage.trim());
    if (!validation.isValid) {
      setInputError(validation.message || 'Message invalide');
      toast({
        title: 'Message non autorisé',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    const success = await sendMessage(newMessage.trim(), 'text');
    if (success) {
      setNewMessage('');
      setInputError(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file);
    if (url) {
      await sendMessage(file.name, type, url, file.name, file.size);
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

  // No need for global ref - quote sending uses parent's useChatRoom

  if (!selectedReservation) {
    return (
      <Card className="lg:col-span-5 flex flex-col">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sélectionnez une conversation</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-5 flex flex-col">
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {selectedReservation.eventName || EVENT_TYPE_LABELS[selectedReservation.eventType]}
          </CardTitle>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            <span>{selectedReservation.guestCount} invités</span>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Démarrez la conversation</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const senderName = (msg as any).sender?.full_name || selectedReservation.clientName || 'Client';
              const senderAvatar = (msg as any).sender?.avatar_url;
              const senderInitial = senderName.charAt(0).toUpperCase();
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex items-end gap-2 max-w-[80%]">
                    {!isOwn && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={senderAvatar} />
                        <AvatarFallback className="text-xs bg-muted">{senderInitial}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      {!isOwn && (
                        <p className="text-xs text-muted-foreground mb-1">{senderName}</p>
                      )}
                      {isOwn && (
                        <p className="text-xs text-muted-foreground mb-1 text-right">Moi</p>
                      )}
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2',
                          isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}
                      >
                        {msg.message_type === 'image' && msg.file_url && (
                          <img
                            src={msg.file_url}
                            alt="Image"
                            className="rounded-lg max-w-full mb-2 cursor-pointer"
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
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4" />
                            <audio controls src={msg.file_url} className="h-8" />
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-right' : ''} text-muted-foreground`}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                    {isOwn && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">Moi</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={imageInputRef}
            onChange={(e) => handleFileUpload(e, 'image')}
            className="hidden"
            accept="image/*"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e, 'file')}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => imageInputRef.current?.click()}
          >
            <Image className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5 text-primary" />
          </Button>
          <Button
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            className="shrink-0"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <span className="text-xs">{formatTime(recordingTime)}</span>
            ) : (
              <Mic className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
          <div className="flex-1 flex flex-col">
            <Input
              placeholder="Écrivez un message..."
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
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
          <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim() || isRecording} size="icon">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
};
