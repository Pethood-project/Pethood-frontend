/**
 * Filtros avanzados de Adoptar, desplegados desde el ícono de deslizadores.
 *
 * Es un modal y no una ruta del stack porque los filtros son estado de la pantalla de
 * Adoptar: sacarlos a otra ruta obligaría a devolverlos por params o por un store, y acá
 * alcanza con levantar el estado un nivel.
 *
 * Se edita sobre un borrador local y recién al tocar "Aplicar" se avisa hacia afuera: así
 * cambiar tres cosas no recarga el feed tres veces. Cerrar sin aplicar descarta el borrador.
 *
 * Módulo 11: además de los filtros por características agrega orden y fecha de publicación
 * (HU-11.2) y ubicación por cercanía (HU-11.3). La ubicación se calcula con las coordenadas
 * del usuario (GPS) contra la ubicación del refugio; el radio por defecto es "Ninguno", que
 * no limita la búsqueda.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/feedback/Toast';
import { DateField } from '@/components/ui/DateField';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { SelectorChips, type OpcionSelector } from '@/components/ui/SelectorChips';
import { ToggleField } from '@/components/ui/ToggleField';
import { PALETA } from '@/constants/theme';
import { pedirUbicacion } from '@/lib/ubicacion';
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

/** Orden por fecha de alta (HU-11.2). "Más recientes" es el default del backend. */
const ORDEN: OpcionSelector<'recientes' | 'antiguas'>[] = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'antiguas', etiqueta: 'Más antiguas' },
];

/** Radios ofrecidos para el filtro por cercanía, en kilómetros (HU-11.3). */
const RADIOS: OpcionSelector<number>[] = [
  { valor: 5, etiqueta: '5 km' },
  { valor: 10, etiqueta: '10 km' },
  { valor: 25, etiqueta: '25 km' },
  { valor: 50, etiqueta: '50 km' },
];

/** Bloque con rótulo en mayúsculas, como las secciones del resto de los filtros. */
function Seccion({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <View className={`mb-5 ${className}`}>
      <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

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
  const toast = useToast();
  const [borrador, setBorrador] = useState<FiltrosAdopcion>(filtros);
  const [especies, setEspecies] = useState<OpcionCatalogo[]>([]);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);

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

  // El texto libre no es un filtro del modal (vive en la barra de búsqueda de la pantalla),
  // así que no cuenta para "Limpiar" ni para el contador del botón.
  const activos = contarFiltrosActivos({ ...borrador, texto: undefined });

  const rangoActivo = RANGOS_DE_EDAD.find(
    (rango) => rango.desde === borrador.edadMin && rango.hasta === borrador.edadMax,
  );

  const usaGps = borrador.latitud !== undefined && borrador.longitud !== undefined;

  /**
   * Pide la ubicación actual y la guarda en el borrador. Si falla, avisa: sin coordenadas no
   * hay filtro por cercanía (ya no hay localidad de texto como alternativa).
   */
  const usarUbicacionActual = async (): Promise<void> => {
    setBuscandoUbicacion(true);
    // `forzar`: el botón explícitamente pide la posición de nuevo ("Actualizar mi ubicación").
    const resultado = await pedirUbicacion({ forzar: true });
    setBuscandoUbicacion(false);

    if (resultado.ok) {
      setBorrador((actual) => ({
        ...actual,
        latitud: resultado.coordenadas.latitud,
        longitud: resultado.coordenadas.longitud,
      }));
      toast.mostrarExito('Ya tenemos tu ubicación: elegí un radio para filtrar.');
      return;
    }

    toast.mostrarAdvertencia(
      resultado.motivo === 'DENEGADO'
        ? 'Sin permiso de ubicación no podemos filtrar por cercanía. Podés seguir explorando el feed completo.'
        : 'No pudimos obtener tu ubicación. Probá de nuevo.',
    );
  };

  /**
   * Elige el radio. "Ninguno" (`undefined`) no limita la búsqueda. Elegir un radio necesita
   * las coordenadas: si todavía no están, se piden en el momento y, si se deniegan, queda
   * "Ninguno".
   */
  const elegirRadio = async (radioKm: number | undefined): Promise<void> => {
    if (radioKm === undefined) {
      setBorrador((actual) => ({ ...actual, radioKm: undefined }));
      return;
    }

    if (usaGps) {
      setBorrador((actual) => ({ ...actual, radioKm }));
      return;
    }

    setBuscandoUbicacion(true);
    const resultado = await pedirUbicacion();
    setBuscandoUbicacion(false);

    if (!resultado.ok) {
      toast.mostrarAdvertencia(
        'Sin tu ubicación no podemos limitar por distancia. El filtro queda en "Ninguno".',
      );
      return;
    }

    setBorrador((actual) => ({
      ...actual,
      radioKm,
      latitud: resultado.coordenadas.latitud,
      longitud: resultado.coordenadas.longitud,
    }));
  };

  /** Deja de usar la ubicación: sin coordenadas no hay radio que aplicar. */
  const quitarUbicacion = (): void => {
    setBorrador((actual) => ({
      ...actual,
      latitud: undefined,
      longitud: undefined,
      radioKm: undefined,
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar} statusBarTranslucent>
      <View className="flex-1 bg-pethood-beige">
        {/* Margen superior a mano y no con el `SafeAreaView` nativo: dentro de un `Modal`
            (otra ventana nativa) este no recibe los insets en iOS y el encabezado quedaba
            debajo de la hora y la batería. `statusBarTranslucent` hace que Android también
            dibuje debajo de la barra, así el mismo margen sirve en las dos plataformas. */}
        <View className="flex-1" style={{ paddingTop: insets.top }}>
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
              onPress={() =>
                setBorrador({
                  ...SIN_FILTROS,
                  // El texto de la barra de búsqueda no es un filtro del modal: se conserva.
                  texto: borrador.texto,
                })
              }
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

          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <Seccion titulo="Ordenar por">
              <SelectorChips
                prefijo="orden"
                opciones={ORDEN}
                valor={borrador.orden ?? 'recientes'}
                onChange={(orden) => setBorrador({ ...borrador, orden })}
              />
            </Seccion>

            <Seccion titulo="Fecha de publicación">
              <FormCard>
                <FormCardRow>
                  <DateField
                    label="Desde"
                    placeholder="Sin límite"
                    valor={borrador.fechaDesde ?? null}
                    onChange={(fechaDesde) => setBorrador({ ...borrador, fechaDesde })}
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
                    onChange={(fechaHasta) => setBorrador({ ...borrador, fechaHasta })}
                    fechaMinima={borrador.fechaDesde}
                    mostrarEdad={false}
                    grande
                  />
                </FormCardRow>
              </FormCard>
            </Seccion>

            <Seccion titulo="Ubicación">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Usar mi ubicación actual"
                onPress={() => void usarUbicacionActual()}
                disabled={buscandoUbicacion}
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-organic-accent-600 bg-organic-surface py-3.5 active:opacity-80"
              >
                <Ionicons
                  name={usaGps ? 'navigate' : 'navigate-outline'}
                  size={18}
                  color={PALETA.accent[600]}
                />
                <Text className="font-cuerpo-semi text-[15px] text-organic-accent-600">
                  {buscandoUbicacion
                    ? 'Buscando…'
                    : usaGps
                      ? 'Actualizar mi ubicación'
                      : 'Usar mi ubicación actual'}
                </Text>
              </Pressable>

              <View className="mt-3">
                <Text className="mb-2 font-cuerpo text-[14px] text-organic-neutral-700">
                  Mostrar publicaciones en un radio de:
                </Text>
                {/* "Ninguno" es el default: no limita la búsqueda. Elegir un radio pide la
                    ubicación del usuario en el momento si todavía no la tenemos. */}
                <SelectorChips
                  prefijo="radio"
                  etiquetaSinFiltro="Ninguno"
                  opciones={RADIOS}
                  valor={borrador.radioKm}
                  onChange={(radioKm) => void elegirRadio(radioKm)}
                />
              </View>

              {usaGps ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={quitarUbicacion}
                  hitSlop={8}
                  className="mt-3 self-start active:opacity-60"
                >
                  <Text className="font-cuerpo-semi text-[13px] text-organic-accent-700">
                    Quitar ubicación actual
                  </Text>
                </Pressable>
              ) : null}
            </Seccion>

            {especies.length > 0 ? (
              <Seccion titulo="Especie">
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
              </Seccion>
            ) : null}

            <Seccion titulo="Tamaño">
              <SelectorChips
                prefijo="tamanio"
                etiquetaSinFiltro="Todos"
                opciones={TAMANIOS}
                valor={borrador.tamanio}
                onChange={(tamanio) => setBorrador({ ...borrador, tamanio })}
              />
            </Seccion>

            <Seccion titulo="Edad">
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
            </Seccion>

            <Seccion titulo="Sexo">
              <SelectorChips
                prefijo="genero"
                etiquetaSinFiltro="Todos"
                opciones={GENEROS}
                valor={borrador.genero}
                onChange={(genero) => setBorrador({ ...borrador, genero })}
              />
            </Seccion>

            <Seccion titulo="Compatible con" className="mb-5">
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
            </Seccion>
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
        </View>
      </View>
    </Modal>
  );
}
