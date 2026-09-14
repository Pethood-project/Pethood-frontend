/**
 * Resumen de lo que el usuario ya tenía declarado, con un botón para cambiarlo. Es lo
 * primero que ve el paso 2 cuando ya hay un hogar previo (`/elegibilidad` lo trae): la
 * segunda solicitud pasa a ser un toque en vez de completar ocho preguntas otra vez.
 */
import { Text, View } from 'react-native';

import { CustomButton } from '@/components/CustomButton';
import { Nota } from '@/components/ui/Nota';
import {
  etiquetaEspacioExterior,
  etiquetaHorasSolo,
  etiquetaTipoVivienda,
} from '@/constants/Solicitudes';
import type { HogarSolicitante } from '@/services/solicitudes';

interface HogarPrecargadoProps {
  hogar: HogarSolicitante;
  onEditar: () => void;
}

/** "Casa con patio", o solo el tipo si no hay espacio al aire libre que sumar. */
function tituloVivienda(hogar: HogarSolicitante): string {
  const vivienda = etiquetaTipoVivienda(hogar.tipoVivienda) ?? 'Vivienda';
  const espacio = etiquetaEspacioExterior(hogar.espacioExterior);

  return espacio && hogar.espacioExterior !== 'Ninguno'
    ? `${vivienda} con ${espacio.toLowerCase()}`
    : vivienda;
}

/** "Sin niños · con experiencia · entre 4 y 8 h/día", el resto de las respuestas en una línea. */
function detalleConvivencia(hogar: HogarSolicitante): string {
  const partes = [
    hogar.tieneNinios ? 'con niños' : 'sin niños',
    hogar.tieneMascotas ? hogar.detalleMascotas || 'con otras mascotas' : 'sin otras mascotas',
    hogar.experienciaPrevia ? 'con experiencia' : 'sin experiencia previa',
  ];

  const horas = etiquetaHorasSolo(hogar.horasSolo);
  if (horas) partes.push(horas.replace('horas por día', 'h/día'));

  return partes.join(' · ');
}

export function HogarPrecargado({ hogar, onEditar }: HogarPrecargadoProps) {
  return (
    <View className="gap-3">
      <View className="gap-1 rounded-2xl border border-organic-neutral-300 bg-organic-surface p-3.5">
        <Text className="font-cuerpo-semi text-[14px] text-organic-neutral-900">
          {tituloVivienda(hogar)}
        </Text>
        <Text className="font-cuerpo text-[12.5px] text-organic-neutral-600">
          {hogar.direccion}
        </Text>

        <Text className="mt-2 font-cuerpo text-[12px] leading-[17px] text-organic-neutral-600">
          {detalleConvivencia(hogar)}
        </Text>

        <View className="mt-3">
          <CustomButton title="Actualizar mis datos" variant="acento-borde" onPress={onEditar} />
        </View>
      </View>

      <Nota texto="Son los datos de tu última solicitud. Si siguen siendo correctos, seguí." />
    </View>
  );
}
