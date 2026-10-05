import Image from "next/image";
import { Foto } from "./Foto";
import { FOTO_REGISTRO } from "./fotos";
import { RegistroRefugioForm } from "./RegistroRefugioForm";
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
              {/* Eslogan del póster: punto principal de la página. */}
              <h1>Adoptar es cambiar dos vidas.</h1>
              <p className="hero-sub">
                Adopción responsable y rescate animal, en una sola plataforma
              </p>
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
                src="/img/refugio.jpg"
                alt="Perro sonriendo esperando un hogar"
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
            <Image
              src="/img/panel.jpg"
              alt="Perro junto a una notebook mostrando su foto"
              width={1200}
              height={800}
              style={{ width: "100%", height: "auto", borderRadius: 20 }}
            />
          </div>
        </section>

        <section id="registro">
          <div className="wrap grid2">
            <div>
              <h2>Registrá tu refugio u ONG</h2>
              <p className="lead" style={{ marginBottom: 24 }}>
                Completá tus datos y los del refugio. Tu cuenta queda{" "}
                <strong>pendiente de verificación</strong>: mientras tanto podés
                completar el perfil, pero no publicar hasta que el equipo de
                administración la apruebe.
              </p>
              <Foto {...FOTO_REGISTRO} />
            </div>

            <RegistroRefugioForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
