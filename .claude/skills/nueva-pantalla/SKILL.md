---
name: nueva-pantalla
description: Implementar una pantalla GUI-XX nueva en la app mobile Expo o el panel web-admin Next.js de este monorepo: usar cuando se pida una pantalla, formulario, listado, porteo del diseño de referencia, o componentes de feedback/toasts.
---

# Nueva pantalla (GUI-XX)

Flujo para implementar pantallas en cualquiera de las dos apps de este monorepo (`apps/`). Toda pantalla corresponde a una GUI-XX del documento fuente y a una spec aprobada.

## Paso 0 — Contexto obligatorio

1. Identificar la GUI-XX y buscar su spec aprobada en `docs/specs/` del repo hermano (pethood-backend). Sin spec, frenar.
2. Leer los textos exactos de feedback en `REQUISITOS.md` sección 5 del repo hermano (voseo rioplatense, con tildes) y las reglas de habilitación de botones de la sección 7 — son consigna académica evaluable, se copian literal.
3. Si existe prototipo, mirar el diseño de referencia en `source/` (Vite + Tailwind + shadcn/ui). Es **especificación visual**, no código reusable: es web (`<div>`, CSS) y React Native necesita `<View>`/`<Text>` — portear a mano. Referencias útiles: `src/app/pages/Register.tsx` (estilo de campos), `components/AnimalCard.tsx`, `components/AlertMessage.tsx`, `components/BottomNav.tsx`. La pestaña "Mapa" NO se implementa jamás.

## Paso 1 — Ubicación según app

**Mobile (`apps/mobile/`)** — adoptantes, rescatistas, personal de refugio:
- Ruta en `app/` con Expo Router (grupos `(auth)`, `(tabs)`, etc.).
- Componente nombrado con su GUI-XX para trazabilidad (ej. `RegistroMedicoForm.GUI20`), PascalCase.
- Validaciones genéricas SOLO en `apps/mobile/shared/validation/` (`limits.ts`, `dates.ts`, `numbers.ts`, `text.ts`) — devuelven mensaje o `null`, justo lo que espera la prop `error` de los inputs. Si falta una regla, agregarla ahí primero.
- Cámara nativa obligatoria para "pruebas de vida" de seguimiento (HU-9.1): bloquear galería.
- JWT en `expo-secure-store`, nunca AsyncStorage plano.

**Web-admin (`apps/web-admin/`)** — admins globales y refugios verificados, NO adoptantes:
- Next.js App Router en `src/app/`, servicios en `src/services/`, tipos en `src/types/`.
- Alta densidad de datos (tablas, dashboards, export CSV). Responsable exclusivo de moderación, validación de refugios/usuarios y catálogos.

## Paso 2 — Contrato API

Los contratos salen de la spec / del backend (`/api/v1/...`), nunca se inventan en el cliente. Ambos frontends son tontos en reglas de negocio: validar en cliente es solo UX; el backend es la fuente de verdad.

## Paso 3 — Estilo

- Paleta SIEMPRE con clases `pethood-*`; los valores exactos viven en `apps/mobile/tailwind.config.js` (fuente de verdad — nunca hardcodear hex, ni acá ni en componentes).
- Estados visuales completos en cada listado: cargando / vacío / error.
- Feedback con los toasts GUI-0.1.x (éxito, advertencia, error, campo vacío, formato inválido, archivo inválido).
- Modales de confirmación en acciones críticas.

## Paso 4 — Verificación

```bash
# mobile
cd apps/mobile && npx tsc --noEmit
# web-admin
cd apps/web-admin && npm run lint && npm run build
```
