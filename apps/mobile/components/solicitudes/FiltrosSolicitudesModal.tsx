/**
 * Filtros de "Mis solicitudes" (GUI-27), desplegados desde el ícono de deslizadores del
 * encabezado. Mismo patrón que `FiltrosAdopcionModal`: se edita sobre un borrador local y
 * recién al tocar "Aplicar" se avisa hacia afuera.
 *
 * La estética sigue la pantalla 33 (Filtros avanzados, sección 08 de los diseños): encabezado
 * crema con "Filtros" en la tipografía de títulos y "Limpiar" a la derecha, secciones con
 * rótulo en mayúsculas, pastillas rellenas en acento cuando están elegidas y el botón de
 * aplicar en acento al pie. Todo un escalón más grande que el diseño, a pedido: el refugio
 * filtra muchas solicitudes y los chips chicos costaba leerlos y tocarlos.
 *
 * Lo recibido se agrupa en tres vistas rápidas —por revisar, revisadas y resueltas— que
 * antes ocupaban dos renglones del encabezado: ahora viven acá arriba, y debajo el estado
 * exacto, de selección múltiple, para afinar.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { DateField } from '@/components/ui/DateField';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { type OpcionSelector } from '@/components/ui/SelectorChips';
import { SelectorChipsMultiples } from '@/components/ui/SelectorChipsMultiples';
import { ModalFiltros, SeccionFiltro } from '@/components/ui/ModalFiltros';
import type { VistaSolicitud } from '@/constants/EstadosSolicitud';
import { ESTADOS_DE_PESTANIA, OPCIONES_PESTANIA, pestaniaDe } from '@/constants/PestaniasSolicitud';
import {
  contarFiltrosActivosSolicitudes,
  SIN_FILTROS_SOLICITUDES,
  type EstadoSolicitudNombre,
  type FiltrosSolicitudes,
  type TipoSolicitud,
} from '@/services/solicitudes';

/** En plural, porque filtran listas; el rótulo cambia según quién mira (ver `EstadosSolicitud`). */
const ETIQUETAS_FILTRO: Record<EstadoSolicitudNombre, Record<VistaSolicitud, string>> = {
  Pendiente: { adoptante: 'Enviadas', refugio: 'Por revisar' },
  En_Revision: { adoptante: 'En revisión', refugio: 'En revisión' },
  Revisada: { adoptante: 'Revisadas', refugio: 'Revisadas' },
  Aprobada: { adoptante: 'Aprobadas', refugio: 'Aprobadas' },
  Rechazada: { adoptante: 'No aceptadas', refugio: 'Rechazadas' },
  Cancelada: { adoptante: 'Canceladas', refugio: 'Canceladas' },
  Cerrada: { adoptante: 'Cerradas', refugio: 'Cerradas' },
};

/** "Todos" es no filtrar: `undefined`. */
const OPCIONES_TIPO: { etiqueta: string; valor: TipoSolicitud | undefined }[] = [
  { etiqueta: 'Todos', valor: undefined },
  { etiqueta: 'Adopciones', valor: 'Adopcion' },
  { etiqueta: 'Tránsitos', valor: 'Transito' },
];

function opcionesEstado(vista: VistaSolicitud): OpcionSelector<EstadoSolicitudNombre>[] {
  return (Object.keys(ETIQUETAS_FILTRO) as EstadoSolicitudNombre[]).map((valor) => ({
    valor,
    etiqueta: ETIQUETAS_FILTRO[valor][vista],
  }));
}

interface FiltrosSolicitudesModalProps {
  visible: boolean;
  /** Quién mira: cambia cómo se llaman los estados ("No aceptadas" para quien pidió). */
  vista: VistaSolicitud;
  /** Lo recibido ofrece las vistas rápidas (por revisar, revisadas, resueltas). */
  conPestanias?: boolean;
  /** Filtros aplicados hoy; el borrador se reinicia con ellos cada vez que se abre. */
  filtros: FiltrosSolicitudes;
  onAplicar: (filtros: FiltrosSolicitudes) => void;
  onCerrar: () => void;
}

export function FiltrosSolicitudesModal({
  visible,
  vista,
  conPestanias = false,
  filtros,
  onAplicar,
  onCerrar,
}: FiltrosSolicitudesModalProps) {
  const [borrador, setBorrador] = useState<FiltrosSolicitudes>(filtros);

  // Al abrir se descarta cualquier borrador anterior: lo que se ve tiene que ser lo que
  // está aplicado, no lo que el usuario tocó y no confirmó la vez pasada.
  useEffect(() => {
    if (visible) setBorrador(filtros);
  }, [visible, filtros]);

  const activos = contarFiltrosActivosSolicitudes(borrador);
  const pestania = pestaniaDe(borrador.estados);

  return (
    <ModalFiltros
      visible={visible}
      activos={activos}
      onLimpiar={() => setBorrador(SIN_FILTROS_SOLICITUDES)}
      onAplicar={() => onAplicar(borrador)}
      onCerrar={onCerrar}
    >
      {conPestanias ? (
        <SeccionFiltro titulo="Mostrar" ayuda="Elegí qué solicitudes querés ver.">
          <View className="flex-row flex-wrap gap-2.5">
            {OPCIONES_PESTANIA.map((opcion) => (
              <Chip
                key={opcion.valor}
                etiqueta={opcion.etiqueta}
                variante="filtro"
                amplio
                activa={pestania === opcion.valor}
                onPress={() =>
                  setBorrador({
                    ...borrador,
                    estados: ESTADOS_DE_PESTANIA[opcion.valor],
                  })
                }
              />
            ))}
            <Chip
              etiqueta="Todas"
              variante="filtro"
              amplio
              activa={!borrador.estados || borrador.estados.length === 0}
              onPress={() => setBorrador({ ...borrador, estados: undefined })}
            />
          </View>
        </SeccionFiltro>
      ) : null}

      <SeccionFiltro
        titulo={conPestanias ? 'Estado exacto' : 'Estado'}
        ayuda="Podés elegir más de un estado."
      >
        <SelectorChipsMultiples
          prefijo="estado-solicitud"
          etiquetaSinFiltro="Todos"
          opciones={opcionesEstado(vista)}
          valores={borrador.estados ?? []}
          onChange={(estados) => setBorrador({ ...borrador, estados })}
          variante="filtro"
          amplio
        />
      </SeccionFiltro>

      <SeccionFiltro titulo="Tipo" ayuda="Adopciones o tránsitos.">
        <View className="flex-row flex-wrap gap-2.5">
          {OPCIONES_TIPO.map((opcion) => (
            <Chip
              key={opcion.etiqueta}
              etiqueta={opcion.etiqueta}
              variante="filtro"
              amplio
              activa={borrador.tipo === opcion.valor}
              onPress={() => setBorrador({ ...borrador, tipo: opcion.valor })}
            />
          ))}
        </View>
      </SeccionFiltro>

      <SeccionFiltro titulo="Fecha de la solicitud">
        <FormCard>
          <FormCardRow>
            <DateField
              label="Desde"
              placeholder="Sin límite"
              valor={borrador.fechaDesde ?? null}
              onChange={(fecha) => setBorrador({ ...borrador, fechaDesde: fecha })}
              fechaMaxima={borrador.fechaHasta ?? new Date()}
              mostrarEdad={false}
              grande
            />
          </FormCardRow>
          <FormCardRow ultima>
            <DateField
              label="Hasta"
              placeholder="Sin límite"
              valor={borrador.fechaHasta ?? null}
              onChange={(fecha) => setBorrador({ ...borrador, fechaHasta: fecha })}
              fechaMinima={borrador.fechaDesde}
              mostrarEdad={false}
              grande
            />
          </FormCardRow>
        </FormCard>
      </SeccionFiltro>
    </ModalFiltros>
  );
}
