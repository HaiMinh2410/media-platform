import { db } from '../src/lib/db';

async function checkBotStatus() {
  const IG_PAGE_ID = '17841477493647789'; // Correct IG ID

  console.log(`🔍 Checking account for ID: ${IG_PAGE_ID}`);

  const account = await db.platformAccount.findFirst({
    where: { platform_user_id: IG_PAGE_ID },
    include: {
      bot_configurations: true,
      meta_tokens: true
    }
  });

  if (!account) {
    console.error('❌ Account not found!');
    return;
  }

  console.log('✅ Account found:', {
    id: account.id,
    name: account.platform_user_name,
    platform: account.platform,
    botActive: account.bot_configurations?.is_active,
    autoSend: account.bot_configurations?.auto_send,
    hasToken: account.meta_tokens.length > 0
  });

  const latestMessages = await db.message.findMany({
    where: {
      conversation: {
        account_id: account.id
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('💬 Latest Messages:', latestMessages.map(m => ({
    id: m.id,
    sender: m.senderType,
    text: m.content,
    time: m.createdAt
  })));

  const latestLogs = await db.aIReplyLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
    include: {
      message: true
    }
  });

  console.log('📝 Latest AI Logs:', latestLogs.map(l => ({
    id: l.id,
    status: l.status,
    model: l.model,
    reply: l.response,
    triggeredBy: l.message?.content,
    time: l.created_at
  })));
}

checkBotStatus().catch(console.error);
