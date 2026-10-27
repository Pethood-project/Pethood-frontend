/**
 * Paso con las preguntas propias del refugio, que se suman al final del formulario común.
 * Cada una se responde según su tipo: texto libre, sí/no, o una de varias opciones.
 */
import { Text } from 'react-native';

import { ChipGroupField } from '@/components/ui/ChipGroupField';
import { Nota } from '@/components/ui/Nota';
import { TextAreaField } from '@/components/ui/TextAreaField';
import type { PreguntaAplicable } from '@/services/solicitudes';
import { LIMITES } from '@/shared/validation/limits';

import { ResumenMascota } from './ResumenMascota';
import type { PasoProps } from './PasoProps';

const OPCIONES_SI_NO = [
  { valor: 'Sí', etiqueta: 'Sí' },
  { valor: 'No', etiqueta: 'No' },
];

interface PreguntaCampoProps {
  pregunta: PreguntaAplicable;
  valor: string;
  error?: string;
  onChange: (valor: string) => void;
}

function PreguntaCampo({ pregunta, valor, error, onChange }: PreguntaCampoProps) {
  if (pregunta.tipo === 'TEXTO') {
    return (
      <TextAreaField
        label={pregunta.texto}
        value={valor}
        onChangeText={onChange}
        maximo={LIMITES.preguntaAdopcion.respuesta.max}
        obligatorio={pregunta.obligatoria}
        error={error}
        variante="pregunta"
      />
    );
  }

  const opciones =
    pregunta.tipo === 'SI_NO'
      ? OPCIONES_SI_NO
      : pregunta.opciones.map((opcion) => ({ valor: opcion, etiqueta: opcion }));

  return (
    <ChipGroupField
      label={pregunta.texto}
      opciones={opciones}
      valor={valor === '' ? null : valor}
      onChange={onChange}
      obligatorio={pregunta.obligatoria}
      error={error}
      variante="pregunta"
    />
  );
}

export function PasoPreguntas({ borrador, errores, mascota, editar, preguntas }: PasoProps) {
  const destinatario = mascota.destinatario ?? 'el refugio';

  return (
    <>
      <ResumenMascota
        nombre={mascota.nombre}
        imagenUrl={mascota.imagenUrl}
        subtitulo={mascota.subtitulo}
      />

      <Text className="font-cuerpo text-[14px] leading-5 text-organic-neutral-700">
        {destinatario} quiere conocerte un poco más antes de avanzar.
      </Text>

      {preguntas.map((pregunta) => (
        <PreguntaCampo
          key={pregunta.id}
          pregunta={pregunta}
          valor={borrador.respuestas[pregunta.id] ?? ''}
          error={errores.respuestas?.[pregunta.id]}
          onChange={(valor) =>
            editar('respuestas', { ...borrador.respuestas, [pregunta.id]: valor })
          }
        />
      ))}

      <Nota tono="consejo" texto="Las que no tienen asterisco son opcionales." />
    </>
  );
}
