export type EncryptedData = {
  iv: string;
  authTag: string;
  ciphertext: string;
};

export type DecryptResult = {
  data: string | null;
  error: string | null;
};
