/**
 * HU-9.2 Ver seguimientos — GUI-21 Seguimiento Adopción/Tránsito.
 *
 * Historial de una solicitud: la mascota arriba y debajo la lista de pedidos. El backend los
 * manda del más nuevo al más viejo (no reordenar el contrato); acá se invierten sólo para
 * pintarlos como un chat — el más viejo arriba, el más nuevo abajo — y se hace scroll
 * automático al final para que la pantalla abra siempre en la última actualización.
 *
 * El botón "Subir actualización" se habilita con `puedeSubirActualizacion`, que el servidor
 * ya calcula combinando rol y estado. No se recalcula en el cliente: el plazo de 48 h se
 * mide contra el reloj del servidor, y el del teléfono puede estar corrido.
 *
 * El refugio, en cambio, ve "Enviar pregunta" (spec 011 §6.11) cuando `puedeEnviarPregunta`,
 * y al final de los hitos la pregunta que dejó programada para el próximo pedido, si la hay.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { NOMBRE_TIPO } from '@/components/seguimiento/etiquetas';
import { FilaPedidoSeguimiento } from '@/components/seguimiento/FilaPedidoSeguimiento';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FotoMascota } from '@/components/ui/FotoMascota';
import { PressableAnimado } from '@/components/ui/PressableAnimado';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import {
  cancelarPreguntaProgramada,
  obtenerSeguimientoDeSolicitud,
  type DetalleSeguimiento,
  type PedidoSeguimiento,
  type PreguntaProgramada,
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
    ? { etiqueta: 'Pendiente', fondo: 'bg-organic-accent-100', texto: 'text-organic-accent-700' }
    : pedidos.some((pedido) => pedido.estado === 'VENCIDO')
      ? {
          etiqueta: 'Con faltantes',
          fondo: 'bg-organic-neutral-200',
          texto: 'text-organic-neutral-600',
        }
      : pedidos.length > 0
        ? { etiqueta: 'Al día', fondo: 'bg-organic-accent-200', texto: 'text-organic-accent-700' }
        : {
            etiqueta: 'Sin pedidos',
            fondo: 'bg-organic-neutral-200',
            texto: 'text-organic-neutral-600',
          };

  return (
    <View className={`flex-none rounded-full px-3 py-1.5 ${fondo}`}>
      <Text className={`font-cuerpo-semi text-xs ${texto}`}>{etiqueta}</Text>
    </View>
  );
}

/**
 * La pregunta que el refugio dejó para el próximo pedido automático. Va al final de los
 * hitos porque es lo que viene después, con la tarjeta punteada que el diseño usa para
 * "esto todavía no pasó". Sólo la ve el refugio: el adoptante la recibe con su pedido.
 */
function TarjetaPreguntaProgramada({
  pregunta,
  proximoAviso,
  ahora,
  onDescartar,
}: {
  pregunta: PreguntaProgramada;
  proximoAviso: string | null;
  ahora: Date;
  onDescartar: () => void;
}) {
  const siguiente = parsearFecha(proximoAviso);
  const falta = siguiente ? tiempoHasta(siguiente, ahora) : null;

  return (
    <View className="mt-2 rounded-[20px] border border-dashed border-organic-neutral-400 bg-organic-surface p-4">
      <View className="flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={16} color={PALETA.neutral[600]} />
        <Text className="flex-1 font-cuerpo-semi text-sm text-organic-neutral-600">
          {falta ? `Próximo pedido · llega en ${falta}` : 'Próximo pedido'}
        </Text>
      </View>

      <Text className="mt-2 font-cuerpo-bold text-lg leading-7 text-organic-neutral-900">
        {pregunta.texto}
      </Text>
      <Text className="mt-1 font-cuerpo text-sm text-organic-neutral-600">
        La escribiste vos: reemplaza a la pregunta aleatoria de ese pedido.
      </Text>

      <PressableAnimado
        accessibilityRole="button"
        accessibilityLabel="Descartar la pregunta programada"
        onPress={onDescartar}
        className="mt-3 self-start"
      >
        <Text className="font-cuerpo-semi text-sm text-organic-accent-700">Descartar</Text>
      </PressableAnimado>
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
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const [descartando, setDescartando] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

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

  const descartarProgramada = async (): Promise<void> => {
    setDescartando(true);
    try {
      setDetalle(await cancelarPreguntaProgramada(id));
      toast.mostrarExito('Listo, descartaste la pregunta programada.');
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos descartar la pregunta.',
      );
      // Si su pedido llegó mientras tanto ya no está programada: se relee para mostrarlo.
      void cargar();
    } finally {
      setDescartando(false);
      setConfirmarDescarte(false);
    }
  };

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 border-b border-organic-neutral-300 bg-organic-neutral-100 px-4 py-4">
          <PressableAnimado
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            hitSlop={8}
            className="h-12 w-12 items-center justify-center rounded-full border border-organic-neutral-300 bg-organic-neutral-100"
          >
            <Ionicons name="arrow-back" size={22} color={PALETA.neutral[700]} />
          </PressableAnimado>

          <View className="flex-1">
            <Text className="font-titulo text-[26px] leading-8 text-organic-accent-600">
              Seguimiento
            </Text>
            {detalle ? (
              <Text className="font-cuerpo text-sm text-organic-neutral-600" numberOfLines={1}>
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
              ref={scrollRef}
              className="flex-1"
              contentContainerClassName="px-4 pb-6"
              // Estilo chat: el hito más nuevo queda al final, así que la pantalla se abre
              // siempre ahí abajo en vez de forzar al usuario a bajar manualmente.
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
              refreshControl={
                <RefreshControl
                  refreshing={refrescando}
                  onRefresh={() => {
                    setRefrescando(true);
                    void cargar();
                  }}
                  tintColor={PALETA.accent[600]}
                  colors={[PALETA.accent[600]]}
                />
              }
            >
              <View className="mb-6 flex-row items-center gap-3.5 rounded-[22px] bg-organic-neutral-100 p-4 shadow-sm">
                <View className="flex-none">
                  <FotoMascota
                    uri={urlAbsoluta(detalle.mascota.imagenUrl)}
                    tamanio={58}
                    accessibilityLabel={`Foto de ${nombreMascota}`}
                  />
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="font-titulo text-xl text-organic-neutral-900" numberOfLines={1}>
                    {nombreMascota}
                  </Text>
                  <Text className="mt-0.5 font-cuerpo text-sm text-organic-neutral-600" numberOfLines={1}>
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
                <View className="items-center rounded-[22px] bg-organic-surface px-6 py-12">
                  <Ionicons name="calendar-outline" size={42} color={PALETA.neutral[400]} />
                  <Text className="mt-4 text-center font-cuerpo-bold text-lg text-organic-neutral-900">
                    Todavía no hay preguntas
                  </Text>
                  <Text className="mt-2 text-center font-cuerpo text-base leading-6 text-organic-neutral-600">
                    {motivoSinPedido(detalle, ahora)}
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="mb-4 font-cuerpo-bold text-lg text-organic-neutral-800">
                    Hitos del seguimiento
                  </Text>
                  {/* El backend los manda del más nuevo al más viejo; acá se invierten sólo
                      para pintarlos, así el más nuevo queda al final como en un chat. */}
                  {[...detalle.seguimientos].reverse().map((pedido, indice, hitos) => (
                    <FilaPedidoSeguimiento
                      key={pedido.id}
                      pedido={pedido}
                      ahora={ahora}
                      esAdoptante={esAdoptante}
                      esUltimo={indice === hitos.length - 1}
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

              {detalle.preguntaProgramada ? (
                <TarjetaPreguntaProgramada
                  pregunta={detalle.preguntaProgramada}
                  proximoAviso={detalle.proximoAviso}
                  ahora={ahora}
                  onDescartar={() => setConfirmarDescarte(true)}
                />
              ) : null}
            </ScrollView>

            {/* El publicador nunca responde: mostrarle un botón gris permanente sería ruido.
                La barra va en color plano y no en `bg-white/80`: los atajos de opacidad en una
                clase que se monta y desmonta disparan el bug de NativeWind descrito en
                `FilaPedidoSeguimiento`. */}
            {esAdoptante ? (
              <View className="border-t border-organic-neutral-200 bg-organic-neutral-100 px-4 pb-5 pt-4">
                <CustomButton
                  title="Subir actualización"
                  variant="acento"
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
            ) : detalle.puedeEnviarPregunta ? (
              <View className="border-t border-organic-neutral-200 bg-organic-neutral-100 px-4 pb-5 pt-4">
                <CustomButton
                  title="Enviar pregunta"
                  variant="acento"
                  onPress={() =>
                    router.push({
                      pathname: '/seguimientos/[solicitudId]/pregunta',
                      params: { solicitudId: id },
                    })
                  }
                />
              </View>
            ) : null}
          </>
        )}
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmarDescarte}
        tono="peligro"
        titulo="¿Descartar la pregunta?"
        mensaje="El próximo pedido va a llevar una pregunta aleatoria, como siempre."
        textoConfirmar="Descartar"
        onConfirmar={() => void descartarProgramada()}
        onCerrar={() => setConfirmarDescarte(false)}
        cargando={descartando}
      />
    </View>
  );
}
