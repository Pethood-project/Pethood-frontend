/**
 * La cabecera de una adopción aprobada: la foto de la mascota a todo el ancho, con un degradé
 * cálido y el título que celebra. Es el hito más grande del proceso y por eso tiene su propia
 * pantalla en vez de un cartelito de estado.
 *
 * No hay un "ya la vio" guardado en ningún lado: la animación de entrada (unas huellitas que
 * suben y una vibración de celebración) se dispara sola si la aprobación es reciente. Pasado
 * ese tiempo, la misma pantalla se ve tranquila.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PALETA } from '@/constants/theme';
import { vibrar } from '@/lib/haptics';
import { urlAbsoluta } from '@/services/api';
import type { SolicitudDetalle } from '@/services/solicitudes';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

const ALTO_FOTO = 340;
const SUBIDA_HUELLA = 300;

/** Dónde nacen las huellitas (fracción del ancho), cuándo salen y qué tan grandes son. */
const HUELLAS = [
  { izquierda: 0.08, demora: 0, tamanio: 22, giro: -18 },
  { izquierda: 0.2, demora: 380, tamanio: 30, giro: 14 },
  { izquierda: 0.36, demora: 120, tamanio: 24, giro: -8 },
  { izquierda: 0.52, demora: 560, tamanio: 32, giro: 20 },
  { izquierda: 0.66, demora: 240, tamanio: 22, giro: -14 },
  { izquierda: 0.8, demora: 700, tamanio: 28, giro: 10 },
  { izquierda: 0.9, demora: 460, tamanio: 20, giro: -22 },
];

function Huella({
  izquierda,
  demora,
  tamanio,
  giro,
  ancho,
}: (typeof HUELLAS)[number] & { ancho: number }) {
  const progreso = useSharedValue(0);

  useEffect(() => {
    progreso.value = withDelay(
      demora,
      withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }),
    );
  }, [demora, progreso]);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateY: -SUBIDA_HUELLA * progreso.value }, { rotate: `${giro}deg` }],
    // Aparece rápido y se va despacio, como si se perdiera en el aire.
    opacity: progreso.value < 0.12 ? progreso.value / 0.12 : 1 - (progreso.value - 0.12) / 0.88,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', bottom: 18, left: ancho * izquierda }, estilo]}
    >
      <Ionicons name="paw" size={tamanio} color={PALETA.calido.amarilloClaro} />
    </Animated.View>
  );
}

interface HeroAprobadaProps {
  solicitud: SolicitudDetalle;
  /** Si la aprobación es de hace pocos días: solo entonces hay animación y vibración. */
  reciente: boolean;
  /** Ancho disponible, para repartir las huellitas. */
  ancho: number;
}

export function HeroAprobada({ solicitud, reciente, ancho }: HeroAprobadaProps) {
  const insets = useSafeAreaInsets();
  const sinMovimiento = useReducedMotion();
  const animar = reciente && !sinMovimiento;

  const nombre = solicitud.mascota.nombre ?? 'Tu mascota';
  const esTransito = solicitud.tipoSolicitud === 'Transito';
  const aprobada = parsearFecha(solicitud.fechaRespuesta);
  const foto = urlAbsoluta(solicitud.mascota.imagenUrl);

  useEffect(() => {
    if (reciente) vibrar.celebracion();
  }, [reciente]);

  return (
    <View style={{ height: ALTO_FOTO + insets.top }} className="overflow-hidden">
      <View
        className="absolute inset-0 overflow-hidden bg-organic-calido-naranja"
        style={{ borderBottomLeftRadius: 44, borderBottomRightRadius: 44 }}
      >
        {foto ? (
          <Image source={{ uri: foto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="paw" size={96} color="rgba(255,255,255,0.55)" />
          </View>
        )}

        {/* Cálido y no negro: el degradé baja al marrón de la marca para que el título se lea
            sin apagar la foto. */}
        <LinearGradient
          colors={[`${PALETA.accent[900]}00`, `${PALETA.accent[900]}E6`]}
          locations={[0.35, 1]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
        />

        {animar ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}>
            {HUELLAS.map((huella) => (
              <Huella key={huella.izquierda} {...huella} ancho={ancho} />
            ))}
          </View>
        ) : null}
      </View>

      <View className="absolute bottom-0 left-0 right-0 px-6 pb-7">
        <Text className="font-titulo text-[30px] leading-[35px] text-white">
          {esTransito
            ? `¡${nombre} te espera en tu hogar de tránsito!`
            : `¡${nombre} es parte de tu familia!`}
        </Text>
        <Text className="mt-2 font-cuerpo text-[15px] leading-[21px] text-white/90">
          {solicitud.publicador.nombre} aceptó tu solicitud
          {aprobada ? ` el ${aFechaVisible(aprobada)}` : ''}.
        </Text>
      </View>
    </View>
  );
}
