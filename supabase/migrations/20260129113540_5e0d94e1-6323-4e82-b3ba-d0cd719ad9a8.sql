-- Create event types enum
CREATE TYPE public.event_type AS ENUM (
  'mariage', 
  'bapteme', 
  'anniversaire', 
  'fete_entreprise', 
  'communion', 
  'fiancailles',
  'autre'
);

-- Create event planning requests table
CREATE TABLE public.event_planning_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  event_name TEXT,
  budget_min NUMERIC NOT NULL DEFAULT 0,
  budget_max NUMERIC NOT NULL,
  guest_count INTEGER NOT NULL,
  event_date DATE,
  event_location TEXT,
  services_needed TEXT[] DEFAULT '{}',
  additional_notes TEXT,
  ai_recommendations JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_planning_id UUID NOT NULL REFERENCES public.event_planning_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat room participants table
CREATE TABLE public.chat_room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('organizer', 'provider', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  voice_duration INTEGER,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create selected providers for event planning
CREATE TABLE public.event_selected_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_planning_id UUID NOT NULL REFERENCES public.event_planning_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID REFERENCES public.products(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_planning_id, provider_id, product_id)
);

-- Enable RLS
ALTER TABLE public.event_planning_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_selected_providers ENABLE ROW LEVEL SECURITY;

-- RLS for event_planning_requests
CREATE POLICY "Users can view their own event planning requests"
ON public.event_planning_requests FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own event planning requests"
ON public.event_planning_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own event planning requests"
ON public.event_planning_requests FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own event planning requests"
ON public.event_planning_requests FOR DELETE
USING (user_id = auth.uid());

-- RLS for chat_rooms
CREATE POLICY "Participants can view their chat rooms"
ON public.chat_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_room_participants
    WHERE room_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can create chat rooms"
ON public.chat_rooms FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Organizers can update their chat rooms"
ON public.chat_rooms FOR UPDATE
USING (created_by = auth.uid());

-- RLS for chat_room_participants
CREATE POLICY "Participants can view room participants"
ON public.chat_room_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_room_participants crp
    WHERE crp.room_id = chat_room_participants.room_id AND crp.user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can add participants"
ON public.chat_room_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = room_id AND created_by = auth.uid()
  )
);

-- RLS for chat_messages
CREATE POLICY "Participants can view messages in their rooms"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_room_participants
    WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Participants can send messages to their rooms"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_room_participants
    WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
  )
);

-- RLS for event_selected_providers
CREATE POLICY "Users can view selected providers for their events"
ON public.event_selected_providers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_planning_requests
    WHERE id = event_planning_id AND user_id = auth.uid()
  )
  OR provider_id = auth.uid()
);

CREATE POLICY "Users can add providers to their events"
ON public.event_selected_providers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_planning_requests
    WHERE id = event_planning_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Providers can update their selection status"
ON public.event_selected_providers FOR UPDATE
USING (provider_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_room_participants_room_id ON public.chat_room_participants(room_id);
CREATE INDEX idx_chat_room_participants_user_id ON public.chat_room_participants(user_id);
CREATE INDEX idx_event_planning_user_id ON public.event_planning_requests(user_id);

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat files
CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-files' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view chat files"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-files');

-- Triggers for updated_at
CREATE TRIGGER update_event_planning_requests_updated_at
BEFORE UPDATE ON public.event_planning_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();