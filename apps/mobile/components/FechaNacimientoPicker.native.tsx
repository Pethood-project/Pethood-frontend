import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text } from 'react-native';

import type { FechaNacimientoPickerProps } from '@/components/FechaNacimientoPicker.types';
import { SelectorFechaIOS } from '@/components/ui/SelectorFechaIOS';

export function FechaNacimientoPicker({
  visible,
  value,
  minimumDate,
  maximumDate,
  onSelect,
  onCancel,
}: FechaNacimientoPickerProps) {
  const [fechaInterna, setFechaInterna] = useState(value);

  useEffect(() => {
    if (visible) {
      setFechaInterna(value);
    }
  }, [visible, value]);

  if (Platform.OS === 'android') {
    if (!visible) return null;

    const onCambioAndroid = (event: DateTimePickerEvent, date?: Date): void => {
      if (event.type === 'set' && date) {
        onSelect(date);
        return;
      }
      onCancel();
    };

    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="calendar"
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onChange={onCambioAndroid}
      />
    );
  }

  return (
    <SelectorFechaIOS
      visible={visible}
      value={fechaInterna}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      onChange={setFechaInterna}
      onCerrar={onCancel}
      pie={
        <>
          <Pressable onPress={onCancel} accessibilityRole="button">
            <Text className="text-base text-gray-500">Cancelar</Text>
          </Pressable>
          <Pressable onPress={() => onSelect(fechaInterna)} accessibilityRole="button">
            <Text className="text-base font-semibold text-pethood-orange">Listo</Text>
          </Pressable>
        </>
      }
    />
  );
}
