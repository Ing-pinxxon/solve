# Arquitectura DEUDAS//ZERO — Offline-First con Supabase

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

## Migración desde localStorage (pendiente — Fase 2)
1. Al primer login exitoso, leer debts de localStorage
2. Añadir userId del usuario autenticado
3. Upsert masivo a Supabase
4. Limpiar localStorage

## Pendiente — Fase 2
- Pantalla de login/registro (Auth UI de Supabase)
- Hook useAuth() para estado de sesión global
- Migración automática al primer login
- Capacitor plugin para SQLite (reemplazar Dexie en producción nativa)
