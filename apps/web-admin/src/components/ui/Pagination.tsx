import { Button } from "@/components/ui/Button";

export function Pagination({
  page,
  limit,
  total,
  onCambiar,
}: {
  page: number;
  limit: number;
  total: number;
  onCambiar: (page: number) => void;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / limit));
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onCambiar(page - 1)}>
        Anterior
      </Button>
      <span>
        Página {page} de {totalPaginas}
      </span>
      <Button variant="secondary" disabled={page >= totalPaginas} onClick={() => onCambiar(page + 1)}>
        Siguiente
      </Button>
    </div>
  );
}
