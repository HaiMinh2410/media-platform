import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log('=== Checking DB Ingestion & Processing Status ===\n');

  // 1. Lấy 10 raw logs mới nhất
  const latestLogs = await db.platformEventLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      webhookEvents: {
        orderBy: { receivedAt: 'desc' }
      }
    }
  });

  console.log(`📋 10 raw webhook logs mới nhất nhận được:`);
  for (const log of latestLogs) {
    console.log(`\n────────────────────────────────────────────────────────────`);
    console.log(`[Log ID: ${log.id}] [Created: ${log.createdAt.toISOString()}] [Status: ${log.status}]`);
    
    // Phân tích payload để xem tin nhắn từ đâu tới
    const payload = log.payload as any;
    const entry = payload?.entry?.[0];
    const id = entry?.id;
    const object = payload?.object;
    
    let text = '';
    let senderId = '';
    if (entry?.messaging?.[0]) {
      const msgObj = entry.messaging[0];
      senderId = msgObj.sender?.id;
      text = msgObj.message?.text || JSON.stringify(msgObj);
    } else if (entry?.changes?.[0]) {
      const change = entry.changes[0];
      text = `Change field: ${change.field}`;
    }

    console.log(`  🔹 Object: ${object} | ID nhận: ${id}`);
    console.log(`  🔹 Sender: ${senderId} | Nội dung: "${text}"`);
    console.log(`  🔹 Đã parse thành WebhookEvent: ${log.webhookEvents.length > 0 ? '✅ Có' : '❌ Không'}`);
    
    if (log.webhookEvents.length > 0) {
      for (const ev of log.webhookEvents) {
        console.log(`    └─ WebhookEvent ID: ${ev.id} | ExternalSender: ${ev.externalSenderId} | Text: "${ev.messageText}"`);
        
        // Kiểm tra xem có Conversation và Message tương ứng trong DB không
        const convo = await db.conversation.findFirst({
          where: {
            platform_conversation_id: ev.externalSenderId // For IG, conversation ID is often the sender ID
          },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 3
            }
          }
        });

        if (convo) {
          console.log(`      └─ ✅ Tìm thấy Conversation: ID: ${convo.id} | Name: ${convo.customer_name} | Platform: ${convo.customer_username}`);
          console.log(`      └─ Số tin nhắn: ${convo.messages.length}`);
          for (const msg of convo.messages) {
            console.log(`        ├─ Message ID: ${msg.id} | Sender: ${msg.senderId} | Text: "${msg.content}" | Created: ${msg.createdAt.toISOString()}`);
          }
        } else {
          // Thử tìm theo mapping
          const mapping = await db.customerPlatformMapping.findFirst({
            where: { external_sender_id: ev.externalSenderId },
            include: { conversation: { include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } } } }
          });
          if (mapping) {
            console.log(`      └─ ✅ Tìm thấy qua mapping: Convo ID: ${mapping.conversation.id} | Platform: ${mapping.platform}`);
            console.log(`        ├─ Last Msg: "${mapping.conversation.messages[0]?.content}"`);
          } else {
            console.log(`      └─ ❌ KHÔNG tìm thấy Conversation hay Mapping nào cho Sender ID: ${ev.externalSenderId} trong DB!`);
          }
        }
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
