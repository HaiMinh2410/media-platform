import { redisConnection } from '../src/infrastructure/queue/bullmq.provider';

async function testRedis() {
  console.log('🧪 Testing Redis Connection...');
  if (!redisConnection) {
    console.error('❌ Redis connection is missing from provider.');
    return;
  }

  try {
    const result = await redisConnection.ping();
    console.log('✅ Redis Ping Success:', result);
  } catch (error) {
    console.error('❌ Redis Connection Failed:', error);
  } finally {
    redisConnection.disconnect();
  }
}

testRedis().catch(console.error);
