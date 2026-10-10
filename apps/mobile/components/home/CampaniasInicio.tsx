/**
 * Accesos de Inicio a las campañas (spec 026): el bloque naranja del adoptante lleva al portal
 * (GUI-13) y la tarjeta chica del refugio a «Mis Campañas» (GUI-36). Conservan el diseño que
 * tenían mientras el módulo no existía; sólo dejaron de decir «Muy pronto».
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

export function CampaniasAdoptante({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Campañas de los refugios. Ver campañas"
      onPress={onPress}
      className="rounded-[30px] p-[18px] active:opacity-90"
      style={{ backgroundColor: PALETA.accent[600] }}
    >
      <Text
        className="font-cuerpo-bold text-[11px] tracking-[1.4px]"
        style={{ color: PALETA.accent[200] }}
      >
        CAMPAÑAS · TU AYUDA CUENTA
      </Text>

      <View className="mt-3.5 flex-row items-center gap-3.5">
        <View
          className="h-[84px] w-[84px] items-center justify-center rounded-[20px]"
          style={{
            backgroundColor: PALETA.accent[700],
            borderWidth: 3,
            borderColor: PALETA.accent[400],
          }}
        >
          <Ionicons name="gift-outline" size={34} color={PALETA.accent[200]} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className="font-titulo text-[18px] leading-[21px]"
            style={{ color: PALETA.accent[100] }}
          >
            Ayudá a los refugios
          </Text>
          <Text
            className="mt-1 font-cuerpo text-[12px] leading-[16px]"
            style={{ color: PALETA.accent[200] }}
          >
            Doná a sus campañas y mirá cuánto les falta para llegar a la meta.
          </Text>
        </View>
      </View>

      <View className="mt-3.5 flex-row items-center justify-between">
        <Text className="font-cuerpo-bold text-[13px]" style={{ color: PALETA.accent[100] }}>
          Ver campañas
        </Text>
        <Ionicons name="arrow-forward" size={16} color={PALETA.accent[100]} />
      </View>
    </Pressable>
  );
}

export function CampaniasRefugio({
  altoMinimo,
  onPress,
}: {
  altoMinimo: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Mis campañas. Ver campañas"
      onPress={onPress}
      className="flex-1 justify-between gap-3 rounded-[26px] p-3.5 active:opacity-90"
      style={{ minHeight: altoMinimo, backgroundColor: PALETA.accent[600] }}
    >
      <View
        className="h-[62px] w-[62px] items-center justify-center rounded-full"
        style={{ borderWidth: 7, borderColor: PALETA.accent[700] }}
      >
        <Ionicons name="cash-outline" size={22} color={PALETA.accent[100]} />
      </View>
      <View>
        <Text
          className="font-titulo text-[15.5px] leading-[18px]"
          style={{ color: PALETA.accent[100] }}
        >
          Mis campañas
        </Text>
        <Text
          className="mt-[3px] font-cuerpo text-[12px] leading-[16px]"
          style={{ color: PALETA.accent[200] }}
        >
          Pedí donaciones y revisá las que te avisan.
        </Text>
        <Text className="mt-2 font-cuerpo-bold text-[12px]" style={{ color: PALETA.accent[100] }}>
          Ver campañas →
        </Text>
      </View>
    </Pressable>
  );
}
