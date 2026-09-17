/**
 * Filtros avanzados de Adoptar, desplegados desde el ícono de deslizadores.
 *
 * Es un modal y no una ruta del stack porque los filtros son estado de la pantalla de
 * Adoptar: sacarlos a otra ruta obligaría a devolverlos por params o por un store, y acá
 * alcanza con levantar el estado un nivel.
 *
 * Se edita sobre un borrador local y recién al tocar "Aplicar" se avisa hacia afuera: así
 * cambiar tres cosas no recarga el feed tres veces. Cerrar sin aplicar descarta el
 * borrador.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SeccionTitulada } from '@/components/ui/SeccionTitulada';
import { SelectorChips, type OpcionSelector } from '@/components/ui/SelectorChips';
import { ToggleField } from '@/components/ui/ToggleField';
import { PALETA } from '@/constants/theme';
import { listarEspecies, type OpcionCatalogo } from '@/services/catalogos';
import type { Genero, Tamanio } from '@/services/mascotas';
import {
  contarFiltrosActivos,
  SIN_FILTROS,
  type FiltrosAdopcion,
} from '@/services/publicaciones';

/**
 * Rangos de edad ofrecidos. `hasta` es exclusivo para que dos rangos contiguos no se
 * pisen; el último queda abierto.
 */
const RANGOS_DE_EDAD = [
  { etiqueta: '0–1 año', desde: 0, hasta: 1 },
  { etiqueta: '1–3 años', desde: 1, hasta: 3 },
  { etiqueta: '3–7 años', desde: 3, hasta: 7 },
  { etiqueta: '7+ años', desde: 7, hasta: undefined },
] as const;

const TAMANIOS: OpcionSelector<Tamanio>[] = [
  { valor: 'PEQUENO', etiqueta: 'Pequeño' },
  { valor: 'MEDIANO', etiqueta: 'Mediano' },
  { valor: 'GRANDE', etiqueta: 'Grande' },
];

const GENEROS: OpcionSelector<Genero>[] = [
  { valor: 'MACHO', etiqueta: 'Macho' },
  { valor: 'HEMBRA', etiqueta: 'Hembra' },
];

interface FiltrosAdopcionModalProps {
  visible: boolean;
  /** Filtros aplicados hoy; el borrador se reinicia con ellos cada vez que se abre. */
  filtros: FiltrosAdopcion;
  onAplicar: (filtros: FiltrosAdopcion) => void;
  onCerrar: () => void;
}

export function FiltrosAdopcionModal({
  visible,
  filtros,
  onAplicar,
  onCerrar,
}: FiltrosAdopcionModalProps) {
  const insets = useSafeAreaInsets();
  const [borrador, setBorrador] = useState<FiltrosAdopcion>(filtros);
  const [especies, setEspecies] = useState<OpcionCatalogo[]>([]);

  // Al abrir se descarta cualquier borrador anterior: lo que se ve tiene que ser lo que
  // está aplicado, no lo que el usuario tocó y no confirmó la vez pasada.
  useEffect(() => {
    if (visible) setBorrador(filtros);
  }, [visible, filtros]);

  // Las especies salen del catálogo y no de una lista fija: si mañana se agrega "Conejo",
  // el filtro lo toma solo. Un fallo se traga a propósito — sin especies el resto de los
  // filtros sigue siendo usable.
  useEffect(() => {
    void listarEspecies()
      .then(setEspecies)
      .catch(() => setEspecies([]));
  }, []);

  const activos = contarFiltrosActivos(borrador);

  const rangoActivo = RANGOS_DE_EDAD.find(
    (rango) => rango.desde === borrador.edadMin && rango.hasta === borrador.edadMax,
  );

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
              onPress={() => setBorrador(SIN_FILTROS)}
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
            {especies.length > 0 ? (
              <SeccionTitulada titulo="Especie" className="mb-5">
                <SelectorChips
                  prefijo="especie"
                  etiquetaSinFiltro="Todas"
                  opciones={especies.map((especie) => ({
                    valor: especie.id,
                    etiqueta: especie.nombre,
                  }))}
                  valor={borrador.especieId}
                  onChange={(especieId) => setBorrador({ ...borrador, especieId })}
                />
              </SeccionTitulada>
            ) : null}

            <SeccionTitulada titulo="Tamaño" className="mb-5">
              <SelectorChips
                prefijo="tamanio"
                etiquetaSinFiltro="Todos"
                opciones={TAMANIOS}
                valor={borrador.tamanio}
                onChange={(tamanio) => setBorrador({ ...borrador, tamanio })}
              />
            </SeccionTitulada>

            <SeccionTitulada titulo="Edad" className="mb-5">
              {/* El selector maneja valores planos, así que el rango viaja por su etiqueta
                  y se vuelve a resolver acá para escribir `edadMin`/`edadMax`. */}
              <SelectorChips
                prefijo="edad"
                etiquetaSinFiltro="Todas"
                opciones={RANGOS_DE_EDAD.map((rango) => ({
                  valor: rango.etiqueta,
                  etiqueta: rango.etiqueta,
                }))}
                valor={rangoActivo?.etiqueta}
                onChange={(etiqueta) => {
                  const rango = RANGOS_DE_EDAD.find((item) => item.etiqueta === etiqueta);
                  setBorrador({ ...borrador, edadMin: rango?.desde, edadMax: rango?.hasta });
                }}
              />
            </SeccionTitulada>

            <SeccionTitulada titulo="Sexo" className="mb-5">
              <SelectorChips
                prefijo="genero"
                etiquetaSinFiltro="Todos"
                opciones={GENEROS}
                valor={borrador.genero}
                onChange={(genero) => setBorrador({ ...borrador, genero })}
              />
            </SeccionTitulada>

            <SeccionTitulada titulo="Compatible con" className="mb-5">
              <View className="gap-3.5 rounded-2xl bg-white p-3.5">
                <ToggleField
                  label="Chicos"
                  valor={borrador.compatibleNinios ?? false}
                  onChange={(valor) => setBorrador({ ...borrador, compatibleNinios: valor })}
                />
                <ToggleField
                  label="Otras mascotas"
                  valor={borrador.compatibleOtrasMascotas ?? false}
                  onChange={(valor) =>
                    setBorrador({ ...borrador, compatibleOtrasMascotas: valor })
                  }
                />
                <ToggleField
                  label="Castrado / esterilizado"
                  valor={borrador.castrado ?? false}
                  onChange={(valor) => setBorrador({ ...borrador, castrado: valor })}
                />
              </View>

              <Text className="mt-2 text-xs leading-4 text-gray-500">
                La compatibilidad la declara quien publica al elegir los rasgos de la mascota.
              </Text>
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
