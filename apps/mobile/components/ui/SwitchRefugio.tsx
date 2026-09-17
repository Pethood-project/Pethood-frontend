/**
 * Cambio entre la vista de adoptante y la de refugio.
 *
 * Vive en Perfil y no en Inicio: es un ajuste de la cuenta, no una acción de la pantalla.
 * Solo lo ve quien pertenece a un refugio.
 *
 * Sin `onCambiar` se muestra atenuado y no responde, que es el estado de hoy: la vista de
 * refugio todavía no existe.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface SwitchRefugioProps {
  activo: boolean;
  onCambiar?: (activo: boolean) => void;
}

export function SwitchRefugio({ activo, onCambiar }: SwitchRefugioProps) {
  const habilitado = Boolean(onCambiar);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: activo, disabled: !habilitado }}
      accessibilityLabel={
        habilitado ? 'Vista de refugio' : 'Vista de refugio, no disponible todavía'
      }
      disabled={!habilitado}
      onPress={habilitado ? () => onCambiar?.(!activo) : undefined}
      className={`flex-row items-center rounded-[28px] bg-white px-4 py-3.5 shadow-sm ${
        habilitado ? 'active:bg-gray-50' : 'opacity-40'
      }`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
        <Ionicons name="home-outline" size={18} color={PALETA.pethood.naranja} />
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-base text-gray-800">Vista de refugio</Text>
        <Text className="mt-0.5 text-xs text-gray-500">
          Administrá las mascotas y campañas de tu refugio
        </Text>
      </View>

      <View
        className={`h-7 w-12 justify-center rounded-full px-0.5 ${
          activo ? 'bg-pethood-orange' : 'bg-gray-300'
        }`}
      >
        <View
          className={`h-6 w-6 rounded-full bg-white shadow-sm ${
            activo ? 'self-end' : 'self-start'
          }`}
        />
      </View>
    </Pressable>
  );
}
