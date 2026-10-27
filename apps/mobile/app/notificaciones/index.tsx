/**
 * Bandeja de notificaciones (spec 004). Lista paginada de más reciente a más antigua, con
 * estado leído/no leído, marcar todas, eliminar (deslizando la fila a la izquierda) y estado
 * vacío. Se accede desde la campana de Inicio.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { DeslizarParaEliminar } from '@/components/notificaciones/DeslizarParaEliminar';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
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

/** Estable, fuera del componente: ver el contrato de `usePaginacionCursor`. */
const claveDeNotificacion = (item: NotificacionItem): number => item.id;

interface FilaNotificacionProps {
  item: NotificacionItem;
  onPress: () => void;
  /** `false` si no se pudo eliminar: la fila vuelve a aparecer. */
  onEliminar: () => Promise<boolean>;
}

/** Se elimina deslizándola hacia la izquierda (ver `DeslizarParaEliminar`). */
function FilaNotificacion({ item, onPress, onEliminar }: FilaNotificacionProps) {
  return (
    <DeslizarParaEliminar onEliminar={onEliminar} separacion={10} radio={16}>
      <Pressable
        accessibilityRole="button"
        // Sin la X, el lector de pantalla no tiene cómo deslizar: se le ofrece como acción.
        accessibilityActions={[{ name: 'eliminar', label: 'Eliminar notificación' }]}
        onAccessibilityAction={(evento) => {
          if (evento.nativeEvent.actionName === 'eliminar') void onEliminar();
        }}
        onPress={onPress}
        // El fondo es opaco a propósito: con uno translúcido se vería la acción de atrás.
        className={`flex-row items-start gap-3 rounded-2xl p-3.5 active:opacity-90 ${
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
      </Pressable>
    </DeslizarParaEliminar>
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
    claveDe: claveDeNotificacion,
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

  const { quitar } = lista;
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
      lista.recargar();
    } catch {
      toast.mostrarError('No pudimos marcar todas como leídas. Intentalo de nuevo.');
    }
  }, [lista, toast]);

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla
          titulo="Notificaciones"
          onVolver={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          derecha={
            hayNoLeidas ? (
              <BotonCircular
                icono="checkmark-done-outline"
                etiqueta="Marcar todas como leídas"
                onPress={() => void marcarTodas()}
              />
            ) : null
          }
        />

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
                onEliminar={() => eliminar(item)}
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
              ) : undefined
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
