import { ListaMock } from "@/components/ui/ListaMock";

export default function PublicacionesRefugioPage() {
  return (
    <ListaMock
      titulo="Publicaciones"
      descripcion="Avisos de adopción de tu refugio."
      columnas={["Título", "Mascota", "Estado", "Solicitudes", "Fecha"]}
      filas={[
        ["Firulais busca hogar", "Firulais", "Activa", "4", "01/09/2026"],
        ["Gatita cariñosa", "Nala", "Pausada", "1", "20/08/2026"],
        ["Luna necesita familia", "Luna", "Finalizada", "6", "01/07/2026"],
      ]}
    />
  );
}
