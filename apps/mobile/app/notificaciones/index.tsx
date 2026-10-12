/**
 * Bandeja de notificaciones (spec 004). Lista paginada de más reciente a más antigua, con
 * estado leído/no leído, marcar todas, eliminar y estado vacío. Se accede desde la campana
 * de Inicio.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { PALETA } from '@/constants/theme';
import { usePaginacionCursor } from '@/hooks/usePaginacionCursor';
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

interface FilaNotificacionProps {
  item: NotificacionItem;
  onPress: () => void;
  onEliminar: () => void;
}

function FilaNotificacion({ item, onPress, onEliminar }: FilaNotificacionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`mb-2.5 flex-row items-start gap-3 rounded-2xl p-3.5 active:opacity-90 ${
        item.leido ? 'bg-organic-surface' : 'bg-organic-accent-100'
      }`}
    >
      <View
        className={`mt-0.5 h-9 w-9 items-center justify-center rounded-full ${
          item.leido ? 'bg-organic-neutral-200' : 'bg-organic-accent-200'
        }`}
      >
        <Ionicons
          name={item.leido ? 'notifications-outline' : 'notifications'}
          size={17}
          color={item.leido ? PALETA.neutral[600] : PALETA.accent[700]}
        />
      </View>

      <View className="min-w-0 flex-1">
        <Text
          className={`font-cuerpo text-sm text-organic-neutral-900 ${item.leido ? '' : 'font-cuerpo-semi'}`}
        >
          {item.mensaje}
        </Text>
        <Text className="mt-1 font-cuerpo text-xs text-organic-neutral-500">
          {tiempoRelativo(new Date(item.fechaAlta))}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Eliminar notificación"
        onPress={onEliminar}
        hitSlop={8}
        className="p-1"
      >
        <Ionicons name="close" size={16} color={PALETA.neutral[400]} />
      </Pressable>
    </Pressable>
  );
}

export default function NotificacionesScreen() {
  const router = useRouter();
  const toast = useToast();

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
    claveDe: (item) => item.id,
    mensajeSinConexion: MENSAJE_SIN_CONEXION,
  });

  const hayNoLeidas = lista.items.some((item) => !item.leido);

  const abrir = useCallback(
    async (item: NotificacionItem) => {
      if (!item.leido) {
        marcarLeida(item.id).catch(() => undefined);
      }

      const ruta = rutaDeNotificacion(item.entidadTipo, item.entidadId);
      if (ruta) router.push(ruta as never);
    },
    [router],
  );

  const eliminar = useCallback(
    async (item: NotificacionItem) => {
      try {
        await eliminarNotificacion(item.id);
      } catch {
        toast.mostrarError('No pudimos eliminar la notificación. Intentalo de nuevo.');
      }
    },
    [toast],
  );

  const marcarTodas = useCallback(async () => {
    try {
      await marcarTodasLeidas();
      lista.recargar();
    } catch {
      toast.mostrarError('No pudimos marcar todas como leídas. Intentalo de nuevo.');
    }
  }, [lista, toast]);

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between gap-3 px-[22px] pb-3.5 pt-2">
          <View className="flex-row items-center gap-3">
            <BotonCircular
              icono="arrow-back"
              etiqueta="Volver"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            />
            <Text className="font-titulo text-[22px] leading-[22px] text-organic-accent-600">
              Notificaciones
            </Text>
          </View>

          {hayNoLeidas ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void marcarTodas()}
              className="px-1 py-2"
            >
              <Text className="font-cuerpo-semi text-[13px] text-organic-accent-600">
                Marcar todas
              </Text>
            </Pressable>
          ) : null}
        </View>

        {lista.cargando ? (
          <EstadoCargando />
        ) : lista.error ? (
          <EstadoError mensaje={lista.error} onAccion={lista.recargar} />
        ) : (
          <FlatList
            data={lista.items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <FilaNotificacion
                item={item}
                onPress={() => void abrir(item)}
                onEliminar={() => void eliminar(item)}
              />
            )}
            onEndReached={lista.cargarMas}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <EstadoVacio
                icono="notifications-outline"
                titulo="Todavía no tenés notificaciones"
                descripcion="Cuando pase algo importante, lo vas a ver acá."
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
              ) : null
            }
            contentContainerClassName="px-3.5 py-1 pb-10"
            refreshing={lista.refrescando}
            onRefresh={lista.refrescar}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
