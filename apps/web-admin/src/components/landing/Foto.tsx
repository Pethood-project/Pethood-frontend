import Image from "next/image";

export interface FotoData {
  src: string;
  alt: string;
  width: number;
  height: number;
  autor: string;
  licencia: string;
  /** Página del archivo en Wikimedia Commons (la licencia CC exige atribuir). */
  url: string;
  /** `object-position` del recorte (ej. "60% center"). */
  posicion?: string;
}

// Foto con crédito de autor (CC BY / CC BY-SA).
export function Foto({ src, alt, width, height, autor, licencia, url, posicion }: FotoData) {
  return (
    <figure className="foto">
      <Image src={src} alt={alt} width={width} height={height} style={posicion ? { objectPosition: posicion } : undefined} />
      <figcaption>
        <a href={url} target="_blank" rel="noreferrer">
          Foto: {autor} / {licencia}
        </a>
      </figcaption>
    </figure>
  );
}
