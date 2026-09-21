import Link from "next/link";
import { Marca } from "./SiteHeader";

export const EQUIPO = [
  "Agustín Leyes",
  "Camila Fabián",
  "Juan Ignacio Castro",
  "Matías Hansen",
  "Nicolás Correa",
];

export function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Marca />
            <p>Adopción responsable y rescate animal en una sola plataforma.</p>
          </div>
          <div>
            <h4>Explorá</h4>
            <ul>
              <li>
                <Link href="/#funciones">Qué hacemos</Link>
              </li>
              <li>
                <Link href="/#registro">Registrá tu refugio</Link>
              </li>
              <li>
                <Link href="/faq">Preguntas frecuentes</Link>
              </li>
              <li>
                <Link href="/login">Ingresar</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>
              <Link href="/equipo">Equipo</Link>
            </h4>
            <ul>
              {EQUIPO.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li>
                <a href="mailto:contacto@pethood.example">
                  contacto@pethood.example
                </a>
              </li>
              <li>Mendoza, Argentina</li>
              <li>
                <Link href="/equipo#contacto">Todos los medios</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-legal">
          <span>© {new Date().getFullYear()} PetHood</span>
          <span>
            Proyecto final de Ingeniería en Sistemas de Información — UTN
            Regional Mendoza.
          </span>
        </div>
      </div>
    </footer>
  );
}
