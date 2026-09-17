// Banner de feedback inline (GUI-0.1.1 éxito / GUI-0.1.3 error) — este proyecto no tiene
// sistema de toasts; se sigue el patrón ya usado en ExportacionAdmin.tsx y el login.
export function Feedback({ tipo, mensaje }: { tipo: "exito" | "error"; mensaje: string }) {
  const estilos =
    tipo === "exito"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-700";

  return <div className={`rounded-md border px-3 py-2 text-sm ${estilos}`}>{mensaje}</div>;
}
