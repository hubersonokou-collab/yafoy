import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'image' | 'file' | 'voice';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  voice_duration: number | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  event_planning_id: string;
  created_by: string;
  created_at: string;
}

export const useChatRoom = (roomId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch room details
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const fetchRoom = async () => {
      const { data } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (data) {
        setRoom(data as ChatRoom);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Fetch messages and subscribe to realtime updates
  useEffect(() => {
    if (!roomId) return;

    setIsLoading(true);

    const fetchMessages = async () => {
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (messagesData && messagesData.length > 0) {
        // Get unique sender IDs
        const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
        
        // Fetch profiles separately
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', senderIds);

        const profilesMap = (profilesData || []).reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);

        // Merge messages with sender info
        const messagesWithSenders = messagesData.map(msg => ({
          ...msg,
          message_type: msg.message_type as 'text' | 'image' | 'file' | 'voice',
          sender: profilesMap[msg.sender_id] || { full_name: null, avatar_url: null },
        }));

        setMessages(messagesWithSenders as unknown as ChatMessage[]);
      } else {
        setMessages([]);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    channelRef.current = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch sender profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .maybeSingle();

          const messageWithSender = {
            ...newMessage,
            message_type: newMessage.message_type as 'text' | 'image' | 'file' | 'voice',
            sender: profileData || { full_name: null, avatar_url: null },
          };

          setMessages(prev => [...prev, messageWithSender as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId]);

  const sendMessage = useCallback(async (
    content: string,
    type: 'text' | 'image' | 'file' | 'voice' = 'text',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    voiceDuration?: number
  ) => {
    if (!roomId || !user) return false;

    setIsSending(true);
    try {
      const { error } = await supabase.from('chat_messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content: type === 'text' ? content : null,
        message_type: type,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_size: fileSize || null,
        voice_duration: voiceDuration || null,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer le message",
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSending(false);
    }
  }, [roomId, user, toast]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de télécharger le fichier",
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  return {
    room,
    messages,
    isLoading,
    isSending,
    sendMessage,
    uploadFile,
  };
};
