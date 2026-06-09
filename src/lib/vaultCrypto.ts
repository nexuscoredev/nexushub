const VAULT_CHECK_PLAINTEXT = 'NEXUS_VAULT_OK';
const PBKDF2_ITERATIONS = 310_000;

function encoder() {
  return new TextEncoder();
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return toBase64(salt);
}

async function deriveKey(masterPassword: string, saltB64: string): Promise<CryptoKey> {
  const salt = fromBase64(saltB64);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder().encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
}

export async function encryptText(
  plaintext: string,
  cryptoKey: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder().encode(plaintext)
  );
  return {
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptText(
  payload: EncryptedPayload,
  cryptoKey: CryptoKey
): Promise<string> {
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);
  return new TextDecoder().decode(decrypted);
}

export async function createVaultVerifier(
  masterPassword: string,
  saltB64: string
): Promise<{ cryptoKey: CryptoKey; verifier: EncryptedPayload }> {
  const cryptoKey = await deriveKey(masterPassword, saltB64);
  const verifier = await encryptText(VAULT_CHECK_PLAINTEXT, cryptoKey);
  return { cryptoKey, verifier };
}

export async function unlockVaultKey(
  masterPassword: string,
  saltB64: string,
  verifier: EncryptedPayload
): Promise<CryptoKey | null> {
  try {
    const cryptoKey = await deriveKey(masterPassword, saltB64);
    const plain = await decryptText(verifier, cryptoKey);
    return plain === VAULT_CHECK_PLAINTEXT ? cryptoKey : null;
  } catch {
    return null;
  }
}
