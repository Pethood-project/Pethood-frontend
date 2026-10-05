/**
 * Desplegable de selección MÚLTIPLE, hermano de `SelectField` (que elige una sola opción) y
 * con la misma hoja de abajo. Lo usan los filtros por provincia y localidad del portal de
 * mascotas perdidas, donde las pastillas no entraban: con muchas opciones, la pantalla de
 * filtros se hacía larguísima.
 *
 * La lista vacía es "sin filtrar" y la representa la opción `etiquetaTodas`, primera de la
 * hoja. Elegir todas las opciones una por una equivale a lo mismo, así que se colapsa a la
 * lista vacía, igual que `SelectorChipsMultiples`.
 *
 * Cerrado muestra un resumen: "Todas", el nombre de la única elegida, o "N seleccionadas".
 */
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { PALETA } from '@/constants/theme';

import { claseValor, FormField } from './FormField';
import { usePaletaFormulario } from './FormCard';

export interface OpcionSelectMultiple<T> {
  valor: T;
  etiqueta: string;
  /**
   * Título bajo el que se agrupa en la hoja (ej. la provincia de una localidad). Las opciones
   * de un mismo grupo tienen que venir juntas. Con un solo grupo no se muestra el título.
   */
  grupo?: string;
}

type Fila<T> =
  { tipo: 'grupo'; titulo: string } | { tipo: 'opcion'; opcion: OpcionSelectMultiple<T> };

interface SelectMultipleFieldProps<T> {
  label: string;
  opciones: OpcionSelectMultiple<T>[];
  /** Vacío = todas. */
  valores: T[];
  onChange: (valores: T[]) => void;
  /** Texto de "sin filtrar", en la hoja y en el campo cerrado ("Todas"). */
  etiquetaTodas: string;
  /** Resumen con más de una elegida ("2 seleccionadas"). */
  textoVarias: (cantidad: number) => string;
  /** Tope de opciones elegidas a la vez. Pasado, no se marcan más y la hoja lo avisa. */
  maximo?: number;
  /** Agrega un buscador arriba de la lista, como `SelectField`. */
  buscable?: boolean;
  grande?: boolean;
}

export function SelectMultipleField<T extends string | number>({
  label,
  opciones,
  valores,
  onChange,
  etiquetaTodas,
  textoVarias,
  maximo,
  buscable = false,
  grande,
}: SelectMultipleFieldProps<T>) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [enElTope, setEnElTope] = useState(false);
  const paleta = usePaletaFormulario();

  const resumen =
    valores.length === 0
      ? etiquetaTodas
      : valores.length === 1
        ? (opciones.find((opcion) => opcion.valor === valores[0])?.etiqueta ?? textoVarias(1))
        : textoVarias(valores.length);

  const filas = useMemo<Fila<T>[]>(() => {
    const termino = buscable ? busqueda.trim().toLocaleLowerCase('es-AR') : '';
    const visibles = termino
      ? opciones.filter((opcion) => opcion.etiqueta.toLocaleLowerCase('es-AR').includes(termino))
      : opciones;
    const conGrupos = new Set(opciones.map((opcion) => opcion.grupo)).size > 1;

    const resultado: Fila<T>[] = [];
    let grupoActual: string | undefined;
    for (const opcion of visibles) {
      if (conGrupos && opcion.grupo && opcion.grupo !== grupoActual) {
        resultado.push({ tipo: 'grupo', titulo: opcion.grupo });
      }
      grupoActual = opcion.grupo;
      resultado.push({ tipo: 'opcion', opcion });
    }
    return resultado;
  }, [buscable, busqueda, opciones]);

  const alternar = (valor: T): void => {
    if (valores.includes(valor)) {
      setEnElTope(false);
      onChange(valores.filter((elegido) => elegido !== valor));
      return;
    }

    const siguientes = [...valores, valor];
    if (siguientes.length === opciones.length) {
      setEnElTope(false);
      onChange([]);
      return;
    }
    if (maximo !== undefined && siguientes.length > maximo) {
      setEnElTope(true);
      return;
    }
    onChange(siguientes);
  };

  const cerrar = (): void => {
    setAbierto(false);
    setBusqueda('');
    setEnElTope(false);
  };

  const tamanioTexto = grande ? 'text-xl' : 'text-base';

  return (
    <FormField label={label} grande={grande} paleta={paleta}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${resumen}`}
        accessibilityState={{ expanded: abierto }}
        disabled={opciones.length === 0}
        onPress={() => setAbierto(true)}
        className="flex-row items-center"
      >
        <Text className={`flex-1 ${claseValor(false, false, grande, paleta)}`} numberOfLines={1}>
          {resumen}
        </Text>
        <Ionicons
          name="chevron-down"
          size={grande ? 22 : 18}
          color={opciones.length === 0 ? PALETA.gris[300] : PALETA.gris[400]}
        />
      </Pressable>

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={cerrar}>
        {/* Fondo y hoja son hermanos, como en `SelectField`: un Pressable anidado en otro en
            web (React 19) dispara su onPress al renderizar. */}
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={cerrar}
            className="absolute inset-0"
          />

          <View className="max-h-[70%] rounded-t-3xl bg-white pb-6 pt-5">
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
              data={filas}
              keyExtractor={(fila) =>
                fila.tipo === 'grupo' ? `grupo-${fila.titulo}` : `opcion-${fila.opcion.valor}`
              }
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                busqueda ? null : (
                  <FilaOpcion
                    etiqueta={etiquetaTodas}
                    activa={valores.length === 0}
                    tamanioTexto={tamanioTexto}
                    grande={grande}
                    onPress={() => {
                      setEnElTope(false);
                      onChange([]);
                    }}
                  />
                )
              }
              ListEmptyComponent={
                <Text className="px-6 py-4 text-base text-gray-500">
                  {busqueda ? 'Sin resultados' : 'No hay opciones disponibles'}
                </Text>
              }
              renderItem={({ item }) =>
                item.tipo === 'grupo' ? (
                  <Text className="px-6 pb-1 pt-4 text-[12px] font-bold uppercase tracking-wide text-gray-500">
                    {item.titulo}
                  </Text>
                ) : (
                  <FilaOpcion
                    etiqueta={item.opcion.etiqueta}
                    activa={valores.includes(item.opcion.valor)}
                    tamanioTexto={tamanioTexto}
                    grande={grande}
                    onPress={() => alternar(item.opcion.valor)}
                  />
                )
              }
            />

            {enElTope && maximo !== undefined ? (
              <Text className="px-6 pt-2 text-center text-sm text-gray-600">
                Podés elegir hasta {maximo} a la vez.
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={cerrar}
              className="mx-6 mt-3 items-center rounded-2xl bg-organic-accent-600 py-3.5 active:opacity-90"
            >
              <Text className="font-cuerpo-semi text-[16px] text-white">Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </FormField>
  );
}

/** Una fila de la hoja: la casilla es de selección múltiple, a diferencia del tilde de `SelectField`. */
function FilaOpcion({
  etiqueta,
  activa,
  tamanioTexto,
  grande,
  onPress,
}: {
  etiqueta: string;
  activa: boolean;
  tamanioTexto: string;
  grande?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: activa }}
      onPress={onPress}
      className={`flex-row items-center justify-between px-6 active:bg-gray-50 ${grande ? 'py-4' : 'py-3.5'}`}
    >
      <Text
        className={`flex-1 ${tamanioTexto} ${activa ? 'font-semibold text-pethood-orange' : 'text-gray-800'}`}
      >
        {etiqueta}
      </Text>
      <Ionicons
        name={activa ? 'checkbox' : 'square-outline'}
        size={grande ? 24 : 22}
        color={activa ? PALETA.pethood.naranja : PALETA.gris[400]}
      />
    </Pressable>
  );
}
