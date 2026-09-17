// Contrato alineado a spec 009 (../../../../Pethood_Back/docs/specs/009-dashboards-reportes-admin.md).

export interface DashboardKpis {
  usuariosActivos: number;
  mascotasRegistradas: number;
  refugiosVerificados: number;
  publicacionesActivas: number;
  adopcionesConcretadas: number;
  campaniasActivas: number;
  montoDonadoDeclarado: number;
  reportesPendientes: number;
}

export interface SolicitudPorEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

export interface PublicacionPorMes {
  mes: string;
  publicaciones: number;
  adopciones: number;
}

export interface DashboardAdmin {
  kpis: DashboardKpis;
  usuariosPorRol: Record<string, number>;
  mascotasPorEstado: Record<string, number>;
  solicitudesPorEstado: SolicitudPorEstado[];
  publicacionesPorMes: PublicacionPorMes[];
}

export const ENTIDADES_EXPORTABLES = [
  "usuarios",
  "mascotas",
  "publicaciones",
  "solicitudes",
  "campanias",
] as const;

export type EntidadExportable = (typeof ENTIDADES_EXPORTABLES)[number];

// --- Dashboard Refugio (GUI-38, HU-14.2) --------------------------------------------------
//
// Contrato alineado a spec 010 (../../../../Pethood_Back/docs/specs/010-dashboard-refugio.md,
// APROBADA), que adoptó tal cual el shape que ya tenía este archivo cuando era "propuesto".

// Mes calendario en formato "YYYY-MM", el mismo que produce <input type="month">.
export type MesISO = string;

export interface PeriodoDashboard {
  desde: MesISO;
  hasta: MesISO;
}

export interface DashboardRefugioKpis {
  animalesAdoptados: number;
  solicitudesCreadas: number;
  animalesEnRefugio: number;
  montoDonado: number;
  objetivoDonaciones: number;
  // spec 010 §7.7 — solicitudes Pendiente/En_Revision con 5+ días sin cambiar de estado.
  solicitudesDemoradas: number;
}

export interface DonacionPorMes {
  mes: string;
  monto: number;
  objetivo: number;
}

export interface SolicitudDemorada {
  id: number;
  mascota: string;
  dias: number;
}

export interface PublicacionDemasiadoAntigua {
  id: number;
  mascota: string;
  dias: number;
}

export interface DashboardRefugio {
  refugio: { nombre: string; localidad: string };
  periodo: PeriodoDashboard;
  kpis: DashboardRefugioKpis;
  solicitudesPorEstado: SolicitudPorEstado[];
  donacionesPorMes: DonacionPorMes[];
  // spec 010 §7.6 — snapshot, no depende del período.
  mascotasPorEstado: Record<string, number>;
  // spec 010 §7.6 — snapshot, buckets 0-15/15-30/30-60/+60 días desde que se publicó cada mascota.
  publicacionesPorAntiguedad: Record<string, number>;
  // spec 010 §7.7 — como máximo 5, más antigua primero.
  solicitudesDemoradasDetalle: SolicitudDemorada[];
  // spec 010 §7.8 — publicaciones con 60+ días publicadas, como máximo 10, más antigua primero.
  publicacionesDemasiadoAntiguas: PublicacionDemasiadoAntigua[];
}

// spec 010 §5 (2026-09-17) — export por entidad, scopeado a refugioId (mismo patrón que admin).
export const ENTIDADES_EXPORTABLES_REFUGIO = ["mascotas", "solicitudes", "donaciones"] as const;

export type EntidadExportableRefugio = (typeof ENTIDADES_EXPORTABLES_REFUGIO)[number];
