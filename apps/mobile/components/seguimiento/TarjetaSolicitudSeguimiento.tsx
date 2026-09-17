/**
 * Fila del listado de seguimientos (HU-9.2): una solicitud de adopción o tránsito con su
 * estado de avance.
 *
 * La misma tarjeta sirve para los dos roles. Cambia sólo el renglón bajo el nombre de la
 * mascota — el adoptante ya sabe que la mascota es suya, mientras que el publicador necesita
 * saber quién la tiene — y el llamado a la acción, que sólo el adoptante puede ejecutar.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { NOMBRE_TIPO } from '@/components/seguimiento/etiquetas';
import { FotoMascota } from '@/components/ui/FotoMascota';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { SolicitudEnSeguimiento } from '@/services/seguimiento';
import { parsearFecha, tiempoHasta } from '@/shared/validation/dates';

const FOTO = 56;

interface TarjetaSolicitudSeguimientoProps {
  solicitud: SolicitudEnSeguimiento;
  /** Instante contra el que se calculan las cuentas regresivas. Lo refresca la pantalla. */
  ahora: Date;
  onPress: () => void;
}

/**
 * El renglón que resume qué pasa ahora con esta solicitud, en orden de urgencia: primero lo
 * que hay que responder, después lo que se perdió, y al final cuándo vuelve a haber algo.
 */
function estadoActual(
  solicitud: SolicitudEnSeguimiento,
  ahora: Date,
): { texto: string; icono: keyof typeof Ionicons.glyphMap; color: string; clase: string } {
  const { pendiente, totales, proximoAviso, finalizado, rol } = solicitud;

  if (pendiente) {
    const plazo = parsearFecha(pendiente.plazo);
    const restante = plazo ? tiempoHasta(plazo, ahora) : null;
    const sufijo = restante ? ` · quedan ${restante}` : '';

    return {
      texto: rol === 'ADOPTANTE' ? `Tenés una pregunta sin responder${sufijo}` : `Esperando respuesta${sufijo}`,
      icono: 'time',
      color: PALETA.estado.advertencia,
      clase: 'text-amber-600',
    };
  }

  if (finalizado) {
    return {
      texto: 'Seguimiento finalizado',
      icono: 'flag-outline',
      color: PALETA.gris[400],
      clase: 'text-gray-500',
    };
  }

  const siguiente = parsearFecha(proximoAviso);
  const falta = siguiente ? tiempoHasta(siguiente, ahora) : null;

  if (falta) {
    return {
      texto: `Próxima pregunta en ${falta}`,
      icono: 'calendar-outline',
      color: PALETA.pethood.naranja,
      clase: 'text-pethood-orange',
    };
  }

  return {
    texto: totales.completados > 0 ? 'Al día' : 'Sin preguntas todavía',
    icono: 'checkmark-circle-outline',
    color: PALETA.pethood.naranja,
    clase: 'text-pethood-orange',
  };
}

export function TarjetaSolicitudSeguimiento({
  solicitud,
  ahora,
  onPress,
}: TarjetaSolicitudSeguimientoProps) {
  const { mascota, adoptante, tipo, rol, totales } = solicitud;
  const nombreMascota = mascota.nombre ?? 'Sin nombre';
  const estado = estadoActual(solicitud, ahora);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seguimiento de ${nombreMascota}. ${estado.texto}`}
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3 rounded-2xl bg-white p-3 shadow-sm active:opacity-80"
    >
      {/* `flex-none`: la foto nunca se achica, por largo que sea el nombre. */}
      <View className="flex-none">
        <FotoMascota
          uri={urlAbsoluta(mascota.imagenUrl)}
          tamanio={FOTO}
          accessibilityLabel={`Foto de ${nombreMascota}`}
        />
      </View>

      {/* `min-w-0` deja que este bloque se achique: sin él un nombre largo empuja el chevron. */}
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-base font-bold text-gray-900" numberOfLines={1}>
            {nombreMascota}
          </Text>
          <View className="flex-none rounded-full bg-pethood-beige-dark px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-gray-600">{NOMBRE_TIPO[tipo]}</Text>
          </View>
        </View>

        <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
          {rol === 'ADOPTANTE'
            ? 'Está a tu cuidado'
            : `A cargo de ${adoptante.nombre} ${adoptante.apellido}`}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-1.5">
          <Ionicons name={estado.icono} size={13} color={estado.color} />
          <Text className={`flex-1 text-[11px] font-medium ${estado.clase}`} numberOfLines={1}>
            {estado.texto}
          </Text>
        </View>

        <Text className="mt-1 text-[11px] text-gray-400">
          {totales.completados} completados · {totales.vencidos} sin completar
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={PALETA.gris[300]} />
    </Pressable>
  );
}
