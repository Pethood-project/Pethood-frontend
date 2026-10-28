/**
 * Lo que deja PetHood en la sala cuando la solicitud avanza: revisada, aceptada o no aceptada.
 * No es un mensaje de nadie, así que no tiene lado; tocarlo lleva al detalle de la solicitud.
 *
 * Revisada y no aceptada son una línea discreta. Aceptada es el hito más grande del proceso y
 * no puede pasar como una línea más: va como una foto polaroid de la mascota, con su nombre y
 * "adoptado" o "en tránsito" abajo. Se toca entera para abrir la solicitud.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { PressableAnimado } from '@/components/ui/PressableAnimado';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { SolicitudEnChat } from '@/services/chats';
import { textoSegunGenero } from '@/shared/genero';
import { aFechaVisible, horaVisible, parsearFecha } from '@/shared/validation/dates';

interface AvisoEstadoSolicitudProps {
  /** El aviso tal como lo guarda el backend ("La solicitud fue aceptada"). */
  texto: string;
  fecha: string | null;
  /** La solicitud a la que se refiere, con su mascota. Puede faltar en un mensaje viejo. */
  solicitud: SolicitudEnChat | null;
  onVerSolicitud?: () => void;
}

/** El backend manda solo el texto: qué pasó se lee de lo que dice. */
function esAceptada(texto: string): boolean {
  return texto.includes('aceptada') && !texto.includes('no fue aceptada');
}

function estiloDeLinea(texto: string): {
  icono: keyof typeof Ionicons.glyphMap;
  color: string;
  fondo: string;
} {
  if (texto.includes('no fue aceptada')) {
    return {
      icono: 'heart-outline',
      color: PALETA.neutral[700],
      fondo: PALETA.neutral[200],
    };
  }

  return {
    icono: 'eye-outline',
    color: PALETA.accent[700],
    fondo: PALETA.calido.amarilloClaro,
  };
}

/** "Adoptado el 25/10/2026": la fecha en que se aceptó, o la del aviso si no la trae. */
function diaDeAdopcion(solicitud: SolicitudEnChat, avisoEn: string | null): string | null {
  const dia = parsearFecha(solicitud.fechaRespuesta ?? avisoEn);
  return dia ? `Adopción del ${aFechaVisible(dia)}` : null;
}

/** "Del 15/11/2026 al 15/12/2026": el período que se acordó. */
function periodoDeTransito(solicitud: SolicitudEnChat): string | null {
  const inicio = parsearFecha(solicitud.transito?.fechaInicio);
  const fin = parsearFecha(solicitud.transito?.fechaFin);

  return inicio && fin ? `Del ${aFechaVisible(inicio)} al ${aFechaVisible(fin)}` : null;
}

/** Marco de la polaroid: parejo arriba y a los costados, ancho abajo para el pie. */
const MARCO = 12;
const PIE = 72;

function Polaroid({
  solicitud,
  fecha,
  onVerSolicitud,
}: {
  solicitud: SolicitudEnChat;
  fecha: string | null;
  onVerSolicitud?: () => void;
}) {
  const { width } = useWindowDimensions();
  const ancho = Math.min(280, width * 0.72);
  const foto = urlAbsoluta(solicitud.mascota.imagenUrl);
  const nombre = solicitud.mascota.nombre ?? 'La mascota';
  const esTransito = solicitud.tipo === 'Transito';

  const estado = esTransito
    ? 'en tránsito'
    : textoSegunGenero(solicitud.mascota.genero ?? 'MACHO', 'adoptado', 'adoptada');

  // Abajo del nombre, cuándo fue: el día de la adopción o el período de tránsito.
  const leyenda = esTransito ? periodoDeTransito(solicitud) : diaDeAdopcion(solicitud, fecha);

  return (
    <View className="w-full items-center py-2">
      <Text className="mb-2 font-cuerpo text-[11px] text-organic-neutral-600">
        {`PetHood${fecha ? ` · ${horaVisible(new Date(fecha))}` : ''}`}
      </Text>

      {/* La inclinación va en un contenedor aparte: el rebote del toque usa su propio
          `transform` y pisaría el giro. Ladeada apenas, como una foto apoyada. */}
      <View style={{ width: ancho, transform: [{ rotate: '-2.5deg' }] }}>
        <PressableAnimado
          accessibilityRole="button"
          accessibilityLabel={`${nombre} ${estado}. Ver solicitud`}
          disabled={!onVerSolicitud}
          onPress={onVerSolicitud}
          escala={0.97}
        >
          <View
            style={{
              backgroundColor: PALETA.blanco,
              paddingHorizontal: MARCO,
              paddingTop: MARCO,
              paddingBottom: 0,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: PALETA.neutral[300],
              shadowColor: PALETA.accent[900],
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.22,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <View
              style={{ width: '100%', aspectRatio: 1, borderRadius: 2 }}
              className="items-center justify-center overflow-hidden bg-organic-calido-naranja"
            >
              {foto ? (
                <Image
                  source={{ uri: foto }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  accessibilityLabel={`Foto de ${nombre}`}
                />
              ) : (
                <Ionicons name="paw" size={56} color="rgba(255,255,255,0.65)" />
              )}
            </View>

            <View style={{ height: PIE }} className="items-center justify-center px-1">
              <Text
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                className="text-center font-titulo text-[22px] leading-[26px] text-organic-neutral-900"
              >
                {nombre}{' '}
                <Text style={{ color: PALETA.accent[600] }} className="font-titulo">
                  {estado}
                </Text>
              </Text>
              {leyenda ? (
                <Text className="mt-0.5 text-center font-cuerpo-semi text-[13px] text-organic-neutral-600">
                  {leyenda}
                </Text>
              ) : null}
            </View>
          </View>

          {/* La cinta con la que se pegó la foto. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -9,
              alignSelf: 'center',
              width: 74,
              height: 22,
              backgroundColor: PALETA.calido.amarillo,
              opacity: 0.88,
              transform: [{ rotate: '3deg' }],
              borderRadius: 2,
            }}
          />
        </PressableAnimado>
      </View>
    </View>
  );
}

export function AvisoEstadoSolicitud({
  texto,
  fecha,
  solicitud,
  onVerSolicitud,
}: AvisoEstadoSolicitudProps) {
  if (esAceptada(texto) && solicitud) {
    return <Polaroid solicitud={solicitud} fecha={fecha} onVerSolicitud={onVerSolicitud} />;
  }

  const { icono, color, fondo } = esAceptada(texto)
    ? {
        icono: 'checkmark-circle' as const,
        color: PALETA.estado.exito,
        fondo: PALETA.accent[100],
      }
    : estiloDeLinea(texto);

  return (
    <View className="w-full items-center py-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${texto}. Ver solicitud`}
        disabled={!onVerSolicitud}
        onPress={onVerSolicitud}
        style={{ backgroundColor: fondo }}
        className="flex-row items-center gap-2 rounded-full px-4 py-2 active:opacity-80"
      >
        <Ionicons name={icono} size={17} color={color} />
        <Text style={{ color }} className="font-cuerpo-semi text-[13px]">
          {texto}
        </Text>
        {fecha ? (
          <Text className="font-cuerpo text-[11px] text-organic-neutral-600">
            {horaVisible(new Date(fecha))}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}
