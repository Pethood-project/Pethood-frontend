/**
 * Spec 011 §6.11 — el refugio le escribe una pregunta propia al adoptante.
 *
 * Qué pasa con la pregunta lo decide el servidor, no esta pantalla: si no hay ninguna
 * esperando respuesta le llega ya al adoptante (con sus 48 h), y si hay una activa —que no
 * se puede tocar— queda programada y reemplaza a la aleatoria del próximo pedido. Acá sólo
 * se anticipa cuál de los dos va a pasar, leyendo el expediente al abrir, para que el
 * refugio no se sorprenda; el toast final repite lo que efectivamente hizo el servidor.
 *
 * La validación de acá es sólo para UX; la fuente de verdad es el backend.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { Nota } from '@/components/ui/Nota';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { PALETA } from '@/constants/theme';
import {
  enviarPregunta,
  obtenerSeguimientoDeSolicitud,
  type DetalleSeguimiento,
} from '@/services/seguimiento';
import { parsearFecha, tiempoHasta } from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';

/** Anticipa qué va a pasar con la pregunta, con las mismas reglas que aplica el servidor. */
function explicacion(detalle: DetalleSeguimiento): string {
  const adoptante = detalle.adoptante.nombre;
  const hayActiva = detalle.seguimientos.some((pedido) => pedido.estado === 'PENDIENTE');

  if (!hayActiva) {
    return (
      `Le llega ahora a ${adoptante} y tiene 48 horas para responderla con una foto y un ` +
      'texto. No cambia las fechas de los pedidos automáticos.'
    );
  }

  const siguiente = parsearFecha(detalle.proximoAviso);
  const falta = siguiente ? tiempoHasta(siguiente) : null;
  const cuando = falta ? ` (llega en ${falta})` : '';
  const pisa = detalle.preguntaProgramada
    ? ' Ya tenías una programada: esta la reemplaza.'
    : '';

  return (
    `${adoptante} tiene una pregunta esperando respuesta, y esa no se puede cambiar. La tuya ` +
    `va a reemplazar a la pregunta del próximo pedido${cuando}.${pisa}`
  );
}

export default function NuevaPreguntaSeguimientoScreen() {
  const { solicitudId } = useLocalSearchParams<{ solicitudId: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = Number(solicitudId);

  const [detalle, setDetalle] = useState<DetalleSeguimiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [texto, setTexto] = useState('');
  const [tocado, setTocado] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(id) || id <= 0) {
      setErrorCarga('El id de la solicitud no es válido.');
      setCargando(false);
      return;
    }

    try {
      setErrorCarga(null);
      setDetalle(await obtenerSeguimientoDeSolicitud(id));
    } catch (err) {
      setErrorCarga(err instanceof Error ? err.message : 'No pudimos abrir el seguimiento.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const errorTexto = useMemo(
    () => validarTexto(texto, { ...LIMITES.seguimiento.pregunta, etiqueta: 'La pregunta' }),
    [texto],
  );

  const enviar = async (): Promise<void> => {
    setMostrarErrores(true);
    if (errorTexto) return;

    setEnviando(true);
    try {
      const { mensaje } = await enviarPregunta(id, texto.trim());
      toast.mostrarExito(mensaje);
      router.back();
    } catch (err) {
      toast.mostrarError(err instanceof Error ? err.message : 'No pudimos enviar la pregunta.');
      // Pudo cambiar el estado mientras escribía (venció la activa, terminó el seguimiento):
      // se relee para que la explicación de arriba diga la verdad.
      void cargar();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 bg-organic-accent-600 px-5 pb-[14px] pt-[9px]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/20 active:opacity-80"
          >
            <Ionicons name="chevron-back" size={22} color={PALETA.blanco} />
          </Pressable>

          <View className="flex-1">
            <Text className="font-titulo text-[22px] leading-[26px] text-white">
              Nueva pregunta
            </Text>
            {detalle ? (
              <Text className="mt-0.5 text-[13px] text-white/80" numberOfLines={1}>
                {detalle.mascota.nombre ?? 'Sin nombre'} · Seguimiento
              </Text>
            ) : null}
          </View>
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : errorCarga || !detalle ? (
          <EstadoError
            mensaje={errorCarga ?? 'No pudimos abrir el seguimiento.'}
            icono="alert-circle-outline"
            onAccion={() => {
              setCargando(true);
              void cargar();
            }}
          />
        ) : !detalle.puedeEnviarPregunta ? (
          // Deep link o el estado cambió desde que se abrió GUI-21: el servidor ya no deja.
          <EstadoError
            mensaje={
              detalle.finalizado
                ? 'El seguimiento terminó: ya no se pueden enviar preguntas.'
                : detalle.rol !== 'PUBLICADOR'
                  ? 'Sólo el refugio que entregó la mascota puede enviar preguntas.'
                  : 'Vas a poder enviar preguntas después de que llegue la primera actualización.'
            }
            icono="lock-closed-outline"
            etiquetaAccion="Volver al seguimiento"
            onAccion={() => router.back()}
          />
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
          >
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 pb-10 pt-4"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-3.5">
                <Nota texto={explicacion(detalle)} />
              </View>

              <FormCard>
                <FormCardRow ultima>
                  <TextAreaField
                    label="Tu pregunta"
                    obligatorio
                    placeholder={`¿Qué querés saber de ${detalle.mascota.nombre ?? 'la mascota'}?`}
                    value={texto}
                    onChangeText={setTexto}
                    onBlur={() => setTocado(true)}
                    maximo={LIMITES.seguimiento.pregunta.max}
                    error={mostrarErrores || tocado ? (errorTexto ?? undefined) : undefined}
                    grande
                  />
                </FormCardRow>
              </FormCard>

              <View className="mt-5">
                <CustomButton
                  title="Enviar pregunta"
                  variant="acento"
                  loading={enviando}
                  disabled={Boolean(errorTexto)}
                  onPress={() => void enviar()}
                  onPressDeshabilitado={() => {
                    setMostrarErrores(true);
                    toast.mostrarAdvertencia(errorTexto ?? 'Revisá la pregunta.');
                  }}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}
