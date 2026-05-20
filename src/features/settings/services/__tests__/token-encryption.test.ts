import { describe, it, expect, beforeAll } from 'bun:test';
import { TokenEncryptionService } from '../token-encryption.service';

// Mock env cho môi trường test nếu chưa có
if (!process.env.META_TOKEN_ENCRYPTION_KEY) {
  process.env.META_TOKEN_ENCRYPTION_KEY = '918c6d08d70778af5dbac978704e82a6b994920c51e818d3dab7b25ec03fd1a0';
}

describe('TokenEncryptionService', () => {
  let service: TokenEncryptionService;

  beforeAll(() => {
    service = new TokenEncryptionService();
  });

  it('should encrypt and decrypt a string successfully', async () => {
    const originalText = 'facebook-long-lived-token-xyz-123';
    const { data: encrypted, error: encError } = await service.encrypt(originalText);
    
    expect(encError).toBeNull();
    expect(encrypted).toContain(':');
    
    const parts = encrypted!.split(':');
    expect(parts).toHaveLength(3); // iv, authTag, ciphertext

    const { data: decrypted, error: decError } = await service.decrypt(encrypted!);
    expect(decError).toBeNull();
    expect(decrypted).toBe(originalText);
  });

  it('should fail to decrypt if the format is invalid', async () => {
    const { data, error } = await service.decrypt('not-a-valid-encrypted-string');
    expect(data).toBeNull();
    expect(error).toBe('INVALID_FORMAT');
  });

  it('should fail to decrypt if the payload is tampered (integrity check)', async () => {
    const originalText = 'sensitive-data';
    const { data: encrypted } = await service.encrypt(originalText);
    
    // Can thiệp vào ciphertext (phần cuối cùng) để phá vỡ tính toàn vẹn
    const parts = encrypted!.split(':');
    const originalCipher = parts[2];
    // Thay đổi 2 ký tự cuối
    parts[2] = originalCipher.substring(0, originalCipher.length - 2) + (originalCipher.endsWith('0') ? '1' : '0'); 
    const tampered = parts.join(':');

    const { data, error } = await service.decrypt(tampered);
    expect(data).toBeNull();
    expect(error).toBe('DECRYPTION_FAILED');
  });

  it('should generate different ciphertexts for the same input due to IV randomization', async () => {
    const text = 'same-input';
    const res1 = await service.encrypt(text);
    const res2 = await service.encrypt(text);
    
    expect(res1.data).not.toBe(res2.data);
    
    // Cả hai đều phải giải mã ra cùng một kết quả ban đầu
    const dec1 = await service.decrypt(res1.data!);
    const dec2 = await service.decrypt(res2.data!);
    expect(dec1.data).toBe(text);
    expect(dec2.data).toBe(text);
  });

  it('should handle empty strings', async () => {
    const originalText = '';
    const { data: encrypted } = await service.encrypt(originalText);
    const { data: decrypted } = await service.decrypt(encrypted!);
    expect(decrypted).toBe('');
  });
});
