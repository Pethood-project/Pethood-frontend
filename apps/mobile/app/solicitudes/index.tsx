/**
 * GUI-27 Solicitudes — las dos puntas del módulo en una sola pantalla:
 *
 * - "Enviadas": lo que el usuario solicitó (HU-7.3). Entra desde la tarjeta "Mis
 *   solicitudes" del Inicio y desde la pantalla de éxito de HU-7.1.
 * - "Recibidas": lo que le llegó sobre sus mascotas publicadas (HU-7.5), con aceptar y
 *   rechazar (HU-7.4). "Quien publicó la mascota" no es siempre un refugio (spec 003 §6.2):
 *   un adoptante particular que ofreció una mascota propia también entra acá a resolver.
 *
 * Cuál se abre primero sale del parámetro `vista`, o sea de por dónde entró el usuario. Las
 * dos comparten tarjeta y filtro por estado: es la misma entidad mirada desde los dos lados.
 *
 * Desde la vista de refugio solo existe "Recibidas" (las de las mascotas del refugio): el
 * refugio no solicita nada, así que no hay "Enviadas" ni selector.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { FiltrosSolicitudesModal } from '@/components/solicitudes/FiltrosSolicitudesModal';
import { ProgresoSolicitud } from '@/components/solicitudes/ProgresoSolicitud';
import { ResolverSolicitudModal } from '@/components/solicitudes/ResolverSolicitudModal';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { EstadoSolicitudBadge } from '@/components/ui/EstadoSolicitudBadge';
import { Nota } from '@/components/ui/Nota';
import { Segmentado } from '@/components/ui/Segmentado';
import { etiquetaTipoSolicitud } from '@/constants/Solicitudes';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { ApiError, urlAbsoluta } from '@/services/api';
import {
  contarFiltrosActivosSolicitudes,
  listarMias,
  listarRecibidas,
  resolverSolicitud,
  type EstadoResolucion,
  type EstadoSolicitudNombre,
  type FiltrosSolicitudes,
  type SolicitudResumen,
} from '@/services/solicitudes';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

/** Desde qué lado se miran las solicitudes. */
type Vista = 'enviadas' | 'recibidas';

const OPCIONES_VISTA = [
  { valor: 'enviadas' as const, etiqueta: 'Enviadas' },
  { valor: 'recibidas' as const, etiqueta: 'Recibidas' },
];

function subtitulo(total: number, filtro: EstadoSolicitudNombre | undefined): string {
  if (filtro === 'Pendiente') {
    return total === 0 ? 'Ninguna pendiente' : `${total} pendiente${total === 1 ? '' : 's'}`;
  }
  if (total === 0) return 'Sin resultados';
  return `${total} solicitud${total === 1 ? '' : 'es'}`;
}

interface TarjetaSolicitudProps {
  solicitud: SolicitudResumen;
  vista: Vista;
  onVerDetalle: () => void;
  onResolver: (accion: EstadoResolucion) => void;
}

function TarjetaSolicitud({ solicitud, vista, onVerDetalle, onResolver }: TarjetaSolicitudProps) {
  const foto = urlAbsoluta(solicitud.mascota.imagenUrl);
  const fecha = parsearFecha(solicitud.fechaAlta);
  // Solo se resuelve del lado de quien publicó: en "Enviadas" el usuario es el solicitante.
  const sePuedeResolver = vista === 'recibidas' && solicitud.estado.nombre === 'Pendiente';

  // En "Recibidas" lo que identifica la solicitud es quién la mandó; en "Enviadas" eso
  // sería el propio usuario, así que ahí lo útil es si pidió adopción o tránsito.
  const referencia =
    vista === 'recibidas'
      ? `${solicitud.solicitante.nombre} ${solicitud.solicitante.apellido}`
      : etiquetaTipoSolicitud(solicitud.tipoSolicitud);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onVerDetalle}
      className="mb-3 overflow-hidden rounded-2xl bg-organic-surface shadow-sm active:opacity-90"
    >
      <View className="flex-row items-center gap-3 p-3">
        {foto ? (
          <Image source={{ uri: foto }} className="h-12 w-12 rounded-xl" />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-organic-accent-100">
            <Ionicons name="paw-outline" size={20} color={PALETA.accent[600]} />
          </View>
        )}

        <View className="flex-1">
          <Text className="font-cuerpo-bold text-sm text-organic-neutral-900">
            {solicitud.mascota.nombre ?? 'Sin nombre'}
          </Text>
          <Text className="mt-0.5 font-cuerpo text-xs text-organic-neutral-600">
            {referencia}
            {fecha ? ` · ${aFechaVisible(fecha)}` : ''}
          </Text>
          <ProgresoSolicitud estado={solicitud.estado.nombre} />
        </View>

        <EstadoSolicitudBadge estado={solicitud.estado.nombre} />
      </View>

      {sePuedeResolver ? (
        <View className="flex-row gap-2 border-t border-organic-neutral-200 px-3 pb-3 pt-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Aceptar la solicitud de ${solicitud.solicitante.nombre}`}
            onPress={() => onResolver('Aprobada')}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 active:opacity-90"
          >
            <Ionicons name="checkmark" size={15} color={PALETA.blanco} />
            <Text className="font-cuerpo-semi text-sm text-white">Aceptar</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Rechazar la solicitud de ${solicitud.solicitante.nombre}`}
            onPress={() => onResolver('Rechazada')}
            className="flex-1 items-center justify-center rounded-xl bg-organic-neutral-200 py-2.5 active:opacity-80"
          >
            <Text className="font-cuerpo-semi text-sm text-organic-neutral-700">Rechazar</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Qué decir cuando no hay nada que listar, según el lado y el filtro. */
function textosVacio(
  vista: Vista,
  filtros: FiltrosSolicitudes,
): { titulo: string; descripcion: string } {
  const soloElDefault = filtros.estado === 'Pendiente' && !filtros.fechaDesde && !filtros.fechaHasta;

  if (contarFiltrosActivosSolicitudes(filtros) > 0 && !soloElDefault) {
    return {
      titulo: 'No hay solicitudes',
      descripcion: 'Probá con otro filtro tocando el ícono de arriba.',
    };
  }

  if (vista === 'enviadas') {
    return {
      titulo: 'Todavía no enviaste ninguna solicitud',
      descripcion: 'Guardá en favoritos las mascotas que te interesen y solicitá desde ahí.',
    };
  }

  return {
    titulo: 'No tenés solicitudes pendientes',
    descripcion: 'Cuando alguien pida adoptar una de tus mascotas, va a aparecer acá.',
  };
}

export default function SolicitudesScreen() {
  const router = useRouter();
  const toast = useToast();
  const { vista: vistaInicial } = useLocalSearchParams<{ vista?: string }>();
  const { vistaRefugio } = useSesion();

  const [vistaElegida, setVista] = useState<Vista>(
    vistaInicial === 'enviadas' ? 'enviadas' : 'recibidas',
  );
  const vista: Vista = vistaRefugio ? 'recibidas' : vistaElegida;
  const [filtros, setFiltros] = useState<FiltrosSolicitudes>({ estado: 'Pendiente' });
  const [modalFiltros, setModalFiltros] = useState(false);
  const [solicitudes, setSolicitudes] = useState<SolicitudResumen[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Solicitud + acción esperando confirmación; `null` cierra el modal. */
  const [aResolver, setAResolver] = useState<{
    solicitud: SolicitudResumen;
    accion: EstadoResolucion;
  } | null>(null);
  const [resolviendo, setResolviendo] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const respuesta =
        vista === 'enviadas' ? await listarMias(filtros) : await listarRecibidas(filtros);
      setSolicitudes(respuesta.solicitudes);
      setTotal(respuesta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar las solicitudes.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [filtros, vista]);

  useFocusEffect(
    useCallback(() => {
      setCargando(true);
      void cargar();
    }, [cargar]),
  );

  const confirmarResolucion = async (comentario: string): Promise<void> => {
    if (!aResolver) return;
    const { solicitud, accion } = aResolver;

    setResolviendo(true);
    try {
      await resolverSolicitud(solicitud.id, accion, comentario);
      setAResolver(null);
      toast.mostrarExito(
        accion === 'Aprobada'
          ? `Aceptaste la solicitud de ${solicitud.solicitante.nombre}.`
          : `Rechazaste la solicitud de ${solicitud.solicitante.nombre}.`,
      );
      await cargar();
    } catch (err) {
      setAResolver(null);

      // 409: alguien más (otro miembro del refugio, o el cron de HU-7.6) ya la resolvió.
      if (err instanceof ApiError && err.codigo === 'SOLICITUD_YA_RESUELTA') {
        toast.mostrarAdvertencia(err.mensaje);
        await cargar();
        return;
      }

      toast.mostrarError(
        err instanceof Error
          ? err.message
          : 'No pudimos actualizar la solicitud. Intentalo de nuevo.',
      );
    } finally {
      setResolviendo(false);
    }
  };

  /** Cambiar de lado vacía la lista: la vieja no tiene nada que ver con la nueva. */
  const cambiarVista = useCallback((siguiente: Vista): void => {
    setVista(siguiente);
    setSolicitudes([]);
    setTotal(0);
    setCargando(true);
  }, []);

  const vacio = textosVacio(vista, filtros);
  const filtrosActivos = contarFiltrosActivosSolicitudes(filtros);

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-[22px] pb-3.5 pt-2">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-3">
              <BotonCircular
                icono="arrow-back"
                etiqueta="Volver"
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace('/(tabs)/perfil')
                }
              />

              <View>
                <Text className="font-titulo text-[22px] leading-[22px] text-organic-accent-600">
                  Solicitudes
                </Text>
                <Text className="mt-1 font-cuerpo text-[13px] text-organic-neutral-700">
                  {cargando ? 'Cargando…' : subtitulo(total, filtros.estado)}
                </Text>
              </View>
            </View>

            <BotonCircular
              icono="options-outline"
              etiqueta="Filtros"
              contador={filtrosActivos}
              onPress={() => setModalFiltros(true)}
            />
          </View>

          {vistaRefugio ? null : (
            <View className="mt-3.5">
              <Segmentado opciones={OPCIONES_VISTA} valor={vista} onChange={cambiarVista} />
            </View>
          )}
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
            data={solicitudes}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TarjetaSolicitud
                solicitud={item}
                vista={vista}
                onVerDetalle={() =>
                  router.push({ pathname: '/solicitudes/[id]', params: { id: item.id } })
                }
                onResolver={(accion) => setAResolver({ solicitud: item, accion })}
              />
            )}
            ListEmptyComponent={
              <EstadoVacio
                icono="file-tray-outline"
                titulo={vacio.titulo}
                descripcion={vacio.descripcion}
              />
            }
            ListFooterComponent={
              solicitudes.length > 0 ? (
                <Nota texto="Tocá una solicitud para ver el estado del proceso paso a paso." />
              ) : null
            }
            contentContainerClassName="px-3.5 py-3.5 pb-10"
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

      <ResolverSolicitudModal
        accion={aResolver?.accion ?? null}
        nombreSolicitante={aResolver?.solicitud.solicitante.nombre ?? ''}
        nombreMascota={aResolver?.solicitud.mascota.nombre ?? null}
        cargando={resolviendo}
        onConfirmar={(comentario) => void confirmarResolucion(comentario)}
        onCerrar={() => setAResolver(null)}
      />

      <FiltrosSolicitudesModal
        visible={modalFiltros}
        filtros={filtros}
        onAplicar={(nuevos) => {
          setModalFiltros(false);
          setCargando(true);
          setFiltros(nuevos);
        }}
        onCerrar={() => setModalFiltros(false)}
      />
    </View>
  );
}
