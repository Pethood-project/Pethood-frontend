/**
 * Elegir entre adoptar y dar tránsito: dos tarjetas grandes de colores distintos, para que
 * la diferencia se vea antes de leerla. La elegida se rellena con su color.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { ESTILO_TIPO_SOLICITUD, OPCIONES_TIPO_SOLICITUD } from '@/constants/Solicitudes';
import { PALETA } from '@/constants/theme';
import { vibrar } from '@/lib/haptics';
import type { TipoSolicitud } from '@/services/solicitudes';

interface SelectorTipoSolicitudProps {
  valor: TipoSolicitud | null;
  onChange: (valor: TipoSolicitud) => void;
  error?: string;
}

export function SelectorTipoSolicitud({ valor, onChange, error }: SelectorTipoSolicitudProps) {
  return (
    <View>
      <View accessibilityRole="radiogroup" className="flex-row gap-3">
        {OPCIONES_TIPO_SOLICITUD.map((opcion) => {
          const estilo = ESTILO_TIPO_SOLICITUD[opcion.valor];
          const elegida = valor === opcion.valor;

          return (
            <Pressable
              key={opcion.valor}
              accessibilityRole="radio"
              accessibilityState={{ selected: elegida }}
              onPress={() => {
                if (!elegida) vibrar.seleccion();
                onChange(opcion.valor);
              }}
              style={{
                backgroundColor: elegida ? estilo.relleno : PALETA.surface,
                borderColor: elegida ? estilo.relleno : PALETA.neutral[300],
              }}
              className="flex-1 items-center rounded-3xl border-2 px-3 py-5 active:opacity-90"
            >
              <View
                style={{ backgroundColor: elegida ? PALETA.blanco : estilo.fondo }}
                className="h-14 w-14 items-center justify-center rounded-full"
              >
                <Ionicons name={estilo.icono} size={28} color={estilo.tinta} />
              </View>

              <Text
                style={{ color: elegida ? estilo.sobreRelleno : PALETA.neutral[900] }}
                className="mt-3 text-center font-cuerpo-bold text-[17px]"
              >
                {opcion.etiqueta}
              </Text>
              <Text
                style={{ color: elegida ? estilo.sobreRelleno : PALETA.neutral[600] }}
                className="mt-0.5 text-center font-cuerpo text-[13px]"
              >
                {estilo.descripcion}
              </Text>

              {elegida ? (
                <View className="absolute right-2.5 top-2.5">
                  <Ionicons name="checkmark-circle" size={20} color={estilo.sobreRelleno} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {error ? <Text className="mt-1.5 text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
