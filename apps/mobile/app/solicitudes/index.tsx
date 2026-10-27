/**
 * GUI-27 Solicitudes — las dos puntas del módulo en una sola pantalla:
 *
 * - "Enviadas": lo que el usuario solicitó. Entra desde la tarjeta "Mis solicitudes" del
 *   Inicio y desde la pantalla de éxito del formulario.
 * - "Recibidas": lo que le llegó sobre sus mascotas publicadas, que quien publicó revisa y
 *   resuelve. "Quien publicó la mascota" no es siempre un refugio: un adoptante particular
 *   que ofreció una mascota propia también entra acá.
 *
 * Cuál se abre primero sale del parámetro `vista`, o sea de por dónde entró el usuario. Las
 * dos comparten tarjeta y filtro por estado: es la misma entidad mirada desde los dos lados.
 * Lo recibido se ordena en tres pestañas —por revisar, revisadas y resueltas— para que quien
 * publica distinga de un vistazo lo que le falta mirar de lo que ya miró.
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
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { EstadoSolicitudBadge } from '@/components/ui/EstadoSolicitudBadge';
import { EtiquetaTipoSolicitud } from '@/components/ui/EtiquetaTipoSolicitud';
import { Nota } from '@/components/ui/Nota';
import { Segmentado } from '@/components/ui/Segmentado';
import { ESTADOS_DE_PESTANIA, pestaniaDe, type Pestania } from '@/constants/PestaniasSolicitud';
import type { VistaSolicitud } from '@/constants/EstadosSolicitud';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { vibrar } from '@/lib/haptics';
import { ApiError, urlAbsoluta } from '@/services/api';
import {
  contarFiltrosActivosSolicitudes,
  listarMias,
  listarRecibidas,
  resolverSolicitud,
  type EstadoResolucion,
  type EstadoSolicitudNombre,
  type FiltrosSolicitudes,
  type MotivoRechazo,
  type SolicitudResumen,
} from '@/services/solicitudes';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

/** Desde qué lado se miran las solicitudes. */
type Vista = 'enviadas' | 'recibidas';

const OPCIONES_VISTA = [
  { valor: 'enviadas' as const, etiqueta: 'Enviadas' },
  { valor: 'recibidas' as const, etiqueta: 'Recibidas' },
];

/** Lo que se ve al entrar: lo que falta mirar, o todo lo que pidió quien envió. */
function filtrosIniciales(vista: Vista): FiltrosSolicitudes {
  return vista === 'recibidas' ? { estados: ESTADOS_DE_PESTANIA.porRevisar } : {};
}

/**
 * Los filtros con los que se abre si alguien llega desde un contador (por ejemplo las
 * adopciones del perfil del refugio): estados separados por coma y un tipo.
 */
function filtrosDeEntrada(vista: Vista, estados?: string, tipo?: string): FiltrosSolicitudes {
  const lista = (estados ?? '').split(',').filter(Boolean) as EstadoSolicitudNombre[];
  const tipoValido = tipo === 'Adopcion' || tipo === 'Transito' ? tipo : undefined;

  if (lista.length === 0 && !tipoValido) return filtrosIniciales(vista);

  return {
    ...(lista.length > 0 ? { estados: lista } : {}),
    ...(tipoValido ? { tipo: tipoValido } : {}),
  };
}

function subtitulo(total: number, vista: Vista, pestania: Pestania | null): string {
  if (total === 0) return pestania === 'porRevisar' ? 'Nada por revisar' : 'Sin resultados';
  if (pestania === 'porRevisar') return `${total} por revisar`;
  if (pestania === 'revisadas') return `${total} esperando tu decisión`;
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
  const quienMira: VistaSolicitud = vista === 'recibidas' ? 'refugio' : 'adoptante';
  const estado = solicitud.estado.nombre;

  // Aceptar y rechazar a mano solo cuando ya está revisada; antes se revisa (la pantalla de
  // detalle abre la revisión y deja marcar, rechazar o aceptar).
  const sePuedeResolver = vista === 'recibidas' && estado === 'Revisada';
  const faltaRevisar = vista === 'recibidas' && (estado === 'Pendiente' || estado === 'En_Revision');

  // En "Recibidas" lo que identifica la solicitud es quién la mandó; en "Enviadas" eso
  // sería el propio usuario, así que ahí alcanza con la fecha.
  const referencia =
    vista === 'recibidas' ? `${solicitud.solicitante.nombre} ${solicitud.solicitante.apellido}` : '';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        vibrar.toque();
        onVerDetalle();
      }}
      className="mb-3.5 overflow-hidden rounded-3xl bg-organic-surface shadow-sm active:opacity-90"
    >
      <View className="flex-row items-center gap-4 p-4">
        {foto ? (
          <Image source={{ uri: foto }} className="h-20 w-20 rounded-2xl" />
        ) : (
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-organic-accent-100">
            <Ionicons name="paw-outline" size={32} color={PALETA.accent[600]} />
          </View>
        )}

        <View className="flex-1">
          <Text className="font-cuerpo-bold text-[18px] leading-6 text-organic-neutral-900">
            {solicitud.mascota.nombre ?? 'Sin nombre'}
          </Text>
          <Text className="mt-1 font-cuerpo text-[14px] leading-5 text-organic-neutral-600">
            {referencia}
            {fecha ? `${referencia ? ' · ' : ''}${aFechaVisible(fecha)}` : ''}
          </Text>
          <View className="mt-1.5">
            <EtiquetaTipoSolicitud tipo={solicitud.tipoSolicitud} />
          </View>
          <ProgresoSolicitud
            estado={estado}
            historial={solicitud.historial}
            vista={quienMira}
            tamanio="compacto"
          />
        </View>

        <EstadoSolicitudBadge estado={estado} vista={quienMira} />
      </View>

      {faltaRevisar ? (
        <View className="border-t border-organic-neutral-200 px-3 pb-3 pt-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Revisar la solicitud de ${solicitud.solicitante.nombre}`}
            onPress={() => {
              vibrar.toque();
              onVerDetalle();
            }}
            className="flex-row items-center justify-center gap-1.5 rounded-xl bg-organic-accent-600 py-2.5 active:opacity-90"
          >
            <Ionicons name="reader-outline" size={16} color={PALETA.blanco} />
            <Text className="font-cuerpo-semi text-sm text-white">
              {estado === 'Pendiente' ? 'Revisar solicitud' : 'Seguir revisando'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {sePuedeResolver ? (
        <View className="flex-row gap-2 border-t border-organic-neutral-200 px-3 pb-3 pt-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Aceptar la solicitud de ${solicitud.solicitante.nombre}`}
            onPress={() => onResolver('Aprobada')}
            style={{ backgroundColor: PALETA.estado.exito }}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 active:opacity-90"
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

/** Qué decir cuando no hay nada que listar, según el lado, la pestaña y el filtro. */
function textosVacio(
  vista: Vista,
  filtros: FiltrosSolicitudes,
  pestania: Pestania | null,
): { titulo: string; descripcion: string } {
  const hayFiltroDeFecha = Boolean(filtros.fechaDesde || filtros.fechaHasta);

  if (hayFiltroDeFecha || (vista === 'enviadas' && contarFiltrosActivosSolicitudes(filtros) > 0)) {
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

  if (pestania === 'revisadas') {
    return {
      titulo: 'No hay solicitudes revisadas',
      descripcion: 'Las que marques como revisadas quedan acá, esperando tu decisión.',
    };
  }

  if (pestania === 'resueltas') {
    return {
      titulo: 'Todavía no resolviste ninguna',
      descripcion: 'Acá vas a ver las que aceptaste, rechazaste, o que se cerraron solas.',
    };
  }

  return pestania === 'porRevisar'
    ? {
        titulo: 'No tenés solicitudes por revisar',
        descripcion: 'Cuando alguien pida adoptar una de tus mascotas, va a aparecer acá.',
      }
    : {
        titulo: 'No hay solicitudes',
        descripcion: 'Probá con otro filtro tocando el ícono de arriba.',
      };
}

export default function SolicitudesScreen() {
  const router = useRouter();
  const toast = useToast();
  const {
    vista: vistaInicial,
    estados: estadosDeEntrada,
    tipo: tipoDeEntrada,
  } = useLocalSearchParams<{ vista?: string; estados?: string; tipo?: string }>();
  const { vistaRefugio } = useSesion();

  const [vistaElegida, setVista] = useState<Vista>(
    vistaInicial === 'enviadas' ? 'enviadas' : 'recibidas',
  );
  const vista: Vista = vistaRefugio ? 'recibidas' : vistaElegida;
  const [filtros, setFiltros] = useState<FiltrosSolicitudes>(() =>
    filtrosDeEntrada(
      vistaInicial === 'enviadas' ? 'enviadas' : 'recibidas',
      estadosDeEntrada,
      tipoDeEntrada,
    ),
  );
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

  const confirmarResolucion = async (comentario: string, motivo?: MotivoRechazo): Promise<void> => {
    if (!aResolver) return;
    const { solicitud, accion } = aResolver;

    setResolviendo(true);
    try {
      await resolverSolicitud(solicitud.id, accion, comentario, motivo);
      setAResolver(null);
      toast.mostrarExito(
        accion === 'Aprobada'
          ? `Aceptaste la solicitud de ${solicitud.solicitante.nombre}.`
          : `Rechazaste la solicitud de ${solicitud.solicitante.nombre}.`,
      );
      await cargar();
    } catch (err) {
      setAResolver(null);

      // 409: alguien más (otro miembro del refugio, o el cron) ya la resolvió.
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

  /** Cambiar de lado vacía la lista y vuelve al filtro de entrada de ese lado. */
  const cambiarVista = useCallback((siguiente: Vista): void => {
    setVista(siguiente);
    setFiltros(filtrosIniciales(siguiente));
    setSolicitudes([]);
    setTotal(0);
    setCargando(true);
  }, []);

  const pestania = pestaniaDe(filtros.estados);
  const vacio = textosVacio(vista, filtros, pestania);
  const filtrosActivos = contarFiltrosActivosSolicitudes(filtros);
  const quienMira: VistaSolicitud = vista === 'recibidas' ? 'refugio' : 'adoptante';

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla
          titulo="Solicitudes"
          subtitulo={cargando ? 'Cargando…' : subtitulo(total, vista, pestania)}
          onVolver={() =>
            router.canGoBack() ? router.back() : router.replace('/(tabs)/perfil')
          }
          derecha={
            <BotonCircular
              icono="options-outline"
              etiqueta="Filtros"
              contador={vista === 'recibidas' && pestania ? filtrosActivos - 1 : filtrosActivos}
              onPress={() => setModalFiltros(true)}
            />
          }
        >
          {vistaRefugio ? null : (
            <Segmentado
              opciones={OPCIONES_VISTA}
              valor={vista}
              onChange={cambiarVista}
              variante="organica"
              grande
            />
          )}

        </EncabezadoPantalla>

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
              ) : undefined
            }
            contentContainerClassName="px-3.5 py-3.5 pb-10"
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => {
                  vibrar.toque();
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
        esAdopcion={aResolver?.solicitud.tipoSolicitud === 'Adopcion'}
        cargando={resolviendo}
        onConfirmar={(comentario, motivo) => void confirmarResolucion(comentario, motivo)}
        onCerrar={() => setAResolver(null)}
      />

      <FiltrosSolicitudesModal
        visible={modalFiltros}
        vista={quienMira}
        conPestanias={vista === 'recibidas'}
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
