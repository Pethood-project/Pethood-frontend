/** Paso 1 de GUI-7.1.1: adoptar o transitar, y el período si es tránsito. */
import { DateField } from '@/components/ui/DateField';
import { Nota } from '@/components/ui/Nota';
import { SegmentedField } from '@/components/ui/SegmentedField';
import { OPCIONES_TIPO_SOLICITUD, PREGUNTAS } from '@/constants/Solicitudes';

import { ResumenMascota } from './ResumenMascota';
import type { PasoProps } from './PasoProps';

/**
 * Un tránsito puede arrancar hoy mismo y no tiene tope cercano: hay hogares que se ofrecen
 * por un año. Por eso se pisa el `fechaMaxima` de `DateField`, que por defecto es hoy
 * porque la mayoría de las fechas del dominio son de nacimiento o de visita médica.
 */
const ANIOS_MAXIMOS_DE_TRANSITO = 10;

export function PasoTipo({ borrador, errores, mascota, editar }: PasoProps) {
  const esTransito = borrador.tipoSolicitud === 'Transito';
  const hoy = new Date();
  const tope = new Date(hoy.getFullYear() + ANIOS_MAXIMOS_DE_TRANSITO, hoy.getMonth(), hoy.getDate());

  return (
    <>
      <ResumenMascota
        nombre={mascota.nombre}
        imagenUrl={mascota.imagenUrl}
        subtitulo={mascota.subtitulo}
      />

      <SegmentedField
        label={PREGUNTAS.tipoSolicitud}
        opciones={OPCIONES_TIPO_SOLICITUD}
        valor={borrador.tipoSolicitud}
        onChange={(valor) => editar('tipoSolicitud', valor)}
        obligatorio
        error={errores.tipoSolicitud}
        variante="tarjetas"
        varianteCampo="pregunta"
      />

      {esTransito ? (
        <>
          <DateField
            label={PREGUNTAS.fechaInicioTransito}
            placeholder="dd/mm/aaaa"
            valor={borrador.fechaInicioTransito}
            onChange={(fecha) => editar('fechaInicioTransito', fecha)}
            obligatorio
            error={errores.fechaInicioTransito}
            fechaMinima={hoy}
            fechaMaxima={tope}
            mostrarEdad={false}
            variante="pregunta"
          />

          <DateField
            label={PREGUNTAS.fechaFinTransito}
            placeholder="dd/mm/aaaa"
            valor={borrador.fechaFinTransito}
            onChange={(fecha) => editar('fechaFinTransito', fecha)}
            obligatorio
            error={errores.fechaFinTransito}
            // El calendario arranca en la fecha de inicio: un fin anterior no es elegible.
            fechaMinima={borrador.fechaInicioTransito ?? hoy}
            fechaMaxima={tope}
            mostrarEdad={false}
            variante="pregunta"
          />
        </>
      ) : (
        <Nota texto="Si elegís tránsito te vamos a pedir el período en el que podés recibirla." />
      )}
    </>
  );
}
