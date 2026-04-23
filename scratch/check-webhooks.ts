import { db } from '../src/lib/db';

async function checkWebhooks() {
  console.log('🔍 Đang kiểm tra lịch sử Webhook để tìm Page ID chuẩn...');

  const events = await db.webhookEvent.findMany({
    take: 5,
    orderBy: { receivedAt: 'desc' }
  });

  if (events.length === 0) {
    console.log('📭 Chưa nhận được sự kiện webhook nào. Hãy thử gửi 1 tin nhắn từ Instagram vào Page của bạn.');
    return;
  }

  console.log('--- 5 Sự kiện Webhook mới nhất ---');
  events.forEach(event => {
    console.log(`- Thời gian: ${event.receivedAt}`);
    console.log(`  Page ID nhận: ${event.externalPageId} (Đây là ID chuẩn cần dùng)`);
    console.log(`  Sender ID: ${event.externalSenderId}`);
    console.log(`  Nội dung: ${event.messageText}`);
    console.log('---------------------------');
  });
}

checkWebhooks().catch(console.error);
