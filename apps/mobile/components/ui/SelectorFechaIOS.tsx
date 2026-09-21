/**
 * Selector de fecha para iOS: el spinner nativo embebido en el flujo del formulario no
 * consigue el ancho mínimo (~280pt) que `UIDatePicker` necesita para dibujar las tres
 * ruedas, y termina descartando la de año. Acá se muestra en cambio dentro de un modal
 * centrado con ancho fijo, así entra completo sin importar cuán angosto sea el campo que
 * lo abrió.
 *
 * Solo tiene sentido en iOS: Android ya abre su propio diálogo nativo con calendario
 * completo (`display="calendar"`/`"default"`), que no tiene este problema.
 */
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ReactNode } from 'react';
import { Dimensions, Modal, View } from 'react-native';

const ANCHO_PANTALLA = Dimensions.get('window').width;

/** Ancho fijo y no relativo al contenedor que lo abre: si ese contenedor es angosto, un
 * porcentaje podía volver a quedar por debajo del mínimo que necesita el spinner. */
const ANCHO_SELECTOR = Math.min(340, ANCHO_PANTALLA - 64);

interface SelectorFechaIOSProps {
  visible: boolean;
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (fecha: Date) => void;
  onCerrar: () => void;
  /** Botones del pie: cada pantalla define su propia semántica (aplicar en vivo con un
   * solo "Listo", o "Cancelar" / "Listo" con la fecha a confirmar recién al tocarlo). */
  pie: ReactNode;
}

export function SelectorFechaIOS({
  visible,
  value,
  minimumDate,
  maximumDate,
  onChange,
  onCerrar,
  pie,
}: SelectorFechaIOSProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="rounded-3xl bg-white p-4 shadow-xl" style={{ width: ANCHO_SELECTOR }}>
          <DateTimePicker
            value={value}
            mode="date"
            display="spinner"
            locale="es-AR"
            themeVariant="light"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={(_evento, fecha) => {
              if (fecha) onChange(fecha);
            }}
            style={{ width: '100%' }}
          />

          <View className="mt-2 flex-row items-center justify-end gap-4">{pie}</View>
        </View>
      </View>
    </Modal>
  );
}
