/**
 * Lo que el refugio pidió para esta mascota, como recordatorio antes de revisar. Va solo, sin
 * comparar contra nada: los requisitos son texto libre, así que no hay nada que evaluar solo y
 * lo que haga falta hablar se habla por el chat. Sin requisitos no se dibuja.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface RequisitosMascotaProps {
  nombreMascota: string | null;
  requisitos: string[];
}

export function RequisitosMascota({ nombreMascota, requisitos }: RequisitosMascotaProps) {
  if (requisitos.length === 0) return null;

  return (
    <View
      style={{ backgroundColor: PALETA.calido.amarilloClaro, borderColor: PALETA.calido.amarillo }}
      className="rounded-2xl border-[1.5px] p-4"
    >
      <View className="flex-row items-center gap-2">
        <Ionicons name="bulb" size={19} color={PALETA.accent[700]} />
        <Text className="flex-1 font-cuerpo-bold text-[15px] text-organic-accent-800">
          Antes de revisar, tené en cuenta esto
        </Text>
      </View>

      <Text className="mt-1 font-cuerpo text-[13px] text-organic-accent-700">
        Lo que pediste para {nombreMascota ?? 'la mascota'}:
      </Text>

      <View className="mt-2.5 gap-2">
        {requisitos.map((requisito) => (
          <View key={requisito} className="flex-row items-start gap-2.5">
            <Ionicons
              name="ellipse"
              size={7}
              color={PALETA.accent[600]}
              style={{ marginTop: 8 }}
            />
            <Text className="flex-1 font-cuerpo text-[15.5px] leading-[22px] text-organic-neutral-900">
              {requisito}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
