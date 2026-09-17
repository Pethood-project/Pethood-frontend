/**
 * Carrusel horizontal de las fotos de una publicación, con paginación por deslizamiento.
 *
 * El indicador "1 de 6" repite el de la tarjeta del mazo, pero acá sí se actualiza: es la
 * pantalla donde el usuario puede recorrer las fotos.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { urlAbsoluta } from '@/services/api';

/** Alto del carrusel como fracción del alto de pantalla, para que entre el texto debajo. */
const PROPORCION_ALTO = 0.48;

interface GaleriaFotosProps {
  imagenes: string[];
}

export function GaleriaFotos({ imagenes }: GaleriaFotosProps) {
  const { width, height } = useWindowDimensions();
  const [actual, setActual] = useState(0);
  const [fallidas, setFallidas] = useState<Record<number, boolean>>({});

  const alto = height * PROPORCION_ALTO;

  const alDesplazar = (evento: NativeSyntheticEvent<NativeScrollEvent>): void => {
    // Se redondea al ancho de pantalla porque el offset llega con decimales.
    setActual(Math.round(evento.nativeEvent.contentOffset.x / width));
  };

  if (imagenes.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center bg-pethood-beige-dark">
        <Ionicons name="paw" size={64} color="rgba(160, 100, 40, 0.22)" />
      </View>
    );
  }

  return (
    <View style={{ height: alto }} className="bg-pethood-beige-dark">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={alDesplazar}
      >
        {imagenes.map((imagen, indice) => {
          const uri = urlAbsoluta(imagen);

          return uri && !fallidas[indice] ? (
            <Image
              key={imagen}
              source={{ uri }}
              style={{ width, height: alto }}
              resizeMode="cover"
              onError={() => setFallidas((actuales) => ({ ...actuales, [indice]: true }))}
            />
          ) : (
            <View
              key={imagen}
              style={{ width, height: alto }}
              className="items-center justify-center"
            >
              <Ionicons name="paw" size={64} color="rgba(160, 100, 40, 0.22)" />
            </View>
          );
        })}
      </ScrollView>

      {imagenes.length > 1 ? (
        <>
          <View className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-white">
              {actual + 1} de {imagenes.length}
            </Text>
          </View>

          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
            {imagenes.map((imagen, indice) => (
              <View
                key={imagen}
                className={`h-1.5 rounded-full ${
                  indice === actual ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}
