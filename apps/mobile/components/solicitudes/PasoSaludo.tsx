/**
 * Paso del saludo: lo que la persona le escribe al refugio, que sale como primer mensaje del
 * chat. Se pide redactado como mensaje (y se muestra como tal, en una burbuja) para que se
 * entienda que no es un campo más del formulario sino el primer "hola".
 */
import { Text, View } from 'react-native';

import { BurbujaMensaje } from '@/components/chat/BurbujaMensaje';
import { Nota } from '@/components/ui/Nota';
import { TextAreaField } from '@/components/ui/TextAreaField';
import type { ItemChat } from '@/lib/mensajesChat';
import { LIMITES } from '@/shared/validation/limits';

import { ResumenMascota } from './ResumenMascota';
import type { PasoProps } from './PasoProps';

/** Alto del área de escritura: es un mensaje breve, no un párrafo. */
const ALTO_SALUDO = 110;

/** La burbuja como la va a ver quien recibe: una propia, ya enviada. */
function itemDePrevia(contenido: string): ItemChat {
  return {
    clave: 'previa-del-saludo',
    mensajeId: null,
    contenido,
    adjuntos: [],
    esMio: true,
    fecha: new Date().toISOString(),
    entregado: false,
    leido: false,
    tipo: 'TEXTO',
    solicitud: null,
    solicitudPropia: false,
    aviso: null,
    mascota: null,
    ubicacion: null,
    eliminado: false,
    respondeA: null,
    estado: 'enviado',
  };
}

export function PasoSaludo({ borrador, errores, mascota, editar }: PasoProps) {
  const nombre = mascota.nombre ?? 'esta mascota';
  const destinatario = mascota.destinatario ?? 'el refugio';
  const esTransito = borrador.tipoSolicitud === 'Transito';
  const texto = borrador.motivacion.trim();

  return (
    <>
      <ResumenMascota
        nombre={mascota.nombre}
        imagenUrl={mascota.imagenUrl}
        subtitulo={mascota.subtitulo}
      />

      <TextAreaField
        label={`Escribile un saludo a ${destinatario}`}
        placeholder={
          esTransito
            ? `¡Hola! Vi a ${nombre} y me gustaría ofrecerle mi casa por un tiempo…`
            : `¡Hola! Vi a ${nombre} y me gustaría contarte por qué quiero darle un hogar…`
        }
        value={borrador.motivacion}
        onChangeText={(valor) => editar('motivacion', valor)}
        maximo={LIMITES.solicitud.motivacion.max}
        obligatorio
        error={errores.motivacion}
        ayuda={`Va a ser tu primer mensaje en el chat · mínimo ${LIMITES.solicitud.motivacion.min} caracteres`}
        variante="pregunta"
        altoMinimo={ALTO_SALUDO}
      />

      <View>
        <Text className="mb-2 font-cuerpo-semi text-[13px] text-organic-neutral-600">
          Así lo va a ver {destinatario}
        </Text>
        <BurbujaMensaje
          item={itemDePrevia(texto || 'Tu saludo va a aparecer acá.')}
          nombreContacto={destinatario}
        />
      </View>

      <Nota
        tono="consejo"
        texto={
          esTransito
            ? 'Contale cómo sería el tiempo que lo tendrías en casa.'
            : 'Presentate y contale cómo sería su día a día con vos.'
        }
      />
    </>
  );
}
