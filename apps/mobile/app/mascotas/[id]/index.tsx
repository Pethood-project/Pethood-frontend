/**
 * Ficha de mascota — HU-6.4: verla individualmente desde "Mis mascotas".
 *
 * Se abre tocando una tarjeta del listado propio (`(tabs)/mis-mascotas.tsx`). Solo quien la
 * cargó o un compañero del mismo refugio puede entrar — el backend vuelve a validarlo, esto
 * es solo para no ofrecer el toque a quien de todos modos va a recibir un 403.
 *
 * Reusa el mismo patrón de encabezado + tarjeta de datos que la ficha de historia clínica
 * (`historia-clinica/[registroId]/index.tsx`), no el de la publicación en adopción: acá no
 * hay galería ni CTA de solicitud, es la mascota en sí y no un anuncio.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { PressableAnimado } from '@/components/ui/PressableAnimado';
import { etiquetaEdad, etiquetaGenero, etiquetaTamanio } from '@/constants/Mascotas';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { ApiError, urlAbsoluta } from '@/services/api';
import { eliminarMascota, obtenerMascota, type FichaMascota } from '@/services/mascotas';

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View className="flex-1">
      <Text className="font-cuerpo-semi text-[11px] uppercase tracking-wide text-organic-neutral-500">
        {etiqueta}
      </Text>
      <Text className="mt-1 font-cuerpo text-lg text-organic-neutral-900">{valor}</Text>
    </View>
  );
}

export default function FichaMascotaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { usuario } = useSesion();

  const mascotaId = Number(id);

  const [mascota, setMascota] = useState<FichaMascota | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  /** Mensaje del 409: la baja quedó bloqueada por solicitudes sin responder. */
  const [bloqueo, setBloqueo] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(mascotaId) || mascotaId <= 0) {
      setError('El id de la mascota no es válido.');
      setCargando(false);
      return;
    }

    try {
      setError(null);
      setMascota(await obtenerMascota(mascotaId));
    } catch (err) {
      setError(
        err instanceof ApiError && err.codigo === 'NO_AUTORIZADO'
          ? 'Esa mascota no es tuya.'
          : err instanceof Error
            ? err.message
            : 'No pudimos cargar la mascota.',
      );
    } finally {
      setCargando(false);
    }
  }, [mascotaId]);

  // Se recarga al volver de editar, para reflejar los cambios.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const esPropia = mascota !== null && mascota.usuarioId === usuario?.id;

  const confirmarBaja = async (): Promise<void> => {
    if (!mascota) return;

    const nombre = mascota.nombre ?? 'La mascota';
    setEliminando(true);

    try {
      const resultado = await eliminarMascota(mascota.id);
      setConfirmarEliminar(false);

      toast.mostrarExito(
        resultado.publicacionesDadasDeBaja > 0
          ? `Eliminamos a ${nombre} y retiramos su publicación en adopción.`
          : `Eliminamos a ${nombre} de tus mascotas.`,
      );

      router.back();
    } catch (err) {
      setConfirmarEliminar(false);

      // El 409 no es un error del usuario sino un bloqueo con salida: se explica en un
      // diálogo aparte en vez de un toast rojo (mismo criterio que mis-mascotas.tsx).
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

  if (cargando) {
    return (
      <View className="flex-1 bg-organic-neutral-100">
        <EstadoCargando />
      </View>
    );
  }

  if (error || !mascota) {
    return (
      <View className="flex-1 bg-organic-neutral-100">
        <SafeAreaView className="flex-1" edges={['top']}>
          <EstadoError
            mensaje={error ?? 'No encontramos la mascota.'}
            etiquetaAccion="Volver"
            onAccion={() => router.back()}
          />
        </SafeAreaView>
      </View>
    );
  }

  const foto = urlAbsoluta(mascota.imagenUrl);
  const subtitulo = [
    mascota.especie.nombre,
    etiquetaEdad(mascota.fechaNacimiento),
    etiquetaTamanio(mascota.tamanio),
    etiquetaGenero(mascota.genero),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="flex-1 bg-organic-neutral-100">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="bg-organic-accent-600 px-4 pb-5 pt-3">
          <View className="flex-row items-center gap-3">
            <PressableAnimado
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => router.back()}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="arrow-back" size={22} color={PALETA.blanco} />
            </PressableAnimado>

            <View className="flex-1">
              <Text className="font-titulo text-2xl text-white" numberOfLines={1}>
                {mascota.nombre ?? 'Sin nombre'}
              </Text>
              <Text className="font-cuerpo text-sm text-white/80" numberOfLines={1}>
                {subtitulo}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
          <View className="overflow-hidden rounded-[22px] bg-organic-neutral-200">
            {foto ? (
              <Image
                source={{ uri: foto }}
                className="w-full"
                style={{ aspectRatio: 4 / 3 }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full items-center justify-center" style={{ aspectRatio: 4 / 3 }}>
                <Ionicons name="paw-outline" size={48} color={PALETA.neutral[400]} />
              </View>
            )}
          </View>

          <View className="mt-3">
            <EstadoMascotaBadge estado={mascota.estado.nombre} />
          </View>

          <View className="mt-4 overflow-hidden rounded-[22px] border border-organic-neutral-200 bg-organic-neutral-100">
            <View className="flex-row gap-3 border-b border-organic-neutral-200 p-4">
              <Dato etiqueta="Especie" valor={mascota.especie.nombre} />
              <Dato etiqueta="Raza" valor={mascota.raza.nombre} />
            </View>

            <View className="flex-row gap-3 p-4">
              <Dato
                etiqueta="Peso"
                valor={mascota.peso === null ? 'Sin dato' : `${mascota.peso} kg`}
              />
              <Dato etiqueta="Castrado" valor={mascota.castrado ? 'Sí' : 'No'} />
            </View>
          </View>

          {mascota.descripcion ? (
            <View className="mt-4 rounded-[22px] border border-organic-neutral-200 bg-organic-neutral-100 p-4">
              <Text className="font-cuerpo-semi text-[11px] uppercase tracking-wide text-organic-neutral-500">
                Descripción
              </Text>
              <Text className="mt-1.5 font-cuerpo text-base leading-6 text-organic-neutral-700">
                {mascota.descripcion}
              </Text>
            </View>
          ) : null}

          {/* Los cuatro botones van apilados de ancho completo y en este orden fijo, para
              adoptante y refugio por igual: 1) historia clínica, 2) editar, 3) ver la
              publicación en adopción si tiene una, 4) eliminar — este último sin fondo, como
              "Dar de baja mi cuenta" en perfil/editar.tsx, para que la baja no compita
              visualmente con las acciones normales. */}
          <View className="mt-6 gap-3">
            <PressableAnimado
              accessibilityRole="button"
              accessibilityLabel={`Historia clínica de ${mascota.nombre ?? 'la mascota'}`}
              onPress={() =>
                router.push({
                  pathname: '/mascotas/[id]/historia-clinica',
                  params: { id: mascota.id },
                })
              }
              escala={0.97}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-organic-calido-amarilloClaro py-4"
            >
              <MaterialCommunityIcons
                name="clipboard-pulse-outline"
                size={20}
                color={PALETA.accent[700]}
              />
              <Text className="font-cuerpo-semi text-lg text-organic-accent-700">
                Historia clínica
              </Text>
            </PressableAnimado>

            {esPropia ? (
              <PressableAnimado
                accessibilityRole="button"
                accessibilityLabel={`Editar ${mascota.nombre ?? 'esta mascota'}`}
                onPress={() =>
                  router.push({ pathname: '/mascotas/[id]/editar', params: { id: mascota.id } })
                }
                escala={0.97}
                className="flex-row items-center justify-center gap-2 rounded-2xl bg-organic-accent-600 py-4"
                style={{
                  shadowColor: PALETA.accent[800],
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 5 },
                  elevation: 6,
                }}
              >
                <Ionicons name="pencil" size={20} color={PALETA.blanco} />
                <Text className="font-cuerpo-semi text-lg text-white">Editar</Text>
              </PressableAnimado>
            ) : null}

            {mascota.publicacionActivaId !== null ? (
              <PressableAnimado
                accessibilityRole="button"
                accessibilityLabel={`Ver la publicación en adopción de ${mascota.nombre ?? 'esta mascota'}`}
                onPress={() =>
                  router.push({
                    pathname: '/publicaciones/[id]',
                    params: { id: mascota.publicacionActivaId! },
                  })
                }
                escala={0.97}
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-organic-accent-300 bg-white py-4"
              >
                <Ionicons name="megaphone-outline" size={20} color={PALETA.accent[700]} />
                <Text className="font-cuerpo-semi text-lg text-organic-accent-700">
                  Ver publicación asociada
                </Text>
              </PressableAnimado>
            ) : null}

            {esPropia ? (
              <PressableAnimado
                accessibilityRole="button"
                accessibilityLabel={`Eliminar ${mascota.nombre ?? 'esta mascota'}`}
                onPress={() => setConfirmarEliminar(true)}
                escala={0.98}
                className="items-center py-3"
              >
                <Text className="font-cuerpo-semi text-base" style={{ color: PALETA.estado.error }}>
                  Eliminar mascota
                </Text>
              </PressableAnimado>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmarEliminar}
        tono="peligro"
        titulo={`¿Eliminar a ${mascota.nombre ?? 'esta mascota'}?`}
        mensaje="Se va a retirar de la plataforma junto con su publicación en adopción, si tiene una."
        detalle="Esta acción no se puede deshacer desde la app."
        textoConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={() => void confirmarBaja()}
        onCerrar={() => setConfirmarEliminar(false)}
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
