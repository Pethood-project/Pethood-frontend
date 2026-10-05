import type { Metadata } from "next";
import Image from "next/image";
import type { FotoData } from "@/components/landing/Foto";
import { FOTO_DESCARGAR_BEAGLE, FOTO_DESCARGAR_GATO } from "@/components/landing/fotos";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

export const metadata: Metadata = { title: "PetHood — Descargá la app" };

// El APK se publica como asset de cada GitHub Release; `latest` siempre apunta a la última versión.
const RELEASES = "https://github.com/Pethood-project/Pethood-frontend/releases";
const APK_URL = `${RELEASES}/latest/download/pethood.apk`;

const PASOS = [
  "Desde el celular, tocá «Descargar APK».",
  "Abrí el archivo. Si Android te lo pide, permití «Instalar apps de origen desconocido» para tu navegador.",
  "Instalá PetHood, abrila e ingresá con tu cuenta.",
];

function Lado({ foto, lado }: { foto: FotoData; lado: "izq" | "der" }) {
  return (
    <div className={`banda-lado ${lado}`} aria-hidden>
      <Image
        src={foto.src}
        alt=""
        width={foto.width}
        height={foto.height}
        priority
        sizes="(max-width: 900px) 50vw, 36vw"
        style={{ objectPosition: foto.posicion }}
      />
    </div>
  );
}

function Credito({ foto, lado }: { foto: FotoData; lado: "izq" | "der" }) {
  return (
    <a className={`banda-foto-credito ${lado}`} href={foto.url} target="_blank" rel="noreferrer">
      Foto: {foto.autor} / {foto.licencia}
    </a>
  );
}

export default function DescargarPage() {
  return (
    <div className="lp">
      <SiteHeader />
      {/* Una foto en cada costado, fundida hacia el centro (ver `.dos-lados` en landing.css). */}
      <div className="banda-foto dos-lados">
        <Lado foto={FOTO_DESCARGAR_BEAGLE} lado="izq" />
        <Lado foto={FOTO_DESCARGAR_GATO} lado="der" />
        <Credito foto={FOTO_DESCARGAR_BEAGLE} lado="izq" />
        <Credito foto={FOTO_DESCARGAR_GATO} lado="der" />
        <main className="wrap page banda-foto-contenido">
          <h1>Descargá la app</h1>
          <p>
            Buscá mascotas, pedí adoptar, chateá con los refugios y hacé el seguimiento después de adoptar, todo desde
            tu celular.
          </p>
          <div className="cta">
            <a href={APK_URL} className="btn">
              Descargar APK
            </a>
            <a href={RELEASES} className="btn sec" target="_blank" rel="noreferrer">
              Ver versiones
            </a>
          </div>
          <p className="hint">Por ahora solo para Android.</p>

          <section style={{ marginTop: 40 }}>
            <h2>Cómo instalarla</h2>
            <ol style={{ marginTop: 12, paddingLeft: 20, listStyle: "decimal", gap: 8 }}>
              {PASOS.map((paso) => (
                <li key={paso}>{paso}</li>
              ))}
            </ol>
            <p className="hint">
              Si ya tenías una versión anterior y Android no te deja actualizar, desinstalala y volvé a instalar.
            </p>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
