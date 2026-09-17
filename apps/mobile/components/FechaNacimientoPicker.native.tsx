import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import type { FechaNacimientoPickerProps } from '@/components/FechaNacimientoPicker.types';

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

  const onCambioNativo = (event: DateTimePickerEvent, date?: Date): void => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        onSelect(date);
        return;
      }
      onCancel();
      return;
    }

    if (date) {
      setFechaInterna(date);
    }
  };

  if (Platform.OS === 'android') {
    if (!visible) return null;

    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="calendar"
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onChange={onCambioNativo}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-3xl bg-white px-4 pb-8 pt-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Pressable onPress={onCancel} accessibilityRole="button">
              <Text className="text-base text-gray-500">Cancelar</Text>
            </Pressable>
            <Pressable onPress={() => onSelect(fechaInterna)} accessibilityRole="button">
              <Text className="text-base font-semibold text-pethood-orange">Listo</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={fechaInterna}
            mode="date"
            display="spinner"
            locale="es-AR"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={onCambioNativo}
          />
        </View>
      </View>
    </Modal>
  );
}
