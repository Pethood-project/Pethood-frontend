# PLAN DE ACCION — Web Admin

Plan de construccion para dejar la web-admin con UI completa. Ordenado por dependencias: primero los componentes de uso compartido, despues las pantallas que los consumen.

Referencia: `API.ADMIN.md` para contratos de API, `../Pethood-backend/docs/REQUISITOS.md` para textos de UI (seccion 5, voseo rioplatense), `../Pethood-backend/docs/MODELO_DATOS.md` para entidades y campos.

---

## Fase A — Sistema de diseño (componentes base)

Los componentes del mobile existen en React Native y no se pueden copiar directamente a Next.js, pero la logica y el patron se reutilizan. Cada componente se crea en `src/components/ui/`.

### A1. Toast de notificacion

Crear `src/components/ui/Toast.tsx` como Provider + hook, igual que el mobile (`components/feedback/Toast.tsx`).

- Provider en el root layout o en cada layout de seccion (admin/refugio).
- Hook: `useToast()` con metodos `exito(msg)`, `advertencia(msg)`, `error(msg)`.
- Auto-dismiss 4s, fade-in animation (reutilizar `animate-dashboard-in` de `globals.css`).
- Posicion: top-right fijo (estilo standard de paneles web).
- Textos: voseo rioplatense, ver tabla de REQUISITOS.md seccion 5.

### A2. Modal de confirmacion

Crear `src/components/ui/ConfirmDialog.tsx`.

- Props: `titulo`, `mensaje`, `tipo` (peligro | advertencia), `textoConfirmar`, `textoCancelar`, `onConfirmar`, `cargando`, `abierto`.
- Dos modos: confirmacion (cancelar + confirmar) e informativo (solo "Entendido").
- Bloquea dismiss mientras `cargando` esta en true.
- Overlay con backdrop oscuro, centrado en pantalla.

### A3. Input reutilizable

Crear `src/components/ui/Input.tsx`.

- Props: `label`, `error` (string | null), `obligatorio`, `disabled`, `placeholder`, iconos opcionales.
- Label arriba (uppercase, small), marca `*` si es obligatorio, texto de error abajo en rojo.
- Estados: default, focus (borde naranja), error (borde rojo), disabled (opacity).
- Companion: `src/components/ui/Select.tsx` para dropdowns nativos (`<select>`), y `src/components/ui/TextArea.tsx` con contador de caracteres.

### A4. Badge de estado

Crear `src/components/ui/Badge.tsx`.

- Componente generico: pill con color por variante.
- Variantes: `exito` (verde), `advertencia` (amber), `error` (rojo), `info` (azul), `neutral` (gris).
- Uso principal: estados de usuario/refugio (PEND_VERIFICACION → advertencia, ACTIVO → exito, SUSPENDIDO → error), verificado (si/no).

### A5. Tabla reutilizable

Crear `src/components/ui/DataTable.tsx`.

- Props: `columnas` (array de {key, label, render?}), `datos`, `ordenColumna`, `direccionOrden`, `onOrdenar`, `vacio` (mensaje cuando no hay datos).
- Responsive: en mobile se muestra como lista de cards (patron comun en paneles admin).
- Paginacion: componente `src/components/ui/Paginacion.tsx` con page/limit/total.

### A6. Estados de carga y vacio

Crear `src/components/ui/LoadingState.tsx` y usar/refactorizar `PantallaPendiente` para que sea un empty state generico.

- `LoadingState`: spinner centrado con texto opcional "Cargando...".
- `EmptyState`: icono + titulo + descripcion + CTA opcional (boton). Reutilizar el patron de `DashboardVacio`.
- `ErrorState`: icono de error + titulo + mensaje + boton de reintentar.

### A7. Filtros de listado

Crear `src/components/ui/FiltrosBar.tsx`.

- Barra horizontal con inputs de filtro: busqueda (texto), selects de rol/estado/verificado.
- Boton "Limpiar filtros".
- Se connecta a los query params de la API (PATRON: los filtros se guardan en URL search params para que la pagina sea shareable).

---

## Fase B — Login funcional

### B1. Login real

El form visual ya existe en `src/app/(auth)/login/page.tsx` pero los inputs estan disabled y no tiene submit.

- Habilitar inputs, conectar a `POST /api/v1/auth/login`.
- Decodificar JWT, guardar en cookie `phd_token` (o donde este configurado).
- Redirect segun rol: admin → `/admin/dashboard`, refugio → `/refugio/dashboard`.
- Manejo de errores: credenciales invalidas (toast error), usuario suspendido (toast error).
- Componentes: usar `Input` de A3.

---

## Fase C — Pantalla de Usuarios (`/admin/usuarios`)

Reemplazar `PantallaPendiente` por pantalla funcional. HU-2.3, HU-2.5.

### C1. Listado de usuarios

- Page: `src/app/admin/usuarios/page.tsx` (server component que pasa token al client).
- Client component: `src/components/admin/UsuariosListado.tsx`.
- Fetch: `GET /admin/usuarios` con filtros de URL search params.
- Render: `DataTable` con columnas: nombre, email, dni, verificado (badge), estado (badge), roles, fechaAlta.
- Filtros: `FiltrosBar` con busqueda, rol, estado, verificado.
- Paginacion: `Paginacion` al final.
- Estados: LoadingState, EmptyState ("No se encontraron usuarios"), ErrorState.

### C2. Verificar usuario

- Boton "Verificar" en cada fila (solo visible si `verificado=false` y `estado=PEND_VERIFICACION`).
- Click → `ConfirmDialog` ("¿Verificar a Juan Perez? Se confirmara la validacion de DNI y telefono.").
- Confirmar → `PATCH /admin/usuarios/:id/verificar`.
- Exito → toast exito, refrescar listado.
- Error → toast error.

### C3. Suspender usuario

- Boton "Suspender" en cada fila (solo si `estado !== SUSPENDIDO` y `rol !== ADMIN`).
- Click → `ConfirmDialog` con textarea para motivo (tipo peligro).
- Confirmar → `PATCH /admin/usuarios/:id/suspender`.
- Exito → toast exito, refrescar listado.

---

## Fase D — Pantalla de Refugios (`/admin/refugios`)

Reemplazar `PantallaPendiente` por pantalla funcional. HU-2.2, HU-2.4.

### D1. Listado de refugios

- Page: `src/app/admin/refugios/page.tsx`.
- Client component: `src/components/admin/RefugiosListado.tsx`.
- Fetch: `GET /admin/refugios` con filtros.
- Render: `DataTable` con columnas: nombre, direccion, email, verificado (badge), estado (badge), miembros (count), mascotas (count), fechaAlta.
- Filtros: busqueda, verificado, estado.
- Estados: LoadingState, EmptyState, ErrorState.

### D2. Detalle de refugio (modal o slide-over)

- Click en fila → modal con `GET /admin/refugios/:id`.
- Mostrar: datos completos del refugio, lista de miembros, resumen de actividad (mascotas, publicaciones, solicitudes, campañas, resenas).
- Botones de accion: "Verificar" y "Suspender" segun estado.

### D3. Verificar refugio

- Boton "Verificar" en modal o fila (solo si `verificado=false` y `estado=PEND_VERIFICACION`).
- ConfirmDialog → `PATCH /admin/refugios/:id/verificar`.
- Toast exito, cerrar modal, refrescar listado.

### D4. Suspender refugio

- Boton "Suspender" (solo si `estado !== SUSPENDIDO`).
- ConfirmDialog con textarea de motivo (peligro) → `PATCH /admin/refugios/:id/suspender`.
- Toast exito, refrescar listado.

---

## Fase E — Pantalla de Catálogos (`/admin/catalogos`)

Reemplazar `PantallaPendiente`. CRUD de especies y razas.

### E1. Lista de especies

- Page: `src/app/admin/catalogos/page.tsx`.
- Fetch: `GET /admin/catalogos/especies`.
- Render: tabla con nombre, descripcion, cantidad de razas, activo/inactivo.
- Botones: "Editar" (abre modal), "Eliminar" (confirm), "Nueva especie" (abre modal).
- Estados: LoadingState, EmptyState.

### E2. Modal de crear/editar especie

- `ConfirmDialog` adaptado o modal propio.
- Campos: nombre (obligatorio), descripcion (opcional).
- Crear → `POST /admin/catalogos/especies`.
- Editar → `PATCH /admin/catalogos/especies/:id`.
- Toast exito, refrescar lista.

### E3. Eliminar especie

- ConfirmDialog tipo peligro: "¿Eliminar la especie 'Conejo'? Esta accion es irreversible."
- Si tiene razas/mascotas activas → error de la API → toast error con mensaje.
- Exito → toast exito, refrescar.

### E4. Lista de razas (por especie)

- Click en especie → expande o navega a sub-vista con sus razas.
- Fetch: `GET /admin/catalogos/especies/:id/razas`.
- CRUD: crear, editar nombre, eliminar raza (mismos patrones que especie).

### E5. Catalogos de estado (solo lectura)

- Seccion inferior o tab: "Estados del sistema".
- Fetch: `GET /admin/catalogos/estados`.
- Render: listas de pills/badges agrupados por tipo (mascota, usuario, refugio, solicitud, campaña, roles).
- Sin acciones de edicion.

---

## Fase F — Pantalla de Moderación (`/admin/moderacion`)

Reemplazar `PantallaPendiente`. HU-3.1 a HU-3.7.
**Dependiente:** confirmacion de la entidad `Reporte_Problema` en el modelo de datos.

### F1. Listado de reportes

- Page: `src/app/admin/moderacion/page.tsx`.
- Fetch: `GET /admin/moderacion/reportes` con filtro `resuelto`.
- Render: `DataTable` con columnas: motivo, resuelto (badge), fechaAlta.
- Filtros: resuelto (pendientes por defecto).
- Estados: LoadingState, EmptyState ("No hay reportes pendientes").

### F2. Resolver reporte

- Click en reporte → modal con detalle.
- Textarea para respuesta interna + textarea para mensaje al usuario.
- Confirmar → `PATCH /admin/moderacion/reportes/:id/resolver`.
- Toast exito, refrescar listado.

---

## Fase G — Dashboard de Refugio (`/refugio/dashboard`)

Reemplazar `PantallaPendiente`. HU-14.2.

### G1. Dashboard de gestion interna

- Requiere: `GET /admin/dashboard/refugio` (documentado en API.ADMIN.md, no implementado en backend).
- Page: `src/app/refugio/dashboard/page.tsx`.
- Fetch con `refugioId` del usuario logueado.
- Componentes: reutilizar `KpiCard`, `DonutChart`, `BarList` del dashboard admin.
- KPIs: mascotasActivas, solicitudesPendientes, adopcionesConcretadas, campaniasActivas, resenasRecibidas, promedioResenas.

---

## Orden de ejecucion sugerido

```
A1 (Toast)          ← todo lo demas depende de esto
A2 (ConfirmDialog)  ← verify/suspend dependen de esto
A3 (Input/Select)   ← formularios y filtros
A4 (Badge)          ← listados
A5 (DataTable)      ← listados
A6 (Loading/Empty)  ← listados
A7 (FiltrosBar)     ← listados

B1 (Login real)     ← desbloquea sesion en web-admin

C1-C3 (Usuarios)    ← primera pantalla funcional
D1-D4 (Refugios)    ← segunda pantalla funcional
E1-E5 (Catalogos)   ← tercera pantalla funcional
F1-F2 (Moderacion)  ← cuarta pantalla (depende de backend)
G1 (Dashboard refugio) ← quinta pantalla (depende de backend)
```

**Total: 7 componentes base + ~15 tareas de implementacion de pantallas.**

---

## Notas

- Cada pantalla nueva sigue el patron: server component (page.tsx) que pasa el token → client component que hace fetch y renderiza.
- Textos de UI en voseo rioplatense, ver REQUISITOS.md seccion 5.
- No hardcodear textos de error genericos — usar los de la API o los de REQUISITOS.md.
- Validar en el cliente solo para UX; la validacion real vive en el backend.
- Nombres de componentes de pantalla con su GUI-XX para trazabilidad academica.
