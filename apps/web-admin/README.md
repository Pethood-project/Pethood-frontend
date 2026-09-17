# apps/web-admin

Panel de administración de escritorio (Next.js App Router + Tailwind), para administradores globales y refugios ya verificados. Ver `../../CLAUDE.md` para el detalle de pantallas (GUI-XX) y reglas de esta app.

## Setup

```bash
cd apps/web-admin
cp .env.example .env.local   # completar NEXT_PUBLIC_API_URL
npm install
npm run dev                  # http://localhost:3000
```

## Estructura

Un único login (`/login`) para ambos roles. El backend devuelve los roles del usuario en el JWT; `/` reenvía al dashboard correspondiente y `src/proxy.ts` filtra la navegación entre secciones por rol (solo UX — el backend es quien autoriza de verdad).

```
src/
├── proxy.ts                # guard de routing por rol (admin/refugio)
├── app/
│   ├── (auth)/login/        # login único
│   ├── admin/                # exclusivo rol Administrador
│   │   ├── dashboard/        # GUI-39 / GUI-40
│   │   ├── refugios/         # HU-2.2, HU-2.4 — validación y alta/baja de refugios
│   │   ├── usuarios/         # HU-2.3, HU-2.5 — validación y baja de usuarios
│   │   ├── moderacion/       # Módulo 3 — reportes, suspensión
│   │   ├── catalogos/        # Especie, Raza, Estado_*, Rol
│   │   └── exportacion/      # GUI-41 — exportación CSV
│   └── refugio/               # exclusivo rol Refugio (ya verificado)
│       ├── dashboard/        # GUI-38
│       ├── campanas/         # GUI-36 / GUI-37
│       └── perfil/           # GUI-26 — perfil público del refugio
├── components/
│   ├── ui/                   # Button, PantallaPendiente, etc.
│   └── layout/                # Sidebar/Topbar por rol
├── services/                  # cliente API tipado (api.ts)
├── lib/                       # sesión/JWT (auth.ts)
└── types/                     # Usuario, Rol, errores de API
```

Todavía sin implementar: integración real con `POST /api/v1/auth/login` (spec 001), componentes de feedback reutilizables (toasts GUI-0.1.x) y el contenido de cada pantalla — quedan para las siguientes iteraciones.
