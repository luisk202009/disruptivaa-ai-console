// Shared encryption/decryption utilities for OAuth token protection
// Uses AES-GCM with a 256-bit key stored in TOKEN_ENCRYPTION_KEY env var

const ALGORITHM = "AES-GCM";

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getEncryptionKey(): Promise<CryptoKey | null> {
  const keyHex = Deno.env.get("TOKEN_ENCRYPTION_KEY");
  if (!keyHex || keyHex.length < 64) return null; // Need at least 256-bit key (64 hex chars)

  const keyBytes = hexToBytes(keyHex.slice(0, 64)); // Use first 256 bits
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: ALGORITHM },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a plaintext token. Returns prefixed ciphertext string.
 * Falls back to plaintext if TOKEN_ENCRYPTION_KEY is not configured.
 */
export async function encryptToken(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;

  const key = await getEncryptionKey();
  if (!key) return plaintext; // Graceful fallback

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  return `enc:${bytesToHex(iv)}:${bytesToHex(new Uint8Array(ciphertext))}`;
}

/**
 * Decrypt a stored token. Handles both encrypted (enc:...) and plaintext (backward compat).
 */
export async function decryptToken(stored: string): Promise<string> {
  if (!stored) return stored;

  // Plaintext backward compatibility
  if (!stored.startsWith("enc:")) return stored;

  const key = await getEncryptionKey();
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required to decrypt encrypted tokens");
  }

  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = hexToBytes(parts[1]);
  const ciphertext = hexToBytes(parts[2]);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
