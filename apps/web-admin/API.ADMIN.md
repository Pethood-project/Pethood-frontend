# API — Web Admin

Todos los endpoints bajo `/api/v1/admin`. Requieren autenticacion JWT + rol `Administrador` salvo que se indique lo contrario.

---

## `GET /api/v1/admin/dashboard`

KPIs agregados y desgloses para el panel de administracion global. Sin parametros de entrada.

**Respuesta:**

```json
{
  "kpis": {
    "usuariosActivos": 150,
    "mascotasRegistradas": 320,
    "refugiosVerificados": 12,
    "publicacionesActivas": 45,
    "adopcionesConcretadas": 28,
    "campaniasActivas": 5,
    "montoDonadoDeclarado": 125000.50,
    "reportesPendientes": 3
  },
  "usuariosPorRol": {
    "Adoptante": 120,
    "Refugio": 25,
    "Administrador": 5
  },
  "mascotasPorEstado": {
    "Disponible": 100,
    "Adoptado": 80,
    "En_Tratamiento": 30,
    "Fallecido": 5
  },
  "solicitudesPorEstado": [
    { "estado": "Pendiente",  "cantidad": 10, "porcentaje": 25.0 },
    { "estado": "Aprobada",   "cantidad": 28, "porcentaje": 70.0 },
    { "estado": "Rechazada",  "cantidad": 2,  "porcentaje": 5.0 }
  ],
  "publicacionesPorMes": [
    { "mes": "Mar", "publicaciones": 12, "adopciones": 5 },
    { "mes": "Abr", "publicaciones": 8,  "adopciones": 7 },
    { "mes": "May", "publicaciones": 15, "adopciones": 3 },
    { "mes": "Jun", "publicaciones": 10, "adopciones": 6 },
    { "mes": "Jul", "publicaciones": 9,  "adopciones": 4 },
    { "mes": "Ago", "publicaciones": 6,  "adopciones": 3 }
  ]
}
```

**Descripcion de campos:**

| Seccion | Tipo | Descripcion |
|---|---|---|
| `kpis.usuariosActivos` | number | Usuarios sin baja logica |
| `kpis.mascotasRegistradas` | number | Mascotas sin baja logica |
| `kpis.refugiosVerificados` | number | Refugios con `verificado=true` |
| `kpis.publicacionesActivas` | number | Publicaciones con `fechaBaja=null` |
| `kpis.adopcionesConcretadas` | number | Solicitudes con estado "Aprobada" |
| `kpis.campaniasActivas` | number | Campanas con `fechaBaja=null` |
| `kpis.montoDonadoDeclarado` | number | Suma de montos declarados en donaciones |
| `kpis.reportesPendientes` | number | Mascotas perdidas/encontradas sin resolver |
| `usuariosPorRol` | object | Cantidad de usuarios activos por rol |
| `mascotasPorEstado` | object | Cantidad de mascotas activas por estado |
| `solicitudesPorEstado` | array | Conteo y porcentaje (1 decimal) por estado |
| `publicacionesPorMes` | array | Ultimos 6 meses, valores en cero si no hay datos |

---

## `GET /api/v1/admin/dashboard/exportar/:entidad`

Exporta la entidad indicada como CSV para descarga. Streaming interno (500 filas/pagina), sin carga completa en memoria.

**Parametro de URL:**

| Nombre | Tipo | Valores permitidos |
|---|---|---|
| `entidad` | string | `usuarios`, `mascotas`, `publicaciones`, `solicitudes`, `campanias` |

**Respuesta:** `Content-Type: text/csv; charset=utf-8` con `Content-Disposition: attachment; filename="<entidad>.csv"`.

**Columnas CSV por entidad:**

| Entidad | Columnas |
|---|---|
| `usuarios` | id, nombre, apellido, email, dni, verificado, estado, fechaAlta |
| `mascotas` | id, nombre, especie, raza, estado, refugioId, usuarioId, fechaAlta |
| `publicaciones` | id, titulo, mascotaId, usuarioId, ubicacion, fechaAlta |
| `solicitudes` | id, tipo, publicacionId, usuarioId, estado, fechaAlta |
| `campanias` | id, titulo, objetivo, estado, refugioId, fechaInicio, fechaFin |

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `ENTIDAD_INVALIDA` | La entidad no es valida para exportacion | 400 |

---

## `GET /api/v1/admin/dashboard/refugio` [ ]

Dashboard agregado de un refugio especifico (gestion interna). Un refugio ve el suyo; un admin puede consultar cualquiera.

**Query params:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `refugioId` | integer | ID del refugio a consultar |

**Respuesta:**

```json
{
  "kpis": {
    "mascotasActivas": 15,
    "solicitudesPendientes": 3,
    "adopcionesConcretadas": 12,
    "campaniasActivas": 2,
    "resenasRecibidas": 28,
    "promedioResenas": 4.2
  },
  "solicitudesPorEstado": [
    { "estado": "Pendiente", "cantidad": 3, "porcentaje": 20.0 },
    { "estado": "Aprobada",  "cantidad": 12, "porcentaje": 80.0 }
  ],
  "mascotasPorEstado": [
    { "estado": "Disponible",   "cantidad": 8 },
    { "estado": "En_Transito",  "cantidad": 4 },
    { "estado": "Adoptado",     "cantidad": 3 }
  ],
  "campanasActivas": [
    {
      "id": 1,
      "titulo": "Campana invierno",
      "objetivo": 500000,
      "montoAcumulado": 125000,
      "porcentaje": 25.0
    }
  ],
  "ultimasResenas": [
    {
      "id": 1,
      "puntuacion": 5,
      "comentario": "Muy buen trato",
      "autor": { "id": 5, "nombre": "Juan" },
      "fecha": "2026-08-01T10:00:00.000Z"
    }
  ]
}
```

**Descripcion de campos:**

| Seccion | Tipo | Descripcion |
|---|---|---|
| `kpis.mascotasActivas` | number | Mascotas del refugio sin baja logica |
| `kpis.solicitudesPendientes` | number | Solicitudes en estado "Pendiente" |
| `kpis.adopcionesConcretadas` | number | Solicitudes con estado "Aprobada" |
| `kpis.campaniasActivas` | number | Campanas activas del refugio |
| `kpis.resenasRecibidas` | number | Total de resenas activas |
| `kpis.promedioResenas` | number | Promedio de puntuacion (1 decimal) |
| `solicitudesPorEstado` | array | Conteo por estado |
| `mascotasPorEstado` | array | Conteo por estado |
| `campanasActivas` | array | Campanas con progreso actual |
| `ultimasResenas` | array | Ultimas 5 resenas recibidas |

---

# Gestión de Usuarios

## `GET /api/v1/admin/usuarios`

Listado paginado de todos los usuarios del sistema. Soporta filtros y búsqueda.

**Query params:**

| Nombre | Tipo | Default | Descripcion |
|---|---|---|---|
| `page` | integer | 1 | Pagina a retornar (1-indexed) |
| `limit` | integer | 20 | Cantidad de resultados por pagina (max 50) |
| `q` | string | — | Busqueda parcial por nombre, apellido o email |
| `rol` | string | — | Filtrar por rol: `ADOPTANTE`, `MIEMBRO_REFUGIO`, `ADMIN` |
| `estado` | string | — | Filtrar por estado del usuario (nombre del catalogo, ej. `Activo`, `Pendiente_Verificacion`, `Suspendido`) |
| `verificado` | `'true'` \| `'false'` | — | Filtrar por estado de verificacion |

> No hay ordenamiento server-side (`orden`/`direccion`) por ahora: el listado siempre va por `id` ascendente.

**Respuesta:**

```json
{
  "total": 150,
  "page": 1,
  "limit": 20,
  "usuarios": [
    {
      "id": 5,
      "nombre": "Juan",
      "apellido": "Perez",
      "email": "juan@mail.com",
      "dni": "38123456",
      "telefono": "+54 261 555-1234",
      "verificado": true,
      "estado": "Activo",
      "roles": ["ADOPTANTE"],
      "refugioId": null
    }
  ]
}
```

**Descripcion de campos del usuario:**

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | number | ID unico del usuario |
| `nombre` | string | Nombre |
| `apellido` | string | Apellido |
| `email` | string | Email (unico) |
| `dni` | string \| null | DNI (nullable para cuentas Google) |
| `telefono` | string \| null | Telefono (nullable para cuentas Google) |
| `verificado` | boolean | true si el admin verifico DNI/telefono |
| `estado` | string | Estado actual del usuario |
| `roles` | string[] | Roles asignados |
| `refugioId` | number \| null | ID del refugio asociado si es MIEMBRO_REFUGIO |

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `VALIDACION` | Los parametros de consulta no son validos | 400 |

---

## `PATCH /api/v1/admin/usuarios/:id/verificar`

Marca un usuario como verificado (validacion de DNI y telefono por parte del admin). Solo aplica a usuarios en estado `Pendiente_Verificacion`.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del usuario a verificar |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Usuario verificado correctamente",
  "usuario": {
    "id": 5,
    "verificado": true,
    "estado": "Activo"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `USUARIO_NO_ENCONTRADO` | No se encontro el usuario | 404 |
| `USUARIO_YA_VERIFICADO` | El usuario ya esta verificado | 409 |
| `ESTADO_INVALIDO` | El usuario no esta en Pendiente_Verificacion | 409 |
| `DATOS_INCOMPLETOS` | Falta el DNI y/o el telefono del usuario | 409 |

---

## `PATCH /api/v1/admin/usuarios/:id/suspender`

Suspende un usuario (cambia estado a `Suspendido`). Un usuario suspendido no puede iniciar sesion (403 en login).

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del usuario a suspender |

**Body:**

```json
{
  "motivo": "Violacion de terminos de uso"
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `motivo` | string | si | Motivo de la suspension (se registra en auditoria) |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Usuario suspendido correctamente",
  "usuario": {
    "id": 5,
    "estado": "Suspendido"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `USUARIO_NO_ENCONTRADO` | No se encontro el usuario | 404 |
| `NO_SE_PUEDE_SUSPENDER_ADMIN` | No se puede suspender a un administrador | 403 |
| `USUARIO_YA_SUSPENDIDO` | El usuario ya esta suspendido | 409 |
| `ESTADO_INVALIDO` | Solo se puede suspender a un usuario Activo | 409 |

---

## `PATCH /api/v1/admin/usuarios/:id/reactivar`

Reactiva un usuario suspendido (`Suspendido` → `Activo`). Vuelve a poder iniciar sesion.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del usuario a reactivar |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Usuario reactivado correctamente",
  "usuario": {
    "id": 5,
    "estado": "Activo"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `USUARIO_NO_ENCONTRADO` | No se encontro el usuario | 404 |
| `ESTADO_INVALIDO` | El usuario no esta suspendido | 409 |

---

## `PATCH /api/v1/admin/usuarios/:id/baja`

Baja logica de un usuario: setea fecha de baja y estado `Inactivo`. No tiene reversion por API. No aplica a administradores.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del usuario a dar de baja |

**Body:**

```json
{
  "motivo": "Cuenta duplicada"
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `motivo` | string | si | Motivo de la baja (1-500 caracteres, se registra en auditoria) |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Usuario dado de baja correctamente",
  "usuario": {
    "id": 5,
    "estado": "Inactivo"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `USUARIO_NO_ENCONTRADO` | No se encontro el usuario | 404 |
| `NO_SE_PUEDE_BAJAR_ADMIN` | No se puede dar de baja a un administrador | 403 |
| `USUARIO_YA_DADO_DE_BAJA` | El usuario ya fue dado de baja | 409 |
| `VALIDACION` | Motivo vacio o fuera de rango | 400 |

---

## `PATCH /api/v1/admin/usuarios/:id/roles`

Agrega y/o quita roles de un usuario en una sola llamada (HU-2.1).

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del usuario |

**Body:**

```json
{
  "agregar": ["MIEMBRO_REFUGIO"],
  "quitar": [],
  "refugioId": 2
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `agregar` | string[] | no | Codigos de rol a agregar: `ADMIN`, `ADOPTANTE`, `MIEMBRO_REFUGIO` |
| `quitar` | string[] | no | Codigos de rol a quitar |
| `refugioId` | integer | condicional | Obligatorio al agregar `MIEMBRO_REFUGIO` (el refugio al que pertenece) |

**Reglas:**

- Un mismo rol no puede estar en `agregar` y `quitar` a la vez.
- No se puede modificar roles de un usuario con rol `ADMIN` (ni auto-modificarse).
- Quitar `ADMIN` a otro admin solo si queda al menos otro administrador activo, si no `ULTIMO_ADMINISTRADOR`.

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Roles actualizados correctamente",
  "roles": ["ADOPTANTE", "MIEMBRO_REFUGIO"]
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `USUARIO_NO_ENCONTRADO` | No se encontro el usuario | 404 |
| `VALIDACION` | Rol invalido, mismo rol en agregar y quitar, o MIEMBRO_REFUGIO sin refugioId | 400 |
| `NO_SE_PUEDE_EDITAR_ADMIN` | No se pueden modificar los roles de un administrador | 403 |
| `REFUGIO_NO_ENCONTRADO` | El refugioId indicado no existe | 404 |
| `ULTIMO_ADMINISTRADOR` | No se puede quitar el ultimo administrador | 409 |

---

## `PATCH /api/v1/admin/usuarios/:id/reactivar`

Reactiva un usuario suspendido (`Suspendido` → `Activo`). Vuelve a poder iniciar sesion.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del usuario a reactivar |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Usuario reactivado correctamente",
  "usuario": {
    "id": 5,
    "estado": "Activo"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `USUARIO_NO_ENCONTRADO` | No se encontro el usuario | 404 |
| `ESTADO_INVALIDO` | El usuario no esta suspendido | 400 |

---

## `PATCH /api/v1/admin/usuarios/:id/baja`

Baja logica de un usuario: setea fecha de baja y estado `Inactivo`. No tiene reversion por API. No aplica a administradores.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del usuario a dar de baja |

**Body:**

```json
{
  "motivo": "Cuenta duplicada"
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `motivo` | string | si | Motivo de la baja (1-500 caracteres, se registra en auditoria) |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Usuario dado de baja correctamente",
  "usuario": {
    "id": 5,
    "estado": "Inactivo"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `USUARIO_NO_ENCONTRADO` | No se encontro el usuario | 404 |
| `NO_SE_PUEDE_BAJAR_ADMIN` | No se puede dar de baja a un administrador | 403 |
| `USUARIO_YA_DADO_DE_BAJA` | El usuario ya fue dado de baja | 409 |
| `VALIDACION` | Motivo vacio o fuera de rango | 400 |

---

## `PATCH /api/v1/admin/usuarios/:id/roles`

Agrega y/o quita roles de un usuario en una sola llamada (HU-2.1).

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del usuario |

**Body:**

```json
{
  "agregar": ["MIEMBRO_REFUGIO"],
  "quitar": [],
  "refugioId": 2
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `agregar` | string[] | no | Codigos de rol a agregar: `ADMIN`, `ADOPTANTE`, `MIEMBRO_REFUGIO` |
| `quitar` | string[] | no | Codigos de rol a quitar |
| `refugioId` | integer | condicional | Obligatorio al agregar `MIEMBRO_REFUGIO` (el refugio al que pertenece) |

**Reglas:**

- Un mismo rol no puede estar en `agregar` y `quitar` a la vez.
- No se puede modificar roles de un usuario con rol `ADMIN` (ni auto-modificarse).
- Quitar `ADMIN` a otro admin solo si queda al menos otro administrador activo, si no `ULTIMO_ADMINISTRADOR`.

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Roles actualizados correctamente",
  "roles": ["ADOPTANTE", "MIEMBRO_REFUGIO"]
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `USUARIO_NO_ENCONTRADO` | No se encontro el usuario | 404 |
| `ROL_INVALIDO` | Un codigo de rol no es valido | 400 |
| `VALIDACION` | Mismo rol en agregar y quitar, o MIEMBRO_REFUGIO sin refugioId | 400 |
| `NO_SE_PUEDE_EDITAR_ADMIN` | No se pueden modificar los roles de un administrador | 403 |
| `REFUGIO_NO_ENCONTRADO` | El refugioId indicado no existe | 404 |
| `ULTIMO_ADMINISTRADOR` | No se puede quitar el ultimo administrador | 409 |

---

# Gestión de Refugios

> Estados posibles: `Pendiente_Verificacion`, `Activo`, `Suspendido`, `Inactivo` (baja logica). El valor `Suspendido` se incorpora al catalogo por el seed del modulo (spec backend 002).

## `POST /api/v1/admin/refugios`

Da de alta un refugio desde el panel (HU-2.4). Nace en estado `Pendiente_Verificacion` con `verificado=false`; queda habilitado cuando el admin lo verifica.

**Body:**

```json
{
  "nombre": "Refugio Patitas",
  "direccion": "Av. San Martin 1234",
  "telefono": "+54 261 555-1234",
  "email": "patitas@refugio.com",
  "descripcion": "Refugio independiente fundado en 2020"
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `nombre` | string | si | Nombre del refugio |
| `direccion` | string | si | Direccion fiscal |
| `telefono` | string | no | Telefono de contacto |
| `email` | string | no | Email de contacto |
| `descripcion` | string | no | Descripcion |

**Respuesta:** `201 Created`

```json
{
  "mensaje": "Refugio creado correctamente",
  "refugio": {
    "id": 3,
    "nombre": "Refugio Patitas",
    "estado": "Pendiente_Verificacion",
    "verificado": false
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `VALIDACION` | Campos fuera de rango o vacios | 400 |

---

## `GET /api/v1/admin/refugios`

Listado paginado de todos los refugios del sistema. Soporta filtros y busqueda.

**Query params:**

| Nombre | Tipo | Default | Descripcion |
|---|---|---|---|
| `page` | integer | 1 | Pagina a retornar (1-indexed) |
| `limit` | integer | 20 | Cantidad de resultados por pagina (max 50) |
| `q` | string | — | Busqueda parcial por nombre del refugio |
| `verificado` | `'true'` \| `'false'` | — | Filtrar por estado de verificacion |
| `estado` | string | — | Filtrar por estado del refugio (nombre del catalogo, ej. `Pendiente_Verificacion`, `Activo`, `Suspendido`) |

> No hay ordenamiento server-side (`orden`/`direccion`) por ahora: el listado siempre va por `id` ascendente.

**Respuesta:**

```json
{
  "total": 12,
  "page": 1,
  "limit": 20,
  "refugios": [
    {
      "id": 2,
      "nombre": "Refugio Patitas",
      "direccion": "Av. San Martin 1234",
      "telefono": "+54 261 555-1234",
      "email": "patitas@refugio.com",
      "descripcion": "Refugio independiente fundado en 2020",
      "verificado": false,
      "estado": "Pendiente_Verificacion",
      "imagenUrl": null
    }
  ]
}
```

**Descripcion de campos del refugio:**

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | number | ID unico del refugio |
| `nombre` | string | Nombre del refugio |
| `direccion` | string | Direccion fiscal o physical |
| `telefono` | string \| null | Telefono de contacto |
| `email` | string \| null | Email de contacto |
| `descripcion` | string \| null | Descripcion |
| `verificado` | boolean | true si el admin verifico el refugio |
| `estado` | string | Estado actual del refugio |
| `imagenUrl` | string \| null | URL de logo/imagen |

> **Decision de equipo:** los conteos (`miembros`/`mascotas`/`campanias`) y `fechaAlta` quedan afuera del listado a proposito — traerlos por fila implicaria 3 queries de agregacion extra por cada resultado de la pagina. Esos numeros ya estan disponibles en el detalle (`GET /admin/refugios/:id`, campo `resumen`), donde el costo se paga una sola vez.

---

## `GET /api/v1/admin/refugios/:id`

Detalle completo de un refugio, incluyendo miembros y resumen de actividad. Util para modal de revision antes de verificar.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del refugio |

**Respuesta:**

```json
{
  "refugio": {
    "id": 2,
    "nombre": "Refugio Patitas",
    "direccion": "Av. San Martin 1234",
    "telefono": "+54 261 555-1234",
    "email": "patitas@refugio.com",
    "descripcion": "Refugio independiente fundado en 2020...",
    "verificado": false,
    "estado": "Pendiente_Verificacion",
    "imagenUrl": "https://..."
  },
  "miembros": [
    {
      "id": 10,
      "nombre": "Maria",
      "apellido": "Lopez",
      "email": "maria@patitas.com",
      "roles": ["MIEMBRO_REFUGIO"]
    }
  ],
  "resumen": {
    "mascotasActivas": 12,
    "publicacionesActivas": 8,
    "solicitudesPendientes": 3,
    "campaniasActivas": 2,
    "resenasRecibidas": 15,
    "promedioResenas": 4.3
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `REFUGIO_NO_ENCONTRADO` | No se encontro el refugio | 404 |

---

## `PATCH /api/v1/admin/refugios/:id/verificar`

Verifica un refugio, habilitandolo a operar plenamente. Solo aplica a refugios en estado `Pendiente_Verificacion`.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del refugio a verificar |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Refugio verificado correctamente",
  "refugio": {
    "id": 2,
    "verificado": true,
    "estado": "Activo"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `REFUGIO_NO_ENCONTRADO` | No se encontro el refugio | 404 |
| `REFUGIO_YA_VERIFICADO` | El refugio ya esta verificado | 409 |
| `ESTADO_INVALIDO` | El refugio no esta en Pendiente_Verificacion | 409 |

---

## `PATCH /api/v1/admin/refugios/:id/suspender`

Suspende un refugio (cambia estado a `Suspendido`). Un refugio suspendido no puede publicar mascotas ni campanias.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del refugio a suspender |

**Body:**

```json
{
  "motivo": "Incumplimiento de normativas"
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `motivo` | string | si | Motivo de la suspension (se registra en auditoria) |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Refugio suspendido correctamente",
  "refugio": {
    "id": 2,
    "estado": "Suspendido"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `REFUGIO_NO_ENCONTRADO` | No se encontro el refugio | 404 |
| `REFUGIO_YA_SUSPENDIDO` | El refugio ya esta suspendido | 409 |
| `ESTADO_INVALIDO` | Solo se puede suspender a un refugio Activo | 409 |

---

## `PATCH /api/v1/admin/refugios/:id/reactivar`

Reactiva un refugio suspendido (`Suspendido` → `Activo`).

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del refugio a reactivar |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Refugio reactivado correctamente",
  "refugio": {
    "id": 2,
    "estado": "Activo"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `REFUGIO_NO_ENCONTRADO` | No se encontro el refugio | 404 |
| `ESTADO_INVALIDO` | El refugio no esta suspendido | 409 |

---

## `PATCH /api/v1/admin/refugios/:id/baja`

Baja logica de un refugio (HU-2.4): setea fecha de baja y estado `Inactivo`. No tiene reversion por API.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del refugio a dar de baja |

**Body:**

```json
{
  "motivo": "Refugio cerrado definitivamente"
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `motivo` | string | si | Motivo de la baja (1-500 caracteres, se registra en auditoria) |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Refugio dado de baja correctamente",
  "refugio": {
    "id": 2,
    "estado": "Inactivo"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `REFUGIO_NO_ENCONTRADO` | No se encontro el refugio | 404 |
| `REFUGIO_YA_DADO_DE_BAJA` | El refugio ya fue dado de baja | 409 |
| `VALIDACION` | Motivo vacio o fuera de rango | 400 |

---

## `PATCH /api/v1/admin/refugios/:id/reactivar`

Reactiva un refugio suspendido (`Suspendido` → `Activo`).

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del refugio a reactivar |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Refugio reactivado correctamente",
  "refugio": {
    "id": 2,
    "estado": "Activo"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `REFUGIO_NO_ENCONTRADO` | No se encontro el refugio | 404 |
| `ESTADO_INVALIDO` | El refugio no esta suspendido | 400 |

---

## `PATCH /api/v1/admin/refugios/:id/baja`

Baja logica de un refugio (HU-2.4): setea fecha de baja y estado `Inactivo`. No tiene reversion por API.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del refugio a dar de baja |

**Body:**

```json
{
  "motivo": "Refugio cerrado definitivamente"
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `motivo` | string | si | Motivo de la baja (1-500 caracteres, se registra en auditoria) |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Refugio dado de baja correctamente",
  "refugio": {
    "id": 2,
    "estado": "Inactivo"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `REFUGIO_NO_ENCONTRADO` | No se encontro el refugio | 404 |
| `REFUGIO_YA_DADO_DE_BAJA` | El refugio ya fue dado de baja | 409 |
| `VALIDACION` | Motivo vacio o fuera de rango | 400 |

---

# Catálogos

Los catálogos son tablas de referencia del sistema. El admin puede gestionar (alta, edicion, baja logica) las especies y razas. Los catalogos de estado son de solo lectura.

## Especies

### `GET /api/v1/admin/catalogos/especies`

Listado de todas las especies (activas e inactivas).

**Respuesta:**

```json
{
  "especies": [
    {
      "id": 1,
      "nombre": "Perro",
      "descripcion": "Canino domestico",
      "activo": true,
      "razas": 45,
      "fechaAlta": "2026-06-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "nombre": "Gato",
      "descripcion": "Felino domestico",
      "activo": true,
      "razas": 30,
      "fechaAlta": "2026-06-01T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/v1/admin/catalogos/especies`

Crea una nueva especie.

**Body:**

```json
{
  "nombre": "Conejo",
  "descripcion": "Lagomorfo domestico"
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `nombre` | string | si | Nombre de la especie (unico) |
| `descripcion` | string | no | Descripcion opcional |

**Respuesta:** `201 Created`

```json
{
  "mensaje": "Especie creada correctamente",
  "especie": {
    "id": 3,
    "nombre": "Conejo",
    "descripcion": "Lagomorfo domestico"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `NOMBRE_DUPLICADO` | Ya existe una especie con ese nombre | 409 |
| `VALIDACION` | Nombre o descripcion fuera de rango | 400 |

### `PATCH /api/v1/admin/catalogos/especies/:id`

Edita nombre y/o descripcion de una especie existente.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID de la especie |

**Body:** campos opcionales (solo se actualizan los enviados).

```json
{
  "nombre": "Canino",
  "descripcion": "Canino domestico (actualizado)"
}
```

**Respuesta:** `200 OK`

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `ESPECIE_NO_ENCONTRADA` | No se encontro la especie | 404 |
| `NOMBRE_DUPLICADO` | Ya existe otra especie con ese nombre | 409 |

### `DELETE /api/v1/admin/catalogos/especies/:id`

Baja logica de una especie. No se puede eliminar si tiene razas o mascotas asociadas activas.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID de la especie |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Especie dada de baja correctamente"
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `ESPECIE_NO_ENCONTRADA` | No se encontro la especie | 404 |
| `TIENE_DEPENDENCIAS` | La especie tiene razas o mascotas activas asociadas | 409 |

---

## Razas

### `GET /api/v1/admin/catalogos/especies/:especieId/razas`

Razas de una especie especifica (activas e inactivas).

> Nota: el endpoint publico `GET /api/v1/especies/:especieId/razas` solo retorna razas activas. Este endpoint del admin incluye las inactivas para gestion de baja logica.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `especieId` | integer | ID de la especie padre |

**Respuesta:**

```json
{
  "especie": { "id": 1, "nombre": "Perro" },
  "razas": [
    {
      "id": 10,
      "nombre": "Labrador",
      "activo": true,
      "mascotas": 25,
      "fechaAlta": "2026-06-01T00:00:00.000Z"
    },
    {
      "id": 11,
      "nombre": "Pastor Aleman",
      "activo": false,
      "mascotas": 0,
      "fechaAlta": "2026-06-01T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/v1/admin/catalogos/razas`

Crea una nueva raza asociada a una especie.

**Body:**

```json
{
  "nombre": "Bulldog",
  "especieId": 1
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `nombre` | string | si | Nombre de la raza |
| `especieId` | integer | si | ID de la especie padre |

**Respuesta:** `201 Created`

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `NOMBRE_DUPLICADO` | Ya existe esa raza para la especie indicada | 409 |
| `ESPECIE_NO_ENCONTRADA` | La especie padre no existe | 404 |

### `PATCH /api/v1/admin/catalogos/razas/:id`

Edita el nombre de una raza existente.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID de la raza |

**Body:** solo el campo `nombre` (opcional).

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `RAZA_NO_ENCONTRADA` | No se encontro la raza | 404 |
| `NOMBRE_DUPLICADO` | Ya existe esa raza para la misma especie | 409 |

### `DELETE /api/v1/admin/catalogos/razas/:id`

Baja logica de una raza. No se puede eliminar si tiene mascotas asociadas activas.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID de la raza |

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `RAZA_NO_ENCONTRADA` | No se encontro la raza | 404 |
| `TIENE_DEPENDENCIAS` | La raza tiene mascotas activas asociadas | 409 |

---

## Catalogos de Estado (solo lectura)

Los catalogos de estado son configuracion del sistema. Son de solo lectura desde el admin (no se pueden crear ni eliminar valores, solo se visualizan para referencia).

### `GET /api/v1/admin/catalogos/estados`

Retorna todos los catalogos de estado en una sola llamada.

**Respuesta:**

```json
{
  "estadosMascota": [
    { "id": 1, "nombre": "Disponible" },
    { "id": 2, "nombre": "En_Tratamiento" },
    { "id": 3, "nombre": "Adoptado" },
    { "id": 4, "nombre": "Fallecido" },
    { "id": 5, "nombre": "En_Transito" }
  ],
  "estadosUsuario": [
    { "id": 1, "nombre": "Pendiente_Verificacion" },
    { "id": 2, "nombre": "Activo" },
    { "id": 3, "nombre": "Suspendido" },
    { "id": 4, "nombre": "Inactivo" }
  ],
  "estadosRefugio": [
    { "id": 1, "nombre": "Pendiente_Verificacion" },
    { "id": 2, "nombre": "Activo" },
    { "id": 3, "nombre": "Suspendido" },
    { "id": 4, "nombre": "Inactivo" }
  ],
  "estadosSolicitud": [
    { "id": 1, "nombre": "Pendiente" },
    { "id": 2, "nombre": "Aprobada" },
    { "id": 3, "nombre": "Rechazada" }
  ],
  "estadosCampania": [
    { "id": 1, "nombre": "Inactiva" },
    { "id": 2, "nombre": "Activa" },
    { "id": 3, "nombre": "Finalizada" },
    { "id": 4, "nombre": "Cancelada" }
  ],
  "roles": [
    { "id": 1, "nombre": "Administrador" },
    { "id": 2, "nombre": "Adoptante" },
    { "id": 3, "nombre": "Refugio" }
  ]
}
```

---

# Moderación

> **Nota:** la entidad `Reporte_Problema` esta pendiente de confirmacion en el modelo de datos (ver MODELO_DATOS.md). Los endpoints de moderacion estan documentados aqui para tener la UI lista, pero la implementacion backend depende de que se defina la estructura final de esta entidad (FKs a Publicacion/Usuario/Resena, campo de tipo de reporte, etc.).

## `GET /api/v1/admin/moderacion/reportes`

Listado paginado de reportes de problemas. Filtrable por estado de resolucion y tipo.

**Query params:**

| Nombre | Tipo | Default | Descripcion |
|---|---|---|---|
| `page` | integer | 1 | Pagina a retornar (1-indexed) |
| `limit` | integer | 20 | Cantidad de resultados por pagina (max 50) |
| `resuelto` | boolean | false | Filtrar por estado de resolucion |
| `orden` | string | `fechaAlta` | Campo de ordenamiento: `fechaAlta` |
| `direccion` | string | `desc` | `asc` o `desc` |

**Respuesta:**

```json
{
  "reportes": [
    {
      "id": 1,
      "motivo": "Publicacion con contenido ofensivo",
      "resuelto": false,
      "respuesta": null,
      "mensajeSistema": null,
      "fechaAlta": "2026-08-10T14:30:00.000Z"
    }
  ],
  "paginacion": {
    "pagina": 1,
    "limite": 20,
    "total": 3,
    "totalPaginas": 1
  }
}
```

> **Pendiente:** una vez confirmada la entidad, la respuesta deberia incluir informacion del reportante, tipo de entidad reportada (publicacion/usuario/resena) y su ID, para que el admin pueda revisar el contexto antes de resolver.

---

## `PATCH /api/v1/admin/moderacion/reportes/:id/resolver`

Marca un reporte como resuelto y opcionalmente registra una respuesta del admin.

**Parametro de URL:**

| Nombre | Tipo | Descripcion |
|---|---|---|
| `id` | integer | ID del reporte a resolver |

**Body:**

```json
{
  "respuesta": "Se elimino la publicacion por violacion de normas",
  "mensajeSistema": "Su publicacion fue removida por contenido que infringe los terminos de uso."
}
```

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `respuesta` | string | no | Respuesta interna del admin (no visible al usuario reportado) |
| `mensajeSistema` | string | no | Mensaje que se envia como notificacion al usuario afectado |

**Respuesta:** `200 OK`

```json
{
  "mensaje": "Reporte resuelto correctamente",
  "reporte": {
    "id": 1,
    "resuelto": true,
    "respuesta": "Se elimino la publicacion por violacion de normas"
  }
}
```

**Errores:**

| Codigo | Mensaje | HTTP |
|---|---|---|
| `REPORTE_NO_ENCONTRADO` | No se encontro el reporte | 404 |
| `REPORTE_YA_RESUELTO` | El reporte ya fue resuelto | 409 |
