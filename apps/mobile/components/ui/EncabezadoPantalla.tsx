/**
 * Encabezado de pantalla: flecha de volver, título y, si hace falta, un subtítulo y acciones
 * a la derecha. Es el único lugar donde se define el tamaño del título, para que "Mis
 * mascotas" y "Notificaciones" no se vean de tamaños distintos, y donde cae la flecha.
 *
 * `barra` lo apoya sobre una barra crema con línea inferior; sin eso queda liso sobre el
 * fondo. `claro` es la banda de color de la marca (seguimientos), con textos blancos.
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { BotonVolver } from './BotonVolver';

/**
 * Título de pantalla con el tamaño único de la app, para los encabezados que arman su propia
 * estructura. Nunca ocupa dos líneas: si un título no entra, se achica un poco (hasta 80%) en
 * vez de saltar, y recién después se corta con puntos suspensivos. Conviene que sea corto.
 */
export function TituloPantalla({
  children,
  claro = false,
}: {
  children: ReactNode;
  claro?: boolean;
}) {
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.8}
      className={`font-titulo text-[27px] leading-[32px] ${
        claro ? 'text-white' : 'text-organic-accent-600'
      }`}
    >
      {children}
    </Text>
  );
}

interface EncabezadoPantallaProps {
  titulo: string;
  subtitulo?: string;
  /** Sin esto no hay flecha: es el encabezado de una pestaña raíz. */
  onVolver?: () => void;
  /** Por defecto "Volver"; el chat dice a dónde vuelve. */
  etiquetaVolver?: string;
  /** Acciones a la derecha, normalmente `BotonCircular`. */
  derecha?: ReactNode;
  barra?: boolean;
  claro?: boolean;
  /** Debajo de la fila del título, dentro de la misma barra (ej. un buscador). */
  children?: ReactNode;
}

export function EncabezadoPantalla({
  titulo,
  subtitulo,
  onVolver,
  etiquetaVolver,
  derecha,
  barra = false,
  claro = false,
  children,
}: EncabezadoPantallaProps) {
  const fondo = claro
    ? 'bg-organic-accent-600'
    : barra
      ? 'border-b border-organic-neutral-300 bg-organic-neutral-100'
      : '';

  return (
    <View className={`px-[22px] pb-3.5 pt-2.5 ${fondo}`}>
      <View className="flex-row items-center gap-2">
        {onVolver ? (
          <BotonVolver onPress={onVolver} etiqueta={etiquetaVolver} claro={claro} />
        ) : null}

        <View className="min-w-0 flex-1">
          <TituloPantalla claro={claro}>{titulo}</TituloPantalla>
          {subtitulo ? (
            <Text
              numberOfLines={1}
              className={`mt-0.5 font-cuerpo text-[13px] ${
                claro ? 'text-white/80' : 'text-organic-neutral-600'
              }`}
            >
              {subtitulo}
            </Text>
          ) : null}
        </View>

        {derecha}
      </View>

      {children ? <View className="mt-3">{children}</View> : null}
    </View>
  );
}
