/**
 * Filtros del portal de mascotas perdidas (GUI-06, HU-13.1 criterio 7), desplegados desde la
 * pastilla "Filtros". El diseño no trae esta pantalla: sigue la pantalla 33 (Filtros
 * avanzados) con el mismo armado que `FiltrosSolicitudesModal` (decisión del 2026-09-29).
 *
 * Las secciones:
 * - Estado: Perdido, Encontrado y Resuelto (el portal muestra los tres). Varios a la vez.
 * - Especie. Varias a la vez.
 * - Lugar: provincias y localidades en dos desplegables de selección múltiple, que cerrados
 *   dicen "Todas", la única elegida o "N seleccionadas" (con pastillas, muchas opciones hacían
 *   la pantalla larguísima). Sólo se ofrecen los lugares que ya tienen avisos. Las localidades
 *   son las de las provincias elegidas (o todas, sin provincia elegida) y, si se eligen, el
 *   portal muestra sólo esas.
 * - Cercanía: un radio en km desde donde está el usuario, como el de Adoptar. Elegirlo pide la
 *   ubicación del teléfono si todavía no la tenemos.
 * - Fecha de publicación: "desde" obligatoria para filtrar por fecha, "hasta" opcional.
 *
 * Se edita sobre un borrador local y recién al tocar "Aplicar" se avisa hacia afuera: así
 * cambiar tres cosas no recarga el portal tres veces. Cerrar sin aplicar descarta el borrador.
 */
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { DateField } from '@/components/ui/DateField';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import {
  SelectMultipleField,
  type OpcionSelectMultiple,
} from '@/components/ui/SelectMultipleField';
import { SelectorChips, type OpcionSelector } from '@/components/ui/SelectorChips';
import { SelectorChipsMultiples } from '@/components/ui/SelectorChipsMultiples';
import { PALETA } from '@/constants/theme';
import { useMargenesDeModal } from '@/hooks/useMargenesDeModal';
import { coordenadasRecordadas, pedirUbicacion, type ResultadoUbicacion } from '@/lib/ubicacion';
import {
  contarFiltrosActivosPerdidos,
  listarUbicaciones,
  SIN_FILTROS_PERDIDOS,
  type FiltrosPerdidos,
  type LocalidadElegida,
  type ProvinciaConLocalidades,
} from '@/services/animalesPerdidos';
import { ApiError } from '@/services/api';
import { listarEspecies, listarEstadosAnimalPerdido } from '@/services/catalogos';
import { LIMITES } from '@/shared/validation/limits';

/** Mensaje de la API ante "hasta" sin "desde", para que el cliente diga lo mismo antes. */
const FALTA_DESDE = 'Para filtrar por fecha, elegí la fecha "desde"';

const MAXIMO_LOCALIDADES = LIMITES.animalPerdido.filtroLocalidades.maximo;

/** Los mismos radios que el filtro por cercanía de Adoptar, en km. */
const RADIOS: OpcionSelector<number>[] = [
  { valor: 5, etiqueta: '5 km' },
  { valor: 10, etiqueta: '10 km' },
  { valor: 25, etiqueta: '25 km' },
  { valor: 50, etiqueta: '50 km' },
];

type MotivoSinUbicacion = Extract<ResultadoUbicacion, { ok: false }>['motivo'];

const SIN_UBICACION: Record<MotivoSinUbicacion, string> = {
  DENEGADO:
    'Sin permiso de ubicación no podemos filtrar por cercanía. Podés habilitarlo en los ajustes del teléfono.',
  DESACTIVADO: 'Activá la ubicación del teléfono para filtrar por cercanía.',
  ERROR: 'No pudimos obtener tu ubicación. Probá de nuevo.',
};

/** Valor de cada localidad en el desplegable: el mismo nombre existe en varias provincias. */
const claveDe = ({ provincia, localidad }: LocalidadElegida): string => `${provincia}|${localidad}`;

const enPluralSeleccionadas = (cantidad: number): string => `${cantidad} seleccionadas`;

/**
 * Las opciones siempre incluyen lo que ya está elegido, aunque se haya quedado sin avisos
 * desde que se aplicó: si no, no habría forma de sacarlo.
 */
function opcionesDeProvincia(
  lugares: ProvinciaConLocalidades[],
  elegidas: string[],
): OpcionSelectMultiple<string>[] {
  const nombres = lugares.map((lugar) => lugar.provincia);
  const faltantes = elegidas.filter((elegida) => !nombres.includes(elegida));
  return [...nombres, ...faltantes].map((nombre) => ({ valor: nombre, etiqueta: nombre }));
}

/** Las localidades de las provincias elegidas (de todas, sin ninguna), agrupadas por provincia. */
function opcionesDeLocalidad(
  lugares: ProvinciaConLocalidades[],
  provincias: string[],
  elegidas: LocalidadElegida[],
): OpcionSelectMultiple<string>[] {
  const pares = lugares
    .filter((lugar) => provincias.length === 0 || provincias.includes(lugar.provincia))
    .flatMap((lugar) =>
      lugar.localidades.map((localidad) => ({ provincia: lugar.provincia, localidad })),
    );
  const claves = pares.map(claveDe);
  const faltantes = elegidas.filter((elegida) => !claves.includes(claveDe(elegida)));

  return [...pares, ...faltantes].map((par) => ({
    valor: claveDe(par),
    etiqueta: par.localidad,
    grupo: par.provincia,
  }));
}

/** Las pastillas van en plural, como las de la pantalla 33 ("Perros", "Gatos"). */
function enPlural(nombre: string): string {
  return /[aeiouáéíóú]$/i.test(nombre) ? `${nombre}s` : `${nombre}es`;
}

interface Opciones {
  estados: OpcionSelector<number>[];
  especies: OpcionSelector<number>[];
  lugares: ProvinciaConLocalidades[];
}

/** Bloque con rótulo en mayúsculas, como las secciones de la pantalla 33. */
function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View className="mb-7">
      <Text className="mb-3 font-cuerpo-bold text-[14px] uppercase tracking-[1px] text-organic-neutral-800">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function Ayuda({ texto, advertencia = false }: { texto: string; advertencia?: boolean }) {
  return (
    <Text
      className={`mt-3 font-cuerpo text-[15px] leading-[21px] ${
        advertencia ? 'text-organic-accent-700' : 'text-organic-neutral-600'
      }`}
    >
      {texto}
    </Text>
  );
}

interface FiltrosPerdidosModalProps {
  visible: boolean;
  /** Filtros aplicados hoy; el borrador se reinicia con ellos cada vez que se abre. */
  filtros: FiltrosPerdidos;
  onAplicar: (filtros: FiltrosPerdidos) => void;
  onCerrar: () => void;
}

export function FiltrosPerdidosModal({
  visible,
  filtros,
  onAplicar,
  onCerrar,
}: FiltrosPerdidosModalProps) {
  const margenes = useMargenesDeModal();
  const [borrador, setBorrador] = useState<FiltrosPerdidos>(filtros);
  const [opciones, setOpciones] = useState<Opciones | null>(null);
  const [errorOpciones, setErrorOpciones] = useState<string | null>(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  /**
   * Por qué no se pudo usar la ubicación. Va en la misma sección y no en un toast: los toasts
   * viven en la pantalla de atrás y el modal los taparía.
   */
  const [avisoUbicacion, setAvisoUbicacion] = useState<string | null>(null);

  /**
   * Las opciones se piden cada vez que se abre: un aviso nuevo puede haber sumado un lugar
   * que antes no estaba.
   */
  const cargarOpciones = useCallback(async (): Promise<void> => {
    setErrorOpciones(null);

    try {
      const [estados, especies, lugares] = await Promise.all([
        listarEstadosAnimalPerdido(),
        listarEspecies(),
        listarUbicaciones(),
      ]);

      setOpciones({
        estados: estados.map((estado) => ({ valor: estado.id, etiqueta: enPlural(estado.nombre) })),
        especies: especies.map((especie) => ({
          valor: especie.id,
          etiqueta: enPlural(especie.nombre),
        })),
        lugares,
      });
    } catch (err) {
      setErrorOpciones(
        err instanceof ApiError
          ? err.message
          : 'No pudimos cargar los filtros. Revisá tu conexión e intentalo de nuevo.',
      );
    }
  }, []);

  // Al abrir se descarta cualquier borrador anterior: lo que se ve tiene que ser lo que
  // está aplicado, no lo que el usuario tocó y no confirmó la vez pasada.
  useEffect(() => {
    if (!visible) return;
    setBorrador(filtros);
    setAvisoUbicacion(null);
    void cargarOpciones();
  }, [visible, filtros, cargarOpciones]);

  const activos = contarFiltrosActivosPerdidos(borrador);

  const lugares = opciones?.lugares ?? [];
  const opcionesProvincia = opcionesDeProvincia(lugares, borrador.provincias);
  const opcionesLocalidad = opcionesDeLocalidad(lugares, borrador.provincias, borrador.localidades);

  /** Las localidades de una provincia que se saca dejan de estar elegidas. */
  const elegirProvincias = (provincias: string[]): void => {
    setBorrador((actual) => ({
      ...actual,
      provincias,
      localidades:
        provincias.length === 0
          ? actual.localidades
          : actual.localidades.filter((elegida) => provincias.includes(elegida.provincia)),
    }));
  };

  const elegirLocalidades = (claves: string[]): void => {
    const porClave = new Map(
      opcionesLocalidad.map((opcion) => [
        opcion.valor,
        { provincia: opcion.grupo ?? '', localidad: opcion.etiqueta },
      ]),
    );
    setBorrador((actual) => ({
      ...actual,
      localidades: claves
        .map((clave) => porClave.get(clave))
        .filter((elegida): elegida is LocalidadElegida => elegida !== undefined),
    }));
  };

  /**
   * "Ninguno" no limita la búsqueda. Un radio necesita la ubicación del teléfono: si todavía
   * no la tenemos se pide en el momento y, si no se consigue, queda "Ninguno".
   */
  const elegirRadio = async (radioKm: number | undefined): Promise<void> => {
    setAvisoUbicacion(null);

    if (radioKm === undefined || coordenadasRecordadas()) {
      setBorrador((actual) => ({ ...actual, radioKm }));
      return;
    }

    setBuscandoUbicacion(true);
    // `forzar`: tocar un radio es pedirla a propósito, aunque antes se haya negado.
    const resultado = await pedirUbicacion({ forzar: true });
    setBuscandoUbicacion(false);

    if (!resultado.ok) {
      setAvisoUbicacion(SIN_UBICACION[resultado.motivo]);
      return;
    }
    setBorrador((actual) => ({ ...actual, radioKm }));
  };

  /** Para quien se movió desde que la app tomó su ubicación. */
  const actualizarUbicacion = async (): Promise<void> => {
    setAvisoUbicacion(null);
    setBuscandoUbicacion(true);
    const resultado = await pedirUbicacion({ forzar: true });
    setBuscandoUbicacion(false);

    setAvisoUbicacion(
      resultado.ok
        ? 'Listo: el radio se mide desde donde estás ahora.'
        : SIN_UBICACION[resultado.motivo],
    );
  };
  // La HU pide "desde" obligatoria para filtrar por fecha: un "hasta" suelto no se aplica.
  const errorFecha =
    borrador.fechaHasta !== undefined && borrador.fechaDesde === undefined
      ? FALTA_DESDE
      : undefined;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar} statusBarTranslucent>
      <View className="flex-1 bg-organic-bg">
        {/* Margen superior a mano: dentro de un `Modal` el `SafeAreaView` nativo no recibe los
            insets (ver `useMargenesDeModal`). */}
        <View className="flex-1" style={{ paddingTop: margenes.arriba }}>
          <View className="flex-row items-center justify-between border-b border-organic-neutral-300 bg-organic-neutral-100 px-5 py-[13px]">
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar filtros"
                onPress={onCerrar}
                hitSlop={8}
                className="h-11 w-11 items-center justify-center rounded-full border border-organic-neutral-300 bg-organic-neutral-100 active:opacity-80"
              >
                <Ionicons name="arrow-back" size={22} color={PALETA.neutral[700]} />
              </Pressable>

              <Text className="font-titulo text-[26px] leading-[31px] text-organic-accent-600">
                Filtros
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpiar filtros"
              onPress={() => setBorrador(SIN_FILTROS_PERDIDOS)}
              disabled={activos === 0 && borrador.fechaHasta === undefined}
              hitSlop={12}
              className="py-2 active:opacity-70"
            >
              <Text
                className={`font-cuerpo-semi text-[17px] ${
                  activos === 0 && borrador.fechaHasta === undefined
                    ? 'text-organic-neutral-400'
                    : 'text-organic-accent-700'
                }`}
              >
                Limpiar
              </Text>
            </Pressable>
          </View>

          {opciones === null ? (
            <View className="flex-1 items-center justify-center px-8">
              {errorOpciones ? (
                <>
                  <Text className="text-center font-cuerpo text-[15px] text-organic-neutral-600">
                    {errorOpciones}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void cargarOpciones()}
                    hitSlop={8}
                    className="mt-3 active:opacity-60"
                  >
                    <Text className="font-cuerpo-bold text-[16px] text-organic-accent-600">
                      Reintentar
                    </Text>
                  </Pressable>
                </>
              ) : (
                <ActivityIndicator color={PALETA.accent[600]} />
              )}
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 22 }}>
              <Seccion titulo="Estado">
                <SelectorChipsMultiples
                  prefijo="estado-perdido"
                  etiquetaSinFiltro="Todos"
                  opciones={opciones.estados}
                  valores={borrador.estados}
                  onChange={(estados) => setBorrador({ ...borrador, estados })}
                  variante="filtro"
                  amplio
                />
                <Ayuda texto="Podés elegir más de un estado." />
              </Seccion>

              <Seccion titulo="Especie">
                <SelectorChipsMultiples
                  prefijo="especie-perdido"
                  etiquetaSinFiltro="Todas"
                  opciones={opciones.especies}
                  valores={borrador.especies}
                  onChange={(especies) => setBorrador({ ...borrador, especies })}
                  variante="filtro"
                  amplio
                />
              </Seccion>

              <Seccion titulo="Lugar">
                {opcionesProvincia.length > 0 ? (
                  <>
                    <FormCard>
                      <FormCardRow>
                        <SelectMultipleField
                          label="Provincia"
                          opciones={opcionesProvincia}
                          valores={borrador.provincias}
                          onChange={elegirProvincias}
                          etiquetaTodas="Todas"
                          textoVarias={enPluralSeleccionadas}
                          grande
                        />
                      </FormCardRow>
                      <FormCardRow ultima>
                        <SelectMultipleField
                          label="Localidad"
                          opciones={opcionesLocalidad}
                          valores={borrador.localidades.map(claveDe)}
                          onChange={elegirLocalidades}
                          etiquetaTodas="Todas"
                          textoVarias={enPluralSeleccionadas}
                          maximo={MAXIMO_LOCALIDADES}
                          buscable
                          grande
                        />
                      </FormCardRow>
                    </FormCard>
                    <Ayuda texto="Si elegís localidades, se muestran sólo los avisos de esas." />
                  </>
                ) : (
                  <Ayuda texto="Todavía no hay avisos con un lugar cargado." />
                )}
              </Seccion>

              <Seccion titulo="Cercanía">
                <SelectorChips
                  prefijo="radio-perdido"
                  etiquetaSinFiltro="Ninguno"
                  opciones={RADIOS}
                  valor={borrador.radioKm}
                  onChange={(radioKm) => void elegirRadio(radioKm)}
                  variante="filtro"
                  amplio
                />
                {buscandoUbicacion ? (
                  <View className="mt-3 flex-row items-center gap-2">
                    <ActivityIndicator size="small" color={PALETA.accent[600]} />
                    <Text className="font-cuerpo text-[15px] text-organic-neutral-600">
                      Buscando tu ubicación…
                    </Text>
                  </View>
                ) : avisoUbicacion ? (
                  <Ayuda texto={avisoUbicacion} advertencia />
                ) : (
                  <Ayuda texto="Desde donde estás hasta el lugar del aviso." />
                )}
                {borrador.radioKm !== undefined && !buscandoUbicacion ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void actualizarUbicacion()}
                    hitSlop={8}
                    className="mt-2 self-start active:opacity-60"
                  >
                    <Text className="font-cuerpo-semi text-[15px] text-organic-accent-700">
                      Actualizar mi ubicación
                    </Text>
                  </Pressable>
                ) : null}
              </Seccion>

              <Seccion titulo="Fecha de publicación">
                <FormCard>
                  <FormCardRow>
                    <DateField
                      label="Desde"
                      placeholder="Elegí la fecha"
                      valor={borrador.fechaDesde ?? null}
                      onChange={(fecha) => setBorrador({ ...borrador, fechaDesde: fecha })}
                      fechaMaxima={borrador.fechaHasta ?? new Date()}
                      mostrarEdad={false}
                      error={errorFecha}
                      grande
                    />
                  </FormCardRow>
                  <FormCardRow ultima>
                    <DateField
                      label="Hasta (opcional)"
                      placeholder="Hasta hoy"
                      valor={borrador.fechaHasta ?? null}
                      onChange={(fecha) => setBorrador({ ...borrador, fechaHasta: fecha })}
                      fechaMinima={borrador.fechaDesde}
                      fechaMaxima={new Date()}
                      mostrarEdad={false}
                      grande
                    />
                  </FormCardRow>
                </FormCard>
              </Seccion>
            </ScrollView>
          )}

          {/* Como en la pantalla 33, el botón va sobre el mismo fondo, sin barra propia. */}
          <View className="px-5 pt-3" style={{ paddingBottom: Math.max(margenes.abajo, 16) }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: errorFecha !== undefined }}
              onPress={() => onAplicar(borrador)}
              disabled={errorFecha !== undefined}
              className={`items-center rounded-[20px] bg-organic-accent-600 py-[18px] shadow-md active:opacity-90 ${
                errorFecha ? 'opacity-40' : ''
              }`}
            >
              <Text className="font-cuerpo-semi text-[18px] text-white">
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
