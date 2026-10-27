/**
 * Filtros de "Mis campañas", detrás del ícono de deslizadores del encabezado: el estado y el
 * rango de fechas de inicio. Se edita un borrador y recién al aplicar se avisa hacia afuera.
 */
import { useEffect, useState } from 'react';

import { PastillasEstados, type OpcionEstado } from '@/components/ui/FiltroEstados';
import { DateField } from '@/components/ui/DateField';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { ModalFiltros, SeccionFiltro } from '@/components/ui/ModalFiltros';
import { SIN_FILTROS_CAMPANIAS, type FiltrosMisCampanias } from '@/services/campanias';

const FECHA_MAXIMA = new Date(2100, 0, 1);

/** Cuántos filtros hay elegidos: el estado cuenta uno y el rango de fechas, otro. */
export function contarFiltrosCampanias(filtros: FiltrosMisCampanias): number {
  return (filtros.estados.length > 0 ? 1 : 0) + (filtros.fechaDesde ? 1 : 0);
}

interface FiltrosCampaniasModalProps {
  visible: boolean;
  estados: OpcionEstado[];
  /** Filtros aplicados hoy; el borrador se reinicia con ellos cada vez que se abre. */
  filtros: FiltrosMisCampanias;
  onAplicar: (filtros: FiltrosMisCampanias) => void;
  onCerrar: () => void;
}

export function FiltrosCampaniasModal({
  visible,
  estados,
  filtros,
  onAplicar,
  onCerrar,
}: FiltrosCampaniasModalProps) {
  const [borrador, setBorrador] = useState<FiltrosMisCampanias>(filtros);

  useEffect(() => {
    if (visible) setBorrador(filtros);
  }, [visible, filtros]);

  return (
    <ModalFiltros
      visible={visible}
      activos={contarFiltrosCampanias(borrador)}
      onLimpiar={() => setBorrador(SIN_FILTROS_CAMPANIAS)}
      onAplicar={() => onAplicar(borrador)}
      onCerrar={onCerrar}
    >
      {estados.length > 0 ? (
        <SeccionFiltro titulo="Estado" ayuda="Podés elegir más de uno.">
          <PastillasEstados
            opciones={estados}
            seleccionados={borrador.estados}
            onChange={(seleccionados) => setBorrador({ ...borrador, estados: seleccionados })}
          />
        </SeccionFiltro>
      ) : null}

      <SeccionFiltro titulo="Inicio de la campaña" ayuda="Elegí desde cuándo; el «hasta» es opcional.">
        <FormCard>
          <FormCardRow ultima={!borrador.fechaDesde}>
            <DateField
              label="Desde"
              placeholder="Sin límite"
              valor={borrador.fechaDesde ?? null}
              onChange={(fecha) =>
                setBorrador({
                  ...borrador,
                  fechaDesde: fecha ?? undefined,
                  // Sin «desde», un «hasta» suelto no filtraría nada.
                  fechaHasta: fecha ? borrador.fechaHasta : undefined,
                })
              }
              fechaMaxima={FECHA_MAXIMA}
              mostrarEdad={false}
              grande
            />
          </FormCardRow>

          {borrador.fechaDesde ? (
            <FormCardRow ultima>
              <DateField
                label="Hasta (opcional)"
                placeholder="Sin límite"
                valor={borrador.fechaHasta ?? null}
                onChange={(fecha) => setBorrador({ ...borrador, fechaHasta: fecha ?? undefined })}
                fechaMinima={borrador.fechaDesde}
                fechaMaxima={FECHA_MAXIMA}
                mostrarEdad={false}
                grande
              />
            </FormCardRow>
          ) : null}
        </FormCard>
      </SeccionFiltro>
    </ModalFiltros>
  );
}
