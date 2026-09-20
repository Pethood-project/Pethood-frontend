/**
 * GUI-08 Chat Adoptante / GUI-31 Chat Refugio — HU-5.1: listado de conversaciones activas.
 *
 * Una sola pantalla para los dos roles. Los artboards son idénticos salvo la cabecera
 * (título, subtítulo y placeholder del buscador), así que lo único condicionado por rol es
 * ese bloque; la lista, la fila y los estados son los mismos.
 *
 * Sólo lectura: abrir una conversación y enviar mensajes es HU-5.2, y filtrar es HU-5.3.
 *
 * El estado de la lista (carga, refresco y tiempo real) vive en `useListaChats`; acá sólo se
 * pinta.
 *
 * Estilo del artboard 07 (adoptante) / 18 (refugio) del diseño Organic, sobre una maqueta
 * de 262px con el factor ×1,33: cabecera en `neutral-100` con borde inferior `neutral-300`
 * y padding 10/16 → 13/21; título en Caprasimo 18 → 24 (17 → 23 en refugio) en `accent-600`;
 * subtítulo del refugio 9 → 12 en `neutral-600`; la lista con 4 → 5 de aire arriba y abajo y
 * un separador `neutral-300` entre filas.
 */
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilaConversacion } from '@/components/chat/FilaConversacion';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { BarraBusqueda } from '@/components/ui/BarraBusqueda';
import { PALETA } from '@/constants/theme';
import { useListaChats } from '@/hooks/useListaChats';
import { useSesion } from '@/hooks/useSesion';

/** Separador entre filas: 1px `neutral-300`, a todo el ancho, como en el diseño. */
function SeparadorFilas() {
  return <View className="h-px bg-organic-neutral-300" />;
}

/**
 * Cada cuánto se recalculan los textos relativos ("Hace 5 min").
 *
 * Es un re-render local, sin pedirle nada al servidor: el minuto es la unidad más chica del
 * criterio 6, así que con este intervalo ningún texto queda viejo. El listado en sí se
 * recarga al enfocar la pantalla y se actualiza por socket cuando llega un mensaje.
 */
const REFRESCO_TEXTOS_MS = 60_000;

/**
 * Subtítulo de GUI-31: "Refugio Esperanza · 4 sin leer".
 *
 * El nombre del refugio viaja en la sesión desde que el backend lo sumó a la respuesta de
 * auth. Una sesión guardada antes de ese cambio no lo tiene: ahí se muestra sólo el
 * contador, que es lo que el diseño pone a la derecha del punto.
 */
function subtituloRefugio(sinLeer: number, refugio: string | null): string {
  const contador = sinLeer === 1 ? '1 sin leer' : `${sinLeer} sin leer`;
  return refugio ? `${refugio} · ${contador}` : contador;
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
  const { esRefugio, usuario } = useSesion();
  const router = useRouter();

  const { chats, cargando, refrescando, error, recargar, refrescar } = useListaChats();

  /**
   * Instante contra el que las filas calculan su texto relativo. Avanza solo cada minuto
   * para que "Hace 5 min" no se quede viejo con la pantalla abierta.
   */
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), REFRESCO_TEXTOS_MS);
    return () => clearInterval(id);
  }, []);

  // Cada vez que la lista cambia (recarga o mensaje por socket) el reloj también se pone al
  // día, para que un mensaje recién llegado no aparezca con la marca del tick anterior.
  useEffect(() => {
    setAhora(new Date());
  }, [chats]);

  const sinLeer = useMemo(
    () => chats.reduce((total, chat) => total + chat.noLeidos, 0),
    [chats],
  );

  const vacio = chats.length === 0;

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="border-b border-organic-neutral-300 bg-organic-neutral-100 px-[21px] py-[13px]">
          {esRefugio ? (
            <>
              <Text className="font-titulo text-[23px] leading-[28px] text-organic-accent-600">
                Mensajes del Refugio
              </Text>
              <Text
                numberOfLines={1}
                className="mt-[4px] font-cuerpo text-[12px] text-organic-neutral-600"
              >
                {subtituloRefugio(sinLeer, usuario?.refugio?.nombre ?? null)}
              </Text>
            </>
          ) : (
            <Text className="font-titulo text-[24px] leading-[29px] text-organic-accent-600">
              Mensajes
            </Text>
          )}

          {/* Criterio 2: sin conversaciones el buscador SE MUESTRA, deshabilitado. Con
              conversaciones se ve normal pero todavía no filtra: eso es HU-5.3. */}
          <View className="mt-[12px]">
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
          <EstadoError mensaje={error} onAccion={recargar} />
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
            ItemSeparatorComponent={SeparadorFilas}
            ListEmptyComponent={ListaVacia}
            contentContainerStyle={vacio ? { flexGrow: 1 } : { paddingVertical: 5 }}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={refrescar}
                tintColor={PALETA.accent[600]}
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
