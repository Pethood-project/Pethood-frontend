import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ExportacionRefugio } from "@/components/dashboard/ExportacionRefugio";
import { periodoPorDefecto } from "@/lib/periodo";
import { ListaMock } from "@/components/ui/ListaMock";

export default async function MascotasRefugioPage() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const periodo = periodoPorDefecto();
  return (
    <ListaMock
      titulo="Mascotas"
      descripcion="Las mascotas de tu refugio."
      columnas={["Nombre", "Especie", "Estado", "Publicada", "Alta"]}
      accion={
        <ExportacionRefugio
          entidad="mascotas"
          periodo={periodo}
          token={token}
        />
      }
      filas={[
        ["Firulais", "Perro", "Disponible", "Sí", "01/09/2026"],
        ["Nala", "Gato", "Disponible", "Sí", "02/08/2026"],
        ["Luna", "Perro", "En tratamiento", "No", "15/08/2026"],
        ["Michi", "Gato", "Adoptado", "No", "28/06/2026"],
      ]}
    />
  );
}
