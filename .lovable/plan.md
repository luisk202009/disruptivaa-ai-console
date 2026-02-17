
# Plan: Fix RLS "companies" INSERT Error

## Problema

La politica INSERT en `companies` existe en la base de datos pero PostgREST no la ha detectado. El INSERT desde el onboarding devuelve 403 (codigo 42501) a pesar de que la politica `"Authenticated users can create companies"` esta configurada correctamente como PERMISSIVE para el rol `authenticated` con `WITH CHECK (true)`.

## Solucion

Ejecutar una migracion SQL minima que:
1. Elimine y recree la politica INSERT (para forzar la invalidacion de cache de PostgREST)
2. Ejecute `NOTIFY pgrst, 'reload schema'` para garantizar que PostgREST recargue las politicas

```sql
-- Force PostgREST to reload by dropping and recreating the policy
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
```

## Archivos Afectados

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Crear - recrear politica + NOTIFY pgrst |

No se requieren cambios en el codigo frontend. El componente `CompanyOnboarding.tsx` ya esta correcto.

## Resultado Esperado

Despues de la migracion, el usuario `luisk20@gmail.com` podra crear su empresa desde el onboarding sin error 403.
