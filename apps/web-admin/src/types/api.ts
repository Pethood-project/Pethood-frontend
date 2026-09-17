// Formato único de error de la API — CONSTITUTION.md sección 5.
export interface ApiErrorBody {
  error: {
    codigo: string;
    mensaje: string;
  };
}
