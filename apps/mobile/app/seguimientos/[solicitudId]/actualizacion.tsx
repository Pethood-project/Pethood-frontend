/**
 * HU-9.1 Enviar seguimiento — GUI-22 Actualización de seguimiento.
 *
 * Responde el pedido que está esperando: descripción + foto de prueba de vida. Cuál es ese
 * pedido lo resuelve la propia pantalla releyendo el detalle de la solicitud, en vez de
 * recibir el id por parámetro. Así el plazo y el estado se leen del servidor en el momento
 * de abrir el formulario — si el pedido venció mientras GUI-21 estaba abierta, acá se ve.
 *
 * La foto sale sí o sí de la cámara nativa, con la galería bloqueada (regla transversal 9).
 * Esa garantía es del front: el backend recibe un archivo y no puede saber de dónde salió.
 *
 * La validación de acá es sólo para UX; la fuente de verdad es el backend. Los tres textos
 * de error son LITERALES de la HU ("Completar descripción", "Limite de caracteres superado",
 * "Adjuntar imagen de prueba"), así que se piden por `errorObligatorio`/`errorLongitud` en
 * vez de dejar que salga el mensaje genérico.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import {
  CAMARA_NO_DISPONIBLE_EN_WEB,
  CapturaPruebaDeVida,
  type FotoCapturada,
} from '@/components/seguimiento/CapturaPruebaDeVida';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { PALETA } from '@/constants/theme';
import {
  obtenerSeguimientoDeSolicitud,
  subirActualizacion,
  type DetalleSeguimiento,
  type PedidoSeguimiento,
} from '@/services/seguimiento';
import { parsearFecha, tiempoHasta } from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';

/** Texto literal de HU-9.1 para la foto faltante. */
const FALTA_FOTO = 'Adjuntar imagen de prueba';

export default function ActualizacionSeguimientoScreen() {
  const { solicitudId } = useLocalSearchParams<{ solicitudId: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = Number(solicitudId);

  const [detalle, setDetalle] = useState<DetalleSeguimiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [descripcionTocada, setDescripcionTocada] = useState(false);

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

  /** El único pedido que acepta respuesta. El servidor garantiza que hay a lo sumo uno. */
  const pendiente: PedidoSeguimiento | null =
    detalle?.seguimientos.find((pedido) => pedido.estado === 'PENDIENTE') ?? null;

  const errorDescripcion = useMemo(
    () =>
      validarTexto(descripcion, {
        ...LIMITES.seguimiento.descripcion,
        etiqueta: 'La descripción',
        errorObligatorio: 'Completar descripción',
        errorLongitud: 'Limite de caracteres superado',
      }),
    [descripcion],
  );

  const errorFoto = foto ? null : FALTA_FOTO;
  const formularioValido = !errorDescripcion && !errorFoto;

  const guardar = async (): Promise<void> => {
    setMostrarErrores(true);
    if (!formularioValido || !pendiente || !foto) return;

    setGuardando(true);
    try {
      const { mensaje } = await subirActualizacion(pendiente.id, {
        descripcion: descripcion.trim(),
        foto,
      });

      // El backend devuelve el texto literal de la HU; se muestra tal cual llega.
      toast.mostrarExito(mensaje);
      router.back();
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos guardar la actualización.',
      );
      // Si venció el plazo o alguien ya respondió, el formulario que quedó en pantalla es
      // mentira: se relee para que muestre el estado real.
      void cargar();
    } finally {
      setGuardando(false);
    }
  };

  const explicarQueFalta = (): void => {
    setMostrarErrores(true);

    if (Platform.OS === 'web' && !foto) {
      toast.mostrarAdvertencia(CAMARA_NO_DISPONIBLE_EN_WEB);
      return;
    }

    toast.mostrarAdvertencia(errorDescripcion ?? errorFoto ?? 'Revisá los datos del formulario.');
  };

  const plazo = parsearFecha(pendiente?.plazo);
  const restante = plazo ? tiempoHasta(plazo) : null;

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
            <Text className="text-2xl font-bold text-pethood-orange">Subir actualización</Text>
            {detalle ? (
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {detalle.mascota.nombre ?? 'Tu mascota'} · Seguimiento
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
        ) : !pendiente || !detalle.puedeSubirActualizacion ? (
          // Se llegó acá sin nada que responder: venció el plazo, alguien lo respondió antes,
          // o la pantalla se abrió por deep link. El publicador nunca puede responder, así
          // que su motivo es otro y merece su propio texto.
          <EstadoError
            mensaje={
              detalle.rol === 'PUBLICADOR'
                ? 'Sólo quien tiene la mascota a su cargo puede subir la actualización.'
                : 'Ahora no hay ninguna pregunta esperando respuesta. Puede que se haya vencido el plazo de 48 horas.'
            }
            icono={detalle.rol === 'PUBLICADOR' ? 'lock-closed-outline' : 'time-outline'}
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
              contentContainerClassName="px-4 pb-10"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Chip de contexto del diseño: en la maqueta dice el día de convivencia, pero
                  la API no manda la fecha de la adopción. Se muestra lo que sí sabemos y es
                  lo accionable: qué número de pedido es y cuánto queda del plazo de 48 h. */}
              <View className="mb-3 flex-row items-center gap-2 self-start rounded-xl bg-orange-50 px-3 py-2">
                <Ionicons name="calendar" size={13} color={PALETA.pethood.naranjaIntensa} />
                <Text className="text-[11px] font-semibold text-orange-800">
                  Pedido {pendiente.numero}
                  {restante ? ` · te quedan ${restante}` : ''}
                </Text>
              </View>

              <View className="mb-3 rounded-2xl bg-organic-surface p-3.5">
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Pregunta
                </Text>
                <Text className="mt-1.5 text-base font-bold leading-6 text-gray-900">
                  {pendiente.pregunta}
                </Text>
              </View>

              <FormCard>
                <FormCardRow>
                  <TextAreaField
                    label="Tu respuesta"
                    obligatorio
                    placeholder={`Contá con detalle cómo viene ${detalle.mascota.nombre ?? 'la mascota'}...`}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    onBlur={() => setDescripcionTocada(true)}
                    maximo={LIMITES.seguimiento.descripcion.max}
                    error={
                      mostrarErrores || descripcionTocada
                        ? (errorDescripcion ?? undefined)
                        : undefined
                    }
                  />
                </FormCardRow>

                <FormCardRow ultima>
                  <CapturaPruebaDeVida
                    foto={foto}
                    onChange={setFoto}
                    error={mostrarErrores ? (errorFoto ?? undefined) : undefined}
                    deshabilitado={guardando}
                  />
                </FormCardRow>
              </FormCard>

              <View className="mt-5">
                <CustomButton
                  title="Guardar respuesta"
                  loading={guardando}
                  disabled={!formularioValido}
                  onPress={() => void guardar()}
                  onPressDeshabilitado={explicarQueFalta}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}
