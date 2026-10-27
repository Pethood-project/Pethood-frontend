/**
 * Las dos tarjetas chicas de Inicio del adoptante, lado a lado: "Mis solicitudes" (lo que
 * pidió y en qué paso va) y "Seguimiento" (el próximo pedido de foto post-adopción).
 *
 * Cada tarjeta es un único Pressable, sin botones adentro: lo que parece un botón (la
 * pastilla "Subir foto") es parte de la tarjeta y navega con ella.
 *
 * Tienen alto mínimo y no fijo: si un nombre largo necesita una línea más, la tarjeta crece
 * en vez de montar el texto sobre la barrita de progreso.
 */
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { estiloDeEstadoSolicitud } from '@/constants/EstadosSolicitud';
import { PALETA } from '@/constants/theme';
import {
  hojaDeAlmanaque,
  pasoDeSolicitud,
  PASOS_SOLICITUD,
  seguimientoDestacado,
} from '@/lib/inicio';
import { urlAbsoluta } from '@/services/api';
import type { SolicitudEnSeguimiento } from '@/services/seguimiento';
import type { ListaSolicitudesRecibidas, SolicitudResumen } from '@/services/solicitudes';

import { AvisoSeccionFallida } from './PiezasInicio';

const ALTO_MINIMO = 188;

interface TarjetasAdoptanteProps {
  solicitudes: ListaSolicitudesRecibidas | null;
  errorSolicitudes: boolean;
  seguimientos: SolicitudEnSeguimiento[] | null;
  errorSeguimientos: boolean;
}

export function TarjetasAdoptante(props: TarjetasAdoptanteProps) {
  return (
    <View className="flex-row gap-3">
      <TarjetaMisSolicitudes lista={props.solicitudes} error={props.errorSolicitudes} />
      <TarjetaSeguimiento seguimientos={props.seguimientos} error={props.errorSeguimientos} />
    </View>
  );
}

function TarjetaMisSolicitudes({
  lista,
  error,
}: {
  lista: ListaSolicitudesRecibidas | null;
  error: boolean;
}) {
  const router = useRouter();
  const enCurso = lista?.total ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mis solicitudes, ${enCurso} en curso`}
      onPress={() => router.push({ pathname: '/solicitudes', params: { vista: 'enviadas' } })}
      className="flex-1 justify-between gap-3 rounded-[26px] p-3.5 active:opacity-90"
      style={{
        minHeight: ALTO_MINIMO,
        backgroundColor: PALETA.surface,
        borderWidth: 1,
        borderColor: PALETA.neutral[300],
      }}
    >
      <View>
        <View className="flex-row items-center justify-between gap-2">
          <View
            className="h-[34px] w-[34px] items-center justify-center rounded-xl"
            style={{ backgroundColor: PALETA.calido.amarilloClaro }}
          >
            <Ionicons name="document-text-outline" size={18} color={PALETA.accent[600]} />
          </View>
          {enCurso > 0 ? (
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: PALETA.accent[200] }}>
              <Text
                numberOfLines={1}
                className="font-cuerpo-bold text-[11px]"
                style={{ color: PALETA.accent[700] }}
              >
                {enCurso} en curso
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={2}
          className="mt-2.5 font-titulo text-[15.5px] leading-[18px]"
          style={{ color: PALETA.accent[900] }}
        >
          Mis solicitudes
        </Text>
      </View>

      <View className="gap-[9px]">
        {error && !lista ? (
          <AvisoSeccionFallida texto="No pudimos traerlas." color={PALETA.neutral[700]} />
        ) : null}
        {lista && enCurso === 0 ? (
          <Text className="font-cuerpo text-[12px] leading-[16px]" style={{ color: PALETA.neutral[700] }}>
            Ninguna en curso. Cuando pidas adoptar, la seguís desde acá.
          </Text>
        ) : null}
        {lista?.solicitudes.slice(0, 2).map((solicitud) => (
          <ProgresoSolicitud key={solicitud.id} solicitud={solicitud} />
        ))}
      </View>
    </Pressable>
  );
}

function ProgresoSolicitud({ solicitud }: { solicitud: SolicitudResumen }) {
  const paso = pasoDeSolicitud(solicitud.estado.nombre);

  return (
    <View>
      <View className="flex-row items-baseline justify-between gap-2">
        <Text
          numberOfLines={1}
          className="shrink font-cuerpo-bold text-[12px]"
          style={{ color: PALETA.neutral[900] }}
        >
          {solicitud.mascota.nombre ?? 'Sin nombre'}
        </Text>
        {/* El estado no se achica: si no entra, se corta el nombre de la mascota. */}
        <Text className="shrink-0 font-cuerpo text-[12px]" style={{ color: PALETA.neutral[700] }}>
          {estiloDeEstadoSolicitud(solicitud.estado.nombre, 'adoptante').etiqueta}
        </Text>
      </View>
      <View className="mt-1 flex-row gap-[3px]">
        {Array.from({ length: PASOS_SOLICITUD }, (_, indice) => (
          <View
            key={indice}
            className="h-[5px] flex-1 rounded-full"
            style={{ backgroundColor: indice < paso ? PALETA.accent[600] : PALETA.neutral[300] }}
          />
        ))}
      </View>
    </View>
  );
}

function TarjetaSeguimiento({
  seguimientos,
  error,
}: {
  seguimientos: SolicitudEnSeguimiento[] | null;
  error: boolean;
}) {
  const router = useRouter();
  const destacado = seguimientos ? seguimientoDestacado(seguimientos) : null;
  const pideFoto = destacado?.pendiente != null;
  const fecha = destacado ? (destacado.pendiente?.plazo ?? destacado.proximoAviso) : null;
  const hoja = fecha ? hojaDeAlmanaque(fecha) : null;
  const nombre = destacado?.mascota.nombre ?? 'Tu mascota';

  let destino: Href = '/seguimientos';
  if (destacado) {
    destino = pideFoto
      ? {
          pathname: '/seguimientos/[solicitudId]/actualizacion',
          params: { solicitudId: destacado.solicitudId },
        }
      : { pathname: '/seguimientos/[solicitudId]', params: { solicitudId: destacado.solicitudId } };
  }

  let detalle = 'Cuando adoptes, acá vas a ver los pedidos de foto.';
  if (destacado) detalle = `${nombre} · ${pideFoto ? 'te pide una foto' : 'próximo pedido'}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seguimiento. ${detalle}`}
      onPress={() => router.push(destino)}
      className="flex-1 justify-between gap-3 rounded-[26px] p-3.5 active:opacity-90"
      style={{ minHeight: ALTO_MINIMO, backgroundColor: PALETA.calido.amarilloClaro }}
    >
      <View className="flex-row items-start justify-between gap-2">
        {hoja ? (
          <View
            className="w-[50px] overflow-hidden rounded-[11px]"
            style={{
              backgroundColor: PALETA.blanco,
              shadowColor: PALETA.neutral[900],
              shadowOpacity: 0.15,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }}
          >
            <Text
              className="py-0.5 text-center font-cuerpo-bold text-[9.5px] tracking-[1px]"
              style={{ backgroundColor: PALETA.calido.naranja, color: PALETA.accent[900] }}
            >
              {hoja.mes}
            </Text>
            <Text
              className="text-center font-titulo text-[22px] leading-[30px]"
              style={{ color: PALETA.accent[800] }}
            >
              {hoja.dia}
            </Text>
          </View>
        ) : (
          <View
            className="h-[34px] w-[34px] items-center justify-center rounded-xl"
            style={{ backgroundColor: PALETA.calido.amarillo }}
          >
            <Ionicons name="camera-outline" size={18} color={PALETA.accent[800]} />
          </View>
        )}

        {destacado ? (
          <View
            className="rounded-full"
            style={{ borderWidth: 2, borderColor: PALETA.surface }}
          >
            <Avatar
              uri={urlAbsoluta(destacado.mascota.imagenUrl)}
              nombre={destacado.mascota.nombre}
              tamanio={36}
              variante="organic"
              accessibilityLabel={`Foto de ${nombre}`}
            />
          </View>
        ) : null}
      </View>

      <View>
        <Text className="font-titulo text-[15.5px] leading-[18px]" style={{ color: PALETA.accent[900] }}>
          Seguimiento
        </Text>
        {error && !seguimientos ? (
          <AvisoSeccionFallida texto="No pudimos traerlo." color={PALETA.accent[800]} />
        ) : (
          <Text
            numberOfLines={3}
            className="mt-[3px] font-cuerpo text-[12px] leading-[16px]"
            style={{ color: PALETA.accent[800] }}
          >
            {detalle}
          </Text>
        )}
        {destacado ? (
          <View
            className="mt-[9px] self-start rounded-xl px-2.5 py-[5px]"
            style={{ backgroundColor: pideFoto ? PALETA.accent[600] : PALETA.calido.amarillo }}
          >
            <Text
              numberOfLines={1}
              className="font-cuerpo-bold text-[12px]"
              style={{ color: pideFoto ? PALETA.accent[100] : PALETA.accent[900] }}
            >
              {pideFoto ? 'Subir foto' : 'Al día'}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
