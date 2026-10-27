/**
 * Adoptar — feed de mascotas publicadas en formato de tarjetas con swipe.
 *
 * Se llega tocando el botón redondo amarillo de la barra inferior. El mazo se arma con el
 * feed del backend, que ya excluye las mascotas propias y las que el usuario guardó.
 *
 * El rechazo es temporal: la tarjeta sale del mazo y no se persiste nada, así que la
 * mascota vuelve a aparecer al recargar el feed o al cambiar los filtros. El "me gusta" sí
 * se guarda, con update optimista contra `POST /favoritos`.
 *
 * Solo existe en el perfil personal: desde la vista de refugio no se adopta. La pestaña se
 * oculta (ver `(tabs)/_layout.tsx`) y, si igual se llega por un link, se vuelve a Inicio.
 */
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FiltrosAdopcionModal } from '@/components/adoptar/FiltrosAdopcionModal';
import { PilaAdopcion, type Decision, type PilaAdopcionRef } from '@/components/adoptar/PilaAdopcion';
import { CustomButton } from '@/components/CustomButton';
import {
  EstadoCargando,
  EstadoError,
  EstadoVacio,
} from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { ApiError } from '@/services/api';
import { agregarFavorito } from '@/services/favoritos';
import {
  contarFiltrosActivos,
  listarFeed,
  SIN_FILTROS,
  TAMANIO_PAGINA,
  type FiltrosAdopcion,
  type PublicacionFeed,
} from '@/services/publicaciones';

/** Con menos tarjetas que esto en el mazo se pide la página siguiente. */
const UMBRAL_PRECARGA = 4;

export default function AdoptarScreen() {
  const { vistaRefugio } = useSesion();

  // El mazo se desmonta al pasar a la vista de refugio, así no queda pidiendo páginas de
  // un feed que el backend ya no le da a ese perfil.
  if (vistaRefugio) return <Redirect href="/(tabs)" />;

  return <MazoAdopcion />;
}

function MazoAdopcion() {
  const router = useRouter();
  const toast = useToast();
  const pila = useRef<PilaAdopcionRef>(null);

  const [publicaciones, setPublicaciones] = useState<PublicacionFeed[]>([]);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState<FiltrosAdopcion>(SIN_FILTROS);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalFiltros, setModalFiltros] = useState(false);

  // El botón de filtros de la tarjeta de Inicio llega con `?filtros=abrir`. El parámetro se
  // limpia al usarlo: la pestaña queda montada, y si no, volver a tocarlo no haría nada.
  const { filtros: pedidoFiltros } = useLocalSearchParams<{ filtros?: string }>();
  useEffect(() => {
    if (pedidoFiltros !== 'abrir') return;
    setModalFiltros(true);
    router.setParams({ filtros: undefined });
  }, [pedidoFiltros, router]);

  /**
   * Cuántas tarjetas descartó el usuario en esta sesión de la pantalla.
   *
   * Hace falta para paginar bien: el feed excluye lo que está en favoritos, así que cada
   * "me gusta" achica el conjunto del servidor y correr el desplazamiento con la cantidad
   * de tarjetas vistas saltearía mascotas. Las rechazadas, en cambio, siguen ahí, y junto
   * con las que quedan en el mazo son exactamente las primeras posiciones ya consumidas.
   */
  const rechazadas = useRef(0);

  /** Evita dos pedidos simultáneos de la misma página cuando llegan dos decisiones seguidas. */
  const pidiendoPagina = useRef(false);

  /** Siempre apunta al `decidir` vigente: lo llama el "Reintentar" de un aviso ya mostrado. */
  const decidirRef = useRef<(publicacion: PublicacionFeed, decision: Decision) => void>(
    () => undefined,
  );

  const cargarPrimeraPagina = useCallback(async (filtrosActivos: FiltrosAdopcion): Promise<void> => {
    setCargando(true);
    setError(null);
    rechazadas.current = 0;

    try {
      const feed = await listarFeed(filtrosActivos, 0, TAMANIO_PAGINA);
      setPublicaciones(feed.publicaciones);
      setTotal(feed.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar las mascotas.');
      setPublicaciones([]);
      setTotal(0);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarPrimeraPagina(filtros);
  }, [cargarPrimeraPagina, filtros]);

  const cargarSiguientePagina = useCallback(async (): Promise<void> => {
    if (pidiendoPagina.current) return;
    pidiendoPagina.current = true;

    try {
      const desplazamiento = rechazadas.current + publicaciones.length;
      const feed = await listarFeed(filtros, desplazamiento, TAMANIO_PAGINA);

      // Se filtran por id los que ya estén en el mazo: si entre el cálculo del
      // desplazamiento y la respuesta cambió algo del lado del servidor, el solapamiento
      // duplicaría tarjetas en vez de romper.
      setPublicaciones((actuales) => {
        const conocidos = new Set(actuales.map((publicacion) => publicacion.id));
        return [...actuales, ...feed.publicaciones.filter((pub) => !conocidos.has(pub.id))];
      });
      setTotal(feed.total);
    } catch {
      // Silencioso a propósito: el mazo todavía tiene tarjetas y un toast acá interrumpiría
      // el swipe por algo que se reintenta solo en la próxima decisión.
    } finally {
      pidiendoPagina.current = false;
    }
  }, [filtros, publicaciones.length]);

  // Quedan páginas mientras lo consumido no llegue al total que informó el servidor.
  const hayMasPaginas = rechazadas.current + publicaciones.length < total;

  useEffect(() => {
    if (!cargando && publicaciones.length <= UMBRAL_PRECARGA && hayMasPaginas) {
      void cargarSiguientePagina();
    }
  }, [cargando, publicaciones.length, hayMasPaginas, cargarSiguientePagina]);

  /** Devuelve la tarjeta al frente del mazo cuando el guardado falla. */
  const reponer = useCallback((publicacion: PublicacionFeed): void => {
    setPublicaciones((actuales) => [publicacion, ...actuales]);
  }, []);

  const decidir = useCallback(
    (publicacion: PublicacionFeed, decision: Decision): void => {
      setPublicaciones((actuales) => actuales.filter((item) => item.id !== publicacion.id));

      if (decision === 'rechazar') {
        rechazadas.current += 1;
        return;
      }

      // El feed ya no la va a devolver, así que el total del servidor baja con ella.
      setTotal((actual) => Math.max(0, actual - 1));

      const nombre = publicacion.mascota.nombre ?? 'la mascota';

      // Se avisa en el momento del swipe y no cuando vuelve el servidor: si no, el aviso
      // llegaba con la carta ya en la siguiente. Si el guardado falla, el error lo pisa.
      toast.mostrarExito(
        { titulo: `${nombre} guardado`, icono: 'heart' },
        { etiqueta: 'Ver', atajo: true, onPress: () => router.push('/favoritos') },
      );

      void agregarFavorito(publicacion.mascota.id).catch((err: unknown) => {
        reponer(publicacion);
        setTotal((actual) => actual + 1);

        // Un rechazo del servidor (4xx) no se arregla reintentando; la red o un 5xx, sí.
        const reintentable = !(err instanceof ApiError && err.status < 500);

        // Si el servidor dio un motivo concreto, ese es el aviso; si fue la red, alcanza con
        // decir que no se pudo y ofrecer reintentar.
        toast.mostrarError(
          reintentable ? 'No se pudo guardar' : err.message,
          reintentable
            ? { etiqueta: 'Reintentar', onPress: () => decidirRef.current(publicacion, 'guardar') }
            : undefined,
        );
      });
    },
    [reponer, router, toast],
  );

  // "Reintentar" del aviso vuelve a pasar por el mismo camino que el swipe.
  decidirRef.current = decidir;

  const abrirFicha = useCallback(
    (publicacion: PublicacionFeed): void => {
      router.push({ pathname: '/publicaciones/[id]', params: { id: publicacion.id } });
    },
    [router],
  );

  const filtrosActivos = contarFiltrosActivos(filtros);
  const mazoVacio = publicaciones.length === 0;

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla
          titulo="Adoptar"
          derecha={
            <View className="flex-row items-center gap-2">
              <BotonCircular
                icono="heart-outline"
                etiqueta="Favoritos"
                onPress={() => router.push('/favoritos')}
              />
              <BotonCircular
                icono="options-outline"
                etiqueta="Filtros de búsqueda"
                onPress={() => setModalFiltros(true)}
                contador={filtrosActivos}
              />
            </View>
          }
        />

        {cargando ? (
          <EstadoCargando />
        ) : error ? (
          <EstadoError mensaje={error} onAccion={() => void cargarPrimeraPagina(filtros)} />
        ) : mazoVacio ? (
          <EstadoVacio
            icono="search-outline"
            titulo="Por ahora no hay más mascotas"
            descripcion={
              filtrosActivos > 0
                ? 'Ninguna mascota coincide con los filtros que elegiste. Probá ampliarlos para ver más opciones.'
                : 'Ya viste todas las publicaciones disponibles. Volvé más tarde: se suman mascotas nuevas todo el tiempo.'
            }
          >
            {filtrosActivos > 0 ? (
              <>
                <CustomButton
                  title="Modificar filtros"
                  variant="acento"
                  onPress={() => setModalFiltros(true)}
                />
                <CustomButton
                  title="Quitar todos los filtros"
                  variant="acento-borde"
                  onPress={() => setFiltros(SIN_FILTROS)}
                />
              </>
            ) : null}
          </EstadoVacio>
        ) : (
          <>
            <View className="flex-1 px-[22px]">
              <PilaAdopcion
                ref={pila}
                publicaciones={publicaciones}
                onDecidir={decidir}
                onAbrir={abrirFicha}
              />
            </View>

            <View className="flex-row items-center justify-center gap-[26px] pb-2 pt-5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="No me interesa"
                onPress={() => pila.current?.rechazar()}
                className="h-[58px] w-[58px] items-center justify-center rounded-full border active:opacity-80"
                style={{
                  backgroundColor: PALETA.neutral[100],
                  borderColor: PALETA.neutral[300],
                  shadowColor: PALETA.neutral[900],
                  shadowOpacity: 0.14,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 2,
                }}
              >
                <Ionicons name="close" size={25} color={PALETA.neutral[700]} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Guardar en favoritos"
                onPress={() => pila.current?.guardar()}
                className="h-[70px] w-[70px] items-center justify-center rounded-full active:opacity-90"
                style={{
                  backgroundColor: PALETA.accent[600],
                  shadowColor: PALETA.accent[800],
                  shadowOpacity: 0.3,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 8,
                }}
              >
                <Ionicons name="heart" size={30} color={PALETA.blanco} />
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>

      <FiltrosAdopcionModal
        visible={modalFiltros}
        filtros={filtros}
        onAplicar={(nuevos) => {
          setModalFiltros(false);
          setFiltros(nuevos);
        }}
        onCerrar={() => setModalFiltros(false)}
      />
    </View>
  );
}
