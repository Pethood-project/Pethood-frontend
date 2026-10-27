/**
 * El camino de estados de una solicitud: puntos unidos por líneas que se van pintando a
 * medida que avanza. Enviada · En revisión · Revisada · Decisión.
 *
 * Se pinta con el historial real y no con el estado actual: una solicitud rechazada estando
 * Pendiente no pasó por las etapas del medio, y esas quedan vacías en vez de aparentar que
 * sí. El último punto cambia según cómo termina: tilde si la aprobaron, cruz si no la
 * aceptaron, y gris si se canceló o se cerró.
 *
 * Un solo componente en tres tamaños: `completo` (detalle, con fechas), `medio` (la tarjeta
 * del chat, con rótulos) y `compacto` (el listado, solo puntos).
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { etiquetaEstadoSolicitud, type VistaSolicitud } from '@/constants/EstadosSolicitud';
import { PALETA } from '@/constants/theme';
import { vibrar } from '@/lib/haptics';
import type { EstadoSolicitudHistorial, EstadoSolicitudNombre } from '@/services/solicitudes';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

type Tamanio = 'completo' | 'medio' | 'compacto';

/** El orden en que se recorren las tres etapas abiertas. La cuarta es la decisión. */
const ETAPAS_ABIERTAS: EstadoSolicitudNombre[] = ['Pendiente', 'En_Revision', 'Revisada'];

const FINALES: EstadoSolicitudNombre[] = ['Aprobada', 'Rechazada', 'Cancelada', 'Cerrada'];

type Tono = 'normal' | 'positivo' | 'negativo' | 'neutro';

interface Etapa {
  clave: string;
  etiqueta: string;
  /** `true` si la solicitud llegó a esta etapa. */
  alcanzada: boolean;
  /** La etapa en la que está parada ahora (solo una, y solo si sigue abierta). */
  actual: boolean;
  fecha: string | null;
  tono: Tono;
  icono: keyof typeof Ionicons.glyphMap;
}

const TONO_FINAL: Record<string, { tono: Tono; icono: keyof typeof Ionicons.glyphMap }> = {
  Aprobada: { tono: 'positivo', icono: 'checkmark' },
  Rechazada: { tono: 'negativo', icono: 'close' },
  Cancelada: { tono: 'neutro', icono: 'arrow-undo' },
  Cerrada: { tono: 'neutro', icono: 'lock-closed' },
};

/** Qué etapas se alcanzaron, a partir del historial o, si no hay, del estado actual. */
function etapasDe(
  estado: EstadoSolicitudNombre,
  historial: EstadoSolicitudHistorial[] | undefined,
  vista: VistaSolicitud,
): Etapa[] {
  const esFinal = FINALES.includes(estado);
  const alcanzadas = new Map<string, string | null>();

  if (historial && historial.length > 0) {
    for (const paso of historial) alcanzadas.set(paso.nombre, paso.fecha);
  } else if (esFinal) {
    // Sin historial no se sabe por dónde pasó: solo se asegura el principio y el final.
    alcanzadas.set('Pendiente', null);
    alcanzadas.set(estado, null);
  } else {
    // Sin historial y abierta, pasó por todo lo anterior a la etapa en la que está.
    const hasta = ETAPAS_ABIERTAS.indexOf(estado);
    ETAPAS_ABIERTAS.slice(0, hasta + 1).forEach((nombre) => alcanzadas.set(nombre, null));
  }

  // Toda solicitud nace Enviada.
  if (!alcanzadas.has('Pendiente')) alcanzadas.set('Pendiente', null);

  const abiertas: Etapa[] = ETAPAS_ABIERTAS.map((nombre) => ({
    clave: nombre,
    etiqueta: nombre === 'Pendiente' ? 'Enviada' : etiquetaEstadoSolicitud(nombre, vista),
    alcanzada: alcanzadas.has(nombre),
    actual: !esFinal && estado === nombre,
    fecha: alcanzadas.get(nombre) ?? null,
    tono: 'normal',
    icono: 'checkmark',
  }));

  const final = TONO_FINAL[estado];

  return [
    ...abiertas,
    {
      clave: 'decision',
      etiqueta: esFinal ? etiquetaEstadoSolicitud(estado, vista) : 'Decisión',
      alcanzada: esFinal,
      actual: false,
      fecha: esFinal ? (alcanzadas.get(estado) ?? null) : null,
      tono: final?.tono ?? 'normal',
      icono: final?.icono ?? 'checkmark',
    },
  ];
}

const DIAMETRO: Record<Tamanio, number> = { completo: 24, medio: 18, compacto: 12 };
const ALTO_LINEA: Record<Tamanio, string> = {
  completo: 'h-[3px]',
  medio: 'h-[2px]',
  compacto: 'h-[2px]',
};

/**
 * Colores del punto: el camino recorrido va en marrón, la etapa en la que está parada ahora
 * en naranja (es lo que se mira primero) y el final según cómo terminó.
 */
function colorDelPunto(etapa: Etapa): { fondo: string; borde: string } {
  if (etapa.actual) return { fondo: PALETA.blanco, borde: PALETA.calido.naranja };
  if (!etapa.alcanzada) return { fondo: PALETA.neutral[100], borde: PALETA.neutral[300] };
  if (etapa.tono === 'positivo') return { fondo: PALETA.estado.exito, borde: PALETA.estado.exito };
  if (etapa.tono === 'negativo') return { fondo: PALETA.estado.error, borde: PALETA.estado.error };
  if (etapa.tono === 'neutro') return { fondo: PALETA.neutral[400], borde: PALETA.neutral[400] };
  return { fondo: PALETA.accent[600], borde: PALETA.accent[600] };
}

/** Un anillo que late alrededor del punto actual: la solicitud está acá y sigue viva. */
function Latido({ diametro }: { diametro: number }) {
  const escala = useSharedValue(1);
  const sinMovimiento = useReducedMotion();

  useEffect(() => {
    if (sinMovimiento) return;
    escala.value = withRepeat(withTiming(1.7, { duration: 1100 }), -1, false);
  }, [escala, sinMovimiento]);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
    opacity: 0.5 * (1.7 - escala.value),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: diametro,
          height: diametro,
          borderRadius: diametro / 2,
          backgroundColor: PALETA.calido.naranja,
        },
        estilo,
      ]}
    />
  );
}

interface PuntoProps {
  etapa: Etapa;
  tamanio: Tamanio;
  latir: boolean;
}

function Punto({ etapa, tamanio, latir }: PuntoProps) {
  const diametro = DIAMETRO[tamanio];
  const { fondo, borde } = colorDelPunto(etapa);
  const interior = Math.round(diametro / 2.2);

  // Una sola cosa adentro: el punto de "estás acá" o el ícono de lo alcanzado. Las dos juntas
  // se apilan y el punto queda corrido.
  const contenido = etapa.actual ? (
    tamanio === 'compacto' ? null : (
      <View
        style={{ width: interior, height: interior, borderRadius: interior / 2 }}
        className="bg-organic-calido-naranja"
      />
    )
  ) : etapa.alcanzada && tamanio !== 'compacto' ? (
    <Ionicons name={etapa.icono} size={tamanio === 'completo' ? 14 : 11} color={PALETA.blanco} />
  ) : null;

  return (
    <View style={{ width: diametro, height: diametro }} className="items-center justify-center">
      {latir ? <Latido diametro={diametro} /> : null}
      <View
        style={{
          width: diametro,
          height: diametro,
          borderRadius: diametro / 2,
          borderWidth: 2,
          backgroundColor: fondo,
          borderColor: borde,
        }}
        className="items-center justify-center"
      >
        {contenido}
      </View>
    </View>
  );
}

interface ProgresoSolicitudProps {
  estado: EstadoSolicitudNombre;
  /** Del más reciente al más viejo, como lo manda el backend. Sin esto se infiere del estado. */
  historial?: EstadoSolicitudHistorial[];
  /** Quién mira: cambia el rótulo del final ("No aceptada" para quien pidió). */
  vista?: VistaSolicitud;
  tamanio?: Tamanio;
}

export function ProgresoSolicitud({
  estado,
  historial,
  vista = 'adoptante',
  tamanio = 'compacto',
}: ProgresoSolicitudProps) {
  const etapas = etapasDe(estado, historial, vista);

  // Si el estado cambia mientras se está mirando (un refresco, un aviso), se siente.
  const anterior = useRef(estado);
  useEffect(() => {
    if (anterior.current !== estado) {
      anterior.current = estado;
      vibrar.seleccion();
    }
  }, [estado]);

  const pintada = (indice: number): boolean =>
    etapas[indice]!.alcanzada && etapas[indice + 1]?.alcanzada === true;

  const conTexto = tamanio !== 'compacto';

  return (
    <View
      accessible
      accessibilityLabel={`Estado de la solicitud: ${etiquetaEstadoSolicitud(estado, vista)}`}
      className={tamanio === 'compacto' ? 'mt-3' : 'mt-1'}
    >
      <View className="flex-row items-center">
        {etapas.map((etapa, indice) => (
          <View key={etapa.clave} className="flex-1 flex-row items-center">
            <View
              className={`flex-1 ${ALTO_LINEA[tamanio]} ${
                indice === 0
                  ? 'bg-transparent'
                  : pintada(indice - 1)
                    ? 'bg-organic-accent-600'
                    : 'bg-organic-neutral-300'
              }`}
            />
            <Punto etapa={etapa} tamanio={tamanio} latir={etapa.actual && tamanio === 'completo'} />
            <View
              className={`flex-1 ${ALTO_LINEA[tamanio]} ${
                indice === etapas.length - 1
                  ? 'bg-transparent'
                  : pintada(indice)
                    ? 'bg-organic-accent-600'
                    : 'bg-organic-neutral-300'
              }`}
            />
          </View>
        ))}
      </View>

      {conTexto ? (
        <View className="mt-2 flex-row">
          {etapas.map((etapa) => {
            const fecha = tamanio === 'completo' ? parsearFecha(etapa.fecha) : null;

            return (
              <View key={etapa.clave} className="flex-1 items-center px-0.5">
                <Text
                  numberOfLines={1}
                  className={`text-center font-cuerpo-semi ${
                    tamanio === 'completo' ? 'text-[12px]' : 'text-[10px]'
                  } ${
                    etapa.alcanzada || etapa.actual
                      ? 'text-organic-neutral-900'
                      : 'text-organic-neutral-500'
                  }`}
                >
                  {etapa.etiqueta}
                </Text>
                {fecha ? (
                  <Text className="mt-0.5 text-center font-cuerpo text-[11px] text-organic-neutral-600">
                    {aFechaVisible(fecha)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
