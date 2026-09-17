# packages/shared

Código TypeScript compartido entre `apps/mobile` y `apps/web-admin`.

**Regla:** no agregar nada acá sin una **duplicación real** entre ambas apps que lo justifique. Si solo una app lo usa, vive en esa app.

---

## Qué va acá

| Tipo | Ejemplo | Cuándo |
|------|---------|--------|
| **Types base** | `RolUsuario`, `Usuario`, `ApiErrorBody` | Ambas apps definen la misma interfaz |
| **Enum labels** | `Tamanio`, `Genero`, estado mascota | Pure data, sin dependencia de plataforma |
| **Validaciones** | formato email, límites de texto | Cuando web-admin tenga forms con mismos campos |
| **Cliente API base** | `ApiFetchOptions`, `ApiError` | Solo lo que es idéntico; el `apiFetch` concreto queda en cada app |

## Qué NO va acá

- `apiFetch` implementation — mobile tiene XHR/FormData/SecureStore, web-admin es fetch puro. Abstrair = adapter layer innecesario hoy.
- Session management — SecureStore vs cookies httpOnly. Mecanismos opuestos.
- Componentes de UI — Expo vs Next.js, stacks distintos.
- Hooks, constants de plataforma, servicios nativos.
- Cosa que solo una app consume.

---

## Cómo funciona: npm workspaces

El monorepo **no tiene** root `package.json` todavía. Para que `apps/mobile` y `apps/web-admin` puedan importar de `packages/shared`, se habilitan **npm workspaces**.

### Setup (una sola vez)

**1. Crear root `package.json`** en la raíz del monorepo (`/frontend/package.json`):

```json
{
  "name": "pethood-frontend",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

**2. Crear `packages/shared/package.json`:**

```json
{
  "name": "@pethood/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

No necesita `build` porque TypeScript resuelve `.ts` directo con `moduleResolution: "bundler"` (ya configurado en ambos tsconfigs).

**3. Agregar al `package.json` de cada app:**

```json
"dependencies": {
  "@pethood/shared": "*"
}
```

**4. Reinstalar desde la raíz:**

```bash
npm install          # desde /frontend
```

Esto crea symlinks en `node_modules/@pethood/shared` → `packages/shared/` dentro de cada app.

**5. Agregar path alias en cada `tsconfig.json`:**

mobile (`apps/mobile/tsconfig.json`):
```json
"paths": {
  "@/*": ["./*"],
  "@pethood/shared": ["../../packages/shared/src"],
  "@pethood/shared/*": ["../../packages/shared/src/*"]
}
```

web-admin (`apps/web-admin/tsconfig.json`):
```json
"paths": {
  "@/*": ["./src/*"],
  "@pethood/shared": ["../../packages/shared/src"],
  "@pethood/shared/*": ["../../packages/shared/src/*"]
}
```

### Cómo importar

```ts
// desde cualquier app
import { RolUsuario, ApiError } from '@pethood/shared';
import { generaLabelTamanio } from '@pethood/shared';
```

### Estructura de packages/shared

```
packages/shared/
├── package.json
├── README.md
└── src/
    ├── index.ts          # barrel export
    ├── types/
    │   ├── auth.ts       # RolUsuario, Usuario, RespuestaAuth
    │   ├── api.ts        # ApiErrorBody, ApiError, ApiFetchOptions
    │   └── index.ts
    ├── enums/
    │   ├── mascota.ts    # Tamanio, Genero, estado labels
    │   └── index.ts
    └── validations/      # futuro, cuando web-admin tenga forms
        └── index.ts
```

---

## Plan de migración

### Fase 1: Types idénticos (ahora)

Mover de ambas apps a `shared/src/types/`:

| Tipo | mobile source | web-admin source |
|------|--------------|-----------------|
| `RolUsuario` | `types/auth.ts:1` | `src/types/auth.ts:1` |
| `Usuario` (base) | `types/auth.ts:3` | `src/types/auth.ts:3` |
| `ApiErrorBody` | `types/api.ts:1` | `src/types/api.ts:1` |
| `RespuestaAuth` | `types/auth.ts:10` | `src/types/auth.ts:7` (como `RespuestaLogin`) |
| `ApiFetchOptions` | `services/api.ts:7` | `src/services/api.ts:7` |

Unificar `RespuestaAuth` / `RespuestaLogin` → nombre único `RespuestaAuth`.

### Fase 2: Enum labels (ahora)

Mover a `shared/src/enums/`:
- `Tamanio` labels (de `apps/mobile/constants/Mascotas.ts`)
- `Genero` labels (de `apps/mobile/constants/Mascotas.ts`)
- Estado mascota labels (de `apps/mobile/constants/EstadosMascota.ts`)

### Fase 3: Validaciones (cuando web-admin tenga forms)

Cuando web-admin implemente crear mascota, registrar usuario, o cualquier form con mismos campos que mobile, mover:
- `limits.ts` (límites de campo, espejo del backend)
- `text.ts` (validación de texto genérica)
- `dates.ts` (parseo y formato de fechas)

### Fase 4: ApiError merge (ahora)

Unificar `ApiError` en una versión flexible que acepte constructores de ambos estilos.

---

## Consideraciones

- **No duplicar `apiFetch`** — cada app tiene su propia implementación por razones legítimas (mobile necesita XHR para FormData, SecureStore auto-token). El día que web-admin necesite lo mismo, se refactorea.
- **`limits.ts` está espejado con el backend** (`pethood-backend/src/shared/validation/limits.ts`). Si cambiás un número, cambialo en ambos repos en el mismo PR.
- **Expo puede tener problemas con imports de `../../`** — el path alias `@pethood/shared` resuelve esto. Si Expo lo rechaza, usar `expo-modules-core` o configurar `extra.nodeModulesPaths` en `app.json`.
- **No commitear `node_modules/`** — los symlinks de workspaces viven ahí.
