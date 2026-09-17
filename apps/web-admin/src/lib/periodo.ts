import type { MesISO } from "@/types/dashboard";

const MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// "YYYY-MM" -> [año, mes 0-indexado]
function parsearMes(mes: MesISO): [number, number] {
  const [anio, m] = mes.split("-").map(Number);
  return [anio, m - 1];
}

function formatearMes(anio: number, mesIndex: number): MesISO {
  return `${anio}-${String(mesIndex + 1).padStart(2, "0")}`;
}

export function mesActual(): MesISO {
  const ahora = new Date();
  return formatearMes(ahora.getFullYear(), ahora.getMonth());
}

export function restarMeses(mes: MesISO, cantidad: number): MesISO {
  const [anio, mesIndex] = parsearMes(mes);
  const fecha = new Date(anio, mesIndex - cantidad, 1);
  return formatearMes(fecha.getFullYear(), fecha.getMonth());
}

// Rango por defecto al entrar al dashboard: los últimos 6 meses (mismo criterio que
// publicacionesPorMes en spec 009), incluye el mes actual.
export function periodoPorDefecto(): { desde: MesISO; hasta: MesISO } {
  const hasta = mesActual();
  return { desde: restarMeses(hasta, 5), hasta };
}

export function etiquetaMes(mes: MesISO): string {
  const [anio, mesIndex] = parsearMes(mes);
  return `${MESES_CORTOS[mesIndex]} ${anio}`;
}

// "Ene - Jun 2026" si el rango cae en el mismo año, "Nov 2025 - Feb 2026" si cruza de año.
export function etiquetaPeriodo(desde: MesISO, hasta: MesISO): string {
  const [anioDesde, mesDesde] = parsearMes(desde);
  const [anioHasta, mesHasta] = parsearMes(hasta);

  if (anioDesde === anioHasta) {
    return `${MESES_CORTOS[mesDesde]} - ${MESES_CORTOS[mesHasta]} ${anioHasta}`;
  }
  return `${etiquetaMes(desde)} - ${etiquetaMes(hasta)}`;
}
