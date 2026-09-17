/** Etiquetas libres: se escribe una y se confirma con el botón o con Enter. */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { claseValor, FormField } from './FormField';
import { validarTexto } from '../../shared/validation/text';
import { PALETA } from '@/constants/theme';

interface TagInputFieldProps {
  label: string;
  placeholder: string;
  etiquetas: string[];
  onChange: (etiquetas: string[]) => void;
  maximoPorEtiqueta: number;
  error?: string;
}

export function TagInputField({
  label,
  placeholder,
  etiquetas,
  onChange,
  maximoPorEtiqueta,
  error,
}: TagInputFieldProps) {
  const [borrador, setBorrador] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const agregar = (): void => {
    const limpia = borrador.trim();
    if (!limpia) return;

    const problema = validarTexto(limpia, {
      max: maximoPorEtiqueta,
      etiqueta: 'Cada requisito',
    });

    if (problema) {
      setErrorLocal(problema);
      return;
    }

    if (etiquetas.includes(limpia)) {
      setErrorLocal('Ese requisito ya está en la lista');
      return;
    }

    onChange([...etiquetas, limpia]);
    setBorrador('');
    setErrorLocal(null);
  };

  const quitar = (etiqueta: string): void =>
    onChange(etiquetas.filter((actual) => actual !== etiqueta));

  return (
    <FormField label={label} error={error ?? errorLocal ?? undefined}>
      {/* Botón visible además del Enter: no todos los teclados de celular lo muestran. */}
      <View className="flex-row items-center gap-2">
        <TextInput
          className={`flex-1 ${claseValor(Boolean(error ?? errorLocal), !borrador)} p-0`}
          placeholder={placeholder}
          placeholderTextColor={PALETA.gris[400]}
          value={borrador}
          onChangeText={(texto) => {
            setBorrador(texto);
            setErrorLocal(null);
          }}
          onSubmitEditing={agregar}
          blurOnSubmit={false}
          returnKeyType="done"
          maxLength={maximoPorEtiqueta}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar a la lista"
          disabled={!borrador.trim()}
          onPress={agregar}
          className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ${
            borrador.trim() ? 'bg-pethood-orange active:opacity-80' : 'bg-gray-100'
          }`}
        >
          <Ionicons name="add" size={15} color={borrador.trim() ? PALETA.blanco : PALETA.gris[400]} />
          <Text
            className={`text-xs font-semibold ${borrador.trim() ? 'text-white' : 'text-gray-400'}`}
          >
            Agregar
          </Text>
        </Pressable>
      </View>

      {etiquetas.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {etiquetas.map((etiqueta) => (
            <View
              key={etiqueta}
              className="flex-row items-center gap-1.5 rounded-full bg-pethood-orange/10 py-1.5 pl-3 pr-2"
            >
              <Text className="text-sm text-pethood-orange">{etiqueta}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${etiqueta}`}
                onPress={() => quitar(etiqueta)}
                hitSlop={6}
              >
                <Ionicons name="close-circle" size={16} color={PALETA.pethood.naranja} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </FormField>
  );
}
