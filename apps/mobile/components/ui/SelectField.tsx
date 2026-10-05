/** Selector cerrado: abre una hoja con las opciones y no admite texto libre. */
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { claseValor, FormField } from './FormField';
import { usePaletaFormulario } from './FormCard';
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
  /** Letra más grande de etiqueta y valor, para el alta y la publicación de mascota. */
  grande?: boolean;
  /** Lapicito junto a la etiqueta, para marcar que el campo se puede editar (perfil). */
  lapiz?: boolean;
  /**
   * Fuerza la paleta Organic cuando el campo va suelto, sin una `FormCard organic` que lo
   * envuelva (el registro, que usa `CustomInput organic`).
   */
  organic?: boolean;
  /**
   * Agrega un buscador arriba de la lista. Necesario con listas largas como las localidades
   * (Buenos Aires tiene cientos), donde scrollear a mano no es viable.
   */
  buscable?: boolean;
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
  grande,
  lapiz,
  organic = false,
  buscable = false,
}: SelectFieldProps<T>) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const paletaContexto = usePaletaFormulario();
  const paleta = organic ? 'organic' : paletaContexto;

  const seleccionada = opciones.find((opcion) => opcion.valor === valor);
  const textoVacio = deshabilitado && textoDeshabilitado ? textoDeshabilitado : placeholder;

  const visibles = useMemo(() => {
    if (!buscable || !busqueda.trim()) return opciones;
    const termino = busqueda.trim().toLocaleLowerCase('es-AR');
    return opciones.filter((opcion) => opcion.etiqueta.toLocaleLowerCase('es-AR').includes(termino));
  }, [buscable, busqueda, opciones]);

  const cerrar = (): void => {
    setAbierto(false);
    setBusqueda('');
    onBlur?.();
  };

  return (
    <FormField label={label} obligatorio={obligatorio} error={error} grande={grande} lapiz={lapiz} paleta={paleta}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${seleccionada?.etiqueta ?? 'sin elegir'}`}
        accessibilityState={{ disabled: deshabilitado, expanded: abierto }}
        disabled={deshabilitado}
        onPress={() => setAbierto(true)}
        className="flex-row items-center"
      >
        <Text
          className={`flex-1 ${claseValor(Boolean(error), !seleccionada, grande, paleta)}`}
          numberOfLines={1}
        >
          {seleccionada?.etiqueta ?? textoVacio}
        </Text>
        <Ionicons
          name="chevron-down"
          size={grande ? 22 : 18}
          color={deshabilitado ? PALETA.gris[300] : PALETA.gris[400]}
        />
      </Pressable>

      <Modal
        visible={abierto}
        transparent
        animationType="fade"
        onRequestClose={cerrar}
      >
        {/* Fondo y hoja son hermanos, no uno dentro del otro: un Pressable anidado en otro
            en web (React 19) dispara su onPress al renderizar y tira el handler de cerrar. */}
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={cerrar}
            className="absolute inset-0"
          />

          <View className="max-h-[60%] rounded-t-3xl bg-white pb-8 pt-5">
            <Text className={`mb-3 px-6 font-bold text-gray-900 ${grande ? 'text-xl' : 'text-lg'}`}>
              {label}
            </Text>

            {buscable ? (
              <View className="mx-6 mb-3 flex-row items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3">
                <Ionicons name="search" size={18} color={PALETA.gris[400]} />
                <TextInput
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar…"
                  placeholderTextColor={PALETA.gris[400]}
                  autoCorrect={false}
                  className="flex-1 py-3 text-base text-gray-900"
                />
                {busqueda ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Limpiar búsqueda"
                    onPress={() => setBusqueda('')}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color={PALETA.gris[400]} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <FlatList
              data={visibles}
              keyExtractor={(opcion) => String(opcion.valor)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text className="px-6 py-4 text-base text-gray-500">
                  {buscable && busqueda ? 'Sin resultados' : 'No hay opciones disponibles'}
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
                      setBusqueda('');
                    }}
                    className={`flex-row items-center justify-between px-6 active:bg-gray-50 ${grande ? 'py-5' : 'py-4'}`}
                  >
                    <Text
                      className={`${grande ? 'text-xl' : 'text-base'} ${activa ? 'font-semibold text-pethood-orange' : 'text-gray-800'}`}
                    >
                      {item.etiqueta}
                    </Text>
                    {activa ? (
                      <Ionicons name="checkmark" size={grande ? 24 : 20} color={PALETA.pethood.naranja} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </FormField>
  );
}