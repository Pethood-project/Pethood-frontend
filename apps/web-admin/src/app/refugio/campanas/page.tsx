import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ExportacionRefugio } from "@/components/dashboard/ExportacionRefugio";
import { periodoPorDefecto } from "@/lib/periodo";
import { diaSinHora, etiquetaEstado, plata } from "@/lib/formato";
import { listarCampaniasRefugio } from "@/services/refugio";
import { ConFoto, TablaListado } from "@/components/refugio/TablaListado";
import { EstadoChip } from "@/components/refugio/EstadoChip";
import { FiltroEstado } from "@/components/refugio/FiltroEstado";
import { AccionesCampania } from "@/components/refugio/AccionesFilas";

interface PageProps {
  searchParams: Promise<{ estado?: string }>;
}

// GUI-36 · HU-12.1 a HU-12.7 — `GET /refugio/campanias`, con pausar/reactivar/finalizar
// (HU-12.6/12.7, spec 028). Alta, edición y confirmación de donaciones siguen en la app móvil.
const ESTADOS = ["Inactiva", "Activa", "Pausada", "Finalizada"];

export default async function CampanasRefugioPage({ searchParams }: PageProps) {
  const { estado } = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const periodo = periodoPorDefecto();
  const campanias = await listarCampaniasRefugio(token);

  const visibles = estado ? campanias.filter((c) => c.estado.nombre === estado) : campanias;

  return (
    <TablaListado
      titulo="Campañas"
      descripcion="Campañas de donación de tu refugio."
      columnas={["Campaña", "Estado", "Objetivo", "Recaudado", "A revisar", "Vence", "Acciones"]}
      accion={<ExportacionRefugio entidad="donaciones" periodo={periodo} token={token} variante="boton" />}
      filtros={
        <FiltroEstado
          ruta="/refugio/campanas"
          estado={estado}
          opcionTodos={{ valor: "", etiqueta: "Todas", cantidad: campanias.length }}
          opciones={ESTADOS.map((e) => ({
            valor: e,
            etiqueta: etiquetaEstado(e),
            cantidad: campanias.filter((c) => c.estado.nombre === e).length,
          }))}
        />
      }
      vacio={estado ? "No hay campañas en ese estado." : "Tu refugio todavía no creó campañas."}
      filas={visibles.map((c) => ({
        clave: c.id,
        celdas: [
          <ConFoto key="c" imagenUrl={c.imagenUrl} texto={c.titulo} />,
          <EstadoChip key="e" nombre={c.estado.nombre} />,
          plata(c.objetivo),
          `${plata(c.recaudado)} (${c.porcentaje}%)`,
          c.pendientes,
          diaSinHora(c.fechaFin),
          <AccionesCampania key="a" id={c.id} estado={c.estado.nombre} token={token} />,
        ],
      }))}
    />
  );
}
