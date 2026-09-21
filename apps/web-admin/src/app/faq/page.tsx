import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "PetHood — Preguntas frecuentes" };

// Contenido mockeado: reemplazar cuando haya textos aprobados.
const PREGUNTAS = [
  { p: "¿Qué es PetHood?", r: "Una plataforma que conecta adoptantes, refugios y ONGs, y les da un lugar común para publicar mascotas, gestionar solicitudes y hacer el seguimiento posterior." },
  { p: "¿Cuánto cuesta usarla?", r: "Registrarse y publicar no tiene costo. Las campañas de donación son voluntarias y van directo a cada refugio." },
  { p: "¿Cómo registro mi refugio u ONG?", r: "Completá el formulario de la página principal. Tu cuenta queda pendiente de verificación hasta que el equipo de administración la apruebe." },
  { p: "¿Cuánto tarda la verificación?", r: "Depende de la documentación que cargues. Mientras tanto podés completar el perfil, pero no publicar mascotas." },
  { p: "¿Cómo adopto una mascota?", r: "Desde la app móvil buscás una mascota, enviás la solicitud al refugio y coordinás por el chat. Después de adoptar, hacés el seguimiento con pruebas de vida." },
  { p: "¿Qué es una prueba de vida?", r: "Una foto o video tomado en el momento con la cámara de la app, que confirma cómo está la mascota durante el seguimiento post-adopción." },
  { p: "¿Puedo reportar una mascota perdida o encontrada?", r: "Sí. Cargás la publicación con la provincia y localidad, y otras personas pueden verla y contactarte." },
  { p: "¿Cómo denuncio una publicación o a un usuario?", r: "Desde cada publicación o perfil hay una opción de reportar. El equipo de administración modera los reportes." },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-pethood-accent-600/10">
        <div className="mx-auto flex max-w-[860px] items-center justify-between px-4 py-2.5 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/img/logo.png" alt="Logo PetHood" width={40} height={40} className="rounded-full" />
            <span className="font-heading text-2xl text-pethood-accent-700">PetHood</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-neutral-700 hover:text-pethood-accent-600">← Volver</Link>
        </div>
      </header>
      <main className="mx-auto max-w-[860px] px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-heading text-[clamp(28px,4vw,40px)] leading-tight">Preguntas frecuentes</h1>
        <div className="mt-8 space-y-3">
          {PREGUNTAS.map(({ p, r }) => (
            <details key={p} className="group rounded-2xl border border-neutral-200 bg-neutral-100 px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {p}
                <span className="text-pethood-orange transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-neutral-700">{r}</p>
            </details>
          ))}
        </div>
      </main>
    </div>
  );
}
