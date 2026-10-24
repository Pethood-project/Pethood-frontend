/**
 * GUI de reputación (Módulo 10): muestra la reputación recibida por el perfil activo (la
 * persona o el refugio) y, arriba, un aviso tipo notificación con la cantidad de reseñas
 * pendientes. La lista de pendientes y el modal para reseñar viven en `/resenas/pendientes`.
 *
 * El switch refugio/adoptante decide de quién es la reputación que se ve y qué transacciones
 * se ofrecen: el backend deriva las partes de cada solicitud y filtra por el perfil activo.
 *
 * También sirve para ver todas las reseñas de un refugio ajeno (`?tipo=refugio&id=<id>`),
 * que es adonde lleva "Ver más reseñas" de la ficha de una publicación. En ese caso no hay
 * pendientes: son las del que mira, no las del refugio.
 *
 * Se muestran las últimas 3 reseñas y el resto se pide de a páginas con "Ver más reseñas".
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { ResumenReputacion } from '@/components/resenas/ResumenReputacion';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { listarTransaccionesElegibles } from '@/services/resenas';

/** Aviso con campanita y contador; al tocarlo se abre la lista de pendientes. */
function AvisoPendientes({ cantidad, onPress }: { cantidad: number; onPress: () => void }) {
  const titulo =
    cantidad === 1 ? 'Tenés 1 reseña pendiente' : `Tenés ${cantidad} reseñas pendientes`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. Tocá para verlas`}
      onPress={onPress}
      className="mb-6 flex-row items-center gap-3 rounded-2xl border border-organic-accent-200 bg-organic-accent-100 p-3.5 active:opacity-90"
    >
      <View>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-organic-accent-600">
          <Ionicons name="notifications" size={22} color="#FFFFFF" />
        </View>
        <View className="absolute -right-1 -top-1 h-[20px] min-w-[20px] items-center justify-center rounded-full border-2 border-organic-accent-100 bg-organic-neutral-900 px-1">
          <Text className="font-cuerpo-semi text-[10px] leading-[12px] text-white">
            {cantidad > 99 ? '99+' : cantidad}
          </Text>
        </View>
      </View>

      <View className="flex-1">
        <Text className="font-cuerpo-semi text-[14px] text-organic-neutral-900">{titulo}</Text>
        <Text className="mt-0.5 font-cuerpo text-[12px] text-organic-neutral-600">
          Tocá para valorar a la otra parte
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={PALETA.accent[600]} />
    </Pressable>
  );
}

/** Cuántas reseñas se ven de entrada; el resto se pide con "Ver más reseñas". */
const RESENAS_VISIBLES = 3;

export default function ResenasScreen() {
  const router = useRouter();
  const { usuario, vistaRefugio } = useSesion();
  const { tipo, id } = useLocalSearchParams<{ tipo?: string; id?: string }>();

  // Reseñas de un refugio ajeno: llegan por parámetro y no hay nada pendiente que mostrar.
  const refugioAjenoId = tipo === 'refugio' && id && /^\d+$/.test(id) ? Number(id) : null;

  const [pendientes, setPendientes] = useState(0);
  const [cargando, setCargando] = useState(refugioAjenoId === null);
  const [error, setError] = useState<string | null>(null);
  // Cambia de valor cada vez que la pantalla toma foco, para que la reputación se vuelva a
  // pedir (por ejemplo, tras publicar una reseña desde la pantalla de pendientes).
  const [refrescoReputacion, setRefrescoReputacion] = useState(0);

  const cargar = useCallback(async (): Promise<void> => {
    if (refugioAjenoId !== null) return;

    setError(null);

    try {
      setPendientes((await listarTransaccionesElegibles()).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar las reseñas pendientes.');
    } finally {
      setCargando(false);
    }
  }, [refugioAjenoId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
      setRefrescoReputacion((n) => n + 1);
    }, [cargar]),
  );

  const refugioId = usuario?.refugio?.id ?? null;
  const reputacionTipo: 'usuario' | 'refugio' =
    refugioAjenoId !== null || (vistaRefugio && refugioId) ? 'refugio' : 'usuario';
  const reputacionId =
    refugioAjenoId ?? (reputacionTipo === 'refugio' ? refugioId! : usuario?.id);

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla
          titulo="Reseñas"
          onVolver={() =>
            router.canGoBack() ? router.back() : router.replace('/(tabs)/perfil' as Href)
          }
        />

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
          <ScrollView contentContainerClassName="px-4 pb-10">
            {pendientes > 0 && refugioAjenoId === null ? (
              <AvisoPendientes
                cantidad={pendientes}
                onPress={() => router.push('/resenas/pendientes' as Href)}
              />
            ) : null}

            {reputacionId ? (
              <ResumenReputacion
                key={refrescoReputacion}
                tipo={reputacionTipo}
                id={reputacionId}
                titulo={
                  refugioAjenoId !== null
                    ? 'Reseñas del refugio'
                    : reputacionTipo === 'refugio'
                      ? 'Reputación del refugio'
                      : 'Tu reputación'
                }
                mostrarLista
                limiteInicial={RESENAS_VISIBLES}
              />
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
