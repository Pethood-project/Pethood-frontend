/**
 * Fila "Ubicación" de Mi Perfil / Mi Refugio.
 *
 * Muestra el link de Google Maps del perfil activo y lo abre en el navegador. Si el link está
 * mal o no hay, el lápiz abre un diálogo para pegarlo a mano; el backend recalcula
 * latitud/longitud a partir del link nuevo, así el pin queda donde el usuario lo pegó.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DialogoLinkMapa } from '@/components/perfil/DialogoLinkMapa';
import { PALETA } from '@/constants/theme';

interface FilaUbicacionProps {
  mapaUrl: string | null;
  /** Persiste el link. Debe lanzar (ApiError) si falla, para mostrar el motivo. */
  onGuardar: (mapaUrl: string) => Promise<void>;
}

export function FilaUbicacion({ mapaUrl, onGuardar }: FilaUbicacionProps) {
  const [abierto, setAbierto] = useState(false);

  const abrirMapa = (): void => {
    if (mapaUrl) void Linking.openURL(mapaUrl);
  };

  return (
    <View className="mt-3">
      <Text className="font-cuerpo-bold text-[11px] uppercase tracking-wider text-organic-neutral-500">
        Ubicación
      </Text>

      <View className="mt-1 flex-row items-center gap-2">
        {mapaUrl ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Ver la ubicación en Google Maps"
            onPress={abrirMapa}
            hitSlop={6}
            className="flex-1 flex-row items-center gap-1.5 active:opacity-70"
          >
            <Ionicons name="location" size={16} color={PALETA.accent[600]} />
            <Text
              className="flex-1 font-cuerpo-semi text-[15px] text-organic-accent-700"
              numberOfLines={1}
            >
              Ver en el mapa
            </Text>
          </Pressable>
        ) : (
          <View className="flex-1 flex-row items-center gap-1.5">
            <Ionicons name="location-outline" size={16} color={PALETA.neutral[500]} />
            <Text className="flex-1 font-cuerpo text-[15px] text-organic-neutral-500">
              Sin ubicación
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar el link de la ubicación"
          onPress={() => setAbierto(true)}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full bg-organic-accent-100 active:opacity-70"
        >
          <Ionicons name="pencil" size={15} color={PALETA.accent[700]} />
        </Pressable>
      </View>

      <DialogoLinkMapa
        visible={abierto}
        valorInicial={mapaUrl}
        onGuardar={onGuardar}
        onCerrar={() => setAbierto(false)}
      />
    </View>
  );
}