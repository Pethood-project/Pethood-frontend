/**
 * Los tres estados que toda pantalla que trae datos tiene que saber mostrar: cargando, que
 * falló, y que no hay nada. Estaban repetidos casi textualmente en cada listado.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

type NombreIcono = keyof typeof Ionicons.glyphMap;

export function EstadoCargando() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={PALETA.pethood.naranja} />
    </View>
  );
}

interface EstadoErrorProps {
  mensaje: string;
  onAccion: () => void;
  /** Por defecto reintenta; algunas pantallas prefieren ofrecer volver. */
  etiquetaAccion?: string;
  /**
   * El default habla de conexión, que es la causa habitual. Cuando el error es del dato y
   * no de la red conviene pasar otro, por ejemplo `alert-circle-outline`.
   */
  icono?: NombreIcono;
}

export function EstadoError({
  mensaje,
  onAccion,
  etiquetaAccion = 'Reintentar',
  icono = 'cloud-offline-outline',
}: EstadoErrorProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name={icono} size={40} color={PALETA.gris[400]} />
      <Text className="mt-3 text-center text-base text-gray-600">{mensaje}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={onAccion}
        className="mt-4 rounded-full bg-pethood-orange px-6 py-2 active:opacity-90"
      >
        <Text className="font-medium text-white">{etiquetaAccion}</Text>
      </Pressable>
    </View>
  );
}

interface EstadoVacioProps {
  icono: NombreIcono;
  titulo: string;
  descripcion: string;
  /** Acciones opcionales debajo del texto, por ejemplo para ampliar una búsqueda. */
  children?: ReactNode;
}

export function EstadoVacio({ icono, titulo, descripcion, children }: EstadoVacioProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-white">
        <Ionicons name={icono} size={44} color={PALETA.pethood.naranja} />
      </View>

      <Text className="text-center text-lg font-bold text-gray-900">{titulo}</Text>
      <Text className="mt-2 text-center text-base leading-6 text-gray-500">{descripcion}</Text>

      {children ? <View className="mt-6 w-full gap-2.5">{children}</View> : null}
    </View>
  );
}
