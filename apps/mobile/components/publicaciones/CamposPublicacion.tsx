/**
 * Campos de una publicación en adopción, compartidos por el alta (GUI-24) y la edición: las
 * dos pantallas tienen que aplicar exactamente las mismas reglas, así que viven acá una
 * sola vez. La mascota queda afuera: el alta la elige y la edición la muestra fija, y cada
 * pantalla pasa esa fila en `filaMascota`.
 *
 * La validación es para UX; la fuente de verdad es el backend.
 */
import type { ReactNode } from 'react';

import { ChipMultiField } from '@/components/ui/ChipMultiField';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { PhotosPickerField, type FotoElegida } from '@/components/ui/PhotosPickerField';
import { TagInputField } from '@/components/ui/TagInputField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import type { Genero } from '@/services/mascotas';
import { rasgoSegunGenero } from '@/shared/genero';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';

/**
 * Rasgos de prueba hasta que exista un catálogo propio. Cuando se defina, salen de la API
 * como el resto de los catálogos.
 *
 * "Bueno con chicos" y "Bueno con otras mascotas" no son rasgos cualquiera: son los dos
 * que resuelven los toggles de "Compatible con" del filtro de Adoptar. El backend los
 * matchea por texto exacto (`publicaciones.dto.ts`), así que cambiar la redacción de
 * cualquiera de los dos rompe el filtro en silencio.
 */
const RASGOS_DE_PERSONALIDAD = [
  'Juguetón',
  'Cariñoso',
  'Tranquilo',
  'Activo',
  'Protector',
  'Sociable',
  'Independiente',
  'Bueno con chicos',
  'Bueno con otras mascotas',
];

export interface ValoresPublicacion {
  /** En orden: la primera es la portada. */
  fotos: FotoElegida[];
  descripcion: string;
  personalidad: string[];
  requisitos: string[];
  ubicacion: string;
}

export const VALORES_INICIALES: ValoresPublicacion = {
  fotos: [],
  descripcion: '',
  personalidad: [],
  requisitos: [],
  ubicacion: '',
};

export interface ErroresCamposPublicacion {
  descripcion?: string;
  ubicacion?: string;
}

export type CampoValidado = keyof ErroresCamposPublicacion;

export const ETIQUETAS_CAMPOS: Record<CampoValidado, string> = {
  descripcion: 'la descripción',
  ubicacion: 'la ubicación',
};

export function validarCamposPublicacion(valores: ValoresPublicacion): ErroresCamposPublicacion {
  const errores: ErroresCamposPublicacion = {};

  const errorDescripcion = validarTexto(valores.descripcion, {
    min: 1,
    max: LIMITES.publicacion.descripcion.max,
    etiqueta: 'La descripción',
  });
  if (errorDescripcion) errores.descripcion = errorDescripcion;

  const errorUbicacion = validarTexto(valores.ubicacion, {
    min: 1,
    max: LIMITES.publicacion.ubicacion.max,
    etiqueta: 'La ubicación',
  });
  if (errorUbicacion) errores.ubicacion = errorUbicacion;

  return errores;
}

interface CamposPublicacionProps {
  valores: ValoresPublicacion;
  onChange: (cambios: Partial<ValoresPublicacion>) => void;
  /** Decide cómo concordar "Desparasitado" y los rasgos. */
  generoMascota: Genero | null;
  /** El error a mostrar de cada campo, ya filtrado por "tocado" o "intentó enviar". */
  errorDe: (campo: CampoValidado) => string | undefined;
  onBlur: (campo: CampoValidado) => void;
  /** Primera fila de la tarjeta: el selector de mascota del alta o la mascota fija. */
  filaMascota: ReactNode;
}

export function CamposPublicacion({
  valores,
  onChange,
  generoMascota,
  errorDe,
  onBlur,
  filaMascota,
}: CamposPublicacionProps) {
  // Solo la etiqueta (ver `ChipMultiField.etiquetaDe`): lo que se guarda es el rasgo en masculino.
  const etiquetaDeRasgo = (rasgo: string): string => rasgoSegunGenero(generoMascota, rasgo);

  return (
    <>
      <PhotosPickerField
        fotos={valores.fotos}
        onChange={(fotos) => onChange({ fotos })}
        maximo={LIMITES.publicacion.imagenes.max}
      />

      <FormCard>
        <FormCardRow>{filaMascota}</FormCardRow>

        <FormCardRow>
          <TextAreaField
            label="Descripción para el swipe"
            obligatorio
            placeholder="Contá qué lo hace especial"
            value={valores.descripcion}
            onChangeText={(descripcion) => onChange({ descripcion })}
            onBlur={() => onBlur('descripcion')}
            maximo={LIMITES.publicacion.descripcion.max}
            error={errorDe('descripcion')}
            grande
          />
        </FormCardRow>

        <FormCardRow>
          <ChipMultiField
            label="Personalidad"
            opciones={RASGOS_DE_PERSONALIDAD}
            seleccionadas={valores.personalidad}
            onChange={(personalidad) => onChange({ personalidad })}
            etiquetaDe={etiquetaDeRasgo}
            grande
          />
        </FormCardRow>

        <FormCardRow>
          <TagInputField
            label="Requisitos de adoptante"
            placeholder="Ej. Casa con patio"
            etiquetas={valores.requisitos}
            onChange={(requisitos) => onChange({ requisitos })}
            maximoPorEtiqueta={LIMITES.publicacion.requisito.max}
            grande
          />
        </FormCardRow>

        <FormCardRow ultima>
          <TextField
            label="Ubicación"
            obligatorio
            placeholder="Ej. Palermo, CABA"
            value={valores.ubicacion}
            onChangeText={(ubicacion) => onChange({ ubicacion })}
            onBlur={() => onBlur('ubicacion')}
            maxLength={LIMITES.publicacion.ubicacion.max}
            error={errorDe('ubicacion')}
            grande
          />
        </FormCardRow>
      </FormCard>
    </>
  );
}
