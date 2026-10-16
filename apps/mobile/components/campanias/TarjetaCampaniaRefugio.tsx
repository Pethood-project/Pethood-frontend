/**
 * Tarjeta de «Mis Campañas» (GUI-36, pantalla 21 del diseño), con la forma de las tarjetas de
 * mascota y publicación: imagen con el estado encima, título, fecha límite, montos, barra,
 * «N% · M donantes», aviso de donaciones por revisar y las acciones que permite su estado
 * (spec 028): pausar, reactivar, finalizar y, si no tiene donaciones, eliminar. Tocar la
 * imagen o el texto abre el detalle, donde se edita.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { BarraProgreso } from '@/components/campanias/BarraProgreso';
import { EstadoCampaniaBadge } from '@/components/ui/EstadoCampaniaBadge';
import { PALETA } from '@/constants/theme';
import {
  accionesDisponibles,
  formatearPesos,
  textoDonantes,
  textoPendientes,
  type AccionCampania,
} from '@/lib/campanias';
import { urlAbsoluta } from '@/services/api';
import type { CampaniaRefugio } from '@/services/campanias';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

type NombreIcono = keyof typeof Ionicons.glyphMap;

const ACCION: Record<AccionCampania, { etiqueta: string; icono: NombreIcono }> = {
  pausar: { etiqueta: 'Pausar', icono: 'pause' },
  reactivar: { etiqueta: 'Reactivar', icono: 'play' },
  finalizar: { etiqueta: 'Finalizar', icono: 'flag-outline' },
  eliminar: { etiqueta: 'Eliminar', icono: 'trash-outline' },
};

interface TarjetaCampaniaRefugioProps {
  campania: CampaniaRefugio;
  onAccion: (accion: AccionCampania) => void;
  onRevisar: () => void;
  /** Abre el detalle de la campaña, donde se edita. */
  onAbrir: () => void;
}

function BotonAccion({
  etiqueta,
  icono,
  onPress,
  peligro = false,
}: {
  etiqueta: string;
  icono: NombreIcono;
  onPress: () => void;
  peligro?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={4}
      className={`flex-row items-center gap-1.5 rounded-full px-4 py-2.5 active:opacity-70 ${
        peligro ? 'bg-red-50' : 'bg-organic-neutral-200'
      }`}
    >
      <Ionicons name={icono} size={17} color={peligro ? '#b91c1c' : PALETA.neutral[700]} />
      <Text
        className={`font-cuerpo-bold text-[14.5px] ${
          peligro ? 'text-red-700' : 'text-organic-neutral-700'
        }`}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

function textoFechaLimite(fechaFin: string): string {
  const fecha = parsearFecha(fechaFin);
  return `Hasta el ${fecha ? aFechaVisible(fecha) : fechaFin}`;
}

export function TarjetaCampaniaRefugio({
  campania,
  onAccion,
  onRevisar,
  onAbrir,
}: TarjetaCampaniaRefugioProps) {
  const imagen = urlAbsoluta(campania.imagenUrl);
  const pendientes = textoPendientes(campania.pendientes);

  return (
    <View className="overflow-hidden rounded-[26px] bg-organic-surface shadow-sm">
      {/* Imagen y texto son Pressables hermanos de los botones de acción, no un Pressable
          contenedor: uno anidado dentro de otro dispara onPress apenas se monta en web
          (React 19), como documenta favoritos.tsx. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver la campaña ${campania.titulo}`}
        onPress={onAbrir}
        className="active:opacity-90"
      >
        <View className="w-full bg-organic-calido-amarilloClaro" style={{ aspectRatio: 16 / 9 }}>
          {imagen ? (
            <Image source={{ uri: imagen }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="gift-outline" size={36} color={PALETA.accent[600]} />
            </View>
          )}
          <View className="absolute left-3 top-3">
            <EstadoCampaniaBadge estado={campania.estado.nombre} />
          </View>
        </View>
      </Pressable>

      <View className="gap-2.5 p-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver la campaña ${campania.titulo}`}
          onPress={onAbrir}
          className="gap-2.5 active:opacity-90"
        >
          <View>
            <Text
              numberOfLines={2}
              className="font-titulo text-[19px] leading-[23px] text-organic-neutral-900"
            >
              {campania.titulo}
            </Text>
            <Text className="mt-1 font-cuerpo text-[13px] text-organic-neutral-600">
              {textoFechaLimite(campania.fechaFin)}
            </Text>
          </View>

          <View className="gap-1.5">
            <View className="flex-row items-end justify-between">
              <Text className="font-cuerpo-bold text-[16px] text-organic-neutral-900">
                {formatearPesos(campania.recaudado)}
              </Text>
              <Text className="font-cuerpo text-[13px] text-organic-neutral-600">
                Meta {formatearPesos(campania.objetivo)}
              </Text>
            </View>
            <BarraProgreso porcentaje={campania.porcentaje} />
            <Text className="font-cuerpo text-[13px] text-organic-neutral-600">
              {campania.porcentaje}% · {textoDonantes(campania.donantes)}
            </Text>
          </View>
        </Pressable>

        {pendientes ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRevisar}
            className="flex-row items-center gap-2 self-start rounded-full bg-organic-calido-amarilloClaro px-3 py-1.5 active:opacity-70"
          >
            <Ionicons name="notifications-outline" size={14} color={PALETA.accent[700]} />
            <Text className="font-cuerpo-bold text-[13px] text-organic-accent-700">
              {pendientes}
            </Text>
          </Pressable>
        ) : null}

        <View className="mt-1 flex-row flex-wrap gap-2 border-t border-organic-neutral-200 pt-3">
          <BotonAccion etiqueta="Donaciones" icono="receipt-outline" onPress={onRevisar} />
          {accionesDisponibles(campania.estado.nombre, campania.tieneDonaciones).map((accion) => (
            <BotonAccion
              key={accion}
              etiqueta={ACCION[accion].etiqueta}
              icono={ACCION[accion].icono}
              peligro={accion === 'eliminar'}
              onPress={() => onAccion(accion)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
