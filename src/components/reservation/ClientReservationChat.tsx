 import { useState, useRef, useEffect } from 'react';
 import SignatureCanvas from 'react-signature-canvas';
 import { Phone, MessageSquare, Send, Image, Paperclip, Mic, X, PenTool, Check } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Badge } from '@/components/ui/badge';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from '@/components/ui/dialog';
 import { useChatRoom } from '@/hooks/useChatRoom';
 import { useAuth } from '@/hooks/useAuth';
 import { format } from 'date-fns';
 import { fr } from 'date-fns/locale';
 
 // Numéro de téléphone YAFOY
 const YAFOY_PHONE = '+221781234567';
 
 interface ClientReservationChatProps {
   roomId: string;
   organizerName?: string;
   organizerAvatar?: string;
   eventName?: string;
   onSignatureComplete?: (signatureDataUrl: string) => void;
 }
 
 export const ClientReservationChat = ({
   roomId,
   organizerName = 'Équipe YAFOY',
   organizerAvatar,
   eventName,
   onSignatureComplete,
 }: ClientReservationChatProps) => {
   const { user } = useAuth();
   const { messages, sendMessage, isSending, uploadFile } = useChatRoom(roomId);
   const [newMessage, setNewMessage] = useState('');
   const [showSignature, setShowSignature] = useState(false);
   const signatureRef = useRef<SignatureCanvas>(null);
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   // Auto-scroll to bottom on new messages
   useEffect(() => {
     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages]);
 
   const handleSendMessage = async () => {
     if (!newMessage.trim() || isSending) return;
     await sendMessage(newMessage, 'text');
     setNewMessage('');
   };
 
   const handleKeyPress = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       handleSendMessage();
     }
   };
 
   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     const url = await uploadFile(file);
     if (url) {
       const isImage = file.type.startsWith('image/');
       await sendMessage(file.name, isImage ? 'image' : 'file', url, file.name, file.size);
     }
   };
 
   const handleClearSignature = () => {
     signatureRef.current?.clear();
   };
 
   const handleSaveSignature = async () => {
     if (signatureRef.current?.isEmpty()) return;
     
     const dataUrl = signatureRef.current?.toDataURL('image/png');
     if (dataUrl) {
       // Convert to blob and upload
       const response = await fetch(dataUrl);
       const blob = await response.blob();
       const file = new File([blob], 'signature.png', { type: 'image/png' });
       
       const url = await uploadFile(file);
       if (url) {
         await sendMessage('Signature électronique', 'image', url, 'signature.png', file.size);
         onSignatureComplete?.(url);
       }
     }
     setShowSignature(false);
   };
 
   return (
     <div className="flex flex-col h-full bg-background">
       {/* Header with organizer info */}
       <div className="border-b p-4 bg-card">
         <div className="flex items-center gap-3">
           <Avatar className="h-12 w-12 border-2 border-primary">
             <AvatarImage src={organizerAvatar} />
             <AvatarFallback className="bg-primary text-primary-foreground">
               {organizerName.charAt(0)}
             </AvatarFallback>
           </Avatar>
           <div className="flex-1">
             <h3 className="font-semibold text-lg">Interlocuteur</h3>
             <p className="text-sm text-muted-foreground">{organizerName}</p>
           </div>
           {eventName && (
             <Badge variant="secondary" className="hidden sm:flex">
               {eventName}
             </Badge>
           )}
         </div>
       </div>
 
       {/* Action Buttons */}
       <div className="p-4 border-b bg-muted/30">
         <div className="grid grid-cols-2 gap-3">
           <Button
             asChild
             size="lg"
             className="h-14 bg-green-600 hover:bg-green-700 text-white font-semibold"
           >
             <a href={`tel:${YAFOY_PHONE}`}>
               <Phone className="mr-2 h-5 w-5" />
               APPELER
             </a>
           </Button>
           <Button
             size="lg"
             variant="default"
             className="h-14 font-semibold"
             onClick={() => document.getElementById('message-input')?.focus()}
           >
             <MessageSquare className="mr-2 h-5 w-5" />
             DISCUTER
           </Button>
         </div>
         
         {/* Signature Button */}
         <Button
           variant="outline"
           className="w-full mt-3 h-12"
           onClick={() => setShowSignature(true)}
         >
           <PenTool className="mr-2 h-5 w-5" />
           Signer électroniquement
         </Button>
       </div>
 
       {/* Messages Area */}
       <ScrollArea className="flex-1 p-4">
         <div className="space-y-4">
           {messages.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
               <p>Démarrez la conversation avec votre organisateur</p>
             </div>
           ) : (
             messages.map((message) => {
               const isOwn = message.sender_id === user?.id;
               return (
                 <div
                   key={message.id}
                   className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                 >
                   <div
                     className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                       isOwn
                         ? 'bg-primary text-primary-foreground rounded-br-none'
                         : 'bg-muted rounded-bl-none'
                     }`}
                   >
                     {message.message_type === 'image' && message.file_url && (
                       <img
                         src={message.file_url}
                         alt={message.file_name || 'Image'}
                         className="rounded-lg max-w-full mb-2"
                       />
                     )}
                     {message.message_type === 'file' && message.file_url && (
                       <a
                         href={message.file_url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center gap-2 text-sm underline"
                       >
                         <Paperclip className="h-4 w-4" />
                         {message.file_name}
                       </a>
                     )}
                     {message.content && (
                       <p className="text-sm">{message.content}</p>
                     )}
                     <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                       {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                     </p>
                   </div>
                 </div>
               );
             })
           )}
           <div ref={messagesEndRef} />
         </div>
       </ScrollArea>
 
       {/* Input Area */}
       <div className="border-t p-4 bg-card">
         <div className="flex items-center gap-2">
           <input
             type="file"
             ref={fileInputRef}
             onChange={handleFileUpload}
             className="hidden"
             accept="image/*,.pdf,.doc,.docx"
           />
           <Button
             variant="ghost"
             size="icon"
             className="shrink-0"
             onClick={() => fileInputRef.current?.click()}
           >
             <Image className="h-5 w-5 text-muted-foreground" />
           </Button>
           <Button
             variant="ghost"
             size="icon"
             className="shrink-0"
             onClick={() => {
               if (fileInputRef.current) {
                 fileInputRef.current.accept = '*/*';
                 fileInputRef.current.click();
               }
             }}
           >
             <Paperclip className="h-5 w-5 text-muted-foreground" />
           </Button>
           <Button
             variant="ghost"
             size="icon"
             className="shrink-0"
           >
             <Mic className="h-5 w-5 text-muted-foreground" />
           </Button>
           <Input
             id="message-input"
             placeholder="Votre message..."
             value={newMessage}
             onChange={(e) => setNewMessage(e.target.value)}
             onKeyPress={handleKeyPress}
             className="flex-1"
           />
           <Button
             size="icon"
             onClick={handleSendMessage}
             disabled={!newMessage.trim() || isSending}
           >
             <Send className="h-5 w-5" />
           </Button>
         </div>
       </div>
 
       {/* Signature Dialog */}
       <Dialog open={showSignature} onOpenChange={setShowSignature}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Signature électronique</DialogTitle>
           </DialogHeader>
           <div className="border rounded-lg bg-white p-2">
             <SignatureCanvas
               ref={signatureRef}
               penColor="black"
               canvasProps={{
                 width: 400,
                 height: 200,
                 className: 'signature-canvas w-full',
               }}
             />
           </div>
           <DialogFooter className="flex gap-2">
             <Button variant="outline" onClick={handleClearSignature}>
               <X className="h-4 w-4 mr-2" />
               Effacer
             </Button>
             <Button onClick={handleSaveSignature}>
               <Check className="h-4 w-4 mr-2" />
               Valider la signature
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 };