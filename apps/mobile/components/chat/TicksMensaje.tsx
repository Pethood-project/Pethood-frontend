/**
 * Acuse de un mensaje propio, al estilo de las apps de mensajería: un tilde cuando el
 * servidor lo guardó, dos cuando le llegó al destinatario y dos pintados cuando lo leyó.
 *
 * Sólo tiene sentido en los mensajes propios: el estado de lectura de lo que nos mandan a
 * nosotros no se le muestra a nadie.
 *
 * Los tres estados son reales: el backend expone `entregado` y `leido` por separado desde
 * que el acuse de recibo vive en `usuario_chat_ultima_entrega` / `ultima_lectura`
 * (ver `api-chat-sala.md`).
 */
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { PALETA } from '@/constants/theme';
import type { ItemChat } from '@/lib/mensajesChat';

/** Hasta dónde llegó el mensaje. */
export type EntregaMensaje = 'enviado' | 'entregado' | 'leido';

/** Sobre qué fondo se pinta: la burbuja propia (naranja) o el fondo de la pantalla. */
type FondoTicks = 'burbuja' | 'pantalla';

const ETIQUETAS: Record<EntregaMensaje, string> = {
  enviado: 'Enviado',
  entregado: 'Entregado',
  leido: 'Leído',
};

/**
 * Color de los tildes. El "pintado" de la lectura cambia según el fondo: sobre el naranja
 * de la burbuja el amarillo cálido es lo único que resalta, y sobre el beige de la pantalla
 * resalta el acento.
 */
const COLORES: Record<FondoTicks, { pendiente: string; leido: string }> = {
  burbuja: { pendiente: PALETA.blanco, leido: PALETA.calido.amarillo },
  pantalla: { pendiente: PALETA.neutral[600], leido: PALETA.accent[600] },
};

/**
 * En qué punto está un mensaje propio ya confirmado.
 *
 * `enviando` y `error` no llegan acá: esos los pinta la burbuja con su propio texto, porque
 * todavía no hay mensaje del lado del servidor que acusar.
 */
export function entregaDe(item: ItemChat): EntregaMensaje {
  if (item.leido) return 'leido';
  return item.entregado ? 'entregado' : 'enviado';
}

interface TicksMensajeProps {
  entrega: EntregaMensaje;
  fondo: FondoTicks;
  tamanio?: number;
}

export function TicksMensaje({ entrega, fondo, tamanio = 15 }: TicksMensajeProps) {
  const leido = entrega === 'leido';
  const colores = COLORES[fondo];

  return (
    // Un tilde sin leer se atenúa para que el pintado se note como un cambio de estado y no
    // sólo como un ícono distinto. El leído va a opacidad plena.
    <View className={leido ? undefined : 'opacity-80'}>
      <Ionicons
        name={entrega === 'enviado' ? 'checkmark' : 'checkmark-done'}
        size={tamanio}
        color={leido ? colores.leido : colores.pendiente}
        accessibilityLabel={ETIQUETAS[entrega]}
      />
    </View>
  );
}
