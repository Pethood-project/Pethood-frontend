/**
 * Miniatura de un video en la conversación (GUI-14).
 *
 * Mismo rectángulo redondeado que `FotoMensaje` —radio, tamaño y velo de subida son los del
 * artboard 37— con una insignia de reproducir encima. Va en un componente aparte y no como
 * una prop de `FotoMensaje` porque `useVideoPlayer` es un hook: no se puede llamar
 * condicionalmente según el adjunto sea foto o video.
 *
 * **Ni el artboard ni la HU definen cómo se ve un video en la grilla** (el diseño sólo tiene
 * la etiqueta "Foto o video" en la hoja de adjuntos). La insignia se diseñó acorde: círculo
 * oscuro semitransparente con el triángulo en blanco, centrado, sobre el mismo velo que ya
 * usa la foto mientras sube.
 *
 * El primer fotograma se muestra con un `VideoView` pausado en vez de generar una miniatura:
 * evita sumar `expo-video-thumbnails` y un archivo más que subir. Los controles nativos van
 * apagados — la miniatura no se reproduce, se toca para abrir el visor.
 */
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { PALETA } from '@/constants/theme';

const RADIO = 20;

/** Lado del círculo de la insignia, y del triángulo adentro. */
const INSIGNIA = 34;
const TRIANGULO = 18;

interface VideoMensajeProps {
  uri: string;
  ancho: number;
  alto: number;
  subiendo: boolean;
  /** Abre el video a pantalla completa. El visor lo monta la pantalla, no cada miniatura. */
  onAbrir?: () => void;
}

export function VideoMensaje({ uri, ancho, alto, subiendo, onAbrir }: VideoMensajeProps) {
  // Sin `play()`: el reproductor existe sólo para tener el primer fotograma a la vista.
  const player = useVideoPlayer(uri, (instancia) => {
    instancia.muted = true;
  });

  return (
    <View
      style={{ width: ancho, height: alto, borderRadius: RADIO }}
      className="overflow-hidden bg-organic-neutral-200"
    >
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
        // La miniatura no es el reproductor: pantalla completa y PiP se manejan en el visor.
        allowsPictureInPicture={false}
        // Android: imprescindible acá. Por defecto `VideoView` dibuja sobre un `SurfaceView`,
        // que es una ventana aparte perforada en la jerarquía y NO se mueve ni se recorta con
        // la lista. En una conversación con varios videos eso se ve como que las miniaturas
        // se mezclan entre sí y se corren al scrollear. `textureView` es una vista común: se
        // desplaza y se superpone como cualquier otra.
        //
        // El precio es más consumo, y por eso NO se usa en el visor: ahí se reproduce de
        // verdad, hay un solo video en pantalla y `surfaceView` rinde mejor.
        surfaceType="textureView"
      />

      {/* El área táctil va ENCIMA del video y no alrededor. `VideoView` es una vista nativa
          y se queda con el toque, así que con el `Pressable` de contenedor tocar la
          miniatura no abría nada. Como hermano posterior queda por arriba y lo recibe él. */}
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel="Reproducir el video"
        onPress={subiendo ? undefined : onAbrir}
        disabled={subiendo || !onAbrir}
        className="absolute inset-0 items-center justify-center active:opacity-90"
      >
        {/* Mientras sube manda el velo con el spinner, igual que la foto: mostrar el play
            invitaría a tocar algo que todavía no se puede abrir. */}
        {subiendo ? (
          <View className="absolute inset-0 items-center justify-center bg-black/35">
            <ActivityIndicator color={PALETA.blanco} />
          </View>
        ) : (
          <View
            style={{
              width: INSIGNIA,
              height: INSIGNIA,
              borderRadius: INSIGNIA / 2,
              backgroundColor: 'rgba(43,22,9,0.55)',
            }}
            className="items-center justify-center"
          >
            {/* Corrido 2px a la derecha: el triángulo de "play" tiene el centro óptico
                desplazado y centrado a la perfección se ve torcido. */}
            <Ionicons
              name="play"
              size={TRIANGULO}
              color={PALETA.blanco}
              style={{ marginLeft: 2 }}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}
