// Mensaje de error debajo de un campo (GUI-0.1.4 vacío / GUI-0.1.5 formato inválido).
export function ErrorCampo({ id, error }: { id: string; error: string | null }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-700">
      {error}
    </p>
  );
}

/** Borde rojo cuando el campo tiene error. */
export const bordeCampo = (error: string | null) => (error ? "border-red-400 focus:border-red-500" : "border-neutral-300");
