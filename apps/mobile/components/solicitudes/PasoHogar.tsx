/**
 * Paso 2 de GUI-7.1.1: las preguntas sobre el hogar del solicitante. Todo lo que se
 * responde acá se guarda en la clase `Hogar` del modelo.
 *
 * Con hogar precargado (ya declaró uno antes) arranca mostrando el resumen de
 * `HogarPrecargado`; el formulario completo solo aparece si toca "Actualizar mis datos".
 * Sin precarga (primera solicitud) no hay nada que resumir, así que va directo al form.
 */
import { View } from 'react-native';

import { ChipGroupField } from '@/components/ui/ChipGroupField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { ToggleField } from '@/components/ui/ToggleField';
import {
  OPCIONES_ESPACIO_EXTERIOR,
  OPCIONES_HORAS_SOLO,
  OPCIONES_TIPO_VIVIENDA,
  PREGUNTAS,
} from '@/constants/Solicitudes';
import { LIMITES } from '@/shared/validation/limits';

import { HogarPrecargado } from './HogarPrecargado';
import type { PasoProps } from './PasoProps';

export function PasoHogar({
  borrador,
  errores,
  editar,
  hogarPrecargado,
  editandoHogar,
  onEditarHogar,
}: PasoProps) {
  if (hogarPrecargado && !editandoHogar) {
    return <HogarPrecargado hogar={hogarPrecargado} onEditar={onEditarHogar} />;
  }

  return (
    <>
      <TextField
        label={PREGUNTAS.direccion}
        placeholder="Calle, número y barrio"
        value={borrador.direccion}
        onChangeText={(texto) => editar('direccion', texto)}
        obligatorio
        error={errores.direccion}
        variante="pregunta"
        maxLength={LIMITES.hogar.direccion.max}
      />

      <ChipGroupField
        label={PREGUNTAS.tipoVivienda}
        opciones={OPCIONES_TIPO_VIVIENDA}
        valor={borrador.tipoVivienda}
        onChange={(valor) => editar('tipoVivienda', valor)}
        obligatorio
        error={errores.tipoVivienda}
        variante="pregunta"
      />

      <ChipGroupField
        label={PREGUNTAS.espacioExterior}
        opciones={OPCIONES_ESPACIO_EXTERIOR}
        valor={borrador.espacioExterior}
        onChange={(valor) => editar('espacioExterior', valor)}
        obligatorio
        error={errores.espacioExterior}
        variante="pregunta"
      />

      <ToggleField
        label={PREGUNTAS.tieneNinios}
        valor={borrador.tieneNinios}
        onChange={(valor) => editar('tieneNinios', valor)}
        variante="caja"
      />

      <View className="gap-2">
        <ToggleField
          label={PREGUNTAS.tieneMascotas}
          valor={borrador.tieneMascotas}
          onChange={(valor) => editar('tieneMascotas', valor)}
          variante="caja"
        />

        {/* El detalle solo aparece con el interruptor encendido: preguntar cuáles cuando
            respondió que no tiene sería pedirle que complete algo que no existe. */}
        {borrador.tieneMascotas ? (
          <TextField
            label="Contanos cuáles"
            placeholder="Tengo 1 gato y otros 2 perros grandes"
            value={borrador.detalleMascotas}
            onChangeText={(texto) => editar('detalleMascotas', texto)}
            error={errores.detalleMascotas}
            variante="pregunta"
            maxLength={LIMITES.hogar.detalleMascotas.max}
          />
        ) : null}
      </View>

      <ToggleField
        label={PREGUNTAS.experienciaPrevia}
        valor={borrador.experienciaPrevia}
        onChange={(valor) => editar('experienciaPrevia', valor)}
        variante="caja"
      />

      <ChipGroupField
        label={PREGUNTAS.horasSolo}
        opciones={OPCIONES_HORAS_SOLO}
        valor={borrador.horasSolo}
        onChange={(valor) => editar('horasSolo', valor)}
        obligatorio
        error={errores.horasSolo}
        variante="pregunta"
      />

      <TextAreaField
        label={PREGUNTAS.descripcion}
        placeholder="Ej.: vivimos en planta baja, con patio cerrado y sin escaleras."
        value={borrador.descripcion}
        onChangeText={(texto) => editar('descripcion', texto)}
        maximo={LIMITES.hogar.descripcion.max}
        error={errores.descripcion}
        variante="pregunta"
      />
    </>
  );
}
