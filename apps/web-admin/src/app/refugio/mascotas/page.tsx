import { cookies } from "next/headers";

import { ExportacionRefugio } from "@/components/dashboard/ExportacionRefugio";
import { EstadoChip } from "@/components/refugio/EstadoChip";
import { FiltroEstado } from "@/components/refugio/FiltroEstado";
import { ConFoto, TablaListado } from "@/components/refugio/TablaListado";
import { AUTH_COOKIE } from "@/lib/auth";
import { etiquetaEstado } from "@/lib/formato";
import { periodoPorDefecto } from "@/lib/periodo";
import { listarMascotasRefugio } from "@/services/refugio";

interface PageProps {
  searchParams: Promise<{ estado?: string }>;
}

// `GET /mascotas/mias` no pagina (devuelve todas las del refugio): el filtro por estado se
// aplica acá sobre el nombre del catálogo, sin depender de los ids.
export default async function MascotasRefugioPage({ searchParams }: PageProps) {
  const { estado } = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const periodo = periodoPorDefecto();
  const mascotas = await listarMascotasRefugio(token);

  const estados = [...new Set(mascotas.map((m) => m.estado.nombre))].sort();
  const visibles = estado ? mascotas.filter((m) => m.estado.nombre === estado) : mascotas;

  return (
    <TablaListado
      titulo="Mascotas"
      descripcion="Las mascotas de tu refugio."
      columnas={["Mascota", "Especie", "Raza", "Género", "Castrado", "Estado"]}
      accion={<ExportacionRefugio entidad="mascotas" periodo={periodo} token={token} variante="boton" />}
      filtros={
        <FiltroEstado
          ruta="/refugio/mascotas"
          estado={estado}
          opcionTodos={{ valor: "", etiqueta: "Todos", cantidad: mascotas.length }}
          opciones={estados.map((e) => ({
            valor: e,
            etiqueta: etiquetaEstado(e),
            cantidad: mascotas.filter((m) => m.estado.nombre === e).length,
          }))}
        />
      }
      vacio={estado ? "No hay mascotas en ese estado." : "Tu refugio todavía no cargó mascotas."}
      filas={visibles.map((m) => ({
        clave: m.id,
        celdas: [
          <ConFoto key="m" imagenUrl={m.imagenUrl} texto={m.nombre ?? "Sin nombre"} />,
          m.especie.nombre,
          m.raza.nombre,
          etiquetaEstado(m.genero),
          m.castrado ? "Sí" : "No",
          <EstadoChip key="e" nombre={m.estado.nombre} />,
        ],
      }))}
    />
  );
}
