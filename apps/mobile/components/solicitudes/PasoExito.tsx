/**
 * El momento de "solicitud enviada": un destello de color, un tilde que se arma, una
 * vibración y, a los pocos segundos, directo a la conversación donde ya está el saludo. Como
 * cuando pagás con QR: te confirma que salió y te lleva al paso siguiente sin quedarse en una
 * pantalla dura con un botón.
 *
 * Es una pantalla y no un toast a propósito: cerrar el formulario con un aviso de tres
 * segundos deja a la persona sin saber si se envió. Pero dura poco y se salta tocándola.
 *
 * Si el backend no pudo abrir la conversación no hay a dónde ir solo: la misma pantalla se
 * queda quieta con los botones de siempre ("Ver mi solicitud" y "Volver").
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { PALETA } from '@/constants/theme';
import { vibrar } from '@/lib/haptics';
import type { SolicitudDetalle } from '@/services/solicitudes';

import { ProgresoSolicitud } from './ProgresoSolicitud';
import type { MascotaDeSolicitud } from './borrador';

/** Cuánto se queda antes de avanzar solo. Suficiente para leer el título, no para aburrirse. */
const ESPERA_MS = 2800;
const ESPERA_REDUCIDA_MS = 1500;

interface PasoExitoProps {
  solicitud: SolicitudDetalle;
  mascota: MascotaDeSolicitud;
  /** Con la sala abierta avanza solo; sin ella se queda quieta con los botones. */
  avanzaSolo: boolean;
  /** Al chat. Se llama sola a los pocos segundos o apenas se toca la pantalla. */
  onAvanzar: () => void;
  onVerSolicitud: () => void;
  onVolver: () => void;
}

export function PasoExito({
  solicitud,
  mascota,
  avanzaSolo,
  onAvanzar,
  onVerSolicitud,
  onVolver,
}: PasoExitoProps) {
  const destinatario = solicitud.publicador?.nombre ?? mascota.destinatario ?? 'el refugio';
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sinMovimiento = useReducedMotion();

  const onda = useSharedValue(0);
  const disco = useSharedValue(0);
  const aro = useSharedValue(0);
  const texto = useSharedValue(0);
  const tarjeta = useSharedValue(0);

  useEffect(() => {
    if (sinMovimiento) {
      onda.value = 1;
      disco.value = 1;
      texto.value = 1;
      tarjeta.value = 1;
    } else {
      onda.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) });
      disco.value = withDelay(260, withSpring(1, { damping: 11, stiffness: 150 }));
      aro.value = withDelay(380, withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }));
      texto.value = withDelay(560, withTiming(1, { duration: 360 }));
      tarjeta.value = withDelay(900, withTiming(1, { duration: 380 }));
    }

    // La vibración cae justo cuando el tilde termina de armarse.
    const aviso = setTimeout(() => vibrar.exito(), sinMovimiento ? 0 : 380);
    return () => clearTimeout(aviso);
  }, [aro, disco, onda, sinMovimiento, tarjeta, texto]);

  // El avance es de un solo disparo: si la persona toca antes, el temporizador se cancela
  // con el desmontaje y no navega dos veces.
  useEffect(() => {
    if (!avanzaSolo) return;
    const temporizador = setTimeout(onAvanzar, sinMovimiento ? ESPERA_REDUCIDA_MS : ESPERA_MS);
    return () => clearTimeout(temporizador);
  }, [avanzaSolo, onAvanzar, sinMovimiento]);

  // El círculo del destello cubre toda la pantalla desde el centro del tilde.
  const diametro = Math.hypot(width, height) * 1.35;
  const estiloOnda = useAnimatedStyle(() => ({
    transform: [{ scale: 0.06 + 0.94 * onda.value }],
    opacity: 0.35 + 0.65 * onda.value,
  }));
  const estiloVelo = useAnimatedStyle(() => ({ opacity: onda.value }));
  const estiloDisco = useAnimatedStyle(() => ({
    transform: [{ scale: disco.value }],
    opacity: disco.value > 0 ? 1 : 0,
  }));
  const estiloAro = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.9 * aro.value }],
    opacity: 0.55 * (1 - aro.value),
  }));
  const estiloTexto = useAnimatedStyle(() => ({
    opacity: texto.value,
    transform: [{ translateY: 14 * (1 - texto.value) }],
  }));
  const estiloTarjeta = useAnimatedStyle(() => ({
    opacity: tarjeta.value,
    transform: [{ translateY: 18 * (1 - tarjeta.value) }],
  }));

  const contenido = (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: diametro,
            height: diametro,
            borderRadius: diametro / 2,
            left: (width - diametro) / 2,
            top: height * 0.34 - diametro / 2,
            backgroundColor: PALETA.accent[600],
          },
          estiloOnda,
        ]}
      />

      {/* El marrón sólido solo se vería plano: arriba se aclara hacia el naranja y abajo
          se oscurece, así el destello tiene dos tonos y no uno. */}
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, estiloVelo]}
      >
        <LinearGradient
          colors={[PALETA.calido.naranja, `${PALETA.accent[600]}00`, PALETA.accent[800]]}
          locations={[0, 0.5, 1]}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <View
        className="flex-1 items-center justify-between px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 18 }}
      >
        <View className="w-full flex-1 items-center justify-center">
          <View className="items-center justify-center" style={{ width: 150, height: 150 }}>
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: PALETA.calido.amarillo,
                },
                estiloAro,
              ]}
            />
            <Animated.View
              style={[
                {
                  width: 112,
                  height: 112,
                  borderRadius: 56,
                  backgroundColor: PALETA.blanco,
                  borderWidth: 5,
                  borderColor: PALETA.calido.amarillo,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                estiloDisco,
              ]}
            >
              <Ionicons name="checkmark" size={64} color={PALETA.accent[600]} />
            </Animated.View>
          </View>

          <Animated.View style={estiloTexto} className="mt-8 items-center gap-2">
            <Text className="text-center font-titulo text-[30px] leading-[35px] text-white">
              ¡Solicitud enviada!
            </Text>
            <Text className="text-center font-cuerpo text-[16px] leading-6 text-white">
              Le escribimos a{' '}
              <Text className="font-cuerpo-bold text-[color:#fbe6af]">{destinatario}</Text>
              {mascota.nombre ? ` sobre ${mascota.nombre}.` : '.'}
            </Text>
          </Animated.View>

          <Animated.View style={estiloTarjeta} className="mt-8 w-full">
            <View className="rounded-3xl bg-organic-surface px-4 pb-4 pt-3.5">
              <Text className="mb-1 text-center font-cuerpo-semi text-[13px] text-organic-neutral-700">
                Esto es lo que sigue. Te avisamos en cada paso.
              </Text>
              <ProgresoSolicitud
                estado="Pendiente"
                historial={solicitud.historial}
                vista="adoptante"
                tamanio="medio"
              />
            </View>
          </Animated.View>
        </View>

        {avanzaSolo ? (
          <Animated.View style={estiloTarjeta}>
            <Text className="text-center font-cuerpo text-[13px] text-white">
              Tocá la pantalla para ir al chat
            </Text>
          </Animated.View>
        ) : (
          <Animated.View style={estiloTarjeta} className="w-full gap-2.5">
            <CustomButton title="Ver mi solicitud" variant="neutro" onPress={onVerSolicitud} />
            <CustomButton title="Volver" variant="acento-borde" onPress={onVolver} />
          </Animated.View>
        )}
      </View>
    </>
  );

  // Con avance automático, tocar en cualquier lado adelanta el paso. Quieta, los botones
  // son la única salida: un toque suelto no tiene que sacar a nadie de acá.
  if (avanzaSolo) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ir al chat"
        onPress={onAvanzar}
        className="flex-1 overflow-hidden bg-organic-bg"
      >
        {contenido}
      </Pressable>
    );
  }

  return <View className="flex-1 overflow-hidden bg-organic-bg">{contenido}</View>;
}
