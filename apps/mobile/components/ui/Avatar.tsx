/**
 * Foto de perfil circular, con las iniciales sobre el naranja de marca como respaldo.
 *
 * El patrón estaba escrito tres veces (perfil, editar perfil y la lista de chats), con la
 * función `iniciales` duplicada literal en dos de ellas. Vive acá para que el avatar se vea
 * igual en toda la app.
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

interface AvatarProps {
  /** URL absoluta o uri local. `null` muestra las iniciales. */
  uri?: string | null;
  nombre?: string | null;
  apellido?: string | null;
  /** Lado del círculo en px. Los tamaños en uso: 56 (fila de chat), 80 y 112 (perfil). */
  tamanio: number;
  /** Tamaño de las iniciales. Por defecto, ~40% del lado, que es la proporción del diseño. */
  tamanioTexto?: number;
  accessibilityLabel?: string;
}

export function Avatar({
  uri,
  nombre,
  apellido,
  tamanio,
  tamanioTexto,
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
      className="items-center justify-center bg-pethood-orange"
    >
      <Text
        style={{ fontSize: tamanioTexto ?? Math.round(tamanio * 0.4) }}
        className="font-bold text-white"
      >
        {iniciales(nombre, apellido)}
      </Text>
    </View>
  );
}
