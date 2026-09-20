/**
 * Foto de perfil circular, con las iniciales como respaldo.
 *
 * El patrón estaba escrito tres veces (perfil, editar perfil y la lista de chats), con la
 * función `iniciales` duplicada literal en dos de ellas. Vive acá para que el avatar se vea
 * igual en toda la app.
 *
 * Dos variantes, porque conviven dos paletas: `clasico` es el naranja de marca con las
 * iniciales en negrita (perfil, solicitudes), y `organic` es el del rediseño — iniciales en
 * Caprasimo sobre `accent-600` para un refugio o `neutral-400` para una persona (artboards
 * 07, 18 y 35 del diseño). El default sigue siendo `clasico` para no cambiar de golpe las
 * pantallas que todavía no migraron.
 *
 * Recibe la url YA absoluta: resolver la ruta relativa de la API es tarea de `urlAbsoluta`,
 * y así el componente sirve también para una uri local del selector de fotos.
 *
 * En web no usamos el `Image` de React Native: internamente intenta mostrar la foto como
 * `background-image` y las de Google (`lh3.googleusercontent.com`) no llegan a verse. Un
 * `<img referrerPolicy="no-referrer">` sí las carga. Si la imagen falla, volvemos a las iniciales.
 */
import { createElement, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';

/**
 * Iniciales de un nombre. Acepta "Ana Pérez" en un solo campo o nombre y apellido por
 * separado, que es como los tienen el perfil (dos campos) y el chat (`contacto.nombre`).
 */
export function iniciales(nombre?: string | null, apellido?: string | null): string {
  const partes = apellido
    ? [nombre, apellido]
    : (nombre ?? '').trim().split(/\s+/).slice(0, 2);

  const letras = partes
    .map((parte) => parte?.trim().charAt(0) ?? '')
    .join('')
    .toUpperCase();

  return letras || '?';
}

/** `clasico` es el naranja de marca; `organic`, el rediseño (iniciales en Caprasimo). */
export type VarianteAvatar = 'clasico' | 'organic';

/** Sólo lo mira la variante `organic`: el diseño distingue refugios de personas por el fondo. */
export type TonoAvatar = 'acento' | 'neutro';

const FONDOS: Record<VarianteAvatar, Record<TonoAvatar, string>> = {
  clasico: { acento: 'bg-pethood-orange', neutro: 'bg-pethood-orange' },
  organic: { acento: 'bg-organic-accent-600', neutro: 'bg-organic-neutral-400' },
};

const TIPOGRAFIA: Record<VarianteAvatar, string> = {
  clasico: 'font-bold text-white',
  organic: 'font-titulo text-white',
};

/**
 * Proporción de las iniciales respecto del lado. En el diseño clásico son ~40%; en el
 * Organic, 13px sobre 42 (~31%): la Caprasimo es más ancha y con el 40% se saldría.
 */
const PROPORCION_TEXTO: Record<VarianteAvatar, number> = {
  clasico: 0.4,
  organic: 0.31,
};

interface AvatarProps {
  /** URL absoluta o uri local. `null` muestra las iniciales. */
  uri?: string | null;
  nombre?: string | null;
  apellido?: string | null;
  /** Lado del círculo en px. Los tamaños en uso: 56 (fila de chat), 80 y 112 (perfil). */
  tamanio: number;
  /** Tamaño de las iniciales. Por defecto, la proporción del diseño de cada variante. */
  tamanioTexto?: number;
  variante?: VarianteAvatar;
  /** Fondo de las iniciales en `organic`: `acento` para un refugio, `neutro` para una persona. */
  tono?: TonoAvatar;
  accessibilityLabel?: string;
}

export function Avatar({
  uri,
  nombre,
  apellido,
  tamanio,
  tamanioTexto,
  variante = 'clasico',
  tono = 'acento',
  accessibilityLabel,
}: AvatarProps) {
  const [uriRota, setUriRota] = useState<string | null>(null);
  // El tamaño va por `style` y no por clase: NativeWind no genera clases dinámicas, así que
  // `h-[${n}px]` no compilaría.
  const medidas = {
    width: tamanio,
    height: tamanio,
    borderRadius: tamanio / 2,
    overflow: 'hidden' as const,
  };
  const hayFoto = Boolean(uri) && uri !== uriRota;
  const etiqueta = accessibilityLabel ?? 'Foto de perfil';

  if (hayFoto && uri) {
    const alFallar = (): void => setUriRota(uri);

    if (Platform.OS === 'web') {
      return createElement('img', {
        src: uri,
        alt: etiqueta,
        referrerPolicy: 'no-referrer',
        onError: alFallar,
        style: { ...medidas, objectFit: 'cover' },
      });
    }

    return (
      <Image
        source={{ uri }}
        style={medidas}
        accessibilityLabel={etiqueta}
        onError={alFallar}
      />
    );
  }

  return (
    <View
      style={medidas}
      accessibilityLabel={accessibilityLabel}
      className={`items-center justify-center ${FONDOS[variante][tono]}`}
    >
      <Text
        style={{ fontSize: tamanioTexto ?? Math.round(tamanio * PROPORCION_TEXTO[variante]) }}
        className={TIPOGRAFIA[variante]}
      >
        {iniciales(nombre, apellido)}
      </Text>
    </View>
  );
}
