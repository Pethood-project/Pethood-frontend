/**
 * GUI-04 Mascotas Adoptante — listado de las mascotas propias, acceso a la creación y
 * punto de entrada a editar (HU-6.2) y eliminar (HU-6.3) cada una.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { ApiError, urlAbsoluta } from '@/services/api';
import { eliminarMascota, listarMisMascotas, type Mascota } from '@/services/mascotas';
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
  /** Solo el creador del registro ve las acciones (misma regla que en publicaciones). */
  esPropia: boolean;
  onEditar: () => void;
  onEliminar: () => void;
  onVerHistoriaClinica: () => void;
}

function TarjetaMascota({
  mascota,
  esPropia,
  onEditar,
  onEliminar,
  onVerHistoriaClinica,
}: TarjetaMascotaProps) {
  const foto = urlAbsoluta(mascota.imagenUrl);

  return (
    <View className="mb-3.5 flex-row gap-3.5 rounded-[26px] bg-organic-surface p-3.5 shadow-sm">
      {foto ? (
        <Image source={{ uri: foto }} className="h-32 w-32 rounded-[20px]" />
      ) : (
        <View className="h-32 w-32 items-center justify-center rounded-[20px] bg-organic-calido-amarilloClaro">
          <Ionicons name="paw-outline" size={36} color={PALETA.accent[600]} />
        </View>
      )}

      <View className="flex-1 justify-center">
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
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${mascota.nombre}`}
                  onPress={onEditar}
                  hitSlop={6}
                  className="h-10 w-10 items-center justify-center rounded-full bg-organic-neutral-200 active:opacity-70"
                >
                  <Ionicons name="pencil" size={18} color={PALETA.neutral[700]} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${mascota.nombre}`}
                  onPress={onEliminar}
                  hitSlop={6}
                  className="h-10 w-10 items-center justify-center rounded-full bg-red-50 active:opacity-70"
                >
                  <Ionicons name="trash-outline" size={18} color={PALETA.estado.error} />
                </Pressable>
              </>
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
  const { esRefugio, usuario } = useSesion();
  const router = useRouter();
  const toast = useToast();

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Mascota esperando confirmación de baja; null cuando el modal está cerrado. */
  const [aEliminar, setAEliminar] = useState<Mascota | null>(null);
  const [eliminando, setEliminando] = useState(false);
  /** Mensaje del 409: la baja quedó bloqueada por solicitudes sin responder. */
  const [bloqueo, setBloqueo] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setMascotas(await listarMisMascotas(esRefugio ? 'REFUGIO' : 'PERSONAL'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar tus mascotas.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  // Se recarga al volver de crear o editar una mascota, para reflejar los cambios.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const confirmarEliminacion = async (): Promise<void> => {
    if (!aEliminar) return;

    const nombre = aEliminar.nombre ?? 'La mascota';
    setEliminando(true);

    try {
      const resultado = await eliminarMascota(aEliminar.id);
      setAEliminar(null);

      toast.mostrarExito(
        resultado.publicacionesDadasDeBaja > 0
          ? `Eliminamos a ${nombre} y retiramos su publicación en adopción.`
          : `Eliminamos a ${nombre} de tus mascotas.`,
      );

      await cargar();
    } catch (err) {
      setAEliminar(null);

      // El 409 no es un error del usuario sino un bloqueo con salida: se explica en un
      // diálogo aparte en vez de un toast rojo.
      if (err instanceof ApiError && err.codigo === 'SOLICITUDES_ABIERTAS') {
        setBloqueo(err.message);
        return;
      }

      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos eliminar la mascota. Intentalo de nuevo.',
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="border-b border-organic-neutral-300 bg-organic-neutral-100 px-[21px] py-[13px]">
          <Text className="font-titulo text-[24px] leading-[29px] text-organic-accent-600">
            Mis mascotas
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
                onEditar={() =>
                  router.push({ pathname: '/mascotas/[id]/editar', params: { id: item.id } })
                }
                onEliminar={() => setAEliminar(item)}
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
            accessibilityLabel={esRefugio ? 'Crear mascota del refugio' : 'Crear mascota'}
            className="absolute bottom-6 right-6 h-[68px] w-[68px] items-center justify-center rounded-full bg-organic-accent-600 shadow-lg active:opacity-90"
          >
            <Ionicons name="add" size={34} color={PALETA.blanco} />
          </Pressable>
        </Link>
      </SafeAreaView>

      {/* Regla transversal 6 de CLAUDE.md: confirmación antes de una acción crítica. */}
      <ConfirmDialog
        visible={aEliminar !== null}
        tono="peligro"
        titulo={`¿Eliminar a ${aEliminar?.nombre ?? 'esta mascota'}?`}
        mensaje="Se va a retirar de la plataforma junto con su publicación en adopción, si tiene una."
        detalle="Esta acción no se puede deshacer desde la app."
        textoConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={() => void confirmarEliminacion()}
        onCerrar={() => setAEliminar(null)}
      />

      <ConfirmDialog
        visible={bloqueo !== null}
        tono="advertencia"
        titulo="No se puede eliminar todavía"
        mensaje={bloqueo ?? ''}
        detalle="Resolvélas desde la bandeja de solicitudes para poder eliminarla."
        textoConfirmar="Ver solicitudes"
        textoCancelar="Entendido"
        onConfirmar={() => {
          setBloqueo(null);
          router.push('/solicitudes');
        }}
        onCerrar={() => setBloqueo(null)}
      />
    </View>
  );
}
