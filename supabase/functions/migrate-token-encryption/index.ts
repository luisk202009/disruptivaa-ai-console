// migrate-token-encryption — función de un solo uso, idempotente.
// Cifra los access_token / refresh_token legacy en texto plano de user_integrations.
// Autoriza únicamente al service_role o a usuarios con rol admin (patrón requireAdmin).
// No toca filas ya cifradas (prefijo "enc:"). No despliega ni migra nada por su cuenta:
// hay que invocarla explícitamente.
import { corsHeaders, requireAdmin, serviceClient } from "../_shared/hubspot.ts";
import { assertEncryptionKey, encryptToken } from "../_shared/crypto.ts";

// Autoriza service_role (Bearer == SUPABASE_SERVICE_ROLE_KEY) o, si no, delega en
// requireAdmin (que lanza un Response 401/403 para cualquier otra llamada).
async function authorize(req: Request): Promise<void> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (token && serviceKey && token === serviceKey) return; // service_role autorizado
  await requireAdmin(req); // admin autorizado; cualquier otro caso lanza Response
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await authorize(req);
    assertEncryptionKey(); // aborta si la key falta o es inválida (fail-fast)

    const sb = serviceClient();
    const { data: rows, error } = await sb
      .from("user_integrations")
      .select("id, access_token, refresh_token");
    if (error) throw new Error(`No se pudo leer user_integrations: ${error.message}`);

    const needsMigration = (v: string | null): boolean => !!v && !v.startsWith("enc:");

    let migrated = 0; // tokens cifrados en esta corrida
    let skipped = 0; // tokens ya cifrados o nulos
    let errors = 0; // filas que fallaron

    for (const row of rows ?? []) {
      const update: Record<string, string> = {};

      try {
        if (needsMigration(row.access_token)) {
          update.access_token = await encryptToken(row.access_token);
        } else {
          skipped++;
        }

        if (needsMigration(row.refresh_token)) {
          update.refresh_token = await encryptToken(row.refresh_token);
        } else {
          skipped++;
        }

        const changed = Object.keys(update).length;
        if (changed > 0) {
          const { error: upErr } = await sb
            .from("user_integrations")
            .update(update)
            .eq("id", row.id);
          if (upErr) throw new Error(upErr.message);
          migrated += changed;
        }
      } catch (e) {
        errors++;
        console.error(`[migrate-token-encryption] fila ${row.id} falló:`, (e as Error).message);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, scannedRows: rows?.length ?? 0, migrated, skipped, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    if (e instanceof Response) return e; // Responses de requireAdmin (401/403)
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
