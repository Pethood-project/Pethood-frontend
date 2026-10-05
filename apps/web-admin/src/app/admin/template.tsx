// A diferencia del layout, el template se vuelve a montar en cada cambio de sección:
// re-dispara el fade-in de globals.css. Los filtros (searchParams) no lo remontan.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-dashboard-in">{children}</div>;
}
