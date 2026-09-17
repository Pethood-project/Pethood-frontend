/**
 * Adoptar — feed de mascotas publicadas en formato de tarjetas con swipe.
 *
 * Se llega tocando el botón redondo amarillo de la barra inferior. El mazo se arma con el
 * feed del backend, que ya excluye las mascotas propias y las que el usuario guardó.
 *
 * El rechazo es temporal: la tarjeta sale del mazo y no se persiste nada, así que la
 * mascota vuelve a aparecer al recargar el feed o al cambiar los filtros. El "me gusta" sí
 * se guarda, con update optimista contra `POST /favoritos`.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
import { PALETA } from '@/constants/theme';
import { agregarFavorito } from '@/services/favoritos';
import {
  contarFiltrosActivos,
  listarFeed,
  SIN_FILTROS,
  type FiltrosAdopcion,
  type PublicacionFeed,
} from '@/services/publicaciones';

/** Con menos tarjetas que esto en el mazo se pide la página siguiente. */
const UMBRAL_PRECARGA = 4;

export default function AdoptarScreen() {
  const router = useRouter();
  const toast = useToast();
  const pila = useRef<PilaAdopcionRef>(null);

  const [publicaciones, setPublicaciones] = useState<PublicacionFeed[]>([]);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState<FiltrosAdopcion>(SIN_FILTROS);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalFiltros, setModalFiltros] = useState(false);

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

  const cargarPrimeraPagina = useCallback(async (filtrosActivos: FiltrosAdopcion): Promise<void> => {
    setCargando(true);
    setError(null);
    rechazadas.current = 0;

    try {
      const feed = await listarFeed(filtrosActivos);
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
      const feed = await listarFeed(filtros, desplazamiento);

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

      void agregarFavorito(publicacion.mascota.id)
        .then(() => {
          toast.mostrarExito(`Guardamos a ${nombre} en favoritos.`);
        })
        .catch((err: unknown) => {
          reponer(publicacion);
          setTotal((actual) => actual + 1);
          toast.mostrarError(
            err instanceof Error ? err.message : 'No pudimos guardar la mascota en favoritos.',
          );
        });
    },
    [reponer, toast],
  );

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
        <View className="flex-row items-center justify-between gap-3 px-[22px] pb-3.5 pt-2">
          <Text className="font-titulo text-[27px] leading-[27px] text-organic-accent-600">
            Adoptar
          </Text>

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
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : error ? (
          <EstadoError mensaje={error} onAccion={() => void cargarPrimeraPagina(filtros)} />
        ) : mazoVacio ? (
          <EstadoVacio
            icono="paw-outline"
            titulo="Por ahora no hay más mascotas"
            descripcion={
              filtrosActivos > 0
                ? 'Ninguna mascota coincide con los filtros que elegiste. Probá ampliarlos para ver más opciones.'
                : 'Ya viste todas las publicaciones disponibles. Volvé más tarde: se suman mascotas nuevas todo el tiempo.'
            }
          >
            {filtrosActivos > 0 ? (
              <>
                <CustomButton title="Modificar filtros" onPress={() => setModalFiltros(true)} />
                <CustomButton
                  title="Quitar todos los filtros"
                  variant="secondary"
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
