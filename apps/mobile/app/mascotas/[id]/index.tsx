/**
 * Ficha de mascota — HU-6.4: verla individualmente desde "Mis mascotas".
 *
 * Se abre tocando una tarjeta del listado propio (`(tabs)/mis-mascotas.tsx`). Solo quien la
 * cargó o un compañero del mismo refugio puede entrar — el backend vuelve a validarlo, esto
 * es solo para no ofrecer el toque a quien de todos modos va a recibir un 403.
 *
 * Copia el formato de la ficha de la publicación (`publicaciones/[id]/index.tsx`): foto
 * arriba y una tarjeta montada encima con las mismas secciones y piezas
 * (`components/publicaciones/FichaPublicacion.tsx`). No hay CTA de solicitud ni favoritos:
 * es la mascota en sí y no un anuncio.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GaleriaFotos } from '@/components/adoptar/GaleriaFotos';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import {
  CajaDescripcion,
  CuadranteSalud,
  datosDeMascota,
  GrillaDatos,
  SeccionFicha,
  SOLAPE_TARJETA,
  Subtitulo,
  TarjetaFicha,
} from '@/components/publicaciones/FichaPublicacion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { PressableAnimado } from '@/components/ui/PressableAnimado';
import { VacunasMascota } from '@/components/vacunas/VacunasMascota';
import { BotonVolver } from '@/components/ui/BotonVolver';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { ApiError } from '@/services/api';
import { eliminarMascota, obtenerMascota, type FichaMascota } from '@/services/mascotas';

export default function FichaMascotaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
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

  return (
    <View className="flex-1 bg-pethood-beige">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        <GaleriaFotos
          imagenes={mascota.imagenUrl ? [mascota.imagenUrl] : []}
          solapeInferior={SOLAPE_TARJETA}
        />

        <TarjetaFicha>
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 font-titulo text-[34px] leading-[40px] text-organic-neutral-900">
              {mascota.nombre ?? 'Sin nombre'}
            </Text>
            <View className="mt-1.5">
              <EstadoMascotaBadge estado={mascota.estado.nombre} tamanio="lg" />
            </View>
          </View>

          <SeccionFicha icono="paw" titulo="Características">
            <GrillaDatos datos={datosDeMascota(mascota)} />
          </SeccionFicha>

          {/* Castrado y desparasitado son de la mascota y se leen juntos. Las vacunas salen de
              la historia clínica: se suman cargando un registro de tipo "Vacuna". */}
          <SeccionFicha icono="heart-pulse" titulo="Salud">
            <View className="flex-row gap-2.5">
              <CuadranteSalud tipo="CASTRADO" activo={mascota.castrado} genero={mascota.genero} />
              <CuadranteSalud
                tipo="DESPARASITADO"
                activo={mascota.desparasitado}
                genero={mascota.genero}
              />
            </View>
            <Subtitulo texto="Vacunas" />
            <VacunasMascota vacunas={mascota.vacunas} grande />
          </SeccionFicha>

          {mascota.descripcion ? (
            <SeccionFicha icono="message-text" titulo="Descripción">
              <CajaDescripcion texto={mascota.descripcion} />
            </SeccionFicha>
          ) : null}
        </TarjetaFicha>

        <View className="px-3">
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
        </View>
      </ScrollView>

      {/* Después del ScrollView y con zIndex alto: en web la galería (transform) pintaba
          encima de un overlay hermano y se comía la flecha (igual que en la publicación). */}
      <BotonVolver
        sobreFoto
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 12,
          zIndex: 9999,
          elevation: 9999,
        }}
      />

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
