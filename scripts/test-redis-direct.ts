import IORedis from 'ioredis';

async function main() {
  console.log('🔌 Testing Redis Connection via ioredis...');
  const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  console.log(`REDIS_URL: ${REDIS_URL}`);
  console.log(`REDIS_TOKEN: ${REDIS_TOKEN ? '***' + REDIS_TOKEN.substring(REDIS_TOKEN.length - 5) : 'undefined'}`);

  const host = REDIS_URL?.replace('https://', '');
  if (!host || !REDIS_TOKEN) {
    console.error('❌ Redis host or token is missing!');
    return;
  }

  console.log(`Connecting to host: ${host}, port: 6379...`);

  const redis = new IORedis({
    host,
    port: 6379,
    password: REDIS_TOKEN,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
  });

  redis.on('connect', () => {
    console.log('✅ Connect event received!');
  });

  redis.on('ready', () => {
    console.log('✅ Redis connection is READY!');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis Error Event:', err.message);
  });

  try {
    const pingRes = await redis.ping();
    console.log(`✅ PING result: "${pingRes}"`);

    const setRes = await redis.set('test_conn', 'hello_from_test_script', 'EX', 10);
    console.log(`✅ SET result: "${setRes}"`);

    const getRes = await redis.get('test_conn');
    console.log(`✅ GET result: "${getRes}"`);
  } catch (err: any) {
    console.error('❌ Redis Operation Failed:', err);
  } finally {
    await redis.quit();
    console.log('🔌 Connection closed.');
  }
}

main().catch(console.error);
