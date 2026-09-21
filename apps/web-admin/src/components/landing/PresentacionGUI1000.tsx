import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const FUNCIONES = [
  "Publicación de mascotas en adopción",
  "Solicitudes de adopción",
  "Seguimiento post-adopción con pruebas de vida",
  "Historia clínica",
  "Chat entre partes",
  "Sistema de reputación",
  "Campañas de donación para refugios",
  "Red de mascotas perdidas y encontradas",
];

const EQUIPO = ["Agustín Leyes", "Camila Fabián", "Juan Ignacio Castro", "Matías Hansen", "Nicolás Correa"];

const btn = "inline-block rounded-[10px] px-[22px] py-[11px] text-center text-base font-semibold transition-colors";
const btnPrimario = `${btn} bg-pethood-orange text-white hover:bg-pethood-orange-dark`;
const btnSecundario = `${btn} border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100`;
const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-pethood-input px-3 py-[9px] text-sm text-neutral-900 focus:border-pethood-orange focus:outline-2 focus:outline-pethood-orange";
const wrap = "mx-auto w-full max-w-[1140px] px-4 sm:px-6";

function Marca({ oscuro }: { oscuro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image src="/img/logo.png" alt="Logo PetHood" width={44} height={44} className="rounded-full" />
      <span className={`font-heading text-[22px] sm:text-[26px] ${oscuro ? "text-white" : "text-pethood-accent-700"}`}>
        PetHood
      </span>
    </span>
  );
}

// Imagen pendiente: mismo criterio visual que el diseño (borde punteado naranja).
function Placeholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`Imagen pendiente: ${label}`}
      className={`flex items-center justify-center rounded-[14px] border-2 border-dashed border-pethood-accent-400 bg-pethood-beige p-4 text-center text-sm text-pethood-accent-600 ${className}`}
    >
      Imagen pendiente: {label}
    </div>
  );
}

function Campo({ id, label, tipo = "text", full, hint, auto }: {
  id: string; label: string; tipo?: string; full?: boolean; hint?: string; auto?: string;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>
      <input id={id} type={tipo} autoComplete={auto} className={inputCls} />
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 [&+&]:mt-8">
      <legend className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-neutral-500">{titulo}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

// GUI-1000 — Presentación + registro de refugio/ONG (maqueta: el formulario todavía no envía nada).
export default function PresentacionGUI1000() {
  return (
    <div className="scroll-smooth">
      <header className="sticky top-0 z-10 border-b border-pethood-accent-600/10 bg-background/90 backdrop-blur">
        <div className={`${wrap} flex items-center justify-between gap-4 py-2.5`}>
          <Link href="/"><Marca /></Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-neutral-700">
            <a href="#funciones" className="hidden hover:text-pethood-accent-600 md:inline">Qué hacemos</a>
            <a href="#registro" className="hidden hover:text-pethood-accent-600 md:inline">Registrá tu refugio</a>
            <Link href="/login" className={`${btnPrimario} !px-4 !py-2 !text-sm`}>Ingresar</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className={`${wrap} py-4 sm:py-7`}>
          <div className="relative flex flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-pethood-beige lg:min-h-[540px] lg:flex-row lg:items-center">
            <div
              className="relative h-[220px] sm:h-[280px] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-3/5
                [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] lg:[mask-image:linear-gradient(to_right,transparent,#000_45%)]"
            >
              <Image src="/img/adopt.jpg" alt="Perro mirando a lo lejos al sol" fill priority sizes="(min-width:1024px) 60vw, 100vw" className="object-cover object-[60%_35%]" />
            </div>
            <div className="relative -mt-5 px-5 pb-7 sm:px-8 sm:pb-10 lg:mt-0 lg:max-w-[520px] lg:p-12">
              <p className="inline-block rounded-full bg-pethood-badge px-3 py-[3px] text-xs font-semibold uppercase tracking-wider text-pethood-accent-700">GUI-1000</p>
              <h1 className="my-3.5 font-heading text-[clamp(32px,5vw,50px)] leading-[1.12] text-balance">
                Adopción responsable y rescate animal, en una sola plataforma
              </h1>
              <p className="max-w-[460px] text-neutral-700">
                PetHood conecta a tres actores que hoy no tienen un lugar en común: <strong>adoptantes</strong>,{" "}
                <strong>refugios y ONGs</strong>, y quien administra todo el sistema.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#registro" className={`${btnPrimario} max-sm:flex-[1_1_100%]`}>Registrá tu refugio</a>
                <a href="#funciones" className={`${btnSecundario} max-sm:flex-[1_1_100%]`}>Conocé más</a>
              </div>
            </div>
          </div>
        </section>

        {/* Actores */}
        <section className={`${wrap} py-10 sm:py-14`}>
          <h2 className="font-heading text-[clamp(24px,3.2vw,32px)] leading-tight">Para quién es</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              { t: "Adoptantes", d: "Encuentran una mascota, piden adoptarla y hacen el seguimiento después de adoptar.", img: { src: "/img/siamese.jpg", alt: "Gato siamés con collar" } },
              { t: "Refugios y ONGs", d: "Publican mascotas, gestionan solicitudes y arman campañas de donación.", img: { src: "/img/puppy.jpg", alt: "Cachorro bernés en el pasto" } },
              { t: "Administración", d: "Verifica refugios, modera reportes y mira los números de toda la plataforma." },
            ].map(({ t, d, img }) => (
              <article key={t} className="rounded-[20px] border border-neutral-200 bg-neutral-100 p-3.5 pb-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(140,73,26,.14)]">
                {img ? (
                  <Image src={img.src} alt={img.alt} width={640} height={480} className="mb-4 aspect-[16/10] w-full rounded-[14px] object-cover md:aspect-[4/3]" />
                ) : (
                  <Placeholder label="ilustración de administración" className="mb-4 aspect-[16/10] md:aspect-[4/3]" />
                )}
                <h3 className="px-1.5 text-[19px] font-bold text-balance">{t}</h3>
                <p className="mt-1 px-1.5 text-sm text-neutral-700">{d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Funciones */}
        <section id="funciones" className="relative bg-cover bg-[position:center_35%] py-12 text-white sm:py-[72px]"
          style={{ backgroundImage: "linear-gradient(rgba(32,30,29,.6), rgba(32,30,29,.72)), url(/img/cat.jpg)" }}>
          <div className={wrap}>
            <h2 className="font-heading text-[clamp(24px,3.2vw,32px)] leading-tight">Todo lo que necesitás, junto</h2>
            <p className="mt-2 max-w-[520px] text-white/75">Un solo lugar para que cada adopción quede registrada, del primer mensaje al seguimiento.</p>
            <ul className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {FUNCIONES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 rounded-2xl border border-white/20 bg-white/10 p-4 font-medium backdrop-blur-sm">
                  <span className="mt-[7px] size-2.5 flex-none rounded-full bg-pethood-orange" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Por qué existe */}
        <section className="py-10 sm:py-16">
          <div className={`${wrap} grid items-center gap-8 lg:grid-cols-2 lg:gap-12`}>
            <Placeholder label="captura del panel web / dashboard — 16:9" className="h-60 lg:aspect-video lg:h-auto !rounded-[20px]" />
            <div className="text-neutral-700">
              <h2 className="mb-2 font-heading text-[clamp(24px,3.2vw,32px)] leading-tight text-foreground">Por qué existe</h2>
              <p className="mt-3">Adoptar o dar en adopción hoy pasa por grupos de Facebook, WhatsApp y publicaciones sueltas: sin seguimiento, sin trazabilidad, sin forma de confirmar que la adopción salió bien ni de detectar reincidencia de maltrato.</p>
              <p className="mt-3">PetHood centraliza eso: cada adopción queda registrada, con seguimiento posterior verificable y reputación tanto de adoptantes como de refugios.</p>
            </div>
          </div>
        </section>

        {/* Registro refugio/ONG */}
        <section id="registro" className="scroll-mt-[76px] pb-[72px] pt-6">
          <div className={`${wrap} grid items-start gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12`}>
            <div>
              <h2 className="font-heading text-[clamp(24px,3.2vw,32px)] leading-tight">Registrá tu refugio u ONG</h2>
              <p className="mt-3 text-neutral-700">
                Completá tus datos y los del refugio. Tu cuenta queda <strong>pendiente de verificación</strong>: mientras tanto podés
                completar el perfil, pero no publicar hasta que el equipo de administración la apruebe.
              </p>
              <Placeholder label="foto del refugio" className="mt-6 h-[260px] !rounded-[20px] lg:aspect-[4/3] lg:h-auto" />
            </div>

            <form aria-label="Registro de refugio u ONG" className="rounded-[20px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
              <Grupo titulo="Tus datos">
                <Campo id="nombre" label="Nombre *" auto="given-name" />
                <Campo id="apellido" label="Apellido *" auto="family-name" />
                <Campo id="email" label="Email *" tipo="email" auto="email" full />
                <Campo id="pass" label="Contraseña *" tipo="password" auto="new-password" hint="Mínimo 8 caracteres, con una mayúscula y un número." />
                <Campo id="pass2" label="Confirmar contraseña *" tipo="password" auto="new-password" />
              </Grupo>
              <Grupo titulo="Datos del refugio">
                <Campo id="rnombre" label="Nombre del refugio / ONG *" full />
                <Campo id="rdir" label="Dirección *" auto="street-address" full />
                <Campo id="rtel" label="Teléfono" tipo="tel" />
                <Campo id="remail" label="Email del refugio" tipo="email" />
                <div className="sm:col-span-2">
                  <label htmlFor="rdesc" className="mb-1 block text-sm font-medium text-neutral-700">Descripción</label>
                  <textarea id="rdesc" rows={3} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="rimg" className="mb-1 block text-sm font-medium text-neutral-700">Logo o foto del refugio</label>
                  <input id="rimg" type="file" accept="image/jpeg,image/png,image/webp" className={inputCls} />
                  <p className="mt-1 text-xs text-neutral-500">JPG, PNG o WEBP, hasta 5 MB.</p>
                </div>
              </Grupo>
              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-neutral-500">Maqueta: todavía no envía datos.</p>
                <button type="button" className={`${btnPrimario} max-sm:w-full`}>Registrar refugio</button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-neutral-900 py-10 text-neutral-300">
        <div className={wrap}>
          <Marca oscuro />
          <p className="mt-2 max-w-[560px] text-sm">
            Proyecto final de Ingeniería en Sistemas de Información — UTN Regional Mendoza, pensado para funcionar como producto real, no solo como entrega académica.
          </p>
          <h4 className="mt-5 text-xs uppercase tracking-wider text-neutral-500">Equipo</h4>
          <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {EQUIPO.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      </footer>
    </div>
  );
}
