/**
 * GUI de reputación (Módulo 10): lista las transacciones ya concretadas pendientes de
 * reseñar, permite crearlas con el modal, y muestra la reputación recibida por el perfil
 * activo (la persona o el refugio).
 *
 * El switch refugio/adoptante decide de quién es la reputación que se ve y qué transacciones
 * se ofrecen: el backend deriva las partes de cada solicitud y filtra por el perfil activo.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { ResenaModal } from '@/components/resenas/ResenaModal';
import { ResumenReputacion } from '@/components/resenas/ResumenReputacion';
import { Avatar } from '@/components/ui/Avatar';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { Chip } from '@/components/ui/Chip';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { urlAbsoluta } from '@/services/api';
import {
  crearResena,
  etiquetaFlujo,
  listarTransaccionesElegibles,
  type TransaccionElegible,
} from '@/services/resenas';

/** Una fila de transacción pendiente, con el CTA para abrir el modal. */
function FilaPendiente({
  transaccion,
  onResenar,
}: {
  transaccion: TransaccionElegible;
  onResenar: (transaccion: TransaccionElegible) => void;
}) {
  const foto = urlAbsoluta(transaccion.mascota.imagenUrl);

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-organic-surface p-3 shadow-sm">
      {foto ? (
        <Image source={{ uri: foto }} className="h-14 w-14 rounded-xl" />
      ) : (
        <View className="h-14 w-14 items-center justify-center rounded-xl bg-organic-accent-100">
          <Ionicons name="paw-outline" size={22} color={PALETA.accent[600]} />
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Avatar
            uri={urlAbsoluta(transaccion.contraparte.imagenUrl)}
            nombre={transaccion.contraparte.nombre}
            tamanio={24}
            variante="organic"
            tono={transaccion.contraparte.tipo === 'REFUGIO' ? 'acento' : 'neutro'}
          />
          <Text numberOfLines={1} className="flex-1 font-cuerpo-semi text-[14px] text-organic-neutral-900">
            {transaccion.contraparte.nombre}
          </Text>
        </View>
        <Text numberOfLines={1} className="mt-1 font-cuerpo text-[12px] text-organic-neutral-600">
          {transaccion.mascota.nombre ?? 'Mascota'} · {etiquetaFlujo(transaccion.flujo)}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Reseñar a ${transaccion.contraparte.nombre}`}
        onPress={() => onResenar(transaccion)}
        className="rounded-2xl bg-organic-accent-600 px-4 py-2.5 active:opacity-90"
      >
        <Text className="font-cuerpo-semi text-[13px] text-white">Reseñar</Text>
      </Pressable>
    </View>
  );
}

export default function ResenasScreen() {
  const router = useRouter();
  const toast = useToast();
  const { usuario, vistaRefugio } = useSesion();

  const [elegibles, setElegibles] = useState<TransaccionElegible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<TransaccionElegible | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Cambia de valor tras publicar una reseña, para que la reputación se vuelva a pedir.
  const [refrescoReputacion, setRefrescoReputacion] = useState(0);

  const cargar = useCallback(async (): Promise<void> => {
    setCargando(true);
    setError(null);

    try {
      setElegibles(await listarTransaccionesElegibles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar las reseñas pendientes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const enviar = async (puntuacion: number, comentario: string): Promise<void> => {
    if (!seleccionada) return;

    setEnviando(true);
    try {
      await crearResena({ solicitudId: seleccionada.solicitudId, puntuacion, comentario });
      setElegibles((actuales) =>
        actuales.filter((item) => item.solicitudId !== seleccionada.solicitudId),
      );
      setSeleccionada(null);
      setRefrescoReputacion((n) => n + 1);
      toast.mostrarExito('¡Gracias! Tu reseña ya quedó publicada.');
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos publicar la reseña. Intentalo de nuevo.',
      );
    } finally {
      setEnviando(false);
    }
  };

  const refugioId = usuario?.refugio?.id ?? null;
  const reputacionTipo: 'usuario' | 'refugio' = vistaRefugio && refugioId ? 'refugio' : 'usuario';
  const reputacionId = reputacionTipo === 'refugio' ? refugioId! : usuario?.id;

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 px-[22px] pb-3.5 pt-2">
          <BotonCircular
            icono="arrow-back"
            etiqueta="Volver"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/perfil' as Href))}
          />
          <Text className="font-titulo text-[22px] leading-[22px] text-organic-accent-600">
            Reseñas
          </Text>
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : error ? (
          <EstadoError mensaje={error} onAccion={() => void cargar()} />
        ) : (
          <ScrollView contentContainerClassName="px-4 pb-10">
            <Text className="mb-2 font-cuerpo-semi text-[11px] uppercase tracking-[0.6px] text-organic-neutral-500">
              Pendientes de reseñar
            </Text>

            {elegibles.length === 0 ? (
              <EstadoVacio
                icono="star-outline"
                titulo="No tenés reseñas pendientes"
                descripcion="Cuando una adopción o un tránsito se concrete, vas a poder valorar a la otra parte desde acá."
              />
            ) : (
              <View className="gap-2.5">
                {elegibles.map((transaccion) => (
                  <FilaPendiente
                    key={transaccion.solicitudId}
                    transaccion={transaccion}
                    onResenar={setSeleccionada}
                  />
                ))}
              </View>
            )}

            {reputacionId ? (
              <ResumenReputacion
                key={refrescoReputacion}
                tipo={reputacionTipo}
                id={reputacionId}
                titulo={reputacionTipo === 'refugio' ? 'Reputación del refugio' : 'Tu reputación'}
                mostrarLista
                className="mt-6"
              />
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>

      <ResenaModal
        transaccion={seleccionada}
        enviando={enviando}
        onEnviar={(puntuacion, comentario) => void enviar(puntuacion, comentario)}
        onCerrar={() => setSeleccionada(null)}
      />
    </View>
  );
}
