/**
 * Fila del listado de seguimientos (HU-9.2): una solicitud de adopción o tránsito con su
 * estado de avance.
 *
 * La misma tarjeta sirve para los dos roles. Cambia sólo el renglón bajo el nombre de la
 * mascota — el adoptante ya sabe que la mascota es suya, mientras que el publicador necesita
 * saber quién la tiene — y el llamado a la acción, que sólo el adoptante puede ejecutar.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { NOMBRE_TIPO } from '@/components/seguimiento/etiquetas';
import { PressableAnimado } from '@/components/ui/PressableAnimado';
import { FotoMascota } from '@/components/ui/FotoMascota';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { SolicitudEnSeguimiento } from '@/services/seguimiento';
import { parsearFecha, tiempoHasta } from '@/shared/validation/dates';

const FOTO = 64;

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
      color: PALETA.accent[700],
      clase: 'text-organic-accent-700',
    };
  }

  if (finalizado) {
    return {
      texto: 'Seguimiento finalizado',
      icono: 'flag-outline',
      color: PALETA.neutral[500],
      clase: 'text-organic-neutral-500',
    };
  }

  const siguiente = parsearFecha(proximoAviso);
  const falta = siguiente ? tiempoHasta(siguiente, ahora) : null;

  if (falta) {
    return {
      texto: `Próxima pregunta en ${falta}`,
      icono: 'calendar-outline',
      color: PALETA.accent[600],
      clase: 'text-organic-accent-600',
    };
  }

  return {
    texto: totales.completados > 0 ? 'Al día' : 'Sin preguntas todavía',
    icono: 'checkmark-circle-outline',
    color: PALETA.accent[600],
    clase: 'text-organic-accent-600',
  };
}

export function TarjetaSolicitudSeguimiento({
  solicitud,
  ahora,
  onPress,
}: TarjetaSolicitudSeguimientoProps) {
  const { mascota, adoptante, tipo, rol, totales, pendiente } = solicitud;
  const nombreMascota = mascota.nombre ?? 'Sin nombre';
  const estado = estadoActual(solicitud, ahora);
  const tienePendiente = Boolean(pendiente);

  return (
    <PressableAnimado
      accessibilityRole="button"
      accessibilityLabel={`Seguimiento de ${nombreMascota}. ${estado.texto}`}
      onPress={onPress}
      escala={0.97}
      // Un seguimiento con pregunta sin responder tiene que saltar a la vista frente a los que
      // no tienen nada pendiente: borde y fondo tintados, no sólo el texto ámbar de abajo.
      // La sombra queda fija en `shadow-sm`: alternarla junto con el resto de la clase dispara
      // el bug de NativeWind descrito en `FilaPedidoSeguimiento` (nativewind#1557).
      className={`mb-3.5 flex-row items-center gap-3.5 rounded-[20px] p-4 shadow-sm ${
        tienePendiente
          ? 'border-2 border-organic-accent-600 bg-organic-accent-100'
          : 'border border-transparent bg-organic-neutral-100'
      }`}
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
          <Text className="flex-1 font-titulo text-xl text-organic-neutral-900" numberOfLines={1}>
            {nombreMascota}
          </Text>
          <View className="flex-none flex-row items-center gap-1.5">
            {tienePendiente ? (
              <View className="rounded-full bg-organic-accent-600 px-2.5 py-1">
                <Text className="font-cuerpo-bold text-xs text-white">Pendiente</Text>
              </View>
            ) : null}
            <View className="rounded-full bg-organic-neutral-200 px-2.5 py-1">
              <Text className="font-cuerpo-semi text-xs text-organic-neutral-600">
                {NOMBRE_TIPO[tipo]}
              </Text>
            </View>
          </View>
        </View>

        <Text className="mt-1 font-cuerpo text-sm text-organic-neutral-600" numberOfLines={1}>
          {rol === 'ADOPTANTE'
            ? 'Está a tu cuidado'
            : `A cargo de ${adoptante.nombre} ${adoptante.apellido}`}
        </Text>

        <View className="mt-2 flex-row items-center gap-1.5">
          <Ionicons name={estado.icono} size={18} color={estado.color} />
          <Text
            className={`flex-1 text-base ${tienePendiente ? 'font-cuerpo-bold' : 'font-cuerpo-semi'} ${estado.clase}`}
            numberOfLines={1}
          >
            {estado.texto}
          </Text>
        </View>

        <Text className="mt-1 font-cuerpo text-xs text-organic-neutral-400">
          {totales.completados} completados · {totales.vencidos} sin completar
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color={PALETA.neutral[300]} />
    </PressableAnimado>
  );
}
