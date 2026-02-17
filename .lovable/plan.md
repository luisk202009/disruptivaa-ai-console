
# Plan: Reparacion Definitiva del Onboarding

## Diagnostico

La politica INSERT en `companies` existe y es PERMISSIVE, pero el INSERT sigue fallando con error 42501. Multiples intentos de recrear la politica no han resuelto el problema.

## Solucion: Funcion SECURITY DEFINER transaccional

En lugar de depender de politicas RLS para el INSERT del onboarding, crearemos una funcion de base de datos con `SECURITY DEFINER` que ejecuta ambas operaciones (crear empresa + asignar al perfil) en una sola transaccion atomica. Esto resuelve:

1. **El error RLS**: La funcion SECURITY DEFINER se ejecuta con privilegios del owner (postgres), sin pasar por RLS
2. **Transaccionalidad**: Si falla el UPDATE de profiles, el INSERT en companies se revierte automaticamente
3. **Seguridad**: La funcion valida que el usuario este autenticado y solo modifica su propio perfil

---

## Cambios

### 1. Migracion SQL: Crear funcion `create_company_for_user`

```sql
CREATE OR REPLACE FUNCTION public.create_company_for_user(
  _company_name text,
  _branding_color text DEFAULT '#00A3FF'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _company_id uuid;
BEGIN
  -- Get authenticated user
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user doesn't already have a company
  IF EXISTS (SELECT 1 FROM profiles WHERE id = _user_id AND company_id IS NOT NULL) THEN
    RAISE EXCEPTION 'User already has a company assigned';
  END IF;

  -- Create company
  INSERT INTO companies (name, branding_color)
  VALUES (_company_name, _branding_color)
  RETURNING id INTO _company_id;

  -- Assign to user profile
  UPDATE profiles
  SET company_id = _company_id, updated_at = now()
  WHERE id = _user_id;

  RETURN _company_id;
END;
$$;
```

### 2. `src/components/CompanyOnboarding.tsx` — Usar RPC en vez de INSERT directo

Reemplazar las dos queries separadas (INSERT companies + UPDATE profiles) por una sola llamada RPC:

```typescript
const { data, error } = await supabase.rpc('create_company_for_user', {
  _company_name: companyName,
  _branding_color: brandColor,
});
```

Ademas, mejorar el manejo de errores mostrando el mensaje especifico del error en el toast.

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Crear funcion `create_company_for_user` |
| `src/components/CompanyOnboarding.tsx` | Reemplazar INSERT+UPDATE por `supabase.rpc()` |

## Resultado esperado

El onboarding funcionara de forma atomica y sin depender de politicas RLS para el INSERT en companies.
