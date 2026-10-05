/**
 * Mis publicaciones — los avisos de adopción del perfil activo.
 *
 * Grilla de dos columnas, igual que Favoritos, pero con lo propio: cada tarjeta muestra la
 * portada, el nombre de la mascota y el estado de la PUBLICACIÓN (no el de la mascota; ver
 * `EstadoPublicacion`). Tocarla abre la ficha completa, que sobre lo propio no ofrece
 * solicitar ni guardar en favoritos. El botón "+" lleva al alta de publicación.
 *
 * Sigue al switch refugio/adoptante: desde el perfil personal lista lo que el usuario publicó
 * a título propio, y desde la vista de refugio todo lo del refugio (el backend filtra por la
 * cabecera `X-Ambito`).
 *
 * Solo en la vista de refugio, que suele tener muchas, hay un filtro por estado de la
 * publicación con selección múltiple ("Todos", o uno o varios estados). Filtra el backend
 * (`?estados=`).
 *
 * Desde el perfil personal, debajo del título hay dos pestañas: "Adopciones" (las
 * publicaciones de adopción, como siempre) y "Perdidas/Encontradas" (los avisos de mascotas
 * perdidas y encontradas del usuario, HU-13.3). La tarjeta de un aviso tiene la misma forma que
 * la de una publicación, con el badge del aviso (Perdido / Encontrado / Resuelto); tocarla abre
 * el popup del aviso, que para el dueño ofrece marcarlo como resuelto, editarlo y eliminarlo.
 * El "+" crea lo de la pestaña elegida. Desde la vista de refugio no hay pestañas: el aviso es
 * siempre de la persona, nunca del refugio.
 *
 * Editar una publicación queda para cuando exista su HU (DEUDA_TECNICA.md ítem 16).
 *
 * Es una ruta del stack raíz, como Favoritos: se entra desde el Perfil y el back tiene que
 * volver al origen real.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { DetalleAvisoModal } from '@/components/perdidos/DetalleAvisoModal';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { EstadoAnimalPerdidoBadge } from '@/components/ui/EstadoAnimalPerdidoBadge';
import { EstadoPublicacionBadge } from '@/components/ui/EstadoPublicacionBadge';
import { FiltroEstados, type OpcionEstado } from '@/components/ui/FiltroEstados';
import { Segmentado, type OpcionSegmento } from '@/components/ui/Segmentado';
import { estiloDeEstadoPublicacion } from '@/constants/EstadosPublicacion';
import { PALETA } from '@/constants/theme';
import { useGestionAviso } from '@/hooks/useGestionAviso';
import { useSesion } from '@/hooks/useSesion';
import { tomarAvisoCreado } from '@/lib/avisoRecienCreado';
import { listarMisAvisos, type AvisoPerdido } from '@/services/animalesPerdidos';
import { urlAbsoluta } from '@/services/api';
import { listarEstadosPublicacion } from '@/services/catalogos';
import { listarMisPublicaciones, type PublicacionPropia } from '@/services/publicaciones';
import { edadEnTexto, parsearFecha } from '@/shared/validation/dates';

function edad(fechaNacimiento: string | null): string | null {
  const fecha = parsearFecha(fechaNacimiento);
  return fecha ? edadEnTexto(fecha) : null;
}

/** Referencia estable para "sin filtro": un `[]` nuevo en cada render recrearía `cargar`. */
const SIN_FILTRO: number[] = [];

function subtituloContador(total: number): string {
  if (total === 0) return 'Ninguna publicación';
  if (total === 1) return '1 publicación';
  return `${total} publicaciones`;
}

type Pestania = 'adopciones' | 'perdidas';

const PESTANIAS: OpcionSegmento<Pestania>[] = [
  { valor: 'adopciones', etiqueta: 'Adopciones' },
  { valor: 'perdidas', etiqueta: 'Perdidas/Encontradas' },
];

function subtituloAvisos(total: number): string {
  if (total === 0) return 'Ningún aviso';
  if (total === 1) return '1 aviso';
  return `${total} avisos`;
}

/** Lo que muestra la grilla: una publicación de adopción o un aviso de mascota perdida. */
type ItemPropio =
  { tipo: 'publicacion'; publicacion: PublicacionPropia } | { tipo: 'aviso'; aviso: AvisoPerdido };

/**
 * Hueco que completa una fila impar: con `numColumns={2}` el único ítem de la última fila
 * se llevaría todo el ancho (mismo recurso que Favoritos).
 */
const RELLENO = '__relleno__' as const;
type ItemGrilla = ItemPropio | typeof RELLENO;

function conRellenoDeFila(items: ItemPropio[]): ItemGrilla[] {
  return items.length % 2 === 1 ? [...items, RELLENO] : items;
}

function TarjetaPublicacion({
  publicacion,
  onVer,
}: {
  publicacion: PublicacionPropia;
  onVer: () => void;
}) {
  const { mascota } = publicacion;
  const foto = urlAbsoluta(publicacion.imagenUrl);
  const detalle = [mascota.especie.nombre, edad(mascota.fechaNacimiento)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Animated.View entering={FadeIn.duration(180)} className="flex-1">
      {/* Un solo Pressable y sin otros adentro: acá no hay corazón ni CTA que convivan con
          él (ver el comentario de Favoritos sobre Pressables anidados en web). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver la publicación de ${mascota.nombre ?? 'esta mascota'}`}
        onPress={onVer}
        className="overflow-hidden rounded-2xl bg-organic-surface shadow-sm active:opacity-90"
      >
        <View className="w-full bg-organic-neutral-200" style={{ aspectRatio: 4 / 3 }}>
          {foto ? (
            <Image source={{ uri: foto }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="paw-outline" size={36} color={PALETA.neutral[400]} />
            </View>
          )}
        </View>

        <View className="p-3">
          <Text numberOfLines={1} className="font-cuerpo-bold text-lg text-organic-neutral-900">
            {mascota.nombre ?? 'Sin nombre'}
          </Text>
          {detalle ? (
            <Text numberOfLines={1} className="mt-0.5 font-cuerpo text-sm text-organic-neutral-600">
              {detalle}
            </Text>
          ) : null}

          <View className="mt-2">
            <EstadoPublicacionBadge estado={publicacion.estado.nombre} tamanio="md" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Un aviso propio en la grilla. Misma forma que la tarjeta de una publicación, con el badge del
 * aviso en lugar del de la publicación. Ya no lleva la etiqueta "Mascotas perdidas": desde que
 * los avisos tienen su pestaña, no se mezclan con las publicaciones.
 */
function TarjetaAvisoPropio({ aviso, onVer }: { aviso: AvisoPerdido; onVer: () => void }) {
  const foto = urlAbsoluta(aviso.imagenUrl);
  const nombre = aviso.nombre ?? 'Sin nombre';
  const detalle = [aviso.especie?.nombre, aviso.localidad].filter(Boolean).join(' · ');

  return (
    <Animated.View entering={FadeIn.duration(180)} className="flex-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver el aviso de ${nombre}`}
        onPress={onVer}
        className="overflow-hidden rounded-2xl bg-organic-surface shadow-sm active:opacity-90"
      >
        <View className="w-full bg-organic-neutral-200" style={{ aspectRatio: 4 / 3 }}>
          {foto ? (
            <Image source={{ uri: foto }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="paw-outline" size={36} color={PALETA.neutral[400]} />
            </View>
          )}
        </View>

        <View className="p-3">
          <Text numberOfLines={1} className="font-cuerpo-bold text-lg text-organic-neutral-900">
            {nombre}
          </Text>
          {detalle ? (
            <Text numberOfLines={1} className="mt-0.5 font-cuerpo text-sm text-organic-neutral-600">
              {detalle}
            </Text>
          ) : null}

          <View className="mt-2">
            <EstadoAnimalPerdidoBadge estado={aviso.estado.nombre} tamanio="md" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MisPublicacionesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { vistaRefugio } = useSesion();

  const [publicaciones, setPublicaciones] = useState<PublicacionPropia[]>([]);
  /** Los avisos de mascotas perdidas del usuario. Siempre vacío en la vista de refugio. */
  const [avisos, setAvisos] = useState<AvisoPerdido[]>([]);
  const [avisoAbierto, setAvisoAbierto] = useState<AvisoPerdido | null>(null);
  /** Arranca en Adopciones, que es lo que la pantalla mostraba siempre. */
  const [pestaniaElegida, setPestaniaElegida] = useState<Pestania>('adopciones');
  /** Desde la vista de refugio no hay avisos: siempre Adopciones. */
  const pestania: Pestania = vistaRefugio ? 'adopciones' : pestaniaElegida;
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
      const [lista, propios] = await Promise.all([
        listarMisPublicaciones(filtro),
        // El aviso es de la persona: desde la vista de refugio no corresponde mostrarlo.
        vistaRefugio ? Promise.resolve<AvisoPerdido[]>([]) : listarMisAvisos(),
      ]);
      if (pedido === ultimoPedido.current) {
        setPublicaciones(lista);
        setAvisos(propios);
      }
    } catch (err) {
      if (pedido !== ultimoPedido.current) return;
      setError(err instanceof Error ? err.message : 'No pudimos cargar tus publicaciones.');
    } finally {
      if (pedido === ultimoPedido.current) {
        setCargando(false);
        setRefrescando(false);
      }
    }
  }, [filtro, vistaRefugio]);

  // El catálogo de estados se pide una sola vez. Si falla, el filtro no se muestra y la
  // grilla sigue funcionando con todas.
  useEffect(() => {
    if (!vistaRefugio) return;

    listarEstadosPublicacion()
      .then((estados) =>
        setOpcionesEstado(
          estados.map((estado) => ({
            id: estado.id,
            etiqueta: estiloDeEstadoPublicacion(estado.nombre).etiqueta,
          })),
        ),
      )
      .catch(() => undefined);
  }, [vistaRefugio]);

  // Se recarga al volver del alta de publicación, para que la nueva aparezca primera, y al
  // cambiar el filtro (`cargar` cambia con él).
  useFocusEffect(
    useCallback(() => {
      // Un aviso recién creado desde acá ya viene en la recarga: se consume el que dejó el alta
      // para que el portal no lo inserte más tarde con datos de este momento.
      tomarAvisoCreado();
      void cargar();
    }, [cargar]),
  );

  const volver = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/perfil');
  }, [router]);

  /**
   * Lo que hace el dueño desde el popup del aviso. Resuelto, se reemplaza en la grilla y el
   * popup lo muestra; eliminado, sale de la grilla. Al volver de editar, la grilla se recarga
   * sola al recuperar el foco.
   */
  const gestion = useGestionAviso({
    onActualizado: useCallback((actualizado: AvisoPerdido) => {
      setAvisos((actuales) =>
        actuales.map((aviso) => (aviso.id === actualizado.id ? actualizado : aviso)),
      );
      setAvisoAbierto(actualizado);
    }, []),
    onEliminado: useCallback((eliminado: AvisoPerdido) => {
      setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== eliminado.id));
      setAvisoAbierto(null);
    }, []),
    onAntesDeEditar: useCallback(() => setAvisoAbierto(null), []),
  });

  const items: ItemPropio[] =
    pestania === 'perdidas'
      ? avisos.map((aviso) => ({ tipo: 'aviso', aviso }))
      : publicaciones.map((publicacion) => ({ tipo: 'publicacion', publicacion }));

  // El "+" crea lo de la pestaña elegida. `origen` le avisa al alta de publicación que, al
  // terminar, vuelva acá y no a "Mis mascotas"; el alta de aviso siempre vuelve atrás.
  const crear = (): void => {
    if (pestania === 'perdidas') {
      router.push('/perdidos/nuevo');
      return;
    }
    router.push({ pathname: '/publicaciones/crear', params: { origen: 'publicaciones' } });
  };

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 px-[22px] pb-4 pt-2">
          <BotonCircular icono="arrow-back" etiqueta="Volver" onPress={volver} grande />

          <View className="flex-1">
            <Text className="font-titulo text-[28px] leading-[28px] text-organic-accent-600">
              {vistaRefugio ? 'Publicaciones del refugio' : 'Mis publicaciones'}
            </Text>
            <Text className="mt-1.5 font-cuerpo text-base text-organic-neutral-700">
              {cargando
                ? 'Cargando…'
                : pestania === 'perdidas'
                  ? subtituloAvisos(items.length)
                  : subtituloContador(items.length)}
            </Text>
          </View>
        </View>

        {vistaRefugio ? null : (
          <View className="px-[22px] pb-1">
            <Segmentado
              opciones={PESTANIAS}
              valor={pestania}
              onChange={setPestaniaElegida}
              variante="organica"
            />
          </View>
        )}

        {vistaRefugio && opcionesEstado.length > 0 ? (
          <FiltroEstados
            opciones={opcionesEstado}
            seleccionados={estadosElegidos}
            onChange={setEstadosElegidos}
          />
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
            data={conRellenoDeFila(items)}
            keyExtractor={(item, indice) =>
              item === RELLENO
                ? `relleno-${indice}`
                : item.tipo === 'aviso'
                  ? `aviso-${item.aviso.id}`
                  : `publicacion-${item.publicacion.id}`
            }
            numColumns={2}
            renderItem={({ item }) =>
              item === RELLENO ? (
                <View className="flex-1" />
              ) : item.tipo === 'aviso' ? (
                <TarjetaAvisoPropio aviso={item.aviso} onVer={() => setAvisoAbierto(item.aviso)} />
              ) : (
                <TarjetaPublicacion
                  publicacion={item.publicacion}
                  onVer={() =>
                    router.push({
                      pathname: '/publicaciones/[id]',
                      params: { id: item.publicacion.id },
                    })
                  }
                />
              )
            }
            ListEmptyComponent={
              pestania === 'perdidas' ? (
                <EstadoVacio
                  icono="search-outline"
                  titulo="Todavía no publicaste ninguna mascota perdida o encontrada"
                  descripcion="Tocá el botón + para reportar una mascota que perdiste o que encontraste."
                />
              ) : filtro.length > 0 ? (
                <EstadoVacio
                  icono="filter-outline"
                  titulo="No hay publicaciones con esos estados"
                  descripcion="Probá con otros estados o tocá «Todos» para ver todas."
                />
              ) : (
                <EstadoVacio
                  icono="megaphone-outline"
                  titulo={
                    vistaRefugio
                      ? 'El refugio todavía no publicó ninguna mascota'
                      : 'Todavía no publicaste ninguna mascota'
                  }
                  descripcion="Tocá el botón + para poner una mascota en adopción. Si todavía no la cargaste, te llevamos a cargarla primero."
                />
              )
            }
            columnWrapperStyle={{ gap: 11, marginBottom: 11 }}
            // Abajo deja lugar para la burbuja de "+", que flota sobre la grilla.
            contentContainerStyle={{
              paddingHorizontal: 14,
              paddingTop: 13,
              paddingBottom: 112 + insets.bottom,
            }}
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

        {/* Burbuja de creación, la misma de "Mis mascotas". Acá no hay barra de tabs debajo,
            así que se corre el inset inferior para no quedar tapada por la del sistema. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            pestania === 'perdidas'
              ? 'Reportar una mascota perdida o encontrada'
              : 'Crear publicación'
          }
          onPress={crear}
          style={{ bottom: 24 + insets.bottom }}
          className="absolute right-6 h-[68px] w-[68px] items-center justify-center rounded-full bg-organic-accent-600 shadow-lg active:opacity-90"
        >
          <Ionicons name="add" size={34} color={PALETA.blanco} />
        </Pressable>
      </SafeAreaView>

      {/* El aviso es propio: el popup ofrece resolverlo, editarlo y eliminarlo, nunca escribirse
          a uno mismo. */}
      <DetalleAvisoModal
        aviso={avisoAbierto}
        onCerrar={() => setAvisoAbierto(null)}
        onResolver={gestion.resolver}
        onEditar={gestion.editar}
        onEliminar={gestion.eliminar}
      />
    </View>
  );
}
