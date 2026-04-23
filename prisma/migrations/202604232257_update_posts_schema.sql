-- Migration: Update posts table for Phase 8 Scheduler
-- Description: Adds title, published_at, error_message, and metadata columns. 
-- Also ensures RLS is enabled and policies are set.

ALTER TABLE "public"."posts" 
ADD COLUMN IF NOT EXISTS "title" TEXT,
ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "error_message" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';

-- Ensure RLS is enabled
ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts during migration
DROP POLICY IF EXISTS "Users can view posts of their workspace accounts" ON "public"."posts";
DROP POLICY IF EXISTS "Users can insert posts for their workspace accounts" ON "public"."posts";
DROP POLICY IF EXISTS "Users can update posts for their workspace accounts" ON "public"."posts";
DROP POLICY IF EXISTS "Users can delete posts for their workspace accounts" ON "public"."posts";

-- Create refined policies
CREATE POLICY "Users can view posts of their workspace accounts"
ON "public"."posts"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "public"."platform_accounts" pa
    JOIN "public"."workspace_members" wm ON pa.workspace_id = wm.workspace_id
    WHERE pa.id = "public"."posts".account_id
    AND wm.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can insert posts for their workspace accounts"
ON "public"."posts"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."platform_accounts" pa
    JOIN "public"."workspace_members" wm ON pa.workspace_id = wm.workspace_id
    WHERE pa.id = account_id
    AND wm.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can update posts for their workspace accounts"
ON "public"."posts"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "public"."platform_accounts" pa
    JOIN "public"."workspace_members" wm ON pa.workspace_id = wm.workspace_id
    WHERE pa.id = "public"."posts".account_id
    AND wm.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can delete posts for their workspace accounts"
ON "public"."posts"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "public"."platform_accounts" pa
    JOIN "public"."workspace_members" wm ON pa.workspace_id = wm.workspace_id
    WHERE pa.id = "public"."posts".account_id
    AND wm.profile_id = auth.uid()
  )
);
