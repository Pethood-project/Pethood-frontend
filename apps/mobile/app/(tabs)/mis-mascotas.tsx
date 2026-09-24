/**
 * GUI-04 Mascotas Adoptante — listado de las mascotas del perfil activo (las personales, o
 * las del refugio desde la vista de refugio; ver `services/sesion.ts`), acceso a la creación y
 * punto de entrada a editar (HU-6.2). Eliminar (HU-6.3) no vive acá: se hace desde adentro
 * de la ficha de cada mascota (`mascotas/[id]/index.tsx`) para que la baja no quede a un
 * toque de distancia mientras se navega la lista.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { urlAbsoluta } from '@/services/api';
import { listarMisMascotas, type Mascota } from '@/services/mascotas';
import { edadEnTexto, parsearFecha } from '@/shared/validation/dates';

const ETIQUETA_TAMANIO = {
  PEQUENO: 'Pequeño',
  MEDIANO: 'Mediano',
  GRANDE: 'Grande',
} as const;

function edad(fechaNacimiento: string | null): string | null {
  const fecha = parsearFecha(fechaNacimiento);
  return fecha ? edadEnTexto(fecha) : null;
}

interface TarjetaMascotaProps {
  mascota: Mascota;
  /** Solo el creador del registro ve editar (misma regla que en publicaciones). */
  esPropia: boolean;
  onVer: () => void;
  onEditar: () => void;
  onVerHistoriaClinica: () => void;
}

function TarjetaMascota({
  mascota,
  esPropia,
  onVer,
  onEditar,
  onVerHistoriaClinica,
}: TarjetaMascotaProps) {
  const foto = urlAbsoluta(mascota.imagenUrl);
  const nombre = mascota.nombre ?? 'esta mascota';

  return (
    <View className="mb-3.5 flex-row gap-3.5 rounded-[26px] bg-organic-surface p-3.5 shadow-sm">
      {/* Foto y datos son Pressables hermanos de los botones de acción, no un Pressable
          contenedor: uno anidado dentro de otro dispara onPress apenas se monta en web
          (React 19), como ya documenta favoritos.tsx. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver a ${nombre}`}
        onPress={onVer}
        className="active:opacity-90"
      >
        {foto ? (
          <Image source={{ uri: foto }} className="h-32 w-32 rounded-[20px]" />
        ) : (
          <View className="h-32 w-32 items-center justify-center rounded-[20px] bg-organic-calido-amarilloClaro">
            <Ionicons name="paw-outline" size={36} color={PALETA.accent[600]} />
          </View>
        )}
      </Pressable>

      <View className="flex-1 justify-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver a ${nombre}`}
          onPress={onVer}
          className="active:opacity-90"
        >
          <Text className="font-titulo text-[19px] leading-[22px] text-organic-neutral-900">
            {mascota.nombre}
          </Text>
          <Text className="mt-1 font-cuerpo text-[15px] text-organic-neutral-600">
            {[
              mascota.especie.nombre,
              edad(mascota.fechaNacimiento),
              mascota.tamanio ? ETIQUETA_TAMANIO[mascota.tamanio] : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </Pressable>

        <View className="mt-3 flex-row items-center justify-between">
          <EstadoMascotaBadge estado={mascota.estado.nombre} />

          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Historia clínica de ${mascota.nombre}`}
              onPress={onVerHistoriaClinica}
              hitSlop={6}
              className="h-10 w-10 items-center justify-center rounded-full bg-organic-calido-amarilloClaro active:opacity-70"
            >
              <MaterialCommunityIcons
                name="clipboard-pulse-outline"
                size={19}
                color={PALETA.accent[600]}
              />
            </Pressable>

            {esPropia ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Editar ${mascota.nombre}`}
                onPress={onEditar}
                hitSlop={6}
                className="h-10 w-10 items-center justify-center rounded-full bg-organic-neutral-200 active:opacity-70"
              >
                <Ionicons name="pencil" size={18} color={PALETA.neutral[700]} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function ListaVacia() {
  return (
    <View className="items-center px-8 py-16">
      <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-organic-surface">
        <Ionicons name="paw-outline" size={52} color={PALETA.accent[600]} />
      </View>

      <Text className="text-center font-titulo text-[20px] leading-[24px] text-organic-neutral-900">
        Todavía no tenés ninguna mascota
      </Text>
      <Text className="mt-2 text-center font-cuerpo text-[15px] leading-6 text-organic-neutral-600">
        Registrá la primera para tenerla en tu perfil o para publicarla en adopción.
      </Text>

      <View className="mt-5 flex-row items-center gap-2.5 rounded-full bg-organic-surface px-4 py-3">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-organic-accent-600">
          <Ionicons name="add" size={20} color={PALETA.blanco} />
        </View>
        <Text className="font-cuerpo-semi text-[15px] text-organic-neutral-700">
          Tocá el botón para empezar
        </Text>
      </View>
    </View>
  );
}

export default function MisMascotasScreen() {
  const { vistaRefugio, usuario } = useSesion();
  const router = useRouter();

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setMascotas(await listarMisMascotas());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar tus mascotas.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  // Se recarga al volver de crear, editar o eliminar una mascota, para reflejar los cambios.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="border-b border-organic-neutral-300 bg-organic-neutral-100 px-[21px] py-[13px]">
          <Text className="font-titulo text-[24px] leading-[29px] text-organic-accent-600">
            {vistaRefugio ? 'Mascotas del refugio' : 'Mis mascotas'}
          </Text>
          <Text className="mt-[4px] font-cuerpo text-[13px] text-organic-neutral-600">
            {cargando ? 'Cargando…' : `${mascotas.length} ${mascotas.length === 1 ? 'mascota' : 'mascotas'}`}
          </Text>
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : error ? (
          <EstadoError
            mensaje={error}
            onAccion={() => {
              setCargando(true);
              void cargar();
            }}
          />
        ) : (
          <FlatList
            data={mascotas}
            keyExtractor={(mascota) => String(mascota.id)}
            renderItem={({ item }) => (
              <TarjetaMascota
                mascota={item}
                esPropia={item.usuarioId === usuario?.id}
                onVer={() => router.push({ pathname: '/mascotas/[id]', params: { id: item.id } })}
                onEditar={() =>
                  router.push({ pathname: '/mascotas/[id]/editar', params: { id: item.id } })
                }
                onVerHistoriaClinica={() =>
                  router.push({
                    pathname: '/mascotas/[id]/historia-clinica',
                    params: { id: item.id },
                  })
                }
              />
            )}
            ListEmptyComponent={ListaVacia}
            contentContainerClassName="px-5 py-4 pb-28"
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => {
                  setRefrescando(true);
                  void cargar();
                }}
                tintColor={PALETA.accent[600]}
              />
            }
          />
        )}

        {/* Burbuja de creación: lleva al formulario de alta. */}
        <Link href="/mascotas/crear" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={vistaRefugio ? 'Crear mascota del refugio' : 'Crear mascota'}
            className="absolute bottom-6 right-6 h-[68px] w-[68px] items-center justify-center rounded-full bg-organic-accent-600 shadow-lg active:opacity-90"
          >
            <Ionicons name="add" size={34} color={PALETA.blanco} />
          </Pressable>
        </Link>
      </SafeAreaView>
    </View>
  );
}
