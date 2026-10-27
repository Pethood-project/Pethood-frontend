/**
 * "Mis publicaciones" en Inicio del refugio: cuántas hay activas, el acceso a publicar una
 * nueva y un carrusel con las últimas.
 *
 * La pastilla de cada tarjeta es el estado del AVISO (Activa / Pausada / Finalizada), no el
 * de la mascota: es lo que el refugio gestiona desde acá.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { estiloDeEstadoPublicacion } from '@/constants/EstadosPublicacion';
import { PALETA } from '@/constants/theme';
import { conPlural } from '@/lib/inicio';
import { urlAbsoluta } from '@/services/api';
import { ESTADO_PUBLICACION, type PublicacionPropia } from '@/services/publicaciones';

import { AvisoSeccionFallida, EncabezadoSeccion } from './PiezasInicio';

const MAXIMO_EN_CARRUSEL = 10;

/** Colores de la pastilla en la paleta Organic; un estado desconocido cae en el neutro. */
const PASTILLAS: Record<string, { fondo: string; tinta: string }> = {
  [ESTADO_PUBLICACION.ACTIVA]: { fondo: PALETA.estado.exitoSuave, tinta: PALETA.estado.exitoTinta },
  [ESTADO_PUBLICACION.PAUSADA]: { fondo: PALETA.calido.amarilloClaro, tinta: PALETA.accent[800] },
};
const PASTILLA_NEUTRA = { fondo: PALETA.neutral[200], tinta: PALETA.neutral[700] };

interface PublicacionesInicioProps {
  publicaciones: PublicacionPropia[] | null;
  error: boolean;
}

export function PublicacionesInicio({ publicaciones, error }: PublicacionesInicioProps) {
  const router = useRouter();
  const activas =
    publicaciones?.filter((p) => p.estado.nombre === ESTADO_PUBLICACION.ACTIVA).length ?? 0;

  return (
    <View
      className="overflow-hidden rounded-[28px] py-4"
      style={{ backgroundColor: PALETA.surface, borderWidth: 1, borderColor: PALETA.neutral[300] }}
    >
      <View className="pl-4">
        <EncabezadoSeccion
          icono="megaphone-outline"
          fondoIcono={PALETA.calido.amarilloClaro}
          colorIcono={PALETA.accent[600]}
          titulo="Mis publicaciones"
          subtitulo={publicaciones ? conPlural(activas, 'activa', 'activas') : 'Cargando…'}
          colorTitulo={PALETA.accent[900]}
          colorSubtitulo={PALETA.estado.exitoTinta}
          enlace={{
            texto: 'Ver todas',
            color: PALETA.accent[600],
            onPress: () => router.push('/publicaciones'),
          }}
        />
      </View>

      {error && !publicaciones ? (
        <View className="px-4 pt-2">
          <AvisoSeccionFallida texto="No pudimos traer tus publicaciones." color={PALETA.neutral[700]} />
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3.5"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, alignItems: 'flex-start' }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nueva publicación"
          onPress={() => router.push('/publicaciones/crear')}
          className="h-[166px] w-[104px] items-center justify-center gap-2 rounded-[22px] active:opacity-80"
          style={{
            backgroundColor: PALETA.bg,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: PALETA.neutral[400],
          }}
        >
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: PALETA.accent[600] }}
          >
            <Ionicons name="add" size={22} color={PALETA.accent[100]} />
          </View>
          <Text
            className="text-center font-cuerpo-bold text-[12.5px] leading-[16px]"
            style={{ color: PALETA.accent[800] }}
          >
            {'Nueva\npublicación'}
          </Text>
        </Pressable>

        {publicaciones && publicaciones.length === 0 ? (
          <View className="h-[166px] w-[200px] justify-center">
            <Text className="font-cuerpo text-[13px] leading-[18px]" style={{ color: PALETA.neutral[700] }}>
              Publicá una mascota para que la vean los adoptantes.
            </Text>
          </View>
        ) : null}

        {publicaciones?.slice(0, MAXIMO_EN_CARRUSEL).map((publicacion) => (
          <TarjetaPublicacion key={publicacion.id} publicacion={publicacion} />
        ))}
      </ScrollView>
    </View>
  );
}

function TarjetaPublicacion({ publicacion }: { publicacion: PublicacionPropia }) {
  const router = useRouter();
  const foto = urlAbsoluta(publicacion.imagenUrl);
  const nombre = publicacion.mascota.nombre ?? 'Sin nombre';
  const pastilla = PASTILLAS[publicacion.estado.nombre] ?? PASTILLA_NEUTRA;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nombre}, publicación ${estiloDeEstadoPublicacion(publicacion.estado.nombre).etiqueta}`}
      onPress={() => router.push({ pathname: '/publicaciones/[id]', params: { id: publicacion.id } })}
      // Cada tarjeta lleva su propio borde: sin él, las fotos claras se pierden en el fondo.
      className="w-[124px] rounded-[22px] p-1.5 active:opacity-85"
      style={{ backgroundColor: PALETA.bg, borderWidth: 2, borderColor: PALETA.accent[400] }}
    >
      <View
        className="h-[104px] w-[112px] overflow-hidden rounded-[16px]"
        style={{ backgroundColor: PALETA.neutral[200] }}
      >
        {foto ? (
          <Image source={{ uri: foto }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="paw-outline" size={28} color={PALETA.neutral[400]} />
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        className="mt-[7px] font-titulo text-[14.5px] leading-[18px]"
        style={{ color: PALETA.accent[900] }}
      >
        {nombre}
      </Text>
      <View className="mt-[3px] self-start rounded-full px-2 py-0.5" style={{ backgroundColor: pastilla.fondo }}>
        <Text numberOfLines={1} className="font-cuerpo-bold text-[11px]" style={{ color: pastilla.tinta }}>
          {estiloDeEstadoPublicacion(publicacion.estado.nombre).etiqueta}
        </Text>
      </View>
    </Pressable>
  );
}
