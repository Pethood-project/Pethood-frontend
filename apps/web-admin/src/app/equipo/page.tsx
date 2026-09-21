import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { EQUIPO, SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

export const metadata: Metadata = { title: "PetHood — Equipo y contacto" };

const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

// lucide v1 no trae logos de marcas: trazos simples a mano.
const Instagram = () => (
  <svg {...svg}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></svg>
);
const LinkedIn = () => (
  <svg {...svg}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v6M8 7.5v.01M12 16v-6M12 12.5c0-1.5 1-2.5 2.5-2.5S17 11 17 12.5V16" /></svg>
);

// Contenido mockeado: los href son de relleno hasta tener las cuentas reales.
const CONTACTOS: { icono: ReactNode; titulo: string; detalle: string; href: string }[] = [
  { icono: <Mail />, titulo: "Email", detalle: "contacto@pethood.example", href: "mailto:contacto@pethood.example" },
  { icono: <MessageCircle />, titulo: "WhatsApp", detalle: "+54 261 000 0000", href: "#" },
  { icono: <Instagram />, titulo: "Instagram", detalle: "@pethood.ar", href: "#" },
  { icono: <LinkedIn />, titulo: "LinkedIn", detalle: "PetHood", href: "#" },
];

// Contenido mockeado: textos y valores de relleno hasta tener los definitivos.
const VALORES = [
  { t: "Adopción responsable", d: "Cada adopción tiene seguimiento verificable, para asegurar que la mascota está bien después del primer día." },
  { t: "Trazabilidad", d: "Historia clínica, solicitudes y reputación quedan registradas, en lugar de perderse entre chats y publicaciones sueltas." },
  { t: "Comunidad", d: "Refugios, ONGs y adoptantes en un mismo lugar, con reglas claras y moderación del equipo de administración." },
];

const iniciales = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");

export default function EquipoPage() {
  return (
    <div className="lp">
      <SiteHeader />
      <main className="wrap page">
        <h1>Equipo</h1>
        <p>Las personas detrás de PetHood y las formas de escribirnos.</p>

        <section className="bloque">
          <div className="grid2">
            <div className="muted">
              <h2>Quiénes somos</h2>
              <p>Somos estudiantes de Ingeniería en Sistemas de Información de la UTN Regional Mendoza. PetHood nació como proyecto final, pero lo pensamos desde el primer día para funcionar como un producto real.</p>
              <p style={{ marginTop: 12 }}>Trabajamos junto a refugios y ONGs para que cada adopción sea responsable, trazable y acompañada en el tiempo.</p>
            </div>
            <div className="ph wide" role="img" aria-label="Imagen pendiente: foto del equipo">Imagen pendiente: foto del equipo</div>
          </div>
        </section>

        <section className="bloque">
          <h2>Qué nos mueve</h2>
          <div className="cards">
            {VALORES.map(({ t, d }) => (
              <article key={t} className="card">
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bloque">
          <h2>Integrantes</h2>
          <ul className="miembros">
            {EQUIPO.map((n) => (
              <li key={n} className="miembro">
                <span className="avatar" aria-hidden>{iniciales(n)}</span>
                <strong>{n}</strong>
                <span>Ing. en Sistemas · UTN FRM</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="contacto" className="bloque">
          <h2>Contacto</h2>
          <p className="muted">¿Dudas, sugerencias o querés sumar a tu refugio? Escribinos por cualquiera de estos medios.</p>
          <ul className="contactos">
            {CONTACTOS.map(({ icono, titulo, detalle, href }) => (
              <li key={titulo}>
                <a href={href} className="contacto">
                  <span className="ico">{icono}</span>
                  <strong>{titulo}</strong>
                  <span>{detalle}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="ubicacion"><MapPin /> Mendoza, Argentina</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
