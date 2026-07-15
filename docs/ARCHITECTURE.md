# Arquitectura $olve — Offline-First con Supabase

> **Marca:** el producto se llama **$olve** (la `S` es `$`). Rebrand aplicado en toda la
> UI, título, manifest y exportaciones (2026-07-15). La única referencia vieja que queda es
> el nombre de la BD local de Dexie (`DeudaZeroDB` en `src/utils/db.ts`): renombrarla
> descartaría datos locales; se migrará en la fase Capacitor.

## Diseño — Claymorphism (2026-06-20)
Sistema visual "plastilina": fondo pastel lavanda, tarjetas/botones inflados con
esquinas grandes y **doble sombra** (externa suave + insets claro/oscuro). Tokens en
`src/styles/app.css` `:root` (`--clay-*`): paleta multicolor pastel (morado, menta,
coral, azul, ámbar), radios (`--r-sm..xl`) y recetas de sombra (`--clay-shadow`,
`--clay-shadow-sm`, `--clay-press`, `--clay-shadow-purple/mint`). `app.css` es la única
hoja activa (variables.css/globals.css están muertos).


## Stack
- Frontend: React 19 + TypeScript + Capacitor (wrapper nativo)
- Caché local: Dexie (IndexedDB)
- Backend: Supabase (Postgres + Auth)
- Sync: Last-write-wins por `updatedAt`

## Flujo de datos

### Sin sesión (modo invitado)
UI → LocalDebtRepository → localStorage

### Con sesión
UI → SupabaseDebtRepository → escribe en local (offline-first) → push remoto async

### Reconexión
SupabaseDebtRepository.syncFromRemote() → pull remoto → last-write-wins → local actualizado

## Resolución de conflictos
Last-write-wins por `updatedAt` (timestamp ms del cliente). Aceptable para finanzas
personales donde conflictos simultáneos en dos dispositivos son raros.

## Modelo de acceso — Preview freemium (Fase 2)
La app funciona sin cuenta (modo invitado/preview), pero la mayoría de funciones se
desbloquean al iniciar sesión:

| Función | Invitado (preview) | Con sesión |
|---|---|---|
| Registrar deudas | 1 deuda | Ilimitadas |
| Ahorro estimado (Tab 1–2) | Visible | Visible |
| Selector de monedas | Fijo COP 🔒 | Habilitado |
| Escenarios de abono (acelerador) | Teaser bloqueado 🔒 | Habilitado |
| Plan de pagos completo (Tab 3) | LockGate borroso 🔒 | Habilitado |
| Export / Import JSON | 🔒 | Habilitado |
| Sincronización multi-dispositivo | — | Activa |

Gating centralizado en `useAuth()` (`isGuest`, `openAuthModal`, `requireAuth`).
Componentes: `LockGate` (secciones), `LockBadge` (controles), `SyncBanner` (CTA),
`AuthModal` (login/registro), `AccountMenu` (header).

## Autenticación
- Proveedores: **Email + contraseña, Google, Apple** (Supabase Auth).
- `src/auth/AuthContext.tsx`: `AuthProvider` + `useAuth()`. Sesión persistida por
  `@supabase/supabase-js` (`persistSession`/`autoRefreshToken`), retorno OAuth vía
  `detectSessionInUrl`.
- Config manual en el dashboard de Supabase: habilitar proveedores + Redirect URLs
  (`http://localhost:3000` en dev). Apple requiere Apple Developer de pago.

## Sincronización (`src/sync/useDebtSync.ts`)
Activa solo con sesión. App.tsx (useState) sigue siendo la fuente de verdad:
1. **Primer login:** estampa `userId` en las deudas locales, las sube (upsert) y luego
   mezcla lo remoto (`mergeByUpdatedAt`). No borra el cache local.
2. **Al enfocar / `visibilitychange`:** pull remoto → merge → estado.
3. **Tras editar (debounce 1.5s):** push de las deudas `syncStatus==='pending'`.
- Conflictos: last-write-wins por `updatedAt` (`src/sync/mergeDebts.ts`, con tests).
- Borrado lógico (`deletedAt`) para propagar bajas entre dispositivos.
- Preferencias (moneda/acelerador/estrategia) en `user_preferences` vía
  `PreferencesRepository`, también LWW por `updatedAt`.

## Pendiente — Fase 3
- OAuth nativo en Capacitor (deep-links + adaptador de storage de sesión).
- Capacitor plugin para SQLite (reemplazar Dexie en producción nativa).
- Realtime opcional (Supabase Realtime) para sync instantánea.
