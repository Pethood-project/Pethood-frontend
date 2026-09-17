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
import { Image, Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { EstadoSeguimiento, PedidoSeguimiento } from '@/services/seguimiento';
import { aFechaVisible, parsearFecha, tiempoHasta } from '@/shared/validation/dates';

type NombreIcono = keyof typeof Ionicons.glyphMap;

/** Lado del círculo del hito. La línea que los une se centra con este valor. */
const CIRCULO = 26;

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
    circulo: 'bg-pethood-orange',
    tarjeta: 'bg-white',
    sombra: SOMBRA_TARJETA,
    etiqueta: 'Completado',
  },
  VENCIDO: {
    icono: 'close',
    colorIcono: PALETA.grisCalido[400],
    circulo: 'border-2 border-pethood-beige-dark bg-gray-100',
    tarjeta: 'border border-gray-200 bg-organic-surface',
    sombra: null,
    etiqueta: 'No completado',
  },
  PENDIENTE: {
    icono: 'time-outline',
    colorIcono: PALETA.pethood.naranjaIntensa,
    circulo: 'border-2 border-pethood-orange bg-white',
    // Punteado: en el diseño es la marca de "esto todavía no está".
    tarjeta: 'border border-dashed border-pethood-orange bg-pethood-beige-dark',
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
    <View className="flex-row gap-3">
      <View className="items-center">
        <View
          className={`items-center justify-center rounded-full ${estilo.circulo}`}
          style={{ width: CIRCULO, height: CIRCULO }}
        >
          <Ionicons name={estilo.icono} size={14} color={estilo.colorIcono} />
        </View>

        {/* La línea encadena este hito con el siguiente; se estira con el alto de la fila. */}
        {esUltimo ? null : <View className="my-1 w-0.5 flex-1 bg-pethood-beige-dark" />}
      </View>

      {/* Tres nodos y no uno solo, a propósito: el `active:opacity-80` del Pressable y la
          sombra tienen que quedar FUERA de la clase que se alterna con el estado del pedido.
          Ver `SOMBRA_TARJETA` — mezclarlos ahí es lo que dispara el bug de NativeWind. */}
      <View className="mb-3 flex-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver la actualización ${pedido.numero}: ${pedido.pregunta}`}
          onPress={onPress}
          disabled={!onPress}
          className={onPress ? 'active:opacity-80' : ''}
        >
          <View
            className={`rounded-2xl p-3 ${estilo.tarjeta}`}
            style={estilo.sombra ?? undefined}
          >
            <Text className="text-sm font-bold leading-5 text-gray-900">{pedido.pregunta}</Text>

            <Text className="mt-1 text-[11px] text-gray-500">
              {[contexto, estilo.etiqueta].filter(Boolean).join(' · ')}
            </Text>

            {pedido.descripcion ? (
              <Text className="mt-2 text-sm leading-5 text-gray-700" numberOfLines={3}>
                {pedido.descripcion}
              </Text>
            ) : null}

            {foto ? (
              <Image
                source={{ uri: foto }}
                className="mt-2.5 h-40 w-full rounded-xl bg-pethood-beige-dark"
                accessibilityLabel={`Foto de prueba del seguimiento ${pedido.numero}`}
              />
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}
