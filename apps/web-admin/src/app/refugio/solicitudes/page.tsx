import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ExportacionRefugio } from "@/components/dashboard/ExportacionRefugio";
import { periodoPorDefecto } from "@/lib/periodo";
import { ListaMock } from "@/components/ui/ListaMock";

export default async function SolicitudesRefugioPage() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const periodo = periodoPorDefecto();
  return (
    <ListaMock
      titulo="Solicitudes"
      descripcion="Solicitudes de adopción y tránsito que recibió tu refugio."
      columnas={["Mascota", "Solicitante", "Tipo", "Estado", "Días", "Fecha"]}
      accion={
        <ExportacionRefugio
          entidad="solicitudes"
          periodo={periodo}
          token={token}
        />
      }
      filas={[
        ["Firulais", "Lucía Pérez", "Adopción", "Pendiente", "2", "03/09/2026"],
        ["Nala", "Juan Díaz", "Tránsito", "En revisión", "7", "30/08/2026"],
        ["Luna", "Sofía Molina", "Adopción", "Rechazada", "-", "12/08/2026"],
        ["Michi", "Ana Gómez", "Adopción", "Aprobada", "-", "25/08/2026"],
      ]}
    />
  );
}
