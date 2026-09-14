/** Paso 3 de GUI-7.1.1: por qué quiere adoptar o transitar a esta mascota. */
import { Nota } from '@/components/ui/Nota';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { LIMITES } from '@/shared/validation/limits';

import { ResumenMascota } from './ResumenMascota';
import type { PasoProps } from './PasoProps';

/** Alto del área de escritura: la pregunta pide un párrafo, no un renglón. */
const ALTO_MOTIVACION = 150;

export function PasoMotivo({ borrador, errores, mascota, editar }: PasoProps) {
  const nombre = mascota.nombre ?? 'esta mascota';
  const pregunta =
    borrador.tipoSolicitud === 'Transito'
      ? `¿Por qué querés ser el hogar de tránsito de ${nombre}?`
      : `¿Por qué querés adoptar a ${nombre}?`;

  return (
    <>
      <ResumenMascota
        nombre={mascota.nombre}
        imagenUrl={mascota.imagenUrl}
        subtitulo={mascota.subtitulo}
      />

      <TextAreaField
        label={pregunta}
        placeholder="Contanos por qué querés adoptar esta mascota"
        value={borrador.motivacion}
        onChangeText={(texto) => editar('motivacion', texto)}
        maximo={LIMITES.solicitud.motivacion.max}
        obligatorio
        error={errores.motivacion}
        ayuda={`Mínimo ${LIMITES.solicitud.motivacion.min} caracteres`}
        variante="pregunta"
        altoMinimo={ALTO_MOTIVACION}
      />

      <Nota tono="consejo" texto="Contale al refugio cómo sería su día a día con vos." />
    </>
  );
}
