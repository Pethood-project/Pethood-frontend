/**
 * HU-9.2 Ver seguimientos — GUI-21 Seguimiento Adopción/Tránsito.
 *
 * Historial de una solicitud: la mascota arriba y debajo la lista de pedidos del más nuevo
 * al más viejo, tal como los manda el backend (no reordenar acá).
 *
 * El botón "Subir actualización" se habilita con `puedeSubirActualizacion`, que el servidor
 * ya calcula combinando rol y estado. No se recalcula en el cliente: el plazo de 48 h se
 * mide contra el reloj del servidor, y el del teléfono puede estar corrido.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { NOMBRE_TIPO } from '@/components/seguimiento/etiquetas';
import { FilaPedidoSeguimiento } from '@/components/seguimiento/FilaPedidoSeguimiento';
import { FotoMascota } from '@/components/ui/FotoMascota';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import {
  obtenerSeguimientoDeSolicitud,
  type DetalleSeguimiento,
  type PedidoSeguimiento,
} from '@/services/seguimiento';
import { parsearFecha, tiempoHasta } from '@/shared/validation/dates';

const REFRESCO_TEXTOS_MS = 60_000;

/**
 * Qué decir cuando no hay nada para responder. Sin esto, un botón gris sin explicación se
 * lee como que la app está rota en vez de como que todavía no toca.
 */
function motivoSinPedido(detalle: DetalleSeguimiento, ahora: Date): string {
  if (detalle.rol === 'PUBLICADOR') {
    return 'Sólo quien tiene la mascota a su cargo puede subir actualizaciones.';
  }

  if (detalle.finalizado) return 'El seguimiento terminó: ya no se piden más actualizaciones.';

  const siguiente = parsearFecha(detalle.proximoAviso);
  const falta = siguiente ? tiempoHasta(siguiente, ahora) : null;

  return falta
    ? `Ahora no hay nada para responder. La próxima pregunta llega en ${falta}.`
    : 'Ahora no hay nada para responder. Te vamos a avisar cuando llegue la próxima pregunta.';
}

/**
 * La pastilla de estado de la cabecera. Resume el expediente en una palabra, en el orden en
 * que importa: lo que hay que responder primero, después lo que se perdió, y recién al final
 * la buena noticia. Sale de los pedidos que ya vinieron, no de un campo del backend.
 */
function PastillaEstado({ pedidos }: { pedidos: PedidoSeguimiento[] }) {
  const { etiqueta, fondo, texto } = pedidos.some((pedido) => pedido.estado === 'PENDIENTE')
    ? { etiqueta: 'Pendiente', fondo: 'bg-amber-50', texto: 'text-amber-700' }
    : pedidos.some((pedido) => pedido.estado === 'VENCIDO')
      ? { etiqueta: 'Con faltantes', fondo: 'bg-gray-100', texto: 'text-gray-600' }
      : pedidos.length > 0
        ? { etiqueta: 'Al día', fondo: 'bg-emerald-50', texto: 'text-emerald-700' }
        : { etiqueta: 'Sin pedidos', fondo: 'bg-gray-100', texto: 'text-gray-600' };

  return (
    <View className={`flex-none rounded-full px-2.5 py-1 ${fondo}`}>
      <Text className={`text-[10px] font-semibold ${texto}`}>{etiqueta}</Text>
    </View>
  );
}

export default function SeguimientoSolicitudScreen() {
  const { solicitudId } = useLocalSearchParams<{ solicitudId: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = Number(solicitudId);

  const [detalle, setDetalle] = useState<DetalleSeguimiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), REFRESCO_TEXTOS_MS);
    return () => clearInterval(intervalo);
  }, []);

  const cargar = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(id) || id <= 0) {
      setError('El id de la solicitud no es válido.');
      setCargando(false);
      return;
    }

    try {
      setError(null);
      setDetalle(await obtenerSeguimientoDeSolicitud(id));
      setAhora(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar el seguimiento.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [id]);

  // Al volver de GUI-22 el pedido recién respondido tiene que aparecer ya completado.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const nombreMascota = detalle?.mascota.nombre ?? 'Sin nombre';
  const esAdoptante = detalle?.rol === 'ADOPTANTE';

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
            <Text className="text-2xl font-bold text-pethood-orange">Seguimiento</Text>
            {detalle ? (
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {nombreMascota} · {NOMBRE_TIPO[detalle.tipo]}
              </Text>
            ) : null}
          </View>
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : error || !detalle ? (
          <EstadoError
            mensaje={error ?? 'No pudimos cargar el seguimiento.'}
            icono="alert-circle-outline"
            onAccion={() => {
              setCargando(true);
              void cargar();
            }}
          />
        ) : (
          <>
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 pb-6"
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
              <View className="mb-5 flex-row items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                <View className="flex-none">
                  <FotoMascota
                    uri={urlAbsoluta(detalle.mascota.imagenUrl)}
                    tamanio={48}
                    accessibilityLabel={`Foto de ${nombreMascota}`}
                  />
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                    {nombreMascota}
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-gray-500" numberOfLines={1}>
                    {esAdoptante
                      ? 'Está a tu cuidado'
                      : `A cargo de ${detalle.adoptante.nombre} ${detalle.adoptante.apellido}`}
                  </Text>
                </View>

                <PastillaEstado pedidos={detalle.seguimientos} />
              </View>

              {detalle.seguimientos.length === 0 ? (
                // Estado vacío en línea y no `EstadoVacio`: la cabecera con la mascota tiene
                // que seguir visible, así que no puede ocupar la pantalla entera.
                <View className="items-center rounded-2xl bg-organic-surface px-6 py-10">
                  <Ionicons name="calendar-outline" size={34} color={PALETA.gris[400]} />
                  <Text className="mt-3 text-center text-base font-bold text-gray-900">
                    Todavía no hay preguntas
                  </Text>
                  <Text className="mt-1.5 text-center text-sm leading-5 text-gray-500">
                    {motivoSinPedido(detalle, ahora)}
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="mb-3 text-sm font-bold text-gray-900">
                    Hitos del seguimiento
                  </Text>
                  {detalle.seguimientos.map((pedido, indice) => (
                    <FilaPedidoSeguimiento
                      key={pedido.id}
                      pedido={pedido}
                      ahora={ahora}
                      esAdoptante={esAdoptante}
                      esUltimo={indice === detalle.seguimientos.length - 1}
                      // HU-9.3. Todos los hitos se abren, no sólo los completados: el
                      // endpoint también responde por los que no tienen nada cargado, con
                      // el mensaje que corresponde según si el plazo sigue abierto.
                      onPress={() =>
                        router.push({
                          pathname: '/seguimientos/actualizaciones/[seguimientoId]',
                          params: { seguimientoId: pedido.id },
                        })
                      }
                    />
                  ))}
                </>
              )}
            </ScrollView>

            {/* El publicador nunca responde: mostrarle un botón gris permanente sería ruido.
                La barra va en color plano y no en `bg-white/80`: los atajos de opacidad en una
                clase que se monta y desmonta disparan el bug de NativeWind descrito en
                `FilaPedidoSeguimiento`. */}
            {esAdoptante ? (
              <View className="border-t border-gray-100 bg-white px-4 pb-4 pt-3">
                <CustomButton
                  title="Subir actualización"
                  disabled={!detalle.puedeSubirActualizacion}
                  onPress={() =>
                    router.push({
                      pathname: '/seguimientos/[solicitudId]/actualizacion',
                      params: { solicitudId: id },
                    })
                  }
                  onPressDeshabilitado={() =>
                    toast.mostrarAdvertencia(motivoSinPedido(detalle, ahora))
                  }
                />
              </View>
            ) : null}
          </>
        )}
      </SafeAreaView>
    </View>
  );
}
