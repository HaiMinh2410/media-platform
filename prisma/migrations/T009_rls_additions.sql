-- Migration: T009 DB Row Level Security (RLS) Implementation
-- Description: Adding missing policies for Conversations, Messages and Analytics

-- 1. Conversations: Allow members to update status
CREATE POLICY "Members can update conversation status" ON public.conversations
FOR UPDATE TO authenticated
USING (has_account_access(account_id))
WITH CHECK (has_account_access(account_id));

-- 2. Messages: Allow members to insert new messages (replies)
-- Note: We check if the user belongs to the workspace associated with the conversation
CREATE POLICY "Members can insert messages to their conversations" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND has_account_access(c.account_id)
    )
);

-- 3. Analytics Snapshots: Members can view
-- (Already seems to have SELECT in the audit, let's double check or re-apply if missing)
-- Based on audit, it had SELECT.

-- 4. TikTok tokens/refreshes: Ensure they are fully covered for SELECT
-- (Already handled by has_account_access in audit)

-- 5. AI Reply Logs: Allow insert if UI generates suggestions
CREATE POLICY "Members can insert ai_reply_logs" ON public.ai_reply_logs
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversations c ON c.id = m.conversation_id
        WHERE m.id = message_id
        AND has_account_access(c.account_id)
    )
);

-- 6. Ensure all tables have RLS enabled (Safety check)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reply_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_token_refreshes ENABLE ROW LEVEL SECURITY;
