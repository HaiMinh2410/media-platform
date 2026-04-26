// scripts/apply-rls-t077.ts
// Run with: bun run scripts/apply-rls-t077.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Applying RLS policies for T077 tables...');

  await prisma.$executeRawUnsafe(`ALTER TABLE public.customer_identities ENABLE ROW LEVEL SECURITY`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.customer_platform_mappings ENABLE ROW LEVEL SECURITY`);

  // Drop policies if they exist to allow re-run
  await prisma.$executeRawUnsafe(`
    DROP POLICY IF EXISTS "Workspace members can access customer identities" ON public.customer_identities
  `);
  await prisma.$executeRawUnsafe(`
    DROP POLICY IF EXISTS "Workspace members can access customer platform mappings" ON public.customer_platform_mappings
  `);

  await prisma.$executeRawUnsafe(`
    CREATE POLICY "Workspace members can access customer identities"
      ON public.customer_identities
      FOR ALL
      USING (
        workspace_id IN (
          SELECT wm.workspace_id FROM public.workspace_members wm
          WHERE wm.profile_id = auth.uid()
        )
      )
      WITH CHECK (
        workspace_id IN (
          SELECT wm.workspace_id FROM public.workspace_members wm
          WHERE wm.profile_id = auth.uid()
        )
      )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE POLICY "Workspace members can access customer platform mappings"
      ON public.customer_platform_mappings
      FOR ALL
      USING (
        identity_id IN (
          SELECT ci.id FROM public.customer_identities ci
          INNER JOIN public.workspace_members wm ON ci.workspace_id = wm.workspace_id
          WHERE wm.profile_id = auth.uid()
        )
      )
      WITH CHECK (
        identity_id IN (
          SELECT ci.id FROM public.customer_identities ci
          INNER JOIN public.workspace_members wm ON ci.workspace_id = wm.workspace_id
          WHERE wm.profile_id = auth.uid()
        )
      )
  `);

  console.log('✅ RLS policies applied successfully for T077.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Failed to apply RLS:', e);
  process.exit(1);
});
