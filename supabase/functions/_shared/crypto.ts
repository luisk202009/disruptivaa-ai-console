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

const HEX_RE = /^[0-9a-fA-F]+$/;

/**
 * Validate the raw TOKEN_ENCRYPTION_KEY hex string. Throws a clear Error if it is
 * missing, not valid hex, or shorter than 64 chars (256-bit key). Returns the hex.
 */
function assertValidKeyHex(keyHex: string | undefined): string {
  if (!keyHex) {
    throw new Error("TOKEN_ENCRYPTION_KEY no está configurada");
  }
  if (!HEX_RE.test(keyHex)) {
    throw new Error("TOKEN_ENCRYPTION_KEY debe ser hexadecimal (^[0-9a-fA-F]+$)");
  }
  if (keyHex.length < 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY debe medir al menos 64 caracteres hex (256 bits)");
  }
  return keyHex;
}

/**
 * Valida que TOKEN_ENCRYPTION_KEY exista y sea válida. Lanza si no.
 * Pensada para llamarse al inicio de cada función que cifra (fail-fast).
 */
export function assertEncryptionKey(): void {
  assertValidKeyHex(Deno.env.get("TOKEN_ENCRYPTION_KEY"));
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const keyHex = assertValidKeyHex(Deno.env.get("TOKEN_ENCRYPTION_KEY"));

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
 * Fail-closed: lanza si TOKEN_ENCRYPTION_KEY no está configurada o es inválida.
 */
export async function encryptToken(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;

  const key = await getEncryptionKey();

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

  // Branch temporal de migración: tokens legacy en texto plano (sin prefijo enc:).
  // TODO(F0-2): eliminar este branch tras migrar y verificar 0 plaintext, dejándolo en throw.
  if (!stored.startsWith("enc:")) {
    console.error("[crypto] plaintext token detectado - pendiente de migrar");
    return stored;
  }

  const key = await getEncryptionKey();

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
