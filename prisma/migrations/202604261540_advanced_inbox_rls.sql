-- Migration: Advanced Inbox RLS
-- Description: Enables RLS for unified_profiles and adds workspace-based policies.

-- Enable RLS for unified_profiles
ALTER TABLE "public"."unified_profiles" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view unified profiles of their workspace" ON "public"."unified_profiles";
DROP POLICY IF EXISTS "Users can insert unified profiles for their workspace" ON "public"."unified_profiles";
DROP POLICY IF EXISTS "Users can update unified profiles for their workspace" ON "public"."unified_profiles";
DROP POLICY IF EXISTS "Users can delete unified profiles for their workspace" ON "public"."unified_profiles";

-- Create policies for unified_profiles
CREATE POLICY "Users can view unified profiles of their workspace"
ON "public"."unified_profiles"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "public"."workspace_members" wm
    WHERE wm.workspace_id = "public"."unified_profiles".workspace_id
    AND wm.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can insert unified profiles for their workspace"
ON "public"."unified_profiles"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."workspace_members" wm
    WHERE wm.workspace_id = workspace_id
    AND wm.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can update unified profiles for their workspace"
ON "public"."unified_profiles"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "public"."workspace_members" wm
    WHERE wm.workspace_id = "public"."unified_profiles".workspace_id
    AND wm.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can delete unified profiles for their workspace"
ON "public"."unified_profiles"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "public"."workspace_members" wm
    WHERE wm.workspace_id = "public"."unified_profiles".workspace_id
    AND wm.profile_id = auth.uid()
  )
);

-- Enable Realtime for unified_profiles (requires replication to be enabled in Supabase dashboard, 
-- but this SQL adds it to the publication)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "public"."unified_profiles";
  END IF;
END $$;
