import Image from "next/image";
import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

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

function Campo({
  id,
  label,
  tipo = "text",
  full,
  hint,
  auto,
}: {
  id: string;
  label: string;
  tipo?: string;
  full?: boolean;
  hint?: string;
  auto?: string;
}) {
  return (
    <div className={full ? "full" : undefined}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={tipo} autoComplete={auto} />
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend>{titulo}</legend>
      <div className="fields">{children}</div>
    </fieldset>
  );
}

export default function Landing() {
  return (
    <div className="lp">
      <SiteHeader />
      <main>
        <section className="hero wrap">
          <div className="hero-card">
            <div
              className="hero-photo"
              role="img"
              aria-label="Perro mirando a lo lejos al sol"
            />
            <div className="hero-copy">
              <h1>
                Adopción responsable y rescate animal, en una sola plataforma
              </h1>
              <p>
                PetHood conecta a dos actores que hoy no tienen un lugar en
                común: <strong>adoptantes</strong> con{" "}
                <strong>refugios y ONGs</strong>.
              </p>
              <div className="cta">
                <a href="#registro" className="btn">
                  Registrá tu refugio
                </a>
                <a href="#funciones" className="btn sec">
                  Conocé más
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="pad wrap">
          <h2>Para quién es</h2>
          <div className="cards dos">
            <article className="card">
              <Image
                src="/img/siamese.jpg"
                alt="Gato siamés con collar"
                width={640}
                height={480}
              />
              <h3>Adoptantes</h3>
              <p>
                Encuentran una mascota, piden adoptarla y hacen el seguimiento
                después de adoptar.
              </p>
            </article>
            <article className="card">
              <Image
                src="/img/puppy.jpg"
                alt="Cachorro bernés en el pasto"
                width={640}
                height={480}
              />
              <h3>Refugios y ONGs</h3>
              <p>
                Publican mascotas, gestionan solicitudes y arman campañas de
                donación.
              </p>
            </article>
          </div>
        </section>

        <section id="funciones" className="band">
          <div className="wrap">
            <h2>Todo lo que necesitás, junto</h2>
            <p className="sub">
              Un solo lugar para que cada adopción quede registrada, del primer
              mensaje al seguimiento.
            </p>
            <ul className="feat">
              {FUNCIONES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="why">
          <div className="wrap grid2">
            <div
              className="ph wide"
              role="img"
              aria-label="Imagen pendiente: captura del panel web"
            >
              Imagen pendiente: captura del panel web / dashboard — 16:9
            </div>
            <div>
              <h2>Por qué existe</h2>
              <p>
                Adoptar o dar en adopción hoy pasa por grupos de Facebook,
                WhatsApp y publicaciones sueltas: sin seguimiento, sin
                trazabilidad, sin forma de confirmar que la adopción salió bien
                ni de detectar reincidencia de maltrato.
              </p>
              <p>
                PetHood centraliza eso: cada adopción queda registrada, con
                seguimiento posterior verificable y reputación tanto de
                adoptantes como de refugios.
              </p>
            </div>
          </div>
        </section>

        <section id="registro">
          <div className="wrap grid2">
            <div>
              <h2>Registrá tu refugio u ONG</h2>
              <p className="lead">
                Completá tus datos y los del refugio. Tu cuenta queda{" "}
                <strong>pendiente de verificación</strong>: mientras tanto podés
                completar el perfil, pero no publicar hasta que el equipo de
                administración la apruebe.
              </p>
              <div
                className="ph"
                role="img"
                aria-label="Imagen pendiente: foto del refugio"
              >
                Imagen pendiente: foto del refugio
              </div>
            </div>

            <form aria-label="Registro de refugio u ONG">
              <Grupo titulo="Tus datos">
                <Campo id="nombre" label="Nombre *" auto="given-name" />
                <Campo id="apellido" label="Apellido *" auto="family-name" />
                <Campo
                  id="email"
                  label="Email *"
                  tipo="email"
                  auto="email"
                  full
                />
                <Campo
                  id="pass"
                  label="Contraseña *"
                  tipo="password"
                  auto="new-password"
                  hint="Mínimo 8 caracteres, con una mayúscula y un número."
                />
                <Campo
                  id="pass2"
                  label="Confirmar contraseña *"
                  tipo="password"
                  auto="new-password"
                />
              </Grupo>
              <Grupo titulo="Datos del refugio">
                <Campo id="rnombre" label="Nombre del refugio / ONG *" full />
                <Campo
                  id="rdir"
                  label="Dirección *"
                  auto="street-address"
                  full
                />
                <Campo id="rtel" label="Teléfono" tipo="tel" />
                <Campo id="remail" label="Email del refugio" tipo="email" />
                <div className="full">
                  <label htmlFor="rdesc">Descripción</label>
                  <textarea id="rdesc" rows={3} />
                </div>
                <div className="full">
                  <label htmlFor="rimg">Logo o foto del refugio</label>
                  <input
                    id="rimg"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                  />
                  <p className="hint">JPG, PNG o WEBP, hasta 5 MB.</p>
                </div>
              </Grupo>
              <div className="actions">
                <p className="hint">Maqueta: todavía no envía datos.</p>
                <button type="button" className="btn">
                  Registrar refugio
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
