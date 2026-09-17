import { cookies } from "next/headers";
import { HeartHandshake, ClipboardList, PawPrint, AlertTriangle } from "lucide-react";
import { AUTH_COOKIE } from "@/lib/auth";
import { obtenerDashboardRefugio, esDashboardRefugioVacio } from "@/services/dashboard";
import { periodoPorDefecto, etiquetaPeriodo } from "@/lib/periodo";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { BarList } from "@/components/dashboard/BarList";
import { DonacionesChart } from "@/components/dashboard/DonacionesChart";
import { AlertasSolicitudes } from "@/components/dashboard/AlertasSolicitudes";
import { PublicacionesAntiguas } from "@/components/dashboard/PublicacionesAntiguas";
import { PeriodoSelector } from "@/components/dashboard/PeriodoSelector";
import { ExportacionRefugio } from "@/components/dashboard/ExportacionRefugio";
import { DashboardVacio } from "@/components/dashboard/DashboardVacio";
import type { MesISO } from "@/types/dashboard";

// GUI-38 — Dashboard Refugio (HU-14.2). Contrato de spec 010 (APROBADA, ver types/dashboard.ts).
export default async function DashboardRefugioPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: MesISO; hasta?: MesISO }>;
}) {
  const params = await searchParams;
  const defecto = periodoPorDefecto();
  const periodo = { desde: params.desde ?? defecto.desde, hasta: params.hasta ?? defecto.hasta };

  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const dashboard = await obtenerDashboardRefugio(token, periodo);

  if (esDashboardRefugioVacio(dashboard)) return <DashboardVacio />;

  return (
    <div className="animate-dashboard-in space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-neutral-900">{dashboard.refugio.nombre}</h1>
          <p className="text-base text-neutral-700">{dashboard.refugio.localidad}</p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <PeriodoSelector periodo={periodo} />
          <ExportacionRefugio periodo={periodo} token={token} />
        </div>
      </div>

      <p className="text-sm font-medium text-neutral-600">Período: {etiquetaPeriodo(periodo.desde, periodo.hasta)}</p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard etiqueta="Animales adoptados" valor={dashboard.kpis.animalesAdoptados} icono={HeartHandshake} color="verde" />
        <KpiCard etiqueta="Solicitudes" valor={dashboard.kpis.solicitudesCreadas} icono={ClipboardList} color="celeste" />
        <KpiCard etiqueta="En refugio" valor={dashboard.kpis.animalesEnRefugio} icono={PawPrint} color="naranja" />
        <KpiCard
          etiqueta="Donación del período"
          valor={`$${dashboard.kpis.montoDonado.toLocaleString("es-AR")}`}
          icono={HeartHandshake}
          color="verde"
          destacado
          nota={`Objetivo: $${dashboard.kpis.objetivoDonaciones.toLocaleString("es-AR")}`}
        />
        <KpiCard
          etiqueta="Solicitudes demoradas"
          valor={dashboard.kpis.solicitudesDemoradas}
          icono={AlertTriangle}
          color={dashboard.kpis.solicitudesDemoradas > 0 ? "rojo" : "verde"}
          nota="Más de 5 días sin respuesta"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-4 md:col-span-1">
          <DonutChart
            titulo="Solicitudes recibidas"
            items={dashboard.solicitudesPorEstado.map((s) => ({ etiqueta: s.estado, valor: s.cantidad }))}
          />
          <BarList
            titulo="Mascotas por estado"
            items={Object.entries(dashboard.mascotasPorEstado).map(([etiqueta, valor]) => ({
              etiqueta: etiqueta.replace(/_/g, " "),
              valor,
            }))}
          />
          <BarList
            titulo="Publicaciones por antigüedad"
            items={Object.entries(dashboard.publicacionesPorAntiguedad).map(([etiqueta, valor]) => ({
              etiqueta,
              valor,
            }))}
          />
        </div>
        <div className="flex flex-col gap-4 md:col-span-2">
          <DonacionesChart items={dashboard.donacionesPorMes} />
          <AlertasSolicitudes items={dashboard.solicitudesDemoradasDetalle} />
          <PublicacionesAntiguas items={dashboard.publicacionesDemasiadoAntiguas} />
        </div>
      </div>
    </div>
  );
}
