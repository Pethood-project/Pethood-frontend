/**
 * Un hito del seguimiento dentro de GUI-21, con la estética de la pantalla 30 del diseño de
 * referencia: círculo con ícono a la izquierda, tarjeta con el texto a la derecha y una
 * línea vertical que los encadena.
 *
 * Los tres estados se distinguen por color Y por forma (spec 011 §3): naranja con tilde el
 * completado, gris con cruz el vencido, y el pendiente en tarjeta punteada, que es la que el
 * diseño usa para "todavía no pasó". El color nunca va solo — cada fila dice su estado con
 * palabras, para que se entienda igual sin distinguir los tonos.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

import { PressableAnimado } from '@/components/ui/PressableAnimado';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { EstadoSeguimiento, PedidoSeguimiento } from '@/services/seguimiento';
import { aFechaVisible, parsearFecha, tiempoHasta } from '@/shared/validation/dates';

type NombreIcono = keyof typeof Ionicons.glyphMap;

/** Lado del círculo del hito. La línea que los une se centra con este valor. */
const CIRCULO = 32;

/**
 * La sombra de la tarjeta completada va por `style` y no como `shadow-sm`.
 *
 * ⚠️ No cambiar a una clase de NativeWind. Cuando una `className` que se ALTERNA incluye
 * `shadow-*` o un atajo de opacidad (`bg-white/50`), NativeWind procesa el CSS en tiempo de
 * render y compite con el contexto de navegación de expo-router: la app revienta con
 * "Couldn't find a navigation context" (nativewind#1557). Acá la clase se alterna con el
 * estado del pedido, así que justo al responder — cuando el hito pasa de PENDIENTE a
 * COMPLETADO — se disparaba el error. Es el mismo motivo por el que `TarjetaAcceso` define
 * su sombra en `style`.
 */
const SOMBRA_TARJETA = {
  shadowColor: PALETA.neutral[900],
  shadowOpacity: 0.1,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
};

interface EstiloEstado {
  icono: NombreIcono;
  colorIcono: string;
  /** Clases del círculo del hito. Sólo colores planos. */
  circulo: string;
  /** Clases de la tarjeta. Sólo colores planos: nada de sombras ni atajos de opacidad. */
  tarjeta: string;
  /** La sombra, aparte de las clases, por el problema descrito en `SOMBRA_TARJETA`. */
  sombra: typeof SOMBRA_TARJETA | null;
  etiqueta: string;
}

const ESTILOS: Record<EstadoSeguimiento, EstiloEstado> = {
  COMPLETADO: {
    icono: 'checkmark',
    colorIcono: PALETA.blanco,
    circulo: 'bg-organic-accent-600',
    tarjeta: 'bg-organic-neutral-100',
    sombra: SOMBRA_TARJETA,
    etiqueta: 'Completado',
  },
  VENCIDO: {
    icono: 'close',
    colorIcono: PALETA.neutral[500],
    circulo: 'border-2 border-organic-neutral-300 bg-organic-neutral-200',
    tarjeta: 'border border-organic-neutral-200 bg-organic-surface',
    sombra: null,
    etiqueta: 'No completado',
  },
  PENDIENTE: {
    icono: 'time-outline',
    colorIcono: PALETA.accent[700],
    // A diferencia de VENCIDO (neutro/inerte), este estado pide una acción ahora: sigue
    // tintado con el acento de marca para que se distinga por color Y forma (spec 011 §3),
    // no sólo por el ícono.
    circulo: 'border-2 border-organic-accent-600 bg-organic-neutral-100',
    // Punteado: en el diseño es la marca de "esto todavía no está".
    tarjeta: 'border border-dashed border-organic-accent-600 bg-organic-accent-100',
    sombra: null,
    etiqueta: 'Esperando tu respuesta',
  },
};

interface FilaPedidoSeguimientoProps {
  pedido: PedidoSeguimiento;
  /** Se inyecta para que la cuenta regresiva se recalcule con el tick de la pantalla. */
  ahora: Date;
  /** El publicador lee el historial pero nunca responde: cambia sólo el texto del pendiente. */
  esAdoptante: boolean;
  /** El último hito no dibuja la línea hacia abajo: no hay nada que encadenar. */
  esUltimo: boolean;
  /** HU-9.3: abre la actualización en detalle. Sin esto el hito no responde al toque. */
  onPress?: () => void;
}

/**
 * Renglón de contexto debajo de la pregunta: cuándo se respondió, cuánto queda de plazo o
 * cuándo venció. Es lo que convierte un estado abstracto en algo accionable.
 */
function detalleTemporal(
  pedido: PedidoSeguimiento,
  ahora: Date,
  esAdoptante: boolean,
): string | null {
  if (pedido.estado === 'COMPLETADO') {
    const respuesta = parsearFecha(pedido.fechaRespuesta);
    return respuesta ? aFechaVisible(respuesta) : null;
  }

  const plazo = parsearFecha(pedido.plazo);

  if (pedido.estado === 'VENCIDO') {
    return plazo ? `Venció el ${aFechaVisible(plazo)}` : null;
  }

  const restante = plazo ? tiempoHasta(plazo, ahora) : null;
  if (!restante) return esAdoptante ? 'Respondé antes de que venza el plazo' : null;

  return esAdoptante ? `Te quedan ${restante}` : `Vence en ${restante}`;
}

export function FilaPedidoSeguimiento({
  pedido,
  ahora,
  esAdoptante,
  esUltimo,
  onPress,
}: FilaPedidoSeguimientoProps) {
  const estilo = ESTILOS[pedido.estado];
  const contexto = detalleTemporal(pedido, ahora, esAdoptante);
  const foto = urlAbsoluta(pedido.fotoUrl);

  return (
    <View className="flex-row gap-3.5">
      <View className="items-center">
        <View
          className={`items-center justify-center rounded-full ${estilo.circulo}`}
          style={{ width: CIRCULO, height: CIRCULO }}
        >
          <Ionicons name={estilo.icono} size={18} color={estilo.colorIcono} />
        </View>

        {/* La línea encadena este hito con el siguiente; se estira con el alto de la fila. */}
        {esUltimo ? null : <View className="my-1 w-1 flex-1 rounded-full bg-organic-accent-600" />}
      </View>

      {/* Tres nodos y no uno solo, a propósito: la animación de presión y la sombra tienen que
          quedar FUERA de la clase que se alterna con el estado del pedido. Ver `SOMBRA_TARJETA`
          — mezclarlas ahí es lo que dispara el bug de NativeWind (nativewind#1557). */}
      <View className="mb-4 flex-1">
        <PressableAnimado
          accessibilityRole="button"
          accessibilityLabel={`Ver la actualización ${pedido.numero}: ${pedido.pregunta}`}
          onPress={onPress}
          disabled={!onPress}
          escala={0.97}
        >
          <View
            className={`rounded-[20px] p-4 ${estilo.tarjeta}`}
            style={estilo.sombra ?? undefined}
          >
            <Text className="font-cuerpo-bold text-lg leading-7 text-organic-neutral-900">
              {pedido.pregunta}
            </Text>

            <Text className="mt-1.5 font-cuerpo text-base text-organic-neutral-600">
              {[contexto, estilo.etiqueta].filter(Boolean).join(' · ')}
            </Text>

            {pedido.descripcion ? (
              <Text
                className="mt-2.5 font-cuerpo text-base leading-6 text-organic-neutral-700"
                numberOfLines={3}
              >
                {pedido.descripcion}
              </Text>
            ) : null}

            {foto ? (
              <Image
                source={{ uri: foto }}
                className="mt-3 h-48 w-full rounded-2xl bg-organic-neutral-200"
                accessibilityLabel={`Foto de prueba del seguimiento ${pedido.numero}`}
              />
            ) : null}
          </View>
        </PressableAnimado>
      </View>
    </View>
  );
}
