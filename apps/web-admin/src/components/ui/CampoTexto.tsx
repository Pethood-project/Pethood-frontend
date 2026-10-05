import { bordeCampo, ErrorCampo } from "./ErrorCampo";

interface CampoTextoProps {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  onBlur?: () => void;
  /** Error ya filtrado por `useTocados().ver`. */
  error: string | null;
  type?: string;
  rows?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  autoComplete?: string;
}

// Label + input/textarea + mensaje de error (GUI-0.1.4 / 0.1.5) para los formularios del panel.
export function CampoTexto({ id, label, value, onChange, onBlur, error, type = "text", rows, ...resto }: CampoTextoProps) {
  const clase = `w-full rounded-md border px-3 py-2 text-sm text-neutral-900 ${bordeCampo(error)}`;
  const comunes = {
    id,
    name: id,
    value,
    onBlur,
    "aria-invalid": !!error,
    "aria-describedby": `${id}-error`,
    className: clase,
    ...resto,
  };
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor={id}>
        {label}
      </label>
      {rows ? (
        <textarea rows={rows} onChange={(e) => onChange(e.target.value)} {...comunes} />
      ) : (
        <input type={type} onChange={(e) => onChange(e.target.value)} {...comunes} />
      )}
      <ErrorCampo id={id} error={error} />
    </div>
  );
}
