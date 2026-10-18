/**
 * Editar un aviso de mascota perdida o encontrada — HU-13.3. Se entra desde el popup del aviso
 * propio ("Editar"), en Mis publicaciones, el portal o la tarjeta del chat.
 *
 * Trae el aviso fresco por su id en vez de recibirlo de la pantalla anterior: así no se edita
 * una copia vieja, y si se eliminó mientras tanto se dice. El formulario es el mismo del alta
 * (`FormularioAviso`), que al volver deja el aviso actualizado para quien abrió la edición.
 *
 * Un aviso resuelto no se edita (decisión del 2026-10-18): el popup ya no ofrece "Editar" y el
 * backend lo rechaza con `AVISO_RESUELTO`. Esto cubre llegar igual por un link o con el aviso
 * resuelto desde otro teléfono.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { FormularioAviso } from '@/components/perdidos/FormularioAviso';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { ApiError } from '@/services/api';
import { estaResuelto, obtenerAviso, type AvisoPerdido } from '@/services/animalesPerdidos';

export default function EditarAvisoPerdidoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const avisoId = Number(id);

  const [aviso, setAviso] = useState<AvisoPerdido | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** El aviso existe y es propio, pero el caso está cerrado: no hay nada que reintentar. */
  const [resuelto, setResuelto] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(avisoId) || avisoId <= 0) {
      setError('El aviso no es válido.');
      return;
    }

    setError(null);
    try {
      const cargado = await obtenerAviso(avisoId, null);
      // Sólo se llega acá desde un aviso propio; esto cubre un link armado a mano.
      if (!cargado.esPropio) {
        setError('Sólo quien publicó el aviso puede editarlo.');
        return;
      }
      if (estaResuelto(cargado)) {
        setResuelto(true);
        return;
      }
      setAviso(cargado);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No pudimos cargar el aviso. Revisá tu conexión e intentalo de nuevo.',
      );
    }
  }, [avisoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (aviso) return <FormularioAviso aviso={aviso} />;

  // Mientras carga (o si falló) va la misma cabecera del formulario, para que no salte.
  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla barra titulo="Editar aviso" onVolver={() => router.back()} />

        {resuelto ? (
          <EstadoError
            icono="heart-circle-outline"
            mensaje="Este caso ya está resuelto, así que el aviso no se puede editar."
            etiquetaAccion="Volver"
            onAccion={() => router.back()}
          />
        ) : error ? (
          <EstadoError mensaje={error} onAccion={() => void cargar()} />
        ) : (
          <EstadoCargando />
        )}
      </SafeAreaView>
    </View>
  );
}
