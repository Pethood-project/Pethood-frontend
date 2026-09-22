/**
 * GUI-12 Favoritos — HU-6.6: listado de las mascotas guardadas y baja de favoritos.
 *
 * Pantalla de consulta y de quitar. El alta la hace el swipe de HU-6.5, todavía sin
 * implementar; acá el `POST` se usa únicamente para el "Deshacer" del toast.
 *
 * Cada tarjeta lleva además el botón de solicitar adopción o tránsito (HU-7.1): es el
 * lugar natural para pedir, porque el feed de Adoptar ya descarta lo que está guardado acá.
 *
 * Es una ruta del stack raíz y no una tab a propósito: se entra desde la Home y desde el
 * Perfil, así que el botón de retroceso tiene que volver al origen real (`router.back()`)
 * y no a una ruta fija.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { BotonSolicitar } from '@/components/solicitudes/BotonSolicitar';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { ESTADO_SOLICITABLE } from '@/constants/Mascotas';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { urlAbsoluta } from '@/services/api';
import {
  agregarFavorito,
  listarFavoritos,
  quitarFavorito,
  type MascotaFavorita,
} from '@/services/favoritos';
import { edadEnTexto, parsearFecha } from '@/shared/validation/dates';

function edad(fechaNacimiento: string | null): string | null {
  const fecha = parsearFecha(fechaNacimiento);
  return fecha ? edadEnTexto(fecha) : null;
}

/** Subtítulo del header. GUI-12 lo muestra como "3 animales guardados". */
function subtituloContador(total: number): string {
  if (total === 0) return 'Ningún animal guardado';
  if (total === 1) return '1 animal guardado';
  return `${total} animales guardados`;
}

/**
 * Reproduce el orden del servidor (`fechaAgregado` descendente) al reponer una tarjeta
 * que se había quitado. No es reordenar la respuesta: es devolver el elemento a la
 * posición que el backend le daría, sin depender de un índice que pudo quedar viejo si el
 * usuario quitó varias seguidas.
 */
function reponerOrdenado(lista: MascotaFavorita[], mascota: MascotaFavorita): MascotaFavorita[] {
  return [...lista, mascota].sort(
    (a, b) => Date.parse(b.fechaAgregado) - Date.parse(a.fechaAgregado),
  );
}

/**
 * Hueco que completa una fila impar. `FlatList` con `numColumns={2}` le da todo el ancho
 * al único ítem de la última fila, así que se agrega un relleno invisible para que esa
 * tarjeta conserve su mitad.
 */
const RELLENO = '__relleno__' as const;
type ItemGrilla = MascotaFavorita | typeof RELLENO;

function conRellenoDeFila(favoritos: MascotaFavorita[]): ItemGrilla[] {
  return favoritos.length % 2 === 1 ? [...favoritos, RELLENO] : favoritos;
}

interface TarjetaFavoritoProps {
  mascota: MascotaFavorita;
  onQuitar: () => void;
  onSolicitada: () => void;
}

function TarjetaFavorito({ mascota, onQuitar, onSolicitada }: TarjetaFavoritoProps) {
  const foto = urlAbsoluta(mascota.imagenUrl);
  const edadTexto = edad(mascota.fechaNacimiento);

  const router = useRouter();

  const irADetalle = (): void => {
    if (mascota.publicacionId === null) return;
    router.push({ pathname: '/publicaciones/[id]', params: { id: mascota.publicacionId } });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(180)}
      layout={LinearTransition.duration(220)}
      className="flex-1"
    >
      {/* La tarjeta, el corazón y el CTA son hermanos: un Pressable dentro de otro en web
          (React 19) dispara onPress al renderizar y tira el árbol, incluso con la ficha
          de una publicación abierta encima. */}
      <View className="overflow-hidden rounded-2xl bg-organic-surface shadow-sm">
        <View className="w-full bg-organic-neutral-200" style={{ aspectRatio: 4 / 3 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver a ${mascota.nombre ?? 'esta mascota'}`}
            disabled={mascota.publicacionId === null}
            onPress={irADetalle}
            className="h-full w-full active:opacity-90"
          >
            {foto ? (
              <Image source={{ uri: foto }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Ionicons name="paw-outline" size={36} color={PALETA.neutral[400]} />
              </View>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar a ${mascota.nombre ?? 'esta mascota'} de favoritos`}
            onPress={onQuitar}
            hitSlop={10}
            className="absolute right-2 top-2 h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-70"
          >
            <Ionicons name="heart" size={20} color={PALETA.accent[600]} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver a ${mascota.nombre ?? 'esta mascota'}`}
          disabled={mascota.publicacionId === null}
          onPress={irADetalle}
          className="p-3 active:opacity-90"
        >
          <Text numberOfLines={1} className="font-cuerpo-bold text-lg text-organic-neutral-900">
            {mascota.nombre ?? 'Sin nombre'}
          </Text>
          {edadTexto ? (
            <Text className="mt-0.5 font-cuerpo text-sm text-organic-neutral-600">
              {edadTexto}
            </Text>
          ) : null}

          <View className="mt-2">
            <EstadoMascotaBadge estado={mascota.estado.nombre} tamanio="md" />
          </View>
        </Pressable>

        {/* Sin publicación no hay nada que solicitar. Con publicación pero en un estado no
            solicitable (En_Tratamiento, En_Transito, Adoptado…) tampoco, salvo que ya haya
            una solicitud en curso: esa se sigue mostrando aunque la mascota haya cambiado
            de estado mientras tanto (`BotonSolicitar` decide ese caso puntual). */}
        {mascota.publicacionId !== null &&
        (mascota.estado.nombre === ESTADO_SOLICITABLE || mascota.solicitudAbiertaId !== null) ? (
          <View className="px-3 pb-3">
            <BotonSolicitar
              variante="tarjeta"
              mascota={{
                publicacionId: mascota.publicacionId,
                nombre: mascota.nombre,
                imagenUrl: mascota.imagenUrl,
                estado: mascota.estado.nombre,
              }}
              solicitudAbiertaId={mascota.solicitudAbiertaId}
              onCreada={onSolicitada}
            />
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function ListaVacia() {
  return (
    <EstadoVacio
      icono="heart-outline"
      titulo="Todavía no guardaste ninguna mascota"
      descripcion="Explorá las mascotas en adopción y guardá las que te interesen para seguirlas desde acá."
    />
  );
}

export default function FavoritosScreen() {
  const router = useRouter();
  const toast = useToast();
  const { vistaRefugio } = useSesion();
  const ambito = vistaRefugio ? 'REFUGIO' : 'PERSONAL';

  const [favoritos, setFavoritos] = useState<MascotaFavorita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Operaciones de alta/baja todavía en vuelo. Mientras haya alguna no se refresca al
   * recuperar el foco: un GET que responda antes que el DELETE repondría la tarjeta que
   * el usuario acaba de quitar.
   */
  const pendientes = useRef(0);

  /**
   * Una cola por mascota, para que el "Deshacer" no le gane de mano al DELETE que lo
   * precede. Los dos endpoints son idempotentes, pero el ORDEN en que llegan define el
   * estado final: si el POST entrara primero, la mascota quedaría quitada igual.
   */
  const colas = useRef(new Map<number, Promise<unknown>>());

  const encolar = useCallback(<T,>(mascotaId: number, tarea: () => Promise<T>): Promise<T> => {
    const anterior = colas.current.get(mascotaId) ?? Promise.resolve();
    // El catch intermedio evita que un fallo previo corte la cadena de la mascota.
    const siguiente = anterior.catch(() => undefined).then(tarea);

    colas.current.set(
      mascotaId,
      siguiente.catch(() => undefined),
    );

    return siguiente;
  }, []);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setFavoritos((await listarFavoritos()).favoritos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar tus favoritos.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (pendientes.current === 0) void cargar();
    }, [cargar]),
  );

  /** Repone la tarjeta y vuelve a guardarla en el servidor (acción "Deshacer"). */
  const deshacer = useCallback(
    (mascota: MascotaFavorita): void => {
      setFavoritos((actuales) => reponerOrdenado(actuales, mascota));
      pendientes.current += 1;

      void encolar(mascota.id, () => agregarFavorito(mascota.id, ambito))
        .catch((err: unknown) => {
          // No se pudo reponer: se vuelve a sacar para no mentirle al usuario.
          setFavoritos((actuales) => actuales.filter((item) => item.id !== mascota.id));
          toast.mostrarError(
            err instanceof Error ? err.message : 'No pudimos volver a guardar la mascota.',
          );
        })
        .finally(() => {
          pendientes.current -= 1;
        });
    },
    [encolar, toast, ambito],
  );

  /**
   * Update optimista: la tarjeta sale de la grilla y el contador baja en el acto
   * (criterio 5), y recién después se confirma contra el servidor. Si el DELETE falla,
   * se revierte todo y se muestra el mensaje que devuelve el backend.
   */
  const quitar = useCallback(
    (mascota: MascotaFavorita): void => {
      const nombre = mascota.nombre ?? 'la mascota';

      setFavoritos((actuales) => actuales.filter((item) => item.id !== mascota.id));
      pendientes.current += 1;

      void encolar(mascota.id, () => quitarFavorito(mascota.id))
        .then(() => {
          toast.mostrarExito(`Quitamos a ${nombre} de favoritos.`, {
            etiqueta: 'Deshacer',
            onPress: () => deshacer(mascota),
          });
        })
        .catch((err: unknown) => {
          setFavoritos((actuales) => reponerOrdenado(actuales, mascota));
          toast.mostrarError(
            err instanceof Error ? err.message : 'No pudimos quitar la mascota de favoritos.',
          );
        })
        .finally(() => {
          pendientes.current -= 1;
        });
    },
    [deshacer, encolar, toast],
  );

  // Se entra desde la Home y desde el Perfil: `back()` vuelve al origen real. El fallback
  // cubre el caso sin historial (deep link directo a /favoritos).
  const volver = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  }, [router]);

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 px-[22px] pb-4 pt-2">
          <BotonCircular icono="arrow-back" etiqueta="Volver" onPress={volver} grande />

          <View>
            <Text className="font-titulo text-[28px] leading-[28px] text-organic-accent-600">
              Favoritos
            </Text>
            <Text className="mt-1.5 font-cuerpo text-base text-organic-neutral-700">
              {cargando ? 'Cargando…' : subtituloContador(favoritos.length)}
            </Text>
          </View>
        </View>

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
            data={conRellenoDeFila(favoritos)}
            keyExtractor={(item, indice) =>
              item === RELLENO ? `relleno-${indice}` : String(item.id)
            }
            numColumns={2}
            renderItem={({ item }) =>
              item === RELLENO ? (
                <View className="flex-1" />
              ) : (
                <TarjetaFavorito
                  mascota={item}
                  onQuitar={() => quitar(item)}
                  onSolicitada={() => void cargar()}
                />
              )
            }
            ListEmptyComponent={ListaVacia}
            columnWrapperStyle={{ gap: 11, marginBottom: 11 }}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 13 }}
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
      </SafeAreaView>
    </View>
  );
}
