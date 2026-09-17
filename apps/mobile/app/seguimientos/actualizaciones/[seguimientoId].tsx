/**
 * HU-9.3 Revisar actualización de seguimiento — pantalla "Actualización Seguimiento".
 *
 * Sólo lectura, y sirve a los dos lados: el publicador (o el personal del refugio) revisa lo
 * que mandó el adoptante, y el adoptante relee lo que cargó él. Abrirla no marca nada como
 * visto ni cambia el estado del pedido (spec 011 §6.10).
 *
 * Es una ruta propia y no un hijo de `/seguimientos/[solicitudId]` porque HU-9.3 permite
 * llegar acá sin haber pasado por el expediente. Por eso el endpoint devuelve mascota,
 * adoptante y solicitud: son el contexto que la pantalla no tendría de dónde sacar.
 *
 * El segmento estático `actualizaciones` desambigua de `/seguimientos/[solicitudId]`, que ya
 * ocupa la forma `/seguimientos/:algo` para el expediente.
 *
 * No hay maqueta para esta pantalla en el canvas de referencia (llega hasta la 33, "Agregar
 * seguimiento"), así que se arma con los bloques de la 30 y la 33: tarjeta de la mascota,
 * bloque PREGUNTA y bloque de respuesta.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { NOMBRE_TIPO } from '@/components/seguimiento/etiquetas';
import { FotoMascota } from '@/components/ui/FotoMascota';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import { obtenerActualizacion, type ActualizacionSeguimiento } from '@/services/seguimiento';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

/** Cómo se ilustra el hueco cuando no hay actualización cargada. */
const ICONO_SIN_CARGA = {
  PENDIENTE: 'hourglass-outline',
  VENCIDO: 'close-circle-outline',
  COMPLETADO: 'checkmark-circle-outline',
} as const;

export default function ActualizacionSeguimientoDetalleScreen() {
  const { seguimientoId } = useLocalSearchParams<{ seguimientoId: string }>();
  const router = useRouter();
  const id = Number(seguimientoId);

  const [actualizacion, setActualizacion] = useState<ActualizacionSeguimiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(id) || id <= 0) {
      setError('El id de la actualización no es válido.');
      setCargando(false);
      return;
    }

    try {
      setError(null);
      setActualizacion(await obtenerActualizacion(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar la actualización.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  // Sin `useFocusEffect`: es sólo lectura y nada de lo que se abre desde acá la modifica,
  // así que recargarla al volver el foco sería un pedido al servidor que no aporta.
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const nombreMascota = actualizacion?.mascota.nombre ?? 'Sin nombre';
  const foto = urlAbsoluta(actualizacion?.fotoUrl);
  const respuesta = parsearFecha(actualizacion?.fechaRespuesta);

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-80"
          >
            <Ionicons name="chevron-back" size={20} color={PALETA.gris[600]} />
          </Pressable>

          <View className="flex-1">
            <Text className="text-2xl font-bold text-pethood-orange">Actualización</Text>
            {actualizacion ? (
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {nombreMascota} · {NOMBRE_TIPO[actualizacion.tipo]}
              </Text>
            ) : null}
          </View>
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : error || !actualizacion ? (
          <EstadoError
            mensaje={error ?? 'No pudimos cargar la actualización.'}
            icono="alert-circle-outline"
            onAccion={() => {
              setCargando(true);
              void cargar();
            }}
          />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pb-10"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <View className="flex-none">
                <FotoMascota
                  uri={urlAbsoluta(actualizacion.mascota.imagenUrl)}
                  tamanio={48}
                  accessibilityLabel={`Foto de ${nombreMascota}`}
                />
              </View>

              <View className="min-w-0 flex-1">
                <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                  {nombreMascota}
                </Text>
                <Text className="mt-0.5 text-[11px] text-gray-500" numberOfLines={1}>
                  {actualizacion.rol === 'ADOPTANTE'
                    ? 'Está a tu cuidado'
                    : `A cargo de ${actualizacion.adoptante.nombre} ${actualizacion.adoptante.apellido}`}
                </Text>
              </View>
            </View>

            <View className="mb-3 rounded-2xl bg-organic-surface p-3.5">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Pregunta {actualizacion.numero}
              </Text>
              <Text className="mt-1.5 text-base font-bold leading-6 text-gray-900">
                {actualizacion.pregunta}
              </Text>
            </View>

            {actualizacion.mensaje ? (
              // Sin actualización cargada. El texto viene del servidor con las palabras
              // literales de HU-9.3 y se muestra tal cual: no se reconstruye acá.
              <View className="items-center rounded-2xl bg-organic-surface px-6 py-10">
                <Ionicons
                  name={ICONO_SIN_CARGA[actualizacion.estado]}
                  size={34}
                  color={PALETA.gris[400]}
                />
                <Text className="mt-3 text-center text-sm leading-5 text-gray-500">
                  {actualizacion.mensaje}
                </Text>
              </View>
            ) : (
              <View className="rounded-2xl bg-white p-3.5 shadow-sm">
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Respuesta
                </Text>

                {respuesta ? (
                  <Text className="mt-1 text-[11px] text-gray-500">
                    Enviada el {aFechaVisible(respuesta)}
                  </Text>
                ) : null}

                <Text className="mt-2 text-sm leading-6 text-gray-700">
                  {actualizacion.descripcion}
                </Text>

                {foto ? (
                  <>
                    <Text className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Foto de prueba
                    </Text>
                    <Image
                      source={{ uri: foto }}
                      className="mt-2 h-64 w-full rounded-xl bg-pethood-beige-dark"
                      accessibilityLabel={`Foto de prueba de la actualización ${actualizacion.numero}`}
                    />
                  </>
                ) : null}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
