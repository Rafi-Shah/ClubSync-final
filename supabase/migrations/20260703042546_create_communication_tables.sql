/*
# Communication Center — Tables Only (no policies)

1. Purpose
   Creates the chat and notification tables. Policies are added in a follow-up
   migration because the conversations RLS policy references
   conversation_participants, which must exist first.

2. New Tables
   - conversations, conversation_participants, messages,
     message_read_receipts, notifications

3. Notes
   - RLS is ENABLED here but NO policies are created yet, so all access is
     locked until the next migration adds policies. This is intentional and
     keeps the split clean.
*/

CREATE TABLE IF NOT EXISTS conversations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type   text NOT NULL
                        CHECK (conversation_type IN ('direct','team','executive','broadcast')),
  title               text,
  related_team_id     uuid REFERENCES teams(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  last_message_at     timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_team ON conversations(related_team_id);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  is_admin        boolean NOT NULL DEFAULT false,
  last_read_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_conv_part_member ON conversation_participants(member_id);
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_member_id  uuid REFERENCES members(id) ON DELETE SET NULL,
  body              text NOT NULL,
  attachment_url    text,
  attachment_type   text,
  is_edited         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS message_read_receipts (
  message_id  uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  read_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, member_id)
);
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  link        text,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
