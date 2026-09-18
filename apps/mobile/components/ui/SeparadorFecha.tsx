/**
 * Chip centrado que abre una jornada dentro de una lista cronológica: "Hoy", "Ayer", una
 * fecha. Lo usa la sala de chat (GUI-14, artboards 35 y 37) y sirve para cualquier lista
 * agrupada por día (seguimiento, historia clínica).
 *
 * Medidas del artboard (sobre 262px, ×1,33): fondo `neutral-200`, texto `neutral-700` de
 * 8 → 11 semibold, padding 3/10 → 4/13, píldora.
 *
 * No sabe de fechas: recibe la etiqueta ya armada (`etiquetaDia` en `shared/validation/dates`).
 */
import { Text, View } from 'react-native';

interface SeparadorFechaProps {
  etiqueta: string;
}

export function SeparadorFecha({ etiqueta }: SeparadorFechaProps) {
  return (
    <View className="items-center">
      <View className="rounded-full bg-organic-neutral-200 px-[13px] py-[4px]">
        <Text className="font-cuerpo-semi text-[11px] text-organic-neutral-700">{etiqueta}</Text>
      </View>
    </View>
  );
}
