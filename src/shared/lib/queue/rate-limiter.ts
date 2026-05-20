import { redisConnection } from './bullmq.provider';

export interface RateLimitResult {
  isAllowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp khi cửa sổ giới hạn được reset (ms)
}

/**
 * Rate Limiter dựa trên Redis Fixed Window Counter.
 * Giới hạn số lượng request của người dùng trong một khoảng thời gian nhất định.
 * 
 * @param key Key định danh (vd: `rate:publish:{userId}`)
 * @param limit Số lượng request tối đa (mặc định 200)
 * @param windowSeconds Cửa sổ thời gian tính bằng giây (mặc định 3600 - 1 giờ)
 */
export async function checkRateLimit(
  key: string,
  limit: number = 200,
  windowSeconds: number = 3600
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  
  // Tính toán thời điểm reset của window hiện tại
  const reset = Math.ceil(now / windowMs) * windowMs;
  const redisKey = `ratelimit:${key}:${reset}`;

  if (!redisConnection) {
    console.warn('[RateLimiter] Redis connection not established. Bypassing rate limit.');
    return { 
      isAllowed: true, 
      limit, 
      remaining: limit, 
      reset 
    };
  }

  try {
    // Sử dụng MULTI để đảm bảo tính nguyên tử (atomic) giữa INCR và EXPIRE
    const pipeline = redisConnection.pipeline();
    pipeline.incr(redisKey);
    pipeline.expireat(redisKey, Math.floor(reset / 1000) + 60); // Giữ lại 60s sau khi reset để tránh race conditions
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    // Kết quả của lệnh INCR là ở index 0, result [error, value]
    const [incrError, currentCount] = results[0];
    
    if (incrError) {
      throw incrError;
    }

    const count = currentCount as number;

    return {
      isAllowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset,
    };
  } catch (error) {
    console.error('[RateLimiter] Critical Error:', error);
    // Fail-safe: Nếu Redis gặp sự cố, vẫn cho phép người dùng tiếp tục (không chặn business)
    return { 
      isAllowed: true, 
      limit, 
      remaining: 0, 
      reset: now + windowMs 
    };
  }
}
