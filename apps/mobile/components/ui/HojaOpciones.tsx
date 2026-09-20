/**
 * Hoja inferior con una lista de opciones, al estilo del diseño Organic (artboard 38,
 * "Enviar en el chat"): velo oscuro, tarjeta redondeada abajo, título en Caprasimo y cada
 * opción con su ícono en un cuadrito amarillo.
 *
 * Reemplaza al `Alert.alert` con botones, que en Android sale con el diálogo del sistema y
 * no con el de la app. Sirve para cualquier "elegí una de estas": de dónde sacar una foto,
 * qué mandar en el chat, etc.
 *
 * Una opción sin `onPress` se pinta igual pero no responde: es el mismo criterio que
 * `BotonCircular` usa para las acciones cuya pantalla todavía no existe.
 *
 * Medidas del artboard (sobre 262px, con el factor ×1,33 de HU-5.1): velo `rgba(43,22,9,.28)`;
 * hoja a 11 de cada borde, radio 27, padding 16, sombra `0 -6px 20px rgba(100,51,18,.18)`;
 * título 17; opciones con 8 de separación, fondo del beige de pantalla, radio 17 y padding
 * 12/13; el cuadrito del ícono 37 de lado, radio 15, sobre el amarillo claro.
 */
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PALETA } from '@/constants/theme';

type NombreIcono = keyof typeof Ionicons.glyphMap;

/** Lado del cuadrito de color que envuelve al ícono. */
const CUADRO = 37;
const RADIO_CUADRO = 15;

export interface OpcionHoja {
  icono: NombreIcono;
  etiqueta: string;
  /** Sin esto la opción se ve igual pero no responde. */
  onPress?: () => void;
}

interface HojaOpcionesProps {
  visible: boolean;
  titulo: string;
  /** Línea chica bajo el título, para la pregunta ("¿De dónde las sacamos?"). */
  subtitulo?: string;
  opciones: OpcionHoja[];
  onCerrar: () => void;
}

function Opcion({ opcion }: { opcion: OpcionHoja }) {
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

  if (!opcion.onPress) {
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
      onPress={opcion.onPress}
      className={`${clases} active:opacity-80`}
    >
      {contenido}
    </Pressable>
  );
}

export function HojaOpciones({ visible, titulo, subtitulo, opciones, onCerrar }: HojaOpcionesProps) {
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
            <Text className="font-titulo text-[17px] text-organic-neutral-900">{titulo}</Text>

            {subtitulo ? (
              <Text className="mt-1 font-cuerpo text-[13px] text-organic-neutral-600">
                {subtitulo}
              </Text>
            ) : null}

            <View className="mt-3 gap-2">
              {opciones.map((opcion) => (
                <Opcion key={opcion.etiqueta} opcion={opcion} />
              ))}
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}
