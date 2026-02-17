

# Plan: Flujo de Onboarding de Empresa

## Resumen

Crear un flujo de onboarding que aparece automaticamente cuando un usuario no-admin no tiene empresa asignada (`company_id` nulo). El formulario permite crear una empresa y vincularla al perfil del usuario.

---

## Cambios Detallados

### 1. Instalar `framer-motion`

Se necesita agregar la dependencia para las animaciones fade-in solicitadas.

### 2. Actualizar `src/hooks/useUserProfile.ts`

Agregar `role` y `company_id` al tipo `UserProfile` (los campos ya existen en la tabla `profiles`):

```typescript
export interface UserProfile {
  id: string;
  language: SupportedLanguage;
  role: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}
```

### 3. Crear `src/components/CompanyOnboarding.tsx`

Componente con:
- Fondo full-screen Black (#000000) con Fira Sans
- Logo de Disruptivaa centrado arriba
- Formulario con animacion fade-in (Framer Motion):
  - Input "Nombre de la Empresa"
  - ColorPicker reutilizado (default #00A3FF)
  - Boton "Crear Empresa" en Electric Blue (#00A3FF)
- Al enviar:
  1. Inserta en `companies` (name, branding_color)
  2. Actualiza `profiles.company_id` del usuario actual
  3. Toast de exito
  4. Invalida query de perfil para refrescar estado (el onboarding desaparece automaticamente)

### 4. Modificar `src/pages/Index.tsx`

Logica condicional:
- Importar `useUserProfile` y `useUserRoles`
- Si `isAdmin` o `profile.company_id` existe: mostrar Dashboard normal
- Si NO es admin Y `company_id` es null: mostrar `CompanyOnboarding` en lugar del Dashboard
- Mientras carga el perfil: mantener LoadingScreen

### 5. Traducciones (i18n)

Nuevas claves `onboarding.*` en los 3 idiomas:

| Clave | ES | EN | PT |
|-------|----|----|-----|
| title | Bienvenido a Disruptivaa | Welcome to Disruptivaa | Bem-vindo ao Disruptivaa |
| subtitle | Configura tu empresa para comenzar | Set up your company to get started | Configure sua empresa para comecar |
| companyName | Nombre de la empresa | Company name | Nome da empresa |
| companyPlaceholder | Ej: Mi Agencia Digital | E.g.: My Digital Agency | Ex: Minha Agencia Digital |
| brandColor | Color de marca | Brand color | Cor da marca |
| createCompany | Crear Empresa | Create Company | Criar Empresa |
| creating | Creando... | Creating... | Criando... |
| success | Empresa creada exitosamente | Company created successfully | Empresa criada com sucesso |
| error | Error al crear la empresa | Error creating company | Erro ao criar a empresa |

---

## Resumen de Archivos

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/CompanyOnboarding.tsx` | **Crear** | Formulario de onboarding con animacion |
| `src/hooks/useUserProfile.ts` | **Modificar** | Agregar role y company_id al tipo |
| `src/pages/Index.tsx` | **Modificar** | Logica condicional onboarding vs dashboard |
| `src/i18n/locales/es/common.json` | **Modificar** | Claves onboarding.* |
| `src/i18n/locales/en/common.json` | **Modificar** | Claves onboarding.* |
| `src/i18n/locales/pt/common.json` | **Modificar** | Claves onboarding.* |
| `package.json` | **Modificar** | Agregar framer-motion |

---

## Seguridad

- La insercion en `companies` requiere usuario autenticado (RLS via admin o politica INSERT)
- La actualizacion de `profiles.company_id` solo permite al propio usuario (RLS existente)
- **Nota**: Se necesita verificar si existe una politica RLS que permita a usuarios no-admin insertar en `companies`. Si no existe, se creara una migracion para agregar una politica INSERT para usuarios autenticados.

## Verificacion Post-Implementacion

- [ ] Usuario sin empresa ve el onboarding al entrar
- [ ] Admin sin empresa NO ve el onboarding (va directo al dashboard)
- [ ] Al crear empresa, el onboarding desaparece y se muestra el dashboard
- [ ] El color picker funciona y el color se guarda en la empresa
- [ ] Animacion fade-in visible al cargar el formulario
- [ ] Traducciones correctas en ES, EN, PT

