import Image from "next/image";
import Link from "next/link";
import "./landing.css";

export function Marca() {
  return (
    <span className="brand">
      <Image src="/img/logo.png" alt="Logo PetHood" width={44} height={44} />
      <span className="logo">PetHood</span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header>
      <div className="wrap">
        <Link href="/">
          <Marca />
        </Link>
        <nav>
          <Link href="/#funciones">Qué hacemos</Link>
          <Link href="/#registro">Registrá tu refugio</Link>
          <Link href="/faq">Preguntas frecuentes</Link>
          <Link href="/equipo">Equipo</Link>
          <Link href="/equipo#contacto">Contacto</Link>
          <Link href="/login" className="btn">
            Ingresar
          </Link>
        </nav>
      </div>
    </header>
  );
}
