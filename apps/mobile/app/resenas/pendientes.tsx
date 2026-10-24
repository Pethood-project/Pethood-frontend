/**
 * Reseñas pendientes (Módulo 10): lista las transacciones ya concretadas que el usuario
 * todavía no reseñó y permite crearlas con el modal. Se llega desde el aviso de la pantalla
 * de Reseñas.
 */
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { FilaPendiente } from '@/components/resenas/FilaPendiente';
import { ResenaModal } from '@/components/resenas/ResenaModal';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import {
  crearResena,
  listarTransaccionesElegibles,
  type TransaccionElegible,
} from '@/services/resenas';

export default function ResenasPendientesScreen() {
  const router = useRouter();
  const toast = useToast();

  const [elegibles, setElegibles] = useState<TransaccionElegible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<TransaccionElegible | null>(null);
  const [enviando, setEnviando] = useState(false);

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
      toast.mostrarExito('¡Gracias! Tu reseña ya quedó publicada.');
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos publicar la reseña. Intentalo de nuevo.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla
          titulo="Pendientes"
          subtitulo={
            !cargando && !error && elegibles.length > 0
              ? `${elegibles.length} ${elegibles.length === 1 ? 'reseña por hacer' : 'reseñas por hacer'}`
              : undefined
          }
          onVolver={() =>
            router.canGoBack() ? router.back() : router.replace('/resenas' as Href)
          }
        />

        {cargando ? (
          <EstadoCargando />
        ) : error ? (
          <EstadoError mensaje={error} onAccion={() => void cargar()} />
        ) : elegibles.length === 0 ? (
          <EstadoVacio
            icono="star-outline"
            titulo="No tenés reseñas pendientes"
            descripcion="Cuando una adopción o un tránsito se concrete, vas a poder valorar a la otra parte desde acá."
          />
        ) : (
          <ScrollView contentContainerClassName="px-4 pb-10">
            <View className="gap-2.5">
              {elegibles.map((transaccion) => (
                <FilaPendiente
                  key={transaccion.solicitudId}
                  transaccion={transaccion}
                  onResenar={setSeleccionada}
                />
              ))}
            </View>
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
