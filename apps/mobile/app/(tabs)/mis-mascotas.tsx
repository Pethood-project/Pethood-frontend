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
    <View className="mb-3 flex-row gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      {foto ? (
        <Image source={{ uri: foto }} className="h-28 w-28 rounded-xl" />
      ) : (
        <View className="h-28 w-28 items-center justify-center rounded-xl bg-gray-100">
          <Ionicons name="paw-outline" size={28} color={PALETA.gris[400]} />
        </View>
      )}

      <View className="flex-1 justify-center">
        <Text className="text-base font-bold text-gray-900">{mascota.nombre}</Text>
        <Text className="mt-0.5 text-sm text-gray-500">
          {[
            mascota.especie.nombre,
            edad(mascota.fechaNacimiento),
            mascota.tamanio ? ETIQUETA_TAMANIO[mascota.tamanio] : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <View className="mt-2 flex-row items-center justify-between">
          <EstadoMascotaBadge estado={mascota.estado.nombre} />

          <View className="flex-row gap-1.5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Historia clínica de ${mascota.nombre}`}
              onPress={onVerHistoriaClinica}
              hitSlop={6}
              className="h-9 w-9 items-center justify-center rounded-full bg-orange-50 active:opacity-70"
            >
              <MaterialCommunityIcons
                name="clipboard-pulse-outline"
                size={17}
                color={PALETA.pethood.naranjaIntensa}
              />
            </Pressable>

            {esPropia ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${mascota.nombre}`}
                  onPress={onEditar}
                  hitSlop={6}
                  className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
                >
                  <Ionicons name="pencil" size={16} color={PALETA.gris[600]} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${mascota.nombre}`}
                  onPress={onEliminar}
                  hitSlop={6}
                  className="h-9 w-9 items-center justify-center rounded-full bg-red-50 active:opacity-70"
                >
                  <Ionicons name="trash-outline" size={16} color={PALETA.estado.error} />
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
      <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-white">
        <Ionicons name="paw-outline" size={44} color={PALETA.pethood.naranja} />
      </View>

      <Text className="text-center text-lg font-bold text-gray-900">
        Todavía no tenés ninguna mascota
      </Text>
      <Text className="mt-2 text-center text-base leading-6 text-gray-500">
        Registrá la primera para tenerla en tu perfil o para publicarla en adopción.
      </Text>

      <View className="mt-5 flex-row items-center gap-2 rounded-full bg-white px-4 py-2.5">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-pethood-orange">
          <Ionicons name="add" size={18} color={PALETA.blanco} />
        </View>
        <Text className="text-sm text-gray-600">Tocá el botón para empezar</Text>
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
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="border-b border-gray-200 bg-white px-5 py-4">
          <Text className="text-xl font-bold text-gray-900">Mis mascotas</Text>
          <Text className="text-sm text-gray-600">
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
                tintColor={PALETA.pethood.naranja}
              />
            }
          />
        )}

        {/* Burbuja de creación: lleva al formulario de alta. */}
        <Link href="/mascotas/crear" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={esRefugio ? 'Crear mascota del refugio' : 'Crear mascota'}
            className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-pethood-orange shadow-lg active:opacity-90"
          >
            <Ionicons name="add" size={32} color={PALETA.blanco} />
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
