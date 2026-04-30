-- Migration: T082 Account Groups & Scoped Inbox Schema
-- Description: Setup RLS for account groups and create unified inbox query functions.

-- 1. RLS for account_groups
ALTER TABLE "public"."account_groups" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view account groups of their workspace" ON "public"."account_groups";
CREATE POLICY "Users can view account groups of their workspace"
ON "public"."account_groups" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "public"."workspace_members" wm
    WHERE wm.workspace_id = "public"."account_groups".workspace_id
    AND wm.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage account groups of their workspace" ON "public"."account_groups";
CREATE POLICY "Users can manage account groups of their workspace"
ON "public"."account_groups" FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "public"."workspace_members" wm
    WHERE wm.workspace_id = "public"."account_groups".workspace_id
    AND wm.profile_id = auth.uid()
    AND wm.role IN ('admin', 'owner')
  )
);

-- 2. RLS for account_group_members
ALTER TABLE "public"."account_group_members" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view account group members" ON "public"."account_group_members";
CREATE POLICY "Users can view account group members"
ON "public"."account_group_members" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "public"."account_groups" ag
    JOIN "public"."workspace_members" wm ON wm.workspace_id = ag.workspace_id
    WHERE ag.id = "public"."account_group_members".group_id
    AND wm.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage account group members" ON "public"."account_group_members";
CREATE POLICY "Users can manage account group members"
ON "public"."account_group_members" FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "public"."account_groups" ag
    JOIN "public"."workspace_members" wm ON wm.workspace_id = ag.workspace_id
    WHERE ag.id = "public"."account_group_members".group_id
    AND wm.profile_id = auth.uid()
    AND wm.role IN ('admin', 'owner')
  )
);

-- 3. Unified Contact View (Tier 4)
CREATE OR REPLACE VIEW "public"."unified_contacts_summary" AS
SELECT 
    ci.id as identity_id,
    ci.workspace_id,
    ci.customer_name,
    ci.customer_avatar,
    MAX(c.last_message_at) as last_message_at,
    COUNT(DISTINCT c.id) as platform_count
FROM "public"."customer_identities" ci
LEFT JOIN "public"."customer_platform_mappings" cpm ON cpm.identity_id = ci.id
LEFT JOIN "public"."conversations" c ON c.id = cpm.conversation_id
GROUP BY ci.id, ci.workspace_id, ci.customer_name, ci.customer_avatar;

-- 4. 4-Tier Inbox Query Function
CREATE OR REPLACE FUNCTION "public"."get_inbox_conversations"(
  p_workspace_id UUID,
  p_group_id UUID DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_identity_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  platform_conversation_id TEXT,
  last_message_at TIMESTAMPTZ,
  status TEXT,
  customer_name TEXT,
  customer_avatar TEXT,
  priority TEXT,
  sentiment TEXT,
  tags TEXT[],
  is_vip BOOLEAN,
  identity_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify workspace access
  IF NOT EXISTS (
    SELECT 1 FROM "public"."workspace_members" 
    WHERE workspace_id = p_workspace_id 
    AND profile_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.account_id,
    c.platform_conversation_id,
    c.last_message_at,
    c.status,
    c.customer_name,
    c.customer_avatar,
    c.priority,
    c.sentiment,
    c.tags,
    c.is_vip,
    cpm.identity_id
  FROM "public"."conversations" c
  LEFT JOIN "public"."customer_platform_mappings" cpm ON cpm.conversation_id = c.id
  JOIN "public"."platform_accounts" pa ON pa.id = c.account_id
  WHERE pa.workspace_id = p_workspace_id
    -- Tier 2: Scoped (Account Group)
    AND (p_group_id IS NULL OR c.account_id IN (
      SELECT agm.account_id FROM "public"."account_group_members" agm WHERE agm.group_id = p_group_id
    ))
    -- Tier 3: Single Account
    AND (p_account_id IS NULL OR c.account_id = p_account_id)
    -- Tier 4: Unified Contact
    AND (p_identity_id IS NULL OR cpm.identity_id = p_identity_id)
  ORDER BY c.last_message_at DESC;
END;
$$;
