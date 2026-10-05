import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ExportacionRefugio } from "@/components/dashboard/ExportacionRefugio";
import { periodoPorDefecto } from "@/lib/periodo";
import { ListaMock } from "@/components/ui/ListaMock";

// GUI-36 · HU-12.1 a HU-12.7 — máx. 5 activas por refugio; falta alias/CBU y confirmación manual de donaciones.
export default async function CampanasRefugioPage() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const periodo = periodoPorDefecto();
  return (
    <ListaMock
      titulo="Campañas"
      descripcion="Campañas de donación de tu refugio."
      columnas={["Campaña", "Estado", "Objetivo", "Recaudado", "Vence"]}
      accion={<ExportacionRefugio entidad="donaciones" periodo={periodo} token={token} />}
      filas={[
        ["Alimento para invierno", "Activa", "$150.000", "$92.000", "30/10/2026"],
        ["Techo nuevo", "Inactiva", "$300.000", "$0", "01/11/2026"],
        ["Vacunación anual", "Finalizada", "$60.000", "$60.000", "01/09/2026"],
      ]}
    />
  );
}
