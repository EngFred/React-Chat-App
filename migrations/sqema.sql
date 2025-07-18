-- migrations/schema.sql (run in Supabase Dashboard SQL Editor)
-- Create tables for users, conversations, and messages
-- Matches User, Conversation, and Message types in the frontend

-- Table for users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  profile_picture TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'private',
  participants UUID[] NOT NULL,
  last_message_id UUID,
  unread_count INTEGER DEFAULT 0,
  typing_users UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,
  read_by UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row-Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY user_access ON users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY conversation_access ON conversations
  FOR ALL
  USING (auth.uid() = ANY(participants))
  WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY message_access ON messages
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id AND auth.uid() = ANY(participants)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id AND auth.uid() = ANY(participants)
  ));

-- Indexes for performance
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);