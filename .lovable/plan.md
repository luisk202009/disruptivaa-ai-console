

# Plan: Estabilizacion Sprint 6 — Correcciones Criticas

## Resumen

Cinco correcciones que incluyen: reorganizar el Sidebar, crear el flujo de onboarding obligatorio, habilitar al admin para ver todos los perfiles/empresas (requiere migracion RLS), funcion "Promover a Admin", y una pestana de Planes simulada en el AdminDashboard.

---

## 1. Sidebar Re-layout

**Archivo**: `src/components/Sidebar.tsx`

Mover el item "Panel Admin" de la lista principal de navegacion (`navItems`) y colocarlo como un item separado justo antes de "Conexiones" y "Ajustes" en el dropdown menu del footer.

**Cambio**: Eliminar el bloque condicional `...(isAdmin ? [...])` de `navItems` (lineas 198-200). En su lugar, agregar un `DropdownMenuItem` con icono `ShieldCheck` antes del item de "Conexiones" en el `DropdownMenuContent` del footer (linea 500), condicionado a `isAdmin`.

```typescript
// En el DropdownMenuContent, antes de Conexiones:
{isAdmin && (
  <>
    <DropdownMenuItem onClick={() => navigate("/admin")} ...>
      <ShieldCheck size={16} />
      <span>{t("navigation.admin")}</span>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
  </>
)}
```

---

## 2. Onboarding Obligatorio en Index.tsx

**Archivo**: `src/pages/Index.tsx`

**Archivo nuevo**: `src/components/CompanyOnboarding.tsx`

El componente `CompanyOnboarding` nunca fue creado. Se creara ahora con:
- Fondo full-screen negro, logo Disruptivaa centrado
- Input "Nombre de la empresa" + ColorPicker (reutilizado)
- Boton "Crear Empresa" en Electric Blue
- Al enviar: inserta en `companies`, actualiza `profiles.company_id`, invalida queries

**Index.tsx** se modifica para:
- Importar `useUserProfile`, `useUserRoles`, `CompanyOnboarding`
- Loading robusto: mientras `profile` o `roles` estan cargando, mantener `LoadingScreen` activo (sin parpadeo del dashboard)
- Si `!isAdmin && !profile?.company_id` -> renderizar `CompanyOnboarding` en lugar del dashboard
- Si `isAdmin || profile?.company_id` -> renderizar dashboard normal

```typescript
const { profile, isLoading: profileLoading } = useUserProfile();
const { isAdmin, isLoading: rolesLoading } = useUserRoles();
const dataReady = !profileLoading && !rolesLoading;
const needsOnboarding = dataReady && !isAdmin && user && !profile?.company_id;
```

---

## 3. AdminDashboard — Fetch ALL Profiles & Companies

**Archivo**: `src/pages/AdminDashboard.tsx`

**Migracion RLS requerida**: Actualmente `profiles` solo tiene politicas para que cada usuario vea su propio perfil. Se necesita una nueva politica SELECT para admins:

```sql
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

Con esta politica, el AdminDashboard podra hacer:
```typescript
const { data: allProfiles } = useQuery({
  queryKey: ["admin_profiles"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, company_id, language, created_at");
    if (error) throw error;
    return data;
  },
  enabled: isAdmin,
});
```

Se agrega una pestana "Usuarios" al AdminDashboard con tabla que muestra todos los perfiles.

---

## 4. Funcion "Promover a Admin"

**Archivo**: `src/pages/AdminDashboard.tsx`

En la tabla de usuarios, agregar un boton "Promover a Admin" por cada fila. Al hacer clic:

```typescript
const promoteToAdmin = useMutation({
  mutationFn: async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
    toast.success(t("admin.promoted"));
  },
});
```

**Nota**: La tabla `user_roles` ya tiene politica "Admins can manage all roles" (ALL), asi que el admin puede insertar sin problema.

Se necesita tambien hacer un `LEFT JOIN` o query separada a `user_roles` para saber que usuarios ya son admin y deshabilitar el boton.

---

## 5. Pestana "Planes" (Simulada)

**Archivo**: `src/pages/AdminDashboard.tsx`

Se agrega una tercera pestana al AdminDashboard usando `Tabs` de Radix:
- Tab 1: "Empresas" (la vista actual)
- Tab 2: "Usuarios" (nuevo de punto 3-4)
- Tab 3: "Planes"

La pestana "Planes" muestra una tabla con datos hardcodeados (mock) de planes:

```typescript
const MOCK_PLANS = [
  { name: "Starter", price: "$49/mo", stripe_id: "price_starter_mock" },
  { name: "Growth", price: "$149/mo", stripe_id: "price_growth_mock" },
  { name: "Enterprise", price: "$499/mo", stripe_id: "price_enterprise_mock" },
];
```

Se mostraran en una tabla con columnas: Nombre, Precio, Stripe ID. Un badge "Simulado" indica que no estan conectados a una tabla real aun.

---

## Traducciones Nuevas

| Clave | ES | EN |
|-------|----|----|
| `admin.users` | Usuarios | Users |
| `admin.plans` | Planes | Plans |
| `admin.companies` | Empresas | Companies |
| `admin.promote` | Promover a Admin | Promote to Admin |
| `admin.promoted` | Usuario promovido a Admin | User promoted to Admin |
| `admin.alreadyAdmin` | Ya es Admin | Already Admin |
| `admin.email` | Email | Email |
| `admin.role` | Rol | Role |
| `admin.company` | Empresa | Company |
| `admin.planName` | Nombre del Plan | Plan Name |
| `admin.planPrice` | Precio | Price |
| `admin.stripeId` | Stripe ID | Stripe ID |
| `admin.mockBadge` | Simulado | Mock |
| `onboarding.title` | Bienvenido a Disruptivaa | Welcome to Disruptivaa |
| `onboarding.subtitle` | Configura tu empresa para comenzar | Set up your company to get started |
| `onboarding.companyName` | Nombre de la empresa | Company name |
| `onboarding.companyPlaceholder` | Ej: Mi Agencia Digital | E.g.: My Digital Agency |
| `onboarding.brandColor` | Color de marca | Brand color |
| `onboarding.createCompany` | Crear Empresa | Create Company |
| `onboarding.creating` | Creando... | Creating... |
| `onboarding.success` | Empresa creada exitosamente | Company created successfully |
| `onboarding.error` | Error al crear la empresa | Error creating company |

---

## Migracion de Base de Datos Requerida

```sql
-- Permitir a admins ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

---

## Resumen de Archivos

| Archivo | Accion |
|---------|--------|
| `src/components/Sidebar.tsx` | Modificar — mover Admin link al dropdown |
| `src/components/CompanyOnboarding.tsx` | Crear — formulario de onboarding |
| `src/pages/Index.tsx` | Modificar — logica condicional onboarding vs dashboard |
| `src/pages/AdminDashboard.tsx` | Modificar — tabs con Usuarios, Planes, Promover Admin |
| `src/i18n/locales/es/common.json` | Modificar — nuevas claves |
| `src/i18n/locales/en/common.json` | Modificar — nuevas claves |
| `src/i18n/locales/pt/common.json` | Modificar — nuevas claves |
| Migracion SQL | Crear — RLS policy para admins en profiles |

## Secuencia de Implementacion

1. Migracion RLS (admins can view all profiles)
2. Crear CompanyOnboarding.tsx
3. Modificar Index.tsx con logica de onboarding
4. Modificar Sidebar.tsx (mover admin link)
5. Reestructurar AdminDashboard.tsx con tabs + usuarios + planes + promover
6. Agregar traducciones

