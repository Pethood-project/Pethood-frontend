/**
 * Filtros de "Mis solicitudes" (GUI-27), desplegados desde el ícono de deslizadores del
 * encabezado. Mismo patrón que `FiltrosAdopcionModal`: se edita sobre un borrador local y
 * recién al tocar "Aplicar" se avisa hacia afuera.
 *
 * La estética sigue la pantalla 33 (Filtros avanzados, sección 08 de los diseños): encabezado
 * crema con "Filtros" en la tipografía de títulos y "Limpiar" a la derecha, secciones con
 * rótulo en mayúsculas, pastillas rellenas en acento cuando están elegidas y el botón de
 * aplicar en acento al pie. Todo un escalón más grande que el diseño, a pedido: el refugio
 * filtra muchas solicitudes y los chips chicos costaba leerlos y tocarlos.
 *
 * El estado es de selección múltiple: se pueden ver dos o tres estados a la vez.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateField } from '@/components/ui/DateField';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { type OpcionSelector } from '@/components/ui/SelectorChips';
import { SelectorChipsMultiples } from '@/components/ui/SelectorChipsMultiples';
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

/** Bloque con rótulo en mayúsculas, como las secciones de la pantalla 33. */
function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View className="mb-7">
      <Text className="mb-3 font-cuerpo-bold text-[14px] uppercase tracking-[1px] text-organic-neutral-800">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

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
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar} statusBarTranslucent>
      <View className="flex-1 bg-organic-bg">
        {/* Margen superior a mano y no con el `SafeAreaView` nativo: dentro de un `Modal`
            (otra ventana nativa) este no recibe los insets en iOS y el encabezado quedaba
            debajo de la hora y la batería. `statusBarTranslucent` hace que Android también
            dibuje debajo de la barra, así el mismo margen sirve en las dos plataformas. */}
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between border-b border-organic-neutral-300 bg-organic-neutral-100 px-5 py-[13px]">
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar filtros"
                onPress={onCerrar}
                hitSlop={8}
                className="h-11 w-11 items-center justify-center rounded-full border border-organic-neutral-300 bg-organic-neutral-100 active:opacity-80"
              >
                <Ionicons name="arrow-back" size={22} color={PALETA.neutral[700]} />
              </Pressable>

              <Text className="font-titulo text-[26px] leading-[31px] text-organic-accent-600">
                Filtros
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpiar filtros"
              onPress={() => setBorrador(SIN_FILTROS_SOLICITUDES)}
              disabled={activos === 0}
              hitSlop={12}
              className="py-2 active:opacity-70"
            >
              <Text
                className={`font-cuerpo-semi text-[17px] ${
                  activos === 0 ? 'text-organic-neutral-400' : 'text-organic-accent-700'
                }`}
              >
                Limpiar
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 22 }}>
            <Seccion titulo="Estado">
              <SelectorChipsMultiples
                prefijo="estado-solicitud"
                etiquetaSinFiltro="Todos"
                opciones={OPCIONES_ESTADO}
                valores={borrador.estados ?? []}
                onChange={(estados) => setBorrador({ ...borrador, estados })}
                variante="filtro"
                amplio
              />
              <Text className="mt-3 font-cuerpo text-[15px] leading-[21px] text-organic-neutral-600">
                Podés elegir más de un estado.
              </Text>
            </Seccion>

            <Seccion titulo="Fecha de la solicitud">
              <FormCard>
                <FormCardRow>
                  <DateField
                    label="Desde"
                    placeholder="Sin límite"
                    valor={borrador.fechaDesde ?? null}
                    onChange={(fecha) => setBorrador({ ...borrador, fechaDesde: fecha })}
                    fechaMaxima={borrador.fechaHasta ?? new Date()}
                    mostrarEdad={false}
                    grande
                  />
                </FormCardRow>
                <FormCardRow ultima>
                  <DateField
                    label="Hasta"
                    placeholder="Sin límite"
                    valor={borrador.fechaHasta ?? null}
                    onChange={(fecha) => setBorrador({ ...borrador, fechaHasta: fecha })}
                    fechaMinima={borrador.fechaDesde}
                    mostrarEdad={false}
                    grande
                  />
                </FormCardRow>
              </FormCard>
            </Seccion>
          </ScrollView>

          {/* Como en la pantalla 33, el botón va sobre el mismo fondo, sin barra propia. El
              inset va en el padding para que quede arriba de la barra del sistema. */}
          <View className="px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onAplicar(borrador)}
              className="items-center rounded-[20px] bg-organic-accent-600 py-[18px] shadow-md active:opacity-90"
            >
              <Text className="font-cuerpo-semi text-[18px] text-white">
                {activos === 0
                  ? 'Aplicar filtros'
                  : `Aplicar filtros (${activos} activo${activos === 1 ? '' : 's'})`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
