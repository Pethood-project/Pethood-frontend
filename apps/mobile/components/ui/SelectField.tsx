/** Selector cerrado: abre una hoja con las opciones y no admite texto libre. */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text } from 'react-native';
import { claseValor, FormField } from './FormField';
import { PALETA } from '@/constants/theme';

export interface OpcionSelect<T> {
  valor: T;
  etiqueta: string;
}

interface SelectFieldProps<T> {
  label: string;
  placeholder: string;
  opciones: OpcionSelect<T>[];
  valor: T | null;
  onChange: (valor: T) => void;
  obligatorio?: boolean;
  error?: string;
  /** Se avisa al cerrar el desplegable: es el equivalente a perder el foco de un input. */
  onBlur?: () => void;
  /** Un selector dependiente queda inhabilitado hasta que se elige el campo del que depende. */
  deshabilitado?: boolean;
  textoDeshabilitado?: string;
}

export function SelectField<T extends string | number>({
  label,
  placeholder,
  opciones,
  valor,
  onChange,
  obligatorio,
  error,
  onBlur,
  deshabilitado = false,
  textoDeshabilitado,
}: SelectFieldProps<T>) {
  const [abierto, setAbierto] = useState(false);

  const seleccionada = opciones.find((opcion) => opcion.valor === valor);
  const textoVacio = deshabilitado && textoDeshabilitado ? textoDeshabilitado : placeholder;

  const cerrar = (): void => {
    setAbierto(false);
    onBlur?.();
  };

  return (
    <FormField label={label} obligatorio={obligatorio} error={error}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${seleccionada?.etiqueta ?? 'sin elegir'}`}
        accessibilityState={{ disabled: deshabilitado, expanded: abierto }}
        disabled={deshabilitado}
        onPress={() => setAbierto(true)}
        className="flex-row items-center"
      >
        <Text
          className={`flex-1 ${claseValor(Boolean(error), !seleccionada)}`}
          numberOfLines={1}
        >
          {seleccionada?.etiqueta ?? textoVacio}
        </Text>
        <Ionicons name="chevron-down" size={18} color={deshabilitado ? PALETA.gris[300] : PALETA.gris[400]} />
      </Pressable>

      <Modal
        visible={abierto}
        transparent
        animationType="fade"
        onRequestClose={cerrar}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={cerrar}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <Pressable
            className="max-h-[60%] rounded-t-3xl bg-white pb-8 pt-5"
            onPress={() => undefined}
          >
            <Text className="mb-3 px-6 text-lg font-bold text-gray-900">{label}</Text>

            <FlatList
              data={opciones}
              keyExtractor={(opcion) => String(opcion.valor)}
              ListEmptyComponent={
                <Text className="px-6 py-4 text-base text-gray-500">
                  No hay opciones disponibles
                </Text>
              }
              renderItem={({ item }) => {
                const activa = item.valor === valor;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: activa }}
                    onPress={() => {
                      onChange(item.valor);
                      setAbierto(false);
                    }}
                    className="flex-row items-center justify-between px-6 py-4 active:bg-gray-50"
                  >
                    <Text
                      className={`text-base ${activa ? 'font-semibold text-pethood-orange' : 'text-gray-800'}`}
                    >
                      {item.etiqueta}
                    </Text>
                    {activa ? <Ionicons name="checkmark" size={20} color={PALETA.pethood.naranja} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </FormField>
  );
}
