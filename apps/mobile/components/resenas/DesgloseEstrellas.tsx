/**
 * Desglose de estrellas de un usuario o refugio: promedio grande a la izquierda y barras de
 * cantidad por puntuación (5 a 1) a la derecha. Es el encabezado de la reputación en los
 * perfiles y en la pantalla de reseñas (Módulo 10, HU-10.5).
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Estrellas } from '@/components/resenas/Estrellas';
import { PALETA } from '@/constants/theme';
import type { DistribucionEstrellas } from '@/services/resenas';

interface DesgloseEstrellasProps {
  promedio: number | null;
  cantidad: number;
  distribucion: DistribucionEstrellas[];
}

export function DesgloseEstrellas({ promedio, cantidad, distribucion }: DesgloseEstrellasProps) {
  // La barra más larga es la de la puntuación más votada, para que el desglose se lea de un
  // vistazo aunque haya pocas reseñas.
  const maximo = Math.max(1, ...distribucion.map((fila) => fila.cantidad));

  return (
    <View className="rounded-2xl bg-organic-surface p-4 shadow-sm">
      <View className="flex-row items-center">
        <View className="w-[104px] items-center">
          <Text className="font-titulo text-[38px] leading-[42px] text-organic-accent-600">
            {promedio === null ? '—' : promedio.toFixed(1)}
          </Text>
          <Estrellas valor={promedio ?? 0} tamanio={16} etiqueta="Promedio de reseñas" />
          <Text className="mt-1 font-cuerpo text-[12px] text-organic-neutral-500">
            {cantidad === 0
              ? 'Sin reseñas'
              : `${cantidad} ${cantidad === 1 ? 'reseña' : 'reseñas'}`}
          </Text>
        </View>

        <View className="ml-3 flex-1 gap-1.5">
          {distribucion.map((fila) => (
            <View key={fila.puntuacion} className="flex-row items-center">
              <Text className="w-3 font-cuerpo-semi text-[12px] text-organic-neutral-600">
                {fila.puntuacion}
              </Text>
              <Ionicons
                name="star"
                size={11}
                color={PALETA.calido.amarillo}
                style={{ marginHorizontal: 3 }}
              />
              <View className="h-2 flex-1 overflow-hidden rounded-full bg-organic-neutral-200">
                <View
                  style={{ width: `${(fila.cantidad / maximo) * 100}%` }}
                  className="h-full rounded-full bg-organic-accent-500"
                />
              </View>
              <Text className="w-6 text-right font-cuerpo text-[11px] text-organic-neutral-500">
                {fila.cantidad}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
