import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL
      }
    }
  })

  try {
    console.log('🚀 Enabling Supabase Replication...')
    
    await prisma.$executeRawUnsafe(`
      BEGIN;
        -- Check if publication exists, if not create it (standard Supabase name)
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
            CREATE PUBLICATION supabase_realtime;
          END IF;
        END $$;

        -- Add tables to replication
        -- Note: We use 'alter publication ... add' but it may fail if already added, 
        -- so we drop first if already present in any publication to be clean, 
        -- or just use a DO block to check.
        
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_reply_logs;
      COMMIT;
    `).catch(err => {
      // If tables are already in the publication, it might throw. We can ignore that specific error.
      if (err.message.includes('already exists in publication')) {
        console.log('ℹ️ Some tables already in publication, continuing...')
      } else {
        throw err
      }
    })

    console.log('✅ Replication enabled for: conversations, messages, ai_reply_logs')
  } catch (error) {
    console.error('❌ Failed to enable replication:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
