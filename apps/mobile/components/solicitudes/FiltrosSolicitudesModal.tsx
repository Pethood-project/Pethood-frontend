/**
 * Filtros de "Mis solicitudes" (GUI-27), desplegados desde el ícono de deslizadores del
 * encabezado. Mismo patrón que `FiltrosAdopcionModal`: se edita sobre un borrador local y
 * recién al tocar "Aplicar" se avisa hacia afuera.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateField } from '@/components/ui/DateField';
import { SeccionTitulada } from '@/components/ui/SeccionTitulada';
import { SelectorChips, type OpcionSelector } from '@/components/ui/SelectorChips';
import { PALETA } from '@/constants/theme';
import {
  contarFiltrosActivosSolicitudes,
  SIN_FILTROS_SOLICITUDES,
  type EstadoSolicitudNombre,
  type FiltrosSolicitudes,
} from '@/services/solicitudes';

const OPCIONES_ESTADO: OpcionSelector<EstadoSolicitudNombre>[] = [
  { valor: 'Pendiente', etiqueta: 'Pendientes' },
  { valor: 'En_Revision', etiqueta: 'En revisión' },
  { valor: 'Aprobada', etiqueta: 'Aprobadas' },
  { valor: 'Rechazada', etiqueta: 'Rechazadas' },
  { valor: 'Cancelada', etiqueta: 'Canceladas' },
];

interface FiltrosSolicitudesModalProps {
  visible: boolean;
  /** Filtros aplicados hoy; el borrador se reinicia con ellos cada vez que se abre. */
  filtros: FiltrosSolicitudes;
  onAplicar: (filtros: FiltrosSolicitudes) => void;
  onCerrar: () => void;
}

export function FiltrosSolicitudesModal({
  visible,
  filtros,
  onAplicar,
  onCerrar,
}: FiltrosSolicitudesModalProps) {
  const insets = useSafeAreaInsets();
  const [borrador, setBorrador] = useState<FiltrosSolicitudes>(filtros);

  // Al abrir se descarta cualquier borrador anterior: lo que se ve tiene que ser lo que
  // está aplicado, no lo que el usuario tocó y no confirmó la vez pasada.
  useEffect(() => {
    if (visible) setBorrador(filtros);
  }, [visible, filtros]);

  const activos = contarFiltrosActivosSolicitudes(borrador);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <View className="flex-1 bg-pethood-beige">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white/85 px-3.5 py-2.5">
            <View className="flex-row items-center gap-2.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar filtros"
                onPress={onCerrar}
                hitSlop={10}
                className="h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white active:opacity-70"
              >
                <Ionicons name="arrow-back" size={18} color={PALETA.grisCalido[700]} />
              </Pressable>

              <Text className="text-xl font-bold text-pethood-orange">Filtros</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setBorrador(SIN_FILTROS_SOLICITUDES)}
              disabled={activos === 0}
              hitSlop={10}
              className="active:opacity-70"
            >
              <Text
                className={`text-sm font-semibold ${
                  activos === 0 ? 'text-gray-300' : 'text-pethood-orange-dark'
                }`}
              >
                Limpiar
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <SeccionTitulada titulo="Estado" className="mb-5">
              <SelectorChips
                prefijo="estado-solicitud"
                etiquetaSinFiltro="Todos"
                opciones={OPCIONES_ESTADO}
                valor={borrador.estado}
                onChange={(estado) => setBorrador({ ...borrador, estado })}
              />
            </SeccionTitulada>

            <SeccionTitulada titulo="Fecha de la solicitud" className="mb-5">
              <View className="gap-3">
                <DateField
                  label="Desde"
                  placeholder="Sin límite"
                  valor={borrador.fechaDesde ?? null}
                  onChange={(fecha) => setBorrador({ ...borrador, fechaDesde: fecha })}
                  fechaMaxima={borrador.fechaHasta ?? new Date()}
                  mostrarEdad={false}
                />
                <DateField
                  label="Hasta"
                  placeholder="Sin límite"
                  valor={borrador.fechaHasta ?? null}
                  onChange={(fecha) => setBorrador({ ...borrador, fechaHasta: fecha })}
                  fechaMinima={borrador.fechaDesde}
                  mostrarEdad={false}
                />
              </View>
            </SeccionTitulada>
          </ScrollView>

          {/* El inset va en el padding y no en el `edges` del SafeAreaView para que el
              fondo blanco siga llegando hasta el borde de la pantalla: si la barra del
              sistema está visible, el botón queda arriba de ella en vez de tapado. */}
          <View
            className="border-t border-gray-200 bg-white px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => onAplicar(borrador)}
              className="items-center rounded-2xl bg-pethood-orange py-3.5 active:bg-pethood-orange-dark"
            >
              <Text className="text-base font-semibold text-white">
                {activos === 0
                  ? 'Aplicar filtros'
                  : `Aplicar filtros (${activos} activo${activos === 1 ? '' : 's'})`}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
