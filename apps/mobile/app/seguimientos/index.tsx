/**
 * HU-9.2 Ver seguimientos — listado de las solicitudes que están en seguimiento.
 *
 * Es la puerta de entrada a GUI-21. El endpoint devuelve de una las dos caras del vínculo
 * (lo que el usuario tiene a su cuidado y lo que entregó), así que la pantalla no pregunta
 * el rol: cada tarjeta trae el suyo y se pinta en consecuencia.
 *
 * Se separan en dos secciones porque son dos tareas distintas: en una hay que responder, en
 * la otra sólo controlar. Mezcladas, lo que el usuario tiene pendiente se pierde entre lo
 * que sólo mira.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { TarjetaSolicitudSeguimiento } from '@/components/seguimiento/TarjetaSolicitudSeguimiento';
import { PALETA } from '@/constants/theme';
import { listarMisSeguimientos, type SolicitudEnSeguimiento } from '@/services/seguimiento';

/**
 * Cada cuánto se recalculan las cuentas regresivas ("quedan 5 horas"). Es un re-render
 * local, sin pedirle nada al servidor: el minuto es la unidad más chica que muestra
 * `tiempoHasta`, así que con este intervalo ningún texto queda viejo.
 */
const REFRESCO_TEXTOS_MS = 60_000;

export default function SeguimientosScreen() {
  const router = useRouter();

  const [solicitudes, setSolicitudes] = useState<SolicitudEnSeguimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), REFRESCO_TEXTOS_MS);
    return () => clearInterval(id);
  }, []);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setSolicitudes(await listarMisSeguimientos());
      setAhora(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar tus seguimientos.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  // Al volver de responder un pedido cambian los totales y el pendiente, así que se recarga
  // cada vez que la pantalla toma el foco y no sólo al montarla.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const { aCargo, entregadas } = useMemo(
    () => ({
      aCargo: solicitudes.filter((solicitud) => solicitud.rol === 'ADOPTANTE'),
      entregadas: solicitudes.filter((solicitud) => solicitud.rol === 'PUBLICADOR'),
    }),
    [solicitudes],
  );

  const abrir = (solicitudId: number): void =>
    router.push({ pathname: '/seguimientos/[solicitudId]', params: { solicitudId } });

  const seccion = (titulo: string, ayuda: string, items: SolicitudEnSeguimiento[]) =>
    items.length === 0 ? null : (
      <View className="mb-5">
        <Text className="mb-1 text-sm font-bold text-gray-900">{titulo}</Text>
        <Text className="mb-3 text-xs text-gray-500">{ayuda}</Text>

        {items.map((solicitud) => (
          <TarjetaSolicitudSeguimiento
            key={solicitud.solicitudId}
            solicitud={solicitud}
            ahora={ahora}
            onPress={() => abrir(solicitud.solicitudId)}
          />
        ))}
      </View>
    );

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
            <Text className="text-2xl font-bold text-pethood-orange">Seguimientos</Text>
            <Text className="text-xs text-gray-500">Adopciones y tránsitos en curso</Text>
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
        ) : solicitudes.length === 0 ? (
          <EstadoVacio
            icono="footsteps-outline"
            titulo="Todavía no hay seguimientos"
            descripcion="Cuando se apruebe una adopción o un tránsito, acá vas a ver cómo va la mascota."
          />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pb-10"
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => {
                  setRefrescando(true);
                  void cargar();
                }}
                tintColor={PALETA.pethood.naranja}
                colors={[PALETA.pethood.naranja]}
              />
            }
          >
            {seccion(
              'A tu cuidado',
              'Respondé las preguntas antes de que venza el plazo de 48 horas.',
              aCargo,
            )}
            {seccion(
              'Mascotas que entregaste',
              'Mirá si quien las tiene está mandando las actualizaciones.',
              entregadas,
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
