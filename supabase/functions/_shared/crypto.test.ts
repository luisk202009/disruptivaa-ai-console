// Tests de crypto.ts (fail-closed). Ejecutar:
//   deno test supabase/functions/_shared/crypto.test.ts --allow-env
import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { assertEncryptionKey, decryptToken, encryptToken } from "./crypto.ts";

const KEY_ENV = "TOKEN_ENCRYPTION_KEY";
const VALID_KEY = "0".repeat(64); // 64 chars hex válidos (256 bits)

// Ejecuta fn con TOKEN_ENCRYPTION_KEY fijada al valor dado (o borrada si undefined),
// restaurando siempre el valor previo. Deno corre los tests de un archivo en serie,
// pero la env es global de proceso, así que restauramos en finally.
async function withKey(value: string | undefined, fn: () => void | Promise<void>) {
  const prev = Deno.env.get(KEY_ENV);
  try {
    if (value === undefined) Deno.env.delete(KEY_ENV);
    else Deno.env.set(KEY_ENV, value);
    await fn();
  } finally {
    if (prev === undefined) Deno.env.delete(KEY_ENV);
    else Deno.env.set(KEY_ENV, prev);
  }
}

Deno.test("round-trip: encrypt luego decrypt devuelve el original", async () => {
  await withKey(VALID_KEY, async () => {
    const plaintext = "ya29.super-secret-token";
    const encrypted = await encryptToken(plaintext);
    assertEquals(encrypted.startsWith("enc:"), true);
    assertEquals(encrypted === plaintext, false);
    const decrypted = await decryptToken(encrypted);
    assertEquals(decrypted, plaintext);
  });
});

Deno.test("encryptToken lanza sin key configurada", async () => {
  await withKey(undefined, async () => {
    await assertRejects(() => encryptToken("algo"), Error);
  });
});

Deno.test("encryptToken lanza con key inválida (no hex / corta)", async () => {
  await withKey("no-es-hex-" + "z".repeat(60), async () => {
    await assertRejects(() => encryptToken("algo"), Error);
  });
  await withKey("abcdef", async () => {
    await assertRejects(() => encryptToken("algo"), Error);
  });
});

Deno.test("decryptToken de valor enc: lanza sin key válida", async () => {
  await withKey(undefined, async () => {
    await assertRejects(() => decryptToken("enc:00:00"), Error);
  });
});

Deno.test("assertEncryptionKey lanza con key inválida y no lanza con válida", async () => {
  await withKey(undefined, () => {
    assertThrows(() => assertEncryptionKey(), Error);
  });
  await withKey("abc", () => {
    assertThrows(() => assertEncryptionKey(), Error);
  });
  await withKey(VALID_KEY, () => {
    assertEncryptionKey(); // no lanza
  });
});
