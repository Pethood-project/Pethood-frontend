# PETHOOD Frontend — Monorepo (mobile + web-admin)

@apps/mobile/AGENTS.md

Este repo es un **monorepo** con dos apps independientes que consumen la misma API REST del backend (`pethood-backend`, repo hermano):

- `apps/mobile/` — app móvil (Expo SDK 57 + TypeScript + NativeWind), mobile-first para adoptantes y refugios. **Ya tiene código real** (auth, componentes base) — ver `apps/mobile/README.md` para el setup.
- `apps/web-admin/` — panel de administración de escritorio (Next.js + Tailwind), para administradores y refugios verificados. Todavía es un placeholder sin código.
- `packages/shared/` — tipos, cliente API y validaciones comunes a ambas apps (solo lo que realmente se duplica). Todavía es un placeholder.

Cada app es un proyecto npm independiente (propio `package.json`/lockfile) — no usamos npm workspaces todavía, se instala/corre `cd apps/<app> && npm ...`.

## Documentos rectores (en `../Pethood-backend/docs/`, repo hermano)

- `CONSTITUTION.md` — principios no negociables del proyecto.
- `REQUISITOS.md` — requisitos y HUs por módulo. Su sección 10 lista ambigüedades del documento fuente todavía sin resolver.
- `MODELO_DATOS.md` — entidades y cardinalidades (fuente de verdad de nombres de campo).
- `ROADMAP.md` — plan de desarrollo por fases.
- `ARQUITECTURA.md` — árbol de directorios de ambos repos y convención de branches.
- `specs/` — spec aprobada del módulo, a leer antes de implementar cualquier pantalla.

No se leen completas en cada cambio: consultá solo lo que la tarea toque.

- Implementás o modificás una pantalla → su spec aprobada en `specs/` y los textos/reglas exactas de `REQUISITOS.md` (§5 feedback voseo, §7 habilitación de botones).
- Dudás sobre nombres de campo, tipos o cardinalidades → `MODELO_DATOS.md`.
- Creás estructura nueva (app, directorios de primer nivel) → árbol de directorios en `ARQUITECTURA.md`.
- Duda sobre un principio no negociable → `CONSTITUTION.md` (las reglas transversales ya están resumidas más abajo, en Convenciones).

## Por qué dos apps separadas

- **`apps/mobile`** — adoptantes particulares, rescatistas independientes, personal operativo de refugios en el día a día (crear mascotas, chatear, subir seguimientos). Necesita hardware nativo: **cámara nativa obligatoria** para las "pruebas de vida" del seguimiento post-adopción (HU-9.1) — el formulario debe bloquear la galería y forzar captura en tiempo real.
- **`apps/web-admin`** — administradores globales y refugios/fundaciones ya verificados, **no adoptantes finales**. Alta densidad de datos: moderación de reportes, catálogos base, dashboards estadísticos, exportación CSV masiva — se degrada en pantallas móviles. Responsable exclusivo de: validación de refugios/usuarios (HU-2.2, HU-2.3), alta/baja de refugios (HU-2.4) y usuarios (HU-2.5), moderación completa (Módulo 3), gestión de catálogos.

`web-admin` reutilizará los mismos endpoints que `mobile` para entidades compartidas (Campaña, Refugio, Reseña) — no duplicar lógica de negocio en el cliente; ambos frontends son "tontos" en reglas de negocio.

**Geolocalización:** se capturan coordenadas (`animal_perdido_latitud`/`longitud` al reportar una mascota perdida/encontrada), pero **no hay mapa interactivo en la UI**. El usuario busca y filtra por selector administrativo de Provincia/Localidad — no integrar ningún SDK de mapas. Ver `../Pethood-backend/docs/MODELO_DATOS.md`.

## Pantallas principales (GUI-XX del documento fuente — usar estos nombres en componentes/rutas)

**Mobile:**

| GUI    | Pantalla                | GUI    | Pantalla                      |
| ------ | ----------------------- | ------ | ----------------------------- |
| GUI-01 | Registrarse             | GUI-20 | Agregar Registro Médico       |
| GUI-02 | Login                   | GUI-21 | Seguimiento Adopción/Tránsito |
| GUI-04 | Mascotas Adoptante      | GUI-22 | Actualización de seguimiento  |
| GUI-05 | Adoptar (feed)          | GUI-23 | Filtros Avanzados             |
| GUI-06 | Mascotas Perdidas       | GUI-24 | Nueva publicación de adopción |
| GUI-08 | Chat Adoptante          | GUI-25 | Nueva pub. perdida/encontrada |
| GUI-09 | Perfil Adoptante        | GUI-27 | Solicitudes                   |
| GUI-10 | Ficha Animal            | GUI-29 | Mascota Refugio               |
| GUI-11 | Estado de Solicitud     | GUI-30 | Crear Mascota Refugio         |
| GUI-12 | Favoritos               | GUI-31 | Chat Refugio                  |
| GUI-13 | Campañas Adoptante      | GUI-36 | Campañas Refugio              |
| GUI-14 | Conversación            | GUI-37 | Crear/Editar Campaña          |
| GUI-15 | Editar Perfil Adoptante |        |                               |
| GUI-16 | Crear Mascota Adoptante |        |                               |
| GUI-18 | Ficha Médica            |        |                               |
| GUI-19 | Detalle Ficha Médica    |        |                               |

**Web-admin (además de GUI-26, GUI-36, GUI-37):**

| GUI    | Pantalla               |
| ------ | ---------------------- |
| GUI-26 | Perfil Público Refugio |
| GUI-38 | Dashboard Refugio      |
| GUI-39 | Dashboard Admin        |
| GUI-40 | Dashboard Admin Vacío  |
| GUI-41 | Error de Exportación   |

**Componentes de feedback reutilizables (GUI-0.1.x, implementar primero):** toast de éxito (0.1.1), advertencia (0.1.2), error (0.1.3), campo obligatorio vacío (0.1.4), campo con formato inválido (0.1.5), archivo inválido/pesado (0.1.6). Todos en **voseo rioplatense** — ver textos y tono exactos en `../Pethood-backend/docs/REQUISITOS.md` sección 5.

## Comandos

```bash
# mobile (ver apps/mobile/README.md para el setup completo: Node 22, npm ci, etc.)
cd apps/mobile && npx expo start        # dev server (Expo Go / emulador)
cd apps/mobile && npx expo start --web  # versión web de la app mobile (debug, no reemplaza web-admin)

# web-admin (cuando exista)
cd apps/web-admin && npm run dev        # http://localhost:3000
```

## Estructura

```
apps/mobile/            # Expo Router — ver detalle real en apps/mobile/README.md
├── app/
│   ├── (auth)/          # login.tsx, register.tsx (ya implementadas)
│   └── ...
├── components/
├── constants/
└── assets/

apps/web-admin/          # Next.js App Router (placeholder, sin código todavía)
└── src/
    ├── app/
    ├── components/
    ├── services/
    └── types/

packages/shared/          # placeholder, sin código todavía
├── types/        # tipos TS espejo de MODELO_DATOS.md
├── api/          # funciones fetch tipadas al backend
└── validations/  # schemas zod compartidos entre mobile y web-admin
```

## Convenciones

- Toda pantalla nueva corresponde a una spec aprobada; los contratos de API salen de la spec, no se inventan.
- Componentes en PascalCase, hooks con prefijo `use`, textos de UI en español correcto (con tildes), voseo rioplatense.
- **Validar en el cliente es solo para UX** — la validación real vive en el backend, nunca asumir que el formulario reemplaza el chequeo del servidor.
- Nunca hardcodear textos de error genéricos — usar los textos y tono de `../Pethood-backend/docs/REQUISITOS.md` sección 5.
- Nombrar componentes de pantalla con su GUI-XX cuando exista, para trazabilidad académica.
- Antes de crear un formulario, revisar `../Pethood-backend/docs/REQUISITOS.md` sección 7 (reglas de habilitación de botones muy específicas en "Crear mascota", "Crear campaña", etc.).
- Estados visuales claros: cargando / vacío / error en cada listado.
- Mobile: Node 22 LTS + npm únicamente (ver `apps/mobile/.nvmrc`/`.npmrc`), variables sensibles en `.env` con prefijo `EXPO_PUBLIC_`, tokens JWT en `expo-secure-store` (nunca AsyncStorage plano). Web-admin: variables en `.env.local` de Next.js. Nunca commitear archivos `.env*` reales.
- No armar contenido en `packages/shared` sin una duplicación real que lo justifique.
- **Toda validación genérica va en `apps/mobile/shared/validation/`**, nunca suelta en una pantalla: `limits.ts` (longitudes y rangos), `dates.ts`, `numbers.ts`, `text.ts`. Devuelven el mensaje de error o `null`, que es justo lo que espera la prop `error` de los inputs. Si te falta una regla, agregala ahí antes de usarla.
- `shared/validation/limits.ts` está **duplicado a mano** en `pethood-backend/src/shared/validation/limits.ts` (son repos separados, no hay import posible). Si cambiás un número, cambialo en los dos en el mismo PR: si divergen, el input corta a una longitud y el server valida otra.

## Identidad visual

Confianza, transparencia y calidez. Colores claros que guían acciones y comunican estados (solicitud pendiente/aprobada, vigencia de publicación, progreso de campaña).

**Paleta (tomada del diseño de referencia, ver abajo):** `#FF9D5C` naranja principal, `#FF8A3D` presionado, `#FFF5ED` fondo de pantallas, `#F5F1E8` fin del degradado, `#FAFAFA` fondo de campos de formulario. Están todos en `apps/mobile/tailwind.config.js` como `pethood-*`: **usar siempre la clase, nunca el hex suelto**, para que un cambio de paleta sea un solo archivo.

> Reemplazan al `#FF7A45` / `#F5EBE0` que figuraba antes acá, que no coincidía con el diseño (decisión de equipo, 2026-08-13).

## Diseño de referencia

El prototipo de alta fidelidad está exportado como app web React en `source/` (raíz del proyecto, fuera de ambos repos): Vite + Tailwind + shadcn/ui + lucide-react. Sirve como **especificación visual**, no como código reutilizable — es web (`<div>`, CSS), y React Native necesita `<View>`/`<Text>`, así que cada pantalla se porta a mano.

Qué mirar ahí antes de codear una pantalla:

- `src/app/pages/Register.tsx` — el formulario más completo: estilo de campo, label, marca de obligatorio y mensaje de error.
- `src/app/components/AnimalCard.tsx` y `pages/shelter/ShelterAnimals.tsx` — tarjetas de mascota y listado.
- `src/app/components/AlertMessage.tsx` — mensajes de feedback.
- `src/app/components/BottomNav.tsx` — navegación inferior.

**Ojo:** el diseño incluye una pestaña "Mapa" que **no se implementa** — el proyecto excluye explícitamente el mapa interactivo. Y no trae la pantalla de crear mascota, así que ese formulario se arma siguiendo las convenciones de `Register.tsx`.
