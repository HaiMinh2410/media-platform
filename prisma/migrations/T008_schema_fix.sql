-- Migration: T008 Workspace & Inbox Schema Adjustment
-- Description: Align DB tables with Phase 2 requirements

-- 1. Fix Profiles FK to auth.users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Update Conversations with status
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- Ensure status is one of the allowed values
-- Check if constraint exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_status_check'
    ) THEN
        ALTER TABLE public.conversations
        ADD CONSTRAINT conversations_status_check CHECK (status IN ('open', 'pending_agent', 'resolved', 'spam'));
    END IF;
END $$;

-- 3. Update Messages with sender_type
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'user';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_sender_type_check'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_sender_type_check CHECK (sender_type IN ('user', 'agent', 'bot', 'ai'));
    END IF;
END $$;

-- 4. Ensure updated_at triggers exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at to tables if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.bot_configurations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create triggers (using DO to ignore if already exists is complex for triggers, 
-- but we can DROP and CREATE or just use IF NOT EXISTS pattern if available in newer PG, 
-- but usually we do DROP IF EXISTS)
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER tr_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_bot_configurations_updated_at ON public.bot_configurations;
CREATE TRIGGER tr_bot_configurations_updated_at BEFORE UPDATE ON public.bot_configurations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
