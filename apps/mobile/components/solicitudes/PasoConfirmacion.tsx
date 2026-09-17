/**
 * Paso 4 de GUI-7.1.1: el resumen de lo respondido y la conformidad antes de mandarla.
 *
 * No repite el formulario campo por campo: junta las respuestas en cinco renglones
 * legibles. Para corregir algo se vuelve con "Atrás", que conserva todo lo cargado.
 */
import { Text } from 'react-native';

import { Casilla } from '@/components/ui/Casilla';
import { FilaDato, TarjetaDatos } from '@/components/ui/FilaDato';
import {
  etiquetaEspacioExterior,
  etiquetaHorasSolo,
  etiquetaTipoSolicitud,
  etiquetaTipoVivienda,
} from '@/constants/Solicitudes';
import { aFechaVisible, duracionEnTexto } from '@/shared/validation/dates';

import { ResumenMascota } from './ResumenMascota';
import type { PasoProps } from './PasoProps';
import type { Borrador } from './borrador';

const CONFORMIDAD =
  'Confirmo que los datos son correctos y acepto que el refugio se contacte conmigo.';

/** Cuánto se recorta el motivo en el resumen: es un recordatorio, no el texto completo. */
const LARGO_MOTIVO = 90;

/** "Casa con patio · Av. Santa Fe 3450": el tipo de vivienda y el espacio, más la dirección. */
function resumenHogar(borrador: Borrador): string {
  const vivienda = etiquetaTipoVivienda(borrador.tipoVivienda) ?? 'Vivienda';
  const espacio = etiquetaEspacioExterior(borrador.espacioExterior);
  const conEspacio =
    espacio && borrador.espacioExterior !== 'Ninguno'
      ? `${vivienda} con ${espacio.toLowerCase()}`
      : `${vivienda} sin espacio al aire libre`;

  return `${conEspacio} · ${borrador.direccion.trim()}`;
}

/** Quiénes más viven en la casa: los chicos y las otras mascotas, en un solo renglón. */
function resumenConvivencia(borrador: Borrador): string {
  const ninios = borrador.tieneNinios ? 'Con niños' : 'Sin niños';

  if (!borrador.tieneMascotas) return `${ninios} · sin otras mascotas`;

  const detalle = borrador.detalleMascotas.trim();
  return detalle ? `${ninios} · ${detalle}` : `${ninios} · con otras mascotas`;
}

/** "15/09/2026 → 15/12/2026 (3 meses)". Null en una adopción, que no tiene período. */
function resumenPeriodo(borrador: Borrador): string | null {
  const { fechaInicioTransito: inicio, fechaFinTransito: fin } = borrador;

  if (!inicio || !fin) return null;

  return `${aFechaVisible(inicio)} → ${aFechaVisible(fin)} (${duracionEnTexto(inicio, fin)})`;
}

function recortar(texto: string, largo: number): string {
  const limpio = texto.trim();
  return limpio.length <= largo ? limpio : `${limpio.slice(0, largo).trimEnd()}…`;
}

export function PasoConfirmacion({ borrador, errores, mascota, editar }: PasoProps) {
  const periodo = resumenPeriodo(borrador);

  return (
    <>
      <ResumenMascota
        nombre={mascota.nombre}
        imagenUrl={mascota.imagenUrl}
        subtitulo={mascota.subtitulo}
      />

      <TarjetaDatos>
        <FilaDato
          etiqueta="Tipo"
          valor={etiquetaTipoSolicitud(borrador.tipoSolicitud ?? '')}
        />
        {periodo ? <FilaDato etiqueta="Período" valor={periodo} /> : null}
        <FilaDato etiqueta="Hogar" valor={resumenHogar(borrador)} />
        <FilaDato etiqueta="Convivencia" valor={resumenConvivencia(borrador)} />
        <FilaDato
          etiqueta="Tiempo sola"
          valor={etiquetaHorasSolo(borrador.horasSolo) ?? 'Sin indicar'}
        />
        <FilaDato etiqueta="Motivo" valor={recortar(borrador.motivacion, LARGO_MOTIVO)} ultima />
      </TarjetaDatos>

      <Casilla
        etiqueta={CONFORMIDAD}
        marcada={borrador.conforme}
        onChange={(valor) => editar('conforme', valor)}
      />

      {errores.conforme ? (
        <Text className="text-xs text-red-500">{errores.conforme}</Text>
      ) : null}
    </>
  );
}
