/**
 * Bandeja de notificaciones (spec 004). Lista paginada de más reciente a más antigua,
 * agrupada por día (Hoy, Ayer, Esta semana, Antes), con un ícono y un color según el tipo, el
 * estado leído/no leído y filtros rápidos (Todas, Sin leer, Solicitudes, Mascotas).
 *
 * Cada fila se desliza: a la izquierda la elimina y a la derecha la marca como leída. Se accede
 * desde la campana de Inicio.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { DeslizarParaEliminar } from '@/components/notificaciones/DeslizarParaEliminar';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { HojaOpciones } from '@/components/ui/HojaOpciones';
import { PALETA } from '@/constants/theme';
import { usePaginacionCursor } from '@/hooks/usePaginacionCursor';
import { vibrar } from '@/lib/haptics';
import {
  agruparPorDia,
  cumpleFiltro,
  estiloDeNotificacion,
  OPCIONES_FILTRO,
  type FilaBandeja,
  type FiltroNotificaciones,
} from '@/lib/notificaciones';
import { rutaDeNotificacion } from '@/lib/rutaDeNotificacion';
import { tiempoRelativo } from '@/shared/validation/dates';
import {
  eliminarNotificacion,
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  type NotificacionItem,
} from '@/services/notificaciones';

const MENSAJE_SIN_CONEXION = 'No pudimos cargar tus notificaciones. Revisá tu conexión.';

const ICONO_FILTRO: Record<FiltroNotificaciones, keyof typeof Ionicons.glyphMap> = {
  todas: 'notifications-outline',
  sinLeer: 'mail-unread-outline',
  solicitudes: 'document-text-outline',
  mascotas: 'paw-outline',
  otras: 'ellipsis-horizontal',
};

/** Con un filtro activo se siguen pidiendo páginas hasta tener al menos esto para mostrar. */
const MINIMO_CON_FILTRO = 6;

/** Estable, fuera del componente: ver el contrato de `usePaginacionCursor`. */
const claveDeNotificacion = (item: NotificacionItem): number => item.id;

interface FilaNotificacionProps {
  item: NotificacionItem;
  onPress: () => void;
  onMarcarLeida: () => void;
  /** `false` si no se pudo eliminar: la fila vuelve a aparecer. */
  onEliminar: () => Promise<boolean>;
}

/** Se desliza a los costados (ver `DeslizarParaEliminar`). */
function FilaNotificacion({ item, onPress, onMarcarLeida, onEliminar }: FilaNotificacionProps) {
  const { titulo, icono, tono } = estiloDeNotificacion(item.tipo);

  return (
    <DeslizarParaEliminar
      onEliminar={onEliminar}
      onMarcarLeida={item.leido ? undefined : onMarcarLeida}
      separacion={10}
      radio={18}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.leido ? '' : 'Sin leer. '}${titulo}. ${item.mensaje}`}
        // Sin deslizar, el lector de pantalla no tiene cómo: se le ofrecen como acciones.
        accessibilityActions={[
          { name: 'eliminar', label: 'Eliminar notificación' },
          ...(item.leido ? [] : [{ name: 'leida', label: 'Marcar como leída' }]),
        ]}
        onAccessibilityAction={(evento) => {
          if (evento.nativeEvent.actionName === 'eliminar') void onEliminar();
          if (evento.nativeEvent.actionName === 'leida') onMarcarLeida();
        }}
        onPress={onPress}
        // El fondo es opaco a propósito: con uno translúcido se vería la acción de atrás.
        style={{
          backgroundColor: item.leido ? PALETA.surface : PALETA.blanco,
          borderColor: item.leido ? PALETA.neutral[200] : PALETA.neutral[300],
          borderWidth: 1,
        }}
        className="flex-row overflow-hidden rounded-[18px] active:opacity-90"
      >
        {/* La barrita del color del tipo marca lo que falta leer. */}
        {item.leido ? null : <View style={{ width: 4, backgroundColor: tono.tinta }} />}

        <View className="min-w-0 flex-1 flex-row items-start gap-3 p-3.5">
          <View
            style={{ backgroundColor: tono.fondo }}
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            <Ionicons name={icono} size={19} color={tono.tinta} />
          </View>

          <View className="min-w-0 flex-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text
                numberOfLines={1}
                className={`min-w-0 flex-1 text-[15.5px] ${
                  item.leido
                    ? 'font-cuerpo-semi text-organic-neutral-700'
                    : 'font-cuerpo-bold text-organic-neutral-900'
                }`}
              >
                {titulo}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Text className="font-cuerpo text-[12px] text-organic-neutral-500">
                  {tiempoRelativo(new Date(item.fechaAlta))}
                </Text>
                {item.leido ? null : (
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: tono.tinta }} />
                )}
              </View>
            </View>

            <Text
              numberOfLines={3}
              className={`mt-0.5 font-cuerpo text-[14px] leading-5 ${
                item.leido ? 'text-organic-neutral-600' : 'text-organic-neutral-800'
              }`}
            >
              {item.mensaje}
            </Text>
          </View>
        </View>
      </Pressable>
    </DeslizarParaEliminar>
  );
}

function CabeceraDeDia({ etiqueta }: { etiqueta: string }) {
  return (
    <Text className="mb-2 mt-3 px-1 font-cuerpo-bold text-[12px] uppercase tracking-[1.2px] text-organic-accent-700">
      {etiqueta}
    </Text>
  );
}

/** Qué decir cuando no hay nada que mostrar, según el filtro. */
function textosVacio(
  filtro: FiltroNotificaciones,
  hayNotificaciones: boolean,
): { titulo: string; descripcion: string } {
  if (!hayNotificaciones) {
    return {
      titulo: 'Todo tranquilo por acá',
      descripcion:
        'Cuando pase algo con tus solicitudes, tus favoritos o tus mascotas, te lo contamos en este lugar.',
    };
  }

  switch (filtro) {
    case 'sinLeer':
      return { titulo: '¡Estás al día!', descripcion: 'No tenés notificaciones sin leer.' };
    case 'solicitudes':
      return {
        titulo: 'Sin novedades de solicitudes',
        descripcion: 'Cuando una solicitud avance, vas a verlo acá.',
      };
    case 'mascotas':
      return {
        titulo: 'Sin novedades de mascotas',
        descripcion: 'Los avisos de tus favoritos y de los seguimientos aparecen acá.',
      };
    default:
      return { titulo: 'No hay notificaciones', descripcion: 'Probá con otro filtro.' };
  }
}

export default function NotificacionesScreen() {
  const router = useRouter();
  const toast = useToast();
  const [filtro, setFiltro] = useState<FiltroNotificaciones>('todas');
  const [hojaFiltros, setHojaFiltros] = useState(false);

  const cargarPagina = useCallback(async (cursor: number | null) => {
    const pagina = await listarNotificaciones(cursor);
    return {
      items: pagina.notificaciones,
      hayMas: pagina.hayMas,
      proximoCursor: pagina.proximoCursor,
    };
  }, []);

  const lista = usePaginacionCursor<NotificacionItem>({
    cargarPagina,
    claveDe: claveDeNotificacion,
    mensajeSinConexion: MENSAJE_SIN_CONEXION,
  });

  const hayNoLeidas = lista.items.some((item) => !item.leido);

  const visibles = useMemo(
    () => lista.items.filter((item) => cumpleFiltro(item, filtro)),
    [lista.items, filtro],
  );
  const filas = useMemo<FilaBandeja[]>(() => agruparPorDia(visibles), [visibles]);

  // Con un filtro puesto, la primera página puede traer pocas que coincidan: se siguen pidiendo
  // hasta llenar la pantalla. `cargarMas` ignora el pedido si ya hay uno en viaje o falló.
  const { hayMas, cargandoMas, errorMas, cargarMas } = lista;
  useEffect(() => {
    if (
      filtro !== 'todas' &&
      visibles.length < MINIMO_CON_FILTRO &&
      hayMas &&
      !cargandoMas &&
      !errorMas
    ) {
      cargarMas();
    }
  }, [filtro, visibles.length, hayMas, cargandoMas, errorMas, cargarMas]);

  const { quitar, reemplazar } = lista;

  const marcarComoLeida = useCallback(
    (item: NotificacionItem) => {
      if (item.leido) return;
      reemplazar({ ...item, leido: true });
      marcarLeida(item.id).catch(() => {
        // Si falla, vuelve a quedar sin leer: lo que se ve tiene que ser lo que hay.
        reemplazar(item);
        toast.mostrarError('No pudimos marcarla como leída. Intentalo de nuevo.');
      });
    },
    [reemplazar, toast],
  );

  const abrir = useCallback(
    (item: NotificacionItem) => {
      marcarComoLeida(item);

      const ruta = rutaDeNotificacion(item.entidadTipo, item.entidadId);
      if (ruta) router.push(ruta as never);
    },
    [marcarComoLeida, router],
  );

  const eliminar = useCallback(
    async (item: NotificacionItem): Promise<boolean> => {
      try {
        await eliminarNotificacion(item.id);
        // Recién con la baja confirmada: si falla, la fila vuelve y el toast lo explica.
        quitar(item.id);
        return true;
      } catch {
        toast.mostrarError('No pudimos eliminar la notificación. Intentalo de nuevo.');
        return false;
      }
    },
    [quitar, toast],
  );

  const marcarTodas = useCallback(async () => {
    try {
      await marcarTodasLeidas();
      vibrar.exito();
      lista.recargar();
    } catch {
      toast.mostrarError('No pudimos marcar todas como leídas. Intentalo de nuevo.');
    }
  }, [lista, toast]);

  const vacio = textosVacio(filtro, lista.items.length > 0);

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla
          titulo="Notificaciones"
          onVolver={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          derecha={
            <View className="flex-row items-center gap-2">
              {lista.items.length > 0 ? (
                <BotonCircular
                  icono="options-outline"
                  etiqueta="Filtrar notificaciones"
                  contador={filtro === 'todas' ? 0 : 1}
                  onPress={() => setHojaFiltros(true)}
                />
              ) : null}
              {hayNoLeidas ? (
                <BotonCircular
                  icono="checkmark-done-outline"
                  etiqueta="Marcar todas como leídas"
                  onPress={() => void marcarTodas()}
                />
              ) : null}
            </View>
          }
        />

        {lista.cargando ? (
          <EstadoCargando />
        ) : lista.error ? (
          <EstadoError mensaje={lista.error} onAccion={lista.recargar} />
        ) : (
          <>
            <FlatList
              data={filas}
              keyExtractor={(fila) => fila.clave}
              renderItem={({ item: fila }) =>
                fila.tipo === 'cabecera' ? (
                  <CabeceraDeDia etiqueta={fila.etiqueta} />
                ) : (
                  <FilaNotificacion
                    item={fila.item}
                    onPress={() => abrir(fila.item)}
                    onMarcarLeida={() => marcarComoLeida(fila.item)}
                    onEliminar={() => eliminar(fila.item)}
                  />
                )
              }
              onEndReached={lista.cargarMas}
              onEndReachedThreshold={0.4}
              ListEmptyComponent={
                <EstadoVacio
                  icono="notifications-outline"
                  titulo={vacio.titulo}
                  descripcion={vacio.descripcion}
                />
              }
              ListFooterComponent={
                lista.cargandoMas ? (
                  <EstadoCargando />
                ) : lista.errorMas ? (
                  <Pressable onPress={lista.reintentarMas} className="items-center py-4">
                    <Text className="font-cuerpo-semi text-sm text-organic-accent-600">
                      No se pudo cargar más — reintentar
                    </Text>
                  </Pressable>
                ) : undefined
              }
              contentContainerClassName="px-3.5 pb-10"
              refreshing={lista.refrescando}
              onRefresh={lista.refrescar}
            />
          </>
        )}
      </SafeAreaView>

      {/* Son pocas opciones: una hojita alcanza, no hace falta una pantalla entera. */}
      <HojaOpciones
        visible={hojaFiltros}
        titulo="Filtrar notificaciones"
        opciones={OPCIONES_FILTRO.map((opcion) => ({
          icono: ICONO_FILTRO[opcion.valor],
          etiqueta: opcion.etiqueta,
          activa: filtro === opcion.valor,
          onPress: () => {
            setFiltro(opcion.valor);
            setHojaFiltros(false);
          },
        }))}
        onCerrar={() => setHojaFiltros(false)}
      />
    </View>
  );
}
