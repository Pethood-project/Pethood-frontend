/**
 * Las fotos de un mensaje (GUI-14, artboard 37).
 *
 * Una sola foto ocupa el ancho que le deja la burbuja. Varias se muestran de a dos por fila,
 * cuadradas, y si son más de las que entran la última lleva el velo con el "+N" — tocarla
 * abre el visor en esa posición, no oculta nada.
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

  if (imagenes.length === 1) {
    return (
      <FotoMensaje
        uri={imagenes[0]!}
        ancho={anchoUnica}
        alto={altoUnica}
        subiendo={subiendo}
        onAbrir={onAbrir ? () => onAbrir(0) : undefined}
      />
    );
  }

  const visibles = imagenes.slice(0, VISIBLES);
  const ocultas = imagenes.length - visibles.length;

  return (
    <View
      style={{ width: lado * 2 + SEPARACION, gap: SEPARACION }}
      className="flex-row flex-wrap"
    >
      {visibles.map((uri, indice) => {
        const esUltimaVisible = indice === visibles.length - 1;

        return (
          <View key={`${uri}-${indice}`}>
            <FotoMensaje
              uri={uri}
              ancho={lado}
              alto={lado}
              subiendo={subiendo}
              onAbrir={onAbrir ? () => onAbrir(indice) : undefined}
            />

            {/* El velo va ENCIMA y sin capturar el toque: la miniatura de abajo sigue
                abriendo el visor, que es donde se ven las que no entraron. */}
            {esUltimaVisible && ocultas > 0 ? (
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
      })}
    </View>
  );
}
