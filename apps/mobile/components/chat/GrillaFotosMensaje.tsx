/**
 * Las fotos de un mensaje (GUI-14, artboard 37).
 *
 * La disposición depende de cuántas son, como en las apps de mensajería, para que nunca
 * quede un hueco:
 *
 * - 1: ocupa el ancho que le deja la burbuja.
 * - 2: dos cuadradas, lado a lado.
 * - 3: una alta a la izquierda y dos cuadradas apiladas a la derecha.
 * - 4 o más: 2×2 cuadradas; si hay más de cuatro, la última lleva el velo con el "+N".
 *   Tocarla abre el visor en esa posición, no oculta nada.
 *
 * Medidas del artboard (sobre 262px, con el factor ×1,33): miniatura de 117 de lado con 7 de
 * separación, radio 20 y el "+N" en Caprasimo 20 sobre `rgba(43,22,9,.45)`.
 */
import { Text, View } from 'react-native';

import { FotoMensaje } from '@/components/chat/FotoMensaje';

/** Cuántas miniaturas se ven antes de agrupar el resto detrás del "+N". */
const VISIBLES = 4;
const SEPARACION = 7;

interface GrillaFotosMensajeProps {
  /** URLs absolutas, o uris locales mientras suben. */
  imagenes: string[];
  /** Lado de cada miniatura cuando hay más de una. */
  lado: number;
  /** Medidas de la foto única. */
  anchoUnica: number;
  altoUnica: number;
  subiendo: boolean;
  /** Abre el visor en esa posición de la lista. */
  onAbrir?: (indice: number) => void;
}

export function GrillaFotosMensaje({
  imagenes,
  lado,
  anchoUnica,
  altoUnica,
  subiendo,
  onAbrir,
}: GrillaFotosMensajeProps) {
  if (imagenes.length === 0) return null;

  const miniatura = (indice: number, ancho: number, alto: number) => {
    const uri = imagenes[indice]!;
    const ocultas = imagenes.length - VISIBLES;
    const conVelo = indice === VISIBLES - 1 && ocultas > 0;

    return (
      <View key={`${uri}-${indice}`}>
        <FotoMensaje
          uri={uri}
          ancho={ancho}
          alto={alto}
          subiendo={subiendo}
          onAbrir={onAbrir ? () => onAbrir(indice) : undefined}
        />

        {/* El velo va ENCIMA y sin capturar el toque: la miniatura de abajo sigue abriendo
            el visor, que es donde se ven las que no entraron. */}
        {conVelo ? (
          <View
            pointerEvents="none"
            style={{ backgroundColor: 'rgba(43,22,9,0.45)', borderRadius: 20 }}
            className="absolute inset-0 items-center justify-center"
          >
            <Text className="font-titulo text-[20px] text-white">{`+${ocultas}`}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (imagenes.length === 1) {
    return miniatura(0, anchoUnica, altoUnica);
  }

  if (imagenes.length === 2) {
    return (
      <View style={{ gap: SEPARACION }} className="flex-row">
        {miniatura(0, lado, lado)}
        {miniatura(1, lado, lado)}
      </View>
    );
  }

  // La alta mide lo mismo que las dos apiladas con su separación: los bordes de afuera
  // quedan alineados y no hay hueco.
  const altoColumna = lado * 2 + SEPARACION;

  if (imagenes.length === 3) {
    return (
      <View style={{ gap: SEPARACION }} className="flex-row">
        {miniatura(0, lado, altoColumna)}
        <View style={{ gap: SEPARACION }}>
          {miniatura(1, lado, lado)}
          {miniatura(2, lado, lado)}
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: SEPARACION }} className="flex-row">
      <View style={{ gap: SEPARACION }}>
        {miniatura(0, lado, lado)}
        {miniatura(2, lado, lado)}
      </View>
      <View style={{ gap: SEPARACION }}>
        {miniatura(1, lado, lado)}
        {miniatura(3, lado, lado)}
      </View>
    </View>
  );
}
