/**
 * Las dos tarjetas chicas de Inicio del refugio, lado a lado: "Mis campañas" (lleva a GUI-36,
 * ver `CampaniasInicio.tsx`) y "Seguimientos" (las mascotas que entregó y
 * siguen en seguimiento post-adopción o tránsito).
 */
import { useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { PALETA } from '@/constants/theme';
import { conPlural } from '@/lib/inicio';
import { urlAbsoluta } from '@/services/api';
import type { SolicitudEnSeguimiento } from '@/services/seguimiento';

import { AvisoSeccionFallida } from './PiezasInicio';
import { CampaniasRefugio } from './CampaniasInicio';

const ALTO_MINIMO = 184;

interface TarjetasRefugioProps {
  seguimientos: SolicitudEnSeguimiento[] | null;
  errorSeguimientos: boolean;
}

export function TarjetasRefugio({ seguimientos, errorSeguimientos }: TarjetasRefugioProps) {
  const router = useRouter();

  return (
    <View className="flex-row gap-3">
      <CampaniasRefugio
        altoMinimo={ALTO_MINIMO}
        onPress={() => router.push('/campanias/refugio' as Href)}
      />
      <TarjetaSeguimientos seguimientos={seguimientos} error={errorSeguimientos} />
    </View>
  );
}

function TarjetaSeguimientos({
  seguimientos,
  error,
}: {
  seguimientos: SolicitudEnSeguimiento[] | null;
  error: boolean;
}) {
  const router = useRouter();
  const enCurso = (seguimientos ?? []).filter((s) => s.rol === 'PUBLICADOR' && !s.finalizado);
  // Pedidos abiertos: el adoptante todavía tiene que mandar la foto.
  const esperandoFoto = enCurso.reduce((suma, s) => suma + s.totales.pendientes, 0);

  let detalle = 'Cuando entregues una mascota, la seguís desde acá.';
  if (enCurso.length > 0) {
    detalle = conPlural(enCurso.length, 'mascota en seguimiento', 'mascotas en seguimiento');
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seguimientos. ${detalle}`}
      onPress={() => router.push('/seguimientos')}
      className="flex-1 justify-between gap-3 rounded-[26px] p-3.5 active:opacity-90"
      style={{ minHeight: ALTO_MINIMO, backgroundColor: PALETA.calido.amarilloClaro }}
    >
      <View className="flex-row">
        {enCurso.slice(0, 3).map((seguimiento, indice) => (
          <View
            key={seguimiento.solicitudId}
            className="rounded-full"
            style={{
              marginLeft: indice === 0 ? 0 : -12,
              borderWidth: 2,
              borderColor: PALETA.calido.amarilloClaro,
            }}
          >
            <Avatar
              uri={urlAbsoluta(seguimiento.mascota.imagenUrl)}
              nombre={seguimiento.mascota.nombre}
              tamanio={34}
              variante="organic"
              accessibilityLabel={seguimiento.mascota.nombre ?? 'Mascota'}
            />
          </View>
        ))}
      </View>

      <View>
        <Text className="font-titulo text-[15.5px] leading-[18px]" style={{ color: PALETA.accent[900] }}>
          Seguimientos
        </Text>
        {error && !seguimientos ? (
          <AvisoSeccionFallida texto="No pudimos traerlos." color={PALETA.accent[800]} />
        ) : (
          <Text
            numberOfLines={3}
            className="mt-[3px] font-cuerpo text-[12px] leading-[16px]"
            style={{ color: PALETA.accent[800] }}
          >
            {detalle}
          </Text>
        )}
        {esperandoFoto > 0 ? (
          <View
            className="mt-[9px] self-start rounded-xl px-2.5 py-[5px]"
            style={{ backgroundColor: PALETA.accent[600] }}
          >
            <Text numberOfLines={1} className="font-cuerpo-bold text-[12px]" style={{ color: PALETA.accent[100] }}>
              {esperandoFoto} esperando foto
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
