import type { Metadata } from "next";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

export const metadata: Metadata = { title: "PetHood — Preguntas frecuentes" };

// Contenido mockeado: reemplazar cuando haya textos aprobados.
const PREGUNTAS = [
  {
    p: "¿Qué es PetHood?",
    r: "Una plataforma que conecta adoptantes, refugios y ONGs, y les da un lugar común para publicar mascotas, gestionar solicitudes y hacer el seguimiento posterior.",
  },
  {
    p: "¿Cuánto cuesta usarla?",
    r: "Registrarse y publicar no tiene costo. Las campañas de donación son voluntarias y van directo a cada refugio.",
  },
  {
    p: "¿Cómo registro mi refugio u ONG?",
    r: "Completá el formulario de la página principal. Tu cuenta queda pendiente de verificación hasta que el equipo de administración la apruebe.",
  },
  {
    p: "¿Cuánto tarda la verificación?",
    r: "Depende de la documentación que cargues. Mientras tanto podés completar el perfil, pero no publicar mascotas.",
  },
  {
    p: "¿Cómo adopto una mascota?",
    r: "Desde la app móvil buscás una mascota, enviás la solicitud al refugio y coordinás por el chat. Después de adoptar, hacés el seguimiento con pruebas de vida.",
  },
  {
    p: "¿Qué es una prueba de vida?",
    r: "Una foto o video tomado en el momento con la cámara de la app, que confirma cómo está la mascota durante el seguimiento post-adopción.",
  },
  {
    p: "¿Puedo reportar una mascota perdida o encontrada?",
    r: "Sí. Cargás la publicación con la provincia y localidad, y otras personas pueden verla y contactarte.",
  },
  {
    p: "¿Cómo denuncio una publicación o a un usuario?",
    r: "Desde cada publicación o perfil hay una opción de reportar. El equipo de administración modera los reportes.",
  },
];

export default function FaqPage() {
  return (
    <div className="lp">
      <SiteHeader />
      <main className="wrap page">
        <h1>Preguntas frecuentes</h1>
        <div className="faq">
          {PREGUNTAS.map(({ p, r }) => (
            <details key={p}>
              <summary>{p}</summary>
              <p>{r}</p>
            </details>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
