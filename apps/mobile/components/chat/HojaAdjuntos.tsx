/**
 * "Enviar en el chat" (GUI-14, artboard 38): la hoja que sale del botón `+` de la barra de
 * escritura, con las cinco cosas que se pueden mandar en una conversación.
 *
 * **Sólo "Foto" está implementada.** Las otras cuatro se pintan idénticas pero no responden:
 * es el mismo criterio que `BotonCircular` usa para las acciones cuya pantalla todavía no
 * existe — dejar el hueco o esconderlas sería peor, porque la lista del diseño se lee como
 * un conjunto. Ninguna tiene HU en REQUISITOS.md todavía (ver `docs/api-chat-sala.md`), así
 * que no se inventa su comportamiento.
 *
 * Medidas del artboard (sobre 262px, con el factor ×1,33 de HU-5.1): velo `rgba(43,22,9,.28)`;
 * hoja a 11 de cada borde, radio 27, padding 16, sombra `0 -6px 20px rgba(100,51,18,.18)`;
 * título en Caprasimo 17; opciones con 8 de separación, fondo del beige de pantalla, radio
 * 17 y padding 12/13; el cuadrito del ícono 37 de lado, radio 15, sobre el amarillo claro.
 */
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PALETA } from '@/constants/theme';

type NombreIcono = keyof typeof Ionicons.glyphMap;

/** Lado del cuadrito de color que envuelve al ícono. */
const CUADRO = 37;
const RADIO_CUADRO = 15;

interface OpcionAdjunto {
  icono: NombreIcono;
  etiqueta: string;
}

/**
 * En el orden del artboard. La primera es la única con acción; el resto espera su HU.
 *
 * El diseño dice "Foto o video", pero **el backend sólo acepta jpg, png y webp**: la
 * etiqueta promete algo que el selector ni siquiera ofrece. Se nombra por lo que hace.
 */
const OPCIONES: OpcionAdjunto[] = [
  { icono: 'camera-outline', etiqueta: 'Foto' },
  { icono: 'paw-outline', etiqueta: 'Compartir una mascota' },
  { icono: 'document-text-outline', etiqueta: 'Enviar solicitud' },
  { icono: 'calendar-outline', etiqueta: 'Coordinar visita' },
  { icono: 'location-outline', etiqueta: 'Ubicación del refugio' },
];

interface HojaAdjuntosProps {
  visible: boolean;
  onCerrar: () => void;
  /** Abre el selector de fotos. Es la única opción con acción. */
  onElegirFoto: () => void;
}

function Opcion({ opcion, onPress }: { opcion: OpcionAdjunto; onPress?: () => void }) {
  const contenido = (
    <>
      {/* El amarillo claro del diseño es el mismo de la tarjeta amarilla de Inicio. */}
      <View
        style={{
          width: CUADRO,
          height: CUADRO,
          borderRadius: RADIO_CUADRO,
          backgroundColor: PALETA.calido.amarilloClaro,
        }}
        className="flex-none items-center justify-center"
      >
        <Ionicons name={opcion.icono} size={19} color={PALETA.accent[700]} />
      </View>

      <Text className="font-cuerpo-semi text-[14px] text-organic-neutral-900">
        {opcion.etiqueta}
      </Text>
    </>
  );

  const clases = 'flex-row items-center gap-3 rounded-[17px] bg-organic-bg px-[13px] py-3';

  // Sin `onPress` se ve igual pero no responde: su pantalla todavía no existe.
  if (!onPress) {
    return (
      <View
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={`${opcion.etiqueta}. Todavía no disponible`}
        className={clases}
      >
        {contenido}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={opcion.etiqueta}
      onPress={onPress}
      className={`${clases} active:opacity-80`}
    >
      {contenido}
    </Pressable>
  );
}

export function HojaAdjuntos({ visible, onCerrar, onElegirFoto }: HojaAdjuntosProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android: sin esto el botón físico de retroceso no cierra la hoja.
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      {/* El velo cierra al tocarlo, que es lo que espera cualquiera frente a una hoja. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        onPress={onCerrar}
        style={{ backgroundColor: 'rgba(43,22,9,0.28)' }}
        className="flex-1 justify-end"
      >
        <SafeAreaView edges={['bottom']}>
          {/* Un Pressable sin acción frena el toque: tocar la hoja no la cierra. */}
          <Pressable
            onPress={() => undefined}
            style={{
              shadowColor: PALETA.accent[800],
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.18,
              shadowRadius: 20,
              elevation: 12,
            }}
            className="m-[11px] rounded-[27px] bg-organic-neutral-100 p-4"
          >
            <Text className="mb-3 font-titulo text-[17px] text-organic-neutral-900">
              Enviar en el chat
            </Text>

            <View className="gap-2">
              {OPCIONES.map((opcion) => (
                <Opcion
                  key={opcion.etiqueta}
                  opcion={opcion}
                  onPress={opcion.etiqueta === 'Foto' ? onElegirFoto : undefined}
                />
              ))}
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}
