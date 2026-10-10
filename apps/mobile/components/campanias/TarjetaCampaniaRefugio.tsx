/**
 * Tarjeta de «Mis Campañas» (GUI-36, pantalla 21 del diseño): estado, título, montos, barra,
 * «N% · M donantes», aviso de donaciones por revisar y las acciones que permite su estado.
 * «Editar» se ve deshabilitado: la edición queda para una spec posterior.
 */
import { Pressable, Text, View } from 'react-native';

import { BarraProgreso } from '@/components/campanias/BarraProgreso';
import { EstadoCampaniaBadge } from '@/components/ui/EstadoCampaniaBadge';
import {
  accionesDisponibles,
  formatearPesos,
  textoDonantes,
  textoPendientes,
  type AccionCampania,
} from '@/lib/campanias';
import type { CampaniaRefugio } from '@/services/campanias';

const ETIQUETA_ACCION: Record<AccionCampania, string> = {
  finalizar: 'Finalizar',
  cancelar: 'Cancelar',
};

interface TarjetaCampaniaRefugioProps {
  campania: CampaniaRefugio;
  onAccion: (accion: AccionCampania) => void;
  onRevisar: () => void;
}

function BotonTarjeta({
  etiqueta,
  onPress,
  peligro = false,
  deshabilitado = false,
}: {
  etiqueta: string;
  onPress?: () => void;
  peligro?: boolean;
  deshabilitado?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      className={`rounded-full border px-3.5 py-1.5 active:opacity-70 ${
        deshabilitado
          ? 'border-organic-neutral-300 opacity-50'
          : peligro
            ? 'border-red-300'
            : 'border-organic-accent-600'
      }`}
    >
      <Text
        className={`font-cuerpo-bold text-[13px] ${
          deshabilitado
            ? 'text-organic-neutral-500'
            : peligro
              ? 'text-red-700'
              : 'text-organic-accent-600'
        }`}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

export function TarjetaCampaniaRefugio({
  campania,
  onAccion,
  onRevisar,
}: TarjetaCampaniaRefugioProps) {
  const pendientes = textoPendientes(campania.pendientes);

  return (
    <View className="gap-2 rounded-[22px] bg-organic-surface p-4">
      <EstadoCampaniaBadge estado={campania.estado.nombre} />
      <Text className="font-cuerpo-bold text-[17px] text-organic-neutral-900">
        {campania.titulo}
      </Text>

      <View className="flex-row justify-between">
        <Text className="font-cuerpo-bold text-[14px] text-organic-neutral-900">
          {formatearPesos(campania.recaudado)}
        </Text>
        <Text className="font-cuerpo text-[14px] text-organic-neutral-600">
          Meta: {formatearPesos(campania.objetivo)}
        </Text>
      </View>
      <BarraProgreso porcentaje={campania.porcentaje} />
      <Text className="font-cuerpo text-[13px] text-organic-neutral-600">
        {campania.porcentaje}% · {textoDonantes(campania.donantes)}
      </Text>

      {pendientes ? (
        <Pressable accessibilityRole="button" onPress={onRevisar} className="active:opacity-70">
          <Text className="font-cuerpo-bold text-[13px] text-organic-accent-600">{pendientes}</Text>
        </Pressable>
      ) : null}

      <View className="mt-1 flex-row flex-wrap gap-2">
        {accionesDisponibles(campania.estado.nombre).map((accion) => (
          <BotonTarjeta
            key={accion}
            etiqueta={ETIQUETA_ACCION[accion]}
            peligro={accion === 'cancelar'}
            onPress={() => onAccion(accion)}
          />
        ))}
        <BotonTarjeta etiqueta="Revisar donaciones" onPress={onRevisar} />
        <BotonTarjeta etiqueta="Editar" deshabilitado />
      </View>
    </View>
  );
}
