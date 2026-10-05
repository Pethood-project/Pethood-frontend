// Contrato: backend/docs/api-admin-catalogos.md
export type Catalogo =
  | "especies"
  | "razas"
  | "vacunas"
  | "estados-mascota"
  | "estados-publicacion"
  | "estados-solicitud"
  | "estados-campania"
  | "estados-refugio"
  | "estados-animal-perdido"
  | "tipos-solicitud";

export const CATALOGOS: { id: Catalogo; label: string }[] = [
  { id: "especies", label: "Especies" },
  { id: "razas", label: "Razas" },
  { id: "vacunas", label: "Vacunas" },
  { id: "estados-mascota", label: "Estados de mascota" },
  { id: "estados-publicacion", label: "Estados de publicación" },
  { id: "estados-solicitud", label: "Estados de solicitud" },
  { id: "estados-campania", label: "Estados de campaña" },
  { id: "estados-refugio", label: "Estados de refugio" },
  { id: "estados-animal-perdido", label: "Estados de animal perdido" },
  { id: "tipos-solicitud", label: "Tipos de solicitud" },
];

export type CodigoBloqueoBaja = "CATALOGO_SIN_BAJA" | "CATALOGO_EN_USO" | "YA_DE_BAJA";

export interface ItemCatalogo {
  /** string solo en `vacunas` (el tipo, ej. "ANTIRRABICA"). */
  id: number | string;
  nombre: string;
  descripcion: string | null;
  fechaAlta: string | null;
  fechaBaja: string | null;
  cantidadUsos: number;
  puedeDarseDeBaja: boolean;
  bloqueoBaja: { codigo: CodigoBloqueoBaja; mensaje: string } | null;
  /** razas: objeto; vacunas: "Perro" | "Gato". */
  especie?: { id: number; nombre: string } | string;
  secuenciaDias?: number;
}

export interface ListaCatalogo {
  catalogo: Catalogo;
  permisos: { alta: boolean; edicion: boolean; baja: boolean };
  items: ItemCatalogo[];
  total: number;
  page: number;
  limit: number;
}

export interface FiltrosCatalogo {
  page?: number;
  limit?: number;
  q?: string;
  incluirBajas?: "true";
  especieId?: number;
}

export interface BodyCatalogo {
  nombre?: string;
  descripcion?: string;
  especieId?: number;
  secuenciaDias?: number;
}
