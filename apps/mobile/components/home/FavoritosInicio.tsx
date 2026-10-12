/**
 * "Tus favoritos" en Inicio del adoptante: carrusel horizontal con las mascotas guardadas
 * y el botón para pedir cada una, sin tener que entrar a GUI-12.
 *
 * El botón es el mismo `BotonSolicitar` de la ficha y de Favoritos, así el chequeo de
 * precondiciones y el formulario son exactamente los mismos entren por donde entren.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { BotonSolicitar } from '@/components/solicitudes/BotonSolicitar';
import { ESTADO_SOLICITABLE, etiquetaEdad } from '@/constants/Mascotas';
import { estiloDeEstado } from '@/constants/EstadosMascota';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { ListaFavoritos, MascotaFavorita } from '@/services/favoritos';

import { AvisoSeccionFallida, EncabezadoSeccion, SOMBRA_TARJETA } from './PiezasInicio';

/** Más que esto ya es la pantalla de Favoritos: el carrusel es un adelanto. */
const MAXIMO_EN_CARRUSEL = 10;

interface FavoritosInicioProps {
  favoritos: ListaFavoritos | null;
  error: boolean;
  /** Se llama al crear una solicitud, para refrescar el resto de Inicio. */
  onSolicitada: () => void;
}

export function FavoritosInicio({ favoritos, error, onSolicitada }: FavoritosInicioProps) {
  const router = useRouter();
  const total = favoritos?.total ?? 0;

  return (
    <View
      className="overflow-hidden rounded-[30px] py-4"
      style={{ backgroundColor: PALETA.accent[200] }}
    >
      <View className="pl-4">
        <EncabezadoSeccion
          icono="heart"
          fondoIcono={PALETA.accent[600]}
          colorIcono={PALETA.accent[100]}
          titulo="Tus favoritos"
          subtitulo={total > 0 ? 'Ya podés pedir adoptarlos' : 'Todavía no guardaste ninguno'}
          colorTitulo={PALETA.accent[900]}
          colorSubtitulo={PALETA.accent[700]}
          enlace={
            total > 0
              ? {
                  texto: total === 1 ? 'Ver' : `Ver los ${total}`,
                  color: PALETA.accent[700],
                  onPress: () => router.push('/favoritos'),
                }
              : undefined
          }
        />
      </View>

      {error && !favoritos ? (
        <View className="px-4 pt-2">
          <AvisoSeccionFallida texto="No pudimos traer tus favoritos." color={PALETA.accent[800]} />
        </View>
      ) : null}

      {favoritos && total === 0 ? (
        <Text
          className="px-4 pt-3 font-cuerpo text-[13px] leading-[18px]"
          style={{ color: PALETA.accent[800] }}
        >
          En Adoptar, deslizá a la derecha las mascotas que te gusten y aparecen acá.
        </Text>
      ) : null}

      {total > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3.5"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 2 }}
        >
          {favoritos!.favoritos.slice(0, MAXIMO_EN_CARRUSEL).map((mascota) => (
            <TarjetaFavorita key={mascota.id} mascota={mascota} onSolicitada={onSolicitada} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function TarjetaFavorita({
  mascota,
  onSolicitada,
}: {
  mascota: MascotaFavorita;
  onSolicitada: () => void;
}) {
  const router = useRouter();
  const foto = urlAbsoluta(mascota.imagenUrl);
  const nombre = mascota.nombre ?? 'Sin nombre';
  // "1 año · Refugio Esperanza"; si la publicó un particular, la raza.
  const detalle = [etiquetaEdad(mascota.fechaNacimiento), mascota.refugio?.nombre ?? mascota.raza.nombre]
    .filter(Boolean)
    .join(' · ');

  const publicacionId = mascota.publicacionId;
  const puedeSolicitarse =
    publicacionId !== null &&
    (mascota.estado.nombre === ESTADO_SOLICITABLE || mascota.solicitudAbiertaId !== null);
  const adoptadaPorMi = mascota.estado.nombre === 'Adoptado' && mascota.adoptadaPorMi;

  return (
    // La tarjeta y el botón son hermanos y no uno dentro del otro: un Pressable anidado en
    // web dispara el onPress de los dos (ver `app/favoritos.tsx`).
    <View
      className="w-[158px] rounded-[22px] p-1.5"
      style={{ backgroundColor: PALETA.surface, ...SOMBRA_TARJETA }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver a ${nombre}`}
        disabled={publicacionId === null}
        onPress={() =>
          publicacionId !== null &&
          router.push({ pathname: '/publicaciones/[id]', params: { id: publicacionId } })
        }
        className="active:opacity-90"
      >
        <View
          className="h-[118px] overflow-hidden rounded-[17px]"
          style={{ backgroundColor: PALETA.neutral[200] }}
        >
          {foto ? (
            <Image source={{ uri: foto }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="paw-outline" size={30} color={PALETA.neutral[400]} />
            </View>
          )}
          <View
            className="absolute right-[7px] top-[7px] h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: PALETA.surface }}
          >
            <Ionicons name="heart" size={15} color={PALETA.accent[600]} />
          </View>
        </View>

        <View className="px-1.5 pt-2">
          <Text
            numberOfLines={1}
            className="font-titulo text-[16px] leading-[19px]"
            style={{ color: PALETA.accent[900] }}
          >
            {nombre}
          </Text>
          <Text
            numberOfLines={1}
            className="mt-0.5 font-cuerpo text-[11.5px]"
            style={{ color: PALETA.neutral[700] }}
          >
            {detalle}
          </Text>
        </View>
      </Pressable>

      <View className="px-1.5 pb-1.5 pt-2.5">
        {puedeSolicitarse ? (
          <BotonSolicitar
            variante="inicio"
            mascota={{
              publicacionId: publicacionId!,
              nombre: mascota.nombre,
              imagenUrl: mascota.imagenUrl,
              estado: mascota.estado.nombre,
            }}
            solicitudAbiertaId={mascota.solicitudAbiertaId}
            onCreada={onSolicitada}
          />
        ) : (
          // Adoptada, en tránsito, en tratamiento o sin publicación: no hay nada que pedir,
          // pero se mantiene el alto para que el carrusel no quede escalonado.
          // La adoptó quien mira: verde suave. Si la adoptó otra persona dice "No disponible".
          <View
            className={`h-[38px] items-center justify-center rounded-full px-2 ${
              adoptadaPorMi ? 'bg-emerald-50' : ''
            }`}
            style={adoptadaPorMi ? undefined : { backgroundColor: PALETA.neutral[200] }}
          >
            <Text
              numberOfLines={1}
              className={`font-cuerpo-bold text-[13px] ${adoptadaPorMi ? 'text-emerald-700' : ''}`}
              style={adoptadaPorMi ? undefined : { color: PALETA.neutral[700] }}
            >
              {publicacionId === null
                ? 'Sin publicar'
                : estiloDeEstado(mascota.estado.nombre, mascota.adoptadaPorMi).etiqueta}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
