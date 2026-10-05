import { cookies } from "next/headers";
import { Users, PawPrint, ShieldCheck, Megaphone, Heart, Flag, HandCoins, AlertTriangle } from "lucide-react";
import { AUTH_COOKIE } from "@/lib/auth";
import { obtenerDashboard, esDashboardVacio } from "@/services/dashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { BarList } from "@/components/dashboard/BarList";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { GraficoPublicacionesPorMes } from "@/components/dashboard/GraficoPublicacionesPorMes";
import { ExportacionAdmin } from "@/components/dashboard/ExportacionAdmin";
import { DashboardVacio } from "@/components/dashboard/DashboardVacio";

const CONFIG_KPI: Record<
  string,
  { etiqueta: string; icono: typeof Users; color: "naranja" | "verde" | "celeste" | "rojo"; href?: string }
> = {
  usuariosActivos: { etiqueta: "Usuarios activos", icono: Users, color: "celeste", href: "/admin/usuarios" },
  mascotasRegistradas: { etiqueta: "Mascotas registradas", icono: PawPrint, color: "naranja", href: "/admin/mascotas" },
  refugiosVerificados: { etiqueta: "Refugios verificados", icono: ShieldCheck, color: "verde", href: "/admin/refugios" },
  publicacionesActivas: { etiqueta: "Publicaciones activas", icono: Megaphone, color: "celeste", href: "/admin/publicaciones" },
  adopcionesConcretadas: { etiqueta: "Adopciones concretadas", icono: Heart, color: "verde", href: "/admin/solicitudes" },
  campaniasActivas: { etiqueta: "Campañas activas", icono: Flag, color: "naranja", href: "/admin/campanas" },
  montoDonadoDeclarado: { etiqueta: "Donado declarado", icono: HandCoins, color: "verde", href: "/admin/campanas" },
  reportesPendientes: { etiqueta: "Reportes pendientes", icono: AlertTriangle, color: "rojo", href: "/admin/moderacion" },
};

export default async function DashboardAdminPage() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const dashboard = await obtenerDashboard(token);

  if (esDashboardVacio(dashboard)) return <DashboardVacio />;

  return (
    <div className="animate-dashboard-in space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-neutral-900">Dashboard</h1>
        <p className="text-base text-neutral-700">Resumen general de la plataforma.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries(dashboard.kpis).map(([clave, valor]) => {
          const config = CONFIG_KPI[clave];
          return (
            <KpiCard
              key={clave}
              etiqueta={config?.etiqueta ?? clave}
              valor={clave === "montoDonadoDeclarado" ? `$${valor.toLocaleString("es-AR")}` : valor}
              icono={config?.icono ?? Users}
              color={config?.color ?? "celeste"}
              href={config?.href}
            />
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-4 md:col-span-1">
          <DonutChart
            titulo="Solicitudes por estado"
            accion={<ExportacionAdmin entidad="solicitudes" token={token} />}
            items={dashboard.solicitudesPorEstado.map((s) => ({ etiqueta: s.estado, valor: s.cantidad }))}
          />
          <BarList
            titulo="Mascotas por estado"
            accion={<ExportacionAdmin entidad="mascotas" token={token} />}
            items={Object.entries(dashboard.mascotasPorEstado).map(([etiqueta, valor]) => ({
              etiqueta: etiqueta.replace(/_/g, " "),
              valor,
            }))}
          />
          <BarList
            titulo="Usuarios por rol"
            accion={<ExportacionAdmin entidad="usuarios" token={token} />}
            items={Object.entries(dashboard.usuariosPorRol).map(([etiqueta, valor]) => ({ etiqueta, valor }))}
          />
        </div>
        <div className="md:col-span-2">
          <GraficoPublicacionesPorMes
            items={dashboard.publicacionesPorMes}
            accion={<ExportacionAdmin entidad="publicaciones" token={token} />}
          />
        </div>
      </div>
    </div>
  );
}
