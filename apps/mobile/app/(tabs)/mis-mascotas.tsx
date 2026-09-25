/**
 * GUI-04 Mascotas Adoptante — listado de las mascotas del perfil activo (las personales, o
 * las del refugio desde la vista de refugio; ver `services/sesion.ts`), acceso a la creación y
 * punto de entrada a editar (HU-6.2). Eliminar (HU-6.3) no vive acá: se hace desde adentro
 * de la ficha de cada mascota (`mascotas/[id]/index.tsx`) para que la baja no quede a un
 * toque de distancia mientras se navega la lista.
 *
 * Solo en la vista de refugio, que suele tener muchas, hay un filtro por estado de la
 * mascota con selección múltiple ("Todos", o uno o varios estados). Filtra el backend
 * (`?estados=`).
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { FiltroEstados, type OpcionEstado } from '@/components/ui/FiltroEstados';
import { estiloDeEstado } from '@/constants/EstadosMascota';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { urlAbsoluta } from '@/services/api';
import { listarEstadosMascota } from '@/services/catalogos';
import { listarMisMascotas, type Mascota } from '@/services/mascotas';
import { edadEnTexto, parsearFecha } from '@/shared/validation/dates';

/** Referencia estable para "sin filtro": un `[]` nuevo en cada render recrearía `cargar`. */
const SIN_FILTRO: number[] = [];

const ETIQUETA_TAMANIO = {
  PEQUENO: 'Pequeño',
  MEDIANO: 'Mediano',
  GRANDE: 'Grande',
} as const;

function edad(fechaNacimiento: string | null): string | null {
  const fecha = parsearFecha(fechaNacimiento);
  return fecha ? edadEnTexto(fecha) : null;
}

interface TarjetaMascotaProps {
  mascota: Mascota;
  /** Solo el creador del registro ve editar (misma regla que en publicaciones). */
  esPropia: boolean;
  onVer: () => void;
  onEditar: () => void;
  onVerHistoriaClinica: () => void;
}

function TarjetaMascota({
  mascota,
  esPropia,
  onVer,
  onEditar,
  onVerHistoriaClinica,
}: TarjetaMascotaProps) {
  const foto = urlAbsoluta(mascota.imagenUrl);
  const nombre = mascota.nombre ?? 'esta mascota';

  return (
    <View className="mb-3.5 flex-row gap-3.5 rounded-[26px] bg-organic-surface p-3.5 shadow-sm">
      {/* Foto y datos son Pressables hermanos de los botones de acción, no un Pressable
          contenedor: uno anidado dentro de otro dispara onPress apenas se monta en web
          (React 19), como ya documenta favoritos.tsx. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver a ${nombre}`}
        onPress={onVer}
        className="active:opacity-90"
      >
        {foto ? (
          <Image source={{ uri: foto }} className="h-32 w-32 rounded-[20px]" />
        ) : (
          <View className="h-32 w-32 items-center justify-center rounded-[20px] bg-organic-calido-amarilloClaro">
            <Ionicons name="paw-outline" size={36} color={PALETA.accent[600]} />
          </View>
        )}
      </Pressable>

      <View className="flex-1 justify-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver a ${nombre}`}
          onPress={onVer}
          className="active:opacity-90"
        >
          <Text className="font-titulo text-[19px] leading-[22px] text-organic-neutral-900">
            {mascota.nombre}
          </Text>
          <Text className="mt-1 font-cuerpo text-[15px] text-organic-neutral-600">
            {[
              mascota.especie.nombre,
              edad(mascota.fechaNacimiento),
              mascota.tamanio ? ETIQUETA_TAMANIO[mascota.tamanio] : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </Pressable>

        <View className="mt-3 flex-row items-center justify-between">
          <EstadoMascotaBadge estado={mascota.estado.nombre} />

          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Historia clínica de ${mascota.nombre}`}
              onPress={onVerHistoriaClinica}
              hitSlop={6}
              className="h-10 w-10 items-center justify-center rounded-full bg-organic-calido-amarilloClaro active:opacity-70"
            >
              <MaterialCommunityIcons
                name="clipboard-pulse-outline"
                size={19}
                color={PALETA.accent[600]}
              />
            </Pressable>

            {esPropia ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Editar ${mascota.nombre}`}
                onPress={onEditar}
                hitSlop={6}
                className="h-10 w-10 items-center justify-center rounded-full bg-organic-neutral-200 active:opacity-70"
              >
                <Ionicons name="pencil" size={18} color={PALETA.neutral[700]} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function ListaVacia() {
  return (
    <View className="items-center px-8 py-16">
      <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-organic-surface">
        <Ionicons name="paw-outline" size={52} color={PALETA.accent[600]} />
      </View>

      <Text className="text-center font-titulo text-[20px] leading-[24px] text-organic-neutral-900">
        Todavía no tenés ninguna mascota
      </Text>
      <Text className="mt-2 text-center font-cuerpo text-[15px] leading-6 text-organic-neutral-600">
        Registrá la primera para tenerla en tu perfil o para publicarla en adopción.
      </Text>

      <View className="mt-5 flex-row items-center gap-2.5 rounded-full bg-organic-surface px-4 py-3">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-organic-accent-600">
          <Ionicons name="add" size={20} color={PALETA.blanco} />
        </View>
        <Text className="font-cuerpo-semi text-[15px] text-organic-neutral-700">
          Tocá el botón para empezar
        </Text>
      </View>
    </View>
  );
}

function ListaVaciaFiltrada() {
  return (
    <View className="items-center px-8 py-16">
      <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-organic-surface">
        <Ionicons name="filter-outline" size={48} color={PALETA.accent[600]} />
      </View>

      <Text className="text-center font-titulo text-[20px] leading-[24px] text-organic-neutral-900">
        No hay mascotas con esos estados
      </Text>
      <Text className="mt-2 text-center font-cuerpo text-[15px] leading-6 text-organic-neutral-600">
        Probá con otros estados o tocá «Todos» para ver todas.
      </Text>
    </View>
  );
}

export default function MisMascotasScreen() {
  const { vistaRefugio, usuario } = useSesion();
  const router = useRouter();

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [opcionesEstado, setOpcionesEstado] = useState<OpcionEstado[]>([]);
  const [estadosElegidos, setEstadosElegidos] = useState<number[]>([]);
  /** El filtro es solo del refugio: desde el perfil personal siempre se ve todo. */
  const filtro = vistaRefugio ? estadosElegidos : SIN_FILTRO;

  /**
   * Número del último pedido. Tocar chips seguido dispara varios GET, y uno viejo que
   * responda tarde pisaría la lista con un filtro que ya no está elegido.
   */
  const ultimoPedido = useRef(0);

  const cargar = useCallback(async (): Promise<void> => {
    const pedido = ++ultimoPedido.current;

    try {
      setError(null);
      const lista = await listarMisMascotas(filtro);
      if (pedido === ultimoPedido.current) setMascotas(lista);
    } catch (err) {
      if (pedido !== ultimoPedido.current) return;
      setError(err instanceof Error ? err.message : 'No pudimos cargar tus mascotas.');
    } finally {
      if (pedido === ultimoPedido.current) {
        setCargando(false);
        setRefrescando(false);
      }
    }
  }, [filtro]);

  // Esta tab sigue montada al cambiar de vista: al volver al refugio arranca sin filtro, y el
  // catálogo se pide recién la primera vez que hace falta. Si falla, el filtro no se muestra
  // y la lista sigue funcionando con todas.
  useEffect(() => {
    setEstadosElegidos([]);
    if (!vistaRefugio) return;

    listarEstadosMascota()
      .then((estados) =>
        setOpcionesEstado(
          estados.map((estado) => ({
            id: estado.id,
            etiqueta: estiloDeEstado(estado.nombre).etiqueta,
          })),
        ),
      )
      .catch(() => undefined);
  }, [vistaRefugio]);

  // Se recarga al volver de crear, editar o eliminar una mascota, para reflejar los cambios, y
  // al cambiar el filtro (`cargar` cambia con él).
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="border-b border-organic-neutral-300 bg-organic-neutral-100 px-[21px] py-[13px]">
          <Text className="font-titulo text-[24px] leading-[29px] text-organic-accent-600">
            {vistaRefugio ? 'Mascotas del refugio' : 'Mis mascotas'}
          </Text>
          <Text className="mt-[4px] font-cuerpo text-[13px] text-organic-neutral-600">
            {cargando ? 'Cargando…' : `${mascotas.length} ${mascotas.length === 1 ? 'mascota' : 'mascotas'}`}
          </Text>
        </View>

        {vistaRefugio && opcionesEstado.length > 0 ? (
          <View className="bg-organic-bg pt-3">
            <FiltroEstados
              opciones={opcionesEstado}
              seleccionados={estadosElegidos}
              onChange={setEstadosElegidos}
            />
          </View>
        ) : null}

        {cargando ? (
          <EstadoCargando />
        ) : error ? (
          <EstadoError
            mensaje={error}
            onAccion={() => {
              setCargando(true);
              void cargar();
            }}
          />
        ) : (
          <FlatList
            data={mascotas}
            keyExtractor={(mascota) => String(mascota.id)}
            renderItem={({ item }) => (
              <TarjetaMascota
                mascota={item}
                esPropia={item.usuarioId === usuario?.id}
                onVer={() => router.push({ pathname: '/mascotas/[id]', params: { id: item.id } })}
                onEditar={() =>
                  router.push({ pathname: '/mascotas/[id]/editar', params: { id: item.id } })
                }
                onVerHistoriaClinica={() =>
                  router.push({
                    pathname: '/mascotas/[id]/historia-clinica',
                    params: { id: item.id },
                  })
                }
              />
            )}
            ListEmptyComponent={filtro.length > 0 ? ListaVaciaFiltrada : ListaVacia}
            contentContainerClassName="px-5 py-4 pb-28"
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => {
                  setRefrescando(true);
                  void cargar();
                }}
                tintColor={PALETA.accent[600]}
              />
            }
          />
        )}

        {/* Burbuja de creación: lleva al formulario de alta. */}
        <Link href="/mascotas/crear" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={vistaRefugio ? 'Crear mascota del refugio' : 'Crear mascota'}
            className="absolute bottom-6 right-6 h-[68px] w-[68px] items-center justify-center rounded-full bg-organic-accent-600 shadow-lg active:opacity-90"
          >
            <Ionicons name="add" size={34} color={PALETA.blanco} />
          </Pressable>
        </Link>
      </SafeAreaView>
    </View>
  );
}
