/**
 * GUI-08 Chat Adoptante / GUI-31 Chat Refugio — HU-5.1: listado de conversaciones activas.
 *
 * Una sola pantalla para los dos roles. Los artboards son idénticos salvo la cabecera
 * (título, subtítulo y placeholder del buscador), así que lo único condicionado por rol es
 * ese bloque; la lista, la fila y los estados son los mismos.
 *
 * Sólo lectura: abrir una conversación y enviar mensajes es HU-5.2, y filtrar es HU-5.3.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilaConversacion } from '@/components/chat/FilaConversacion';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { BarraBusqueda } from '@/components/ui/BarraBusqueda';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { listarChats, type Conversacion } from '@/services/chats';

/**
 * Cada cuánto se recalculan los textos relativos ("Hace 5 min").
 *
 * Es un re-render local, sin pedirle nada al servidor: el minuto es la unidad más chica del
 * criterio 6, así que con este intervalo ningún texto queda viejo. El listado en sí se
 * recarga al enfocar la pantalla — esta HU no pide tiempo real.
 */
const REFRESCO_TEXTOS_MS = 60_000;

/**
 * Subtítulo de GUI-31. El diseño lo muestra como "Refugio Esperanza · 4 sin leer", pero el
 * nombre del refugio no viaja en la sesión: `Usuario` (types/auth.ts) sólo trae los roles,
 * no a qué refugio pertenece la persona. Se muestra la parte que sí tenemos en vez de
 * inventar un pedido a la API — queda anotado como pendiente.
 */
function subtituloRefugio(sinLeer: number): string {
  return sinLeer === 1 ? '1 sin leer' : `${sinLeer} sin leer`;
}

function ListaVacia() {
  return (
    <EstadoVacio
      icono="chatbubbles-outline"
      // Textos literales del criterio 2 de la HU.
      titulo="¡Tu bandeja de entrada está vacía!"
      descripcion="Explora mascotas para empezar una conversación."
    />
  );
}

export default function ChatScreen() {
  const { esRefugio } = useSesion();
  const router = useRouter();

  const [chats, setChats] = useState<Conversacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Instante contra el que las filas calculan su texto relativo. Avanza solo cada minuto
   * para que "Hace 5 min" no se quede viejo con la pantalla abierta.
   */
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), REFRESCO_TEXTOS_MS);
    return () => clearInterval(id);
  }, []);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setChats((await listarChats()).chats);
      // Al traer datos nuevos el reloj también se pone al día, para que un mensaje recién
      // llegado no aparezca con la marca del tick anterior.
      setAhora(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar tus conversaciones.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  // Al volver de una conversación cambiaron los no leídos y el último mensaje, así que se
  // recarga cada vez que la pantalla toma el foco y no sólo al montarla.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const sinLeer = useMemo(
    () => chats.reduce((total, chat) => total + chat.noLeidos, 0),
    [chats],
  );

  const vacio = chats.length === 0;

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="border-b border-organic-neutral-200 bg-white/85 px-4 py-2.5">
          <Text className="text-xl font-bold text-pethood-orange">
            {esRefugio ? 'Mensajes del Refugio' : 'Mensajes'}
          </Text>

          {esRefugio ? (
            <Text className="mt-0.5 text-xs text-organic-neutral-500">
              {subtituloRefugio(sinLeer)}
            </Text>
          ) : null}

          {/* Criterio 2: sin conversaciones el buscador SE MUESTRA, deshabilitado. Con
              conversaciones se ve normal pero todavía no filtra: eso es HU-5.3. */}
          <View className="mt-2.5">
            <BarraBusqueda
              placeholder={esRefugio ? 'Buscar...' : 'Buscar conversaciones...'}
              deshabilitada={vacio}
              accessibilityLabel="Buscar conversaciones"
            />
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
            data={chats}
            keyExtractor={(chat) => String(chat.chatId)}
            renderItem={({ item }) => (
              <FilaConversacion
                conversacion={item}
                ahora={ahora}
                // HU-5.2: sólo viaja el chatId. El nombre y la foto los resuelve la
                // cabecera de la sala, para que abrirla desde una notificación o un deep
                // link no dependa de haber pasado por acá.
                onPress={() => router.push(`/chats/${item.chatId}`)}
              />
            )}
            ListEmptyComponent={ListaVacia}
            contentContainerStyle={vacio ? { flexGrow: 1 } : { paddingVertical: 4 }}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => {
                  setRefrescando(true);
                  void cargar();
                }}
                tintColor={PALETA.pethood.naranja}
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
