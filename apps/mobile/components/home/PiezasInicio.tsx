/**
 * Piezas chicas que se repiten entre las secciones de Inicio (adoptante y refugio).
 *
 * Las sombras van por `style` y nunca como clase `shadow-*`: ver la advertencia de
 * `components/seguimiento/FilaPedidoSeguimiento.tsx` (nativewind#1557).
 */
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

type NombreIcono = keyof typeof Ionicons.glyphMap;

/** Sombra de las tarjetitas claras sobre un bloque de color (favoritos). */
export const SOMBRA_TARJETA = {
  shadowColor: PALETA.neutral[900],
  shadowOpacity: 0.12,
  shadowRadius: 2,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
};

/** Sombra de la foto de adelante en el abanico de la tarjeta de Adoptar. */
export const SOMBRA_FOTO = {
  shadowColor: PALETA.neutral[900],
  shadowOpacity: 0.35,
  shadowRadius: 9,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
};

interface EncabezadoSeccionProps {
  icono: NombreIcono;
  /** Fondo del círculo del ícono y color del ícono. */
  fondoIcono: string;
  colorIcono: string;
  titulo: string;
  subtitulo: string;
  colorTitulo: string;
  colorSubtitulo: string;
  enlace?: { texto: string; color: string; onPress: () => void };
}

/**
 * Cabecera de las secciones con carrusel ("Tus favoritos", "Mis publicaciones"): ícono,
 * título, subtítulo y el enlace a la pantalla completa.
 *
 * El texto se achica y corta antes que empujar el enlace fuera de la tarjeta.
 */
export function EncabezadoSeccion({
  icono,
  fondoIcono,
  colorIcono,
  titulo,
  subtitulo,
  colorTitulo,
  colorSubtitulo,
  enlace,
}: EncabezadoSeccionProps) {
  return (
    <View className="flex-row items-center justify-between gap-3 pr-4">
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: fondoIcono }}
        >
          <Ionicons name={icono} size={18} color={colorIcono} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className="font-titulo text-[18px] leading-[21px]"
            style={{ color: colorTitulo }}
          >
            {titulo}
          </Text>
          <Text
            numberOfLines={1}
            className="font-cuerpo text-[12.5px]"
            style={{ color: colorSubtitulo }}
          >
            {subtitulo}
          </Text>
        </View>
      </View>

      {enlace ? (
        <Pressable
          accessibilityRole="link"
          onPress={enlace.onPress}
          hitSlop={8}
          className="active:opacity-60"
        >
          <Text className="font-cuerpo-bold text-[13px]" style={{ color: enlace.color }}>
            {enlace.texto}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface BotonAmarilloProps {
  texto: string;
  onPress: () => void;
  /** Ícono antes del texto (la huella) o después (la flecha). */
  iconoInicio?: NombreIcono;
  iconoFin?: NombreIcono;
}

/** El botón principal de las tarjetas oscuras: el mismo amarillo del botón central de la barra. */
export function BotonAmarillo({ texto, onPress, iconoInicio, iconoFin }: BotonAmarilloProps) {
  const tinta = PALETA.accent[900];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-[50px] flex-1 flex-row items-center justify-center gap-2 rounded-full px-4 active:opacity-85"
      style={{ backgroundColor: PALETA.tabCentral.amarillo }}
    >
      {iconoInicio ? <Ionicons name={iconoInicio} size={18} color={tinta} /> : null}
      <Text numberOfLines={1} className="font-cuerpo-bold text-[15px]" style={{ color: tinta }}>
        {texto}
      </Text>
      {iconoFin ? <Ionicons name={iconoFin} size={18} color={tinta} /> : null}
    </Pressable>
  );
}

/**
 * Lo que muestra una sección cuando su pedido falló y no hay datos anteriores. Chico a
 * propósito: el resto de Inicio sigue funcionando y no tiene sentido tapar la pantalla.
 */
export function AvisoSeccionFallida({ texto, color }: { texto: string; color: string }) {
  return (
    <View className="flex-row items-center gap-2 py-2">
      <Ionicons name="cloud-offline-outline" size={16} color={color} />
      <Text className="flex-1 font-cuerpo text-[12.5px]" style={{ color }}>
        {texto} Deslizá hacia abajo para reintentar.
      </Text>
    </View>
  );
}

/** Contenedor de sección con esquinas grandes. Sólo agrupa el patrón repetido. */
export function BloqueInicio({
  fondo,
  borde,
  className = '',
  children,
}: {
  fondo: string;
  borde?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <View
      className={`overflow-hidden rounded-[30px] ${className}`}
      style={{
        backgroundColor: fondo,
        ...(borde ? { borderWidth: 1, borderColor: borde } : {}),
      }}
    >
      {children}
    </View>
  );
}
