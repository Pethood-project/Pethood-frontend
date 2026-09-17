import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import type { FechaNacimientoPickerProps } from '@/components/FechaNacimientoPicker.types';
import { fechaAIsoLocal, parsearIsoLocal } from '@/lib/fechaNacimiento';

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-3xl bg-white px-4 pb-8 pt-3">
          <View className="mb-4 flex-row items-center justify-between">
            <Pressable onPress={onCancel} accessibilityRole="button">
              <Text className="text-base text-gray-500">Cancelar</Text>
            </Pressable>
            <Pressable onPress={() => onSelect(fechaInterna)} accessibilityRole="button">
              <Text className="text-base font-semibold text-pethood-orange">Listo</Text>
            </Pressable>
          </View>
          <input
            type="date"
            value={fechaAIsoLocal(fechaInterna)}
            min={fechaAIsoLocal(minimumDate)}
            max={fechaAIsoLocal(maximumDate)}
            onChange={(event) => {
              const fecha = parsearIsoLocal(event.target.value);
              if (fecha) {
                setFechaInterna(fecha);
              }
            }}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-800"
          />
        </View>
      </View>
    </Modal>
  );
}
