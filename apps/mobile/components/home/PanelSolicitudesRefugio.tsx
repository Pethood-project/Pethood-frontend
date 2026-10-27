/**
 * Bloque principal de Inicio del refugio: cuántas solicitudes hay por revisar, cómo se
 * reparten por estado y las dos últimas que llegaron.
 *
 * "Por revisar" es Pendiente + En revisión: las que todavía no se terminaron de mirar. Las
 * revisadas esperan solo la decisión y se cuentan aparte. La barrita suma además las
 * aprobadas del mes, para que se vea lo que ya salió; las de meses anteriores no, porque con
 * el tiempo taparían todo lo demás.
 */
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { iniciales } from '@/components/ui/Avatar';
import { FotoMascota } from '@/components/ui/FotoMascota';
import { PALETA } from '@/constants/theme';
import { conPlural, dentroDeFrase } from '@/lib/inicio';
import { urlAbsoluta } from '@/services/api';
import type { ListaSolicitudesRecibidas, SolicitudResumen } from '@/services/solicitudes';
import { tiempoRelativo } from '@/shared/validation/dates';

import { AvisoSeccionFallida, BotonAmarillo } from './PiezasInicio';

export interface ResumenSolicitudesRefugio {
  /** Las pendientes, la más nueva primero: de acá salen las dos filas. */
  pendientes: ListaSolicitudesRecibidas;
  enRevision: number;
  revisadas: number;
  aprobadasDelMes: number;
  llegadasHoy: number;
}

interface PanelSolicitudesRefugioProps {
  resumen: ResumenSolicitudesRefugio | null;
  error: boolean;
}

export function PanelSolicitudesRefugio({ resumen, error }: PanelSolicitudesRefugioProps) {
  const router = useRouter();
  const pendientes = resumen?.pendientes.total ?? 0;
  const enRevision = resumen?.enRevision ?? 0;
  const revisadas = resumen?.revisadas ?? 0;
  const aprobadas = resumen?.aprobadasDelMes ?? 0;
  const porRevisar = pendientes + enRevision;

  const tramos = [
    { cantidad: pendientes, color: PALETA.tabCentral.amarillo, texto: conPlural(pendientes, 'pendiente', 'pendientes') },
    { cantidad: enRevision, color: PALETA.accent[400], texto: `${enRevision} en revisión` },
    {
      cantidad: revisadas,
      color: PALETA.accent[300],
      texto: conPlural(revisadas, 'revisada', 'revisadas'),
    },
    {
      cantidad: aprobadas,
      color: PALETA.accent[100],
      texto: `${conPlural(aprobadas, 'aprobada', 'aprobadas')} este mes`,
    },
  ];
  const hayTramos = tramos.some((tramo) => tramo.cantidad > 0);

  return (
    <View
      className="rounded-[30px] px-[18px] pb-[18px] pt-5"
      style={{ backgroundColor: PALETA.accent[800] }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text
          className="min-w-0 flex-1 font-cuerpo-bold text-[11px] tracking-[1.4px]"
          style={{ color: PALETA.accent[400] }}
        >
          SOLICITUDES DE ADOPCIÓN
        </Text>
        {resumen && resumen.llegadasHoy > 0 ? (
          <View
            className="rounded-full px-[9px] py-[3px]"
            style={{ backgroundColor: PALETA.tabCentral.amarillo }}
          >
            <Text className="font-cuerpo-bold text-[11.5px]" style={{ color: PALETA.accent[900] }}>
              {conPlural(resumen.llegadasHoy, 'nueva', 'nuevas')} hoy
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-1.5 flex-row items-baseline gap-2.5">
        <Text className="font-titulo text-[60px] leading-[66px]" style={{ color: PALETA.accent[100] }}>
          {resumen ? porRevisar : '–'}
        </Text>
        <Text className="font-cuerpo-semi text-[16px]" style={{ color: PALETA.accent[300] }}>
          por revisar
        </Text>
      </View>

      <View className="mt-1.5 flex-row gap-1">
        {hayTramos ? (
          tramos
            .filter((tramo) => tramo.cantidad > 0)
            .map((tramo) => (
              <View
                key={tramo.color}
                className="h-2.5 rounded-full"
                style={{ flex: tramo.cantidad, backgroundColor: tramo.color }}
              />
            ))
        ) : (
          <View className="h-2.5 flex-1 rounded-full" style={{ backgroundColor: PALETA.accent[700] }} />
        )}
      </View>

      {/* Envuelve en vez de cortar: con números de tres cifras no entra en una línea. */}
      <View className="mt-2 flex-row flex-wrap gap-x-3.5 gap-y-1">
        {tramos.map((tramo) => (
          <View key={tramo.color} className="flex-row items-center gap-[5px]">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: tramo.color }} />
            <Text className="font-cuerpo text-[12px]" style={{ color: PALETA.accent[200] }}>
              {tramo.texto}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-4 gap-2">
        {error && !resumen ? (
          <AvisoSeccionFallida texto="No pudimos traer las solicitudes." color={PALETA.accent[200]} />
        ) : null}
        {resumen && pendientes === 0 ? (
          <Text className="font-cuerpo text-[13px]" style={{ color: PALETA.accent[200] }}>
            No hay solicitudes pendientes. ¡Todo al día!
          </Text>
        ) : null}
        {resumen?.pendientes.solicitudes.slice(0, 2).map((solicitud) => (
          <FilaSolicitud key={solicitud.id} solicitud={solicitud} />
        ))}
      </View>

      <View className="mt-3.5 flex-row">
        <BotonAmarillo
          texto="Revisar solicitudes"
          iconoFin="arrow-forward"
          onPress={() => router.push({ pathname: '/solicitudes', params: { vista: 'recibidas' } })}
        />
      </View>
    </View>
  );
}

function FilaSolicitud({ solicitud }: { solicitud: SolicitudResumen }) {
  const router = useRouter();
  const { solicitante, mascota } = solicitud;
  const nombreMascota = mascota.nombre ?? 'tu mascota';
  const accion =
    solicitud.tipoSolicitud === 'Transito'
      ? `ofrece tránsito a ${nombreMascota}`
      : `quiere adoptar a ${nombreMascota}`;
  const cuando = dentroDeFrase(tiempoRelativo(new Date(solicitud.fechaAlta)));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${solicitante.nombre} ${solicitante.apellido} ${accion}, ${cuando}`}
      onPress={() => router.push({ pathname: '/solicitudes/[id]', params: { id: solicitud.id } })}
      className="flex-row items-center gap-[11px] rounded-[18px] px-3 py-2.5 active:opacity-85"
      style={{ backgroundColor: PALETA.accent[700] }}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: PALETA.accent[300] }}
      >
        <Text className="font-cuerpo-bold text-[13px]" style={{ color: PALETA.accent[800] }}>
          {iniciales(solicitante.nombre, solicitante.apellido)}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="font-cuerpo-bold text-[14px]"
          style={{ color: PALETA.accent[100] }}
        >
          {solicitante.nombre} {solicitante.apellido}
        </Text>
        <Text numberOfLines={1} className="font-cuerpo text-[12px]" style={{ color: PALETA.accent[200] }}>
          {accion} · {cuando}
        </Text>
      </View>
      <FotoMascota uri={urlAbsoluta(mascota.imagenUrl)} tamanio={40} accessibilityLabel={nombreMascota} />
    </Pressable>
  );
}
