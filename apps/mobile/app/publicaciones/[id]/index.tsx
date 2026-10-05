/**
 * Ficha del animal — detalle completo de una publicación en adopción.
 *
 * Se abre tocando una tarjeta del mazo de Adoptar. La mascota NO se descarta de la pila al
 * entrar acá: esa pantalla conserva su estado y el back devuelve a la misma tarjeta.
 *
 * El corazón guarda y quita de favoritos, y el pie tiene el CTA de solicitar adopción o
 * tránsito (HU-7.1). El botón resuelve solo las precondiciones y el formulario: acá solo se
 * le pasa la mascota y se refresca la ficha cuando la solicitud queda creada.
 *
 * También se abre desde "Mis publicaciones". Sobre lo propio (`esPropia`) no hay corazón ni
 * CTA, y en su lugar se muestra el estado de la publicación. Quien la puede gestionar
 * (`puedeEditar`) además tiene ahí las acciones: editarla y pausarla, reactivarla o
 * finalizarla, cada cambio de estado con su cartel de confirmación.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GaleriaFotos } from '@/components/adoptar/GaleriaFotos';
import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import {
  BannerEstadoPublicacion,
  CajaDescripcion,
  ChipRasgo,
  CuadranteSalud,
  datosDeMascota,
  GrillaDatos,
  MedallaRequisito,
  PublicadoPor,
  SeccionFicha,
  SOLAPE_TARJETA,
  Subtitulo,
  TarjetaFicha,
} from '@/components/publicaciones/FichaPublicacion';
import { BotonReportar } from '@/components/reportes/BotonReportar';
import { ResumenReputacion } from '@/components/resenas/ResumenReputacion';
import { BotonSolicitar, solicitudEnviadaDe } from '@/components/solicitudes/BotonSolicitar';
import { ConfirmDialog, type TonoDialogo } from '@/components/ui/ConfirmDialog';
import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { VacunasMascota } from '@/components/vacunas/VacunasMascota';
import { ESTADO_SOLICITABLE } from '@/constants/Mascotas';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { coordenadasRecordadas, distanciaEnTexto, pedirUbicacion } from '@/lib/ubicacion';
import { agregarFavorito, quitarFavorito } from '@/services/favoritos';
import {
  ESTADO_PUBLICACION,
  cambiarEstadoPublicacion,
  obtenerPublicacion,
  type AccionEstadoPublicacion,
  type PublicacionFeed,
} from '@/services/publicaciones';
import { obtenerElegibilidad } from '@/services/solicitudes';
import { rasgoSegunGenero } from '@/shared/genero';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

/** Cartel de confirmación y aviso de éxito de cada cambio de estado manual. */
const CAMBIOS_DE_ESTADO: Record<
  AccionEstadoPublicacion,
  {
    tono: TonoDialogo;
    icono: keyof typeof Ionicons.glyphMap;
    titulo: string;
    mensaje: string;
    detalle?: string;
    confirmar: string;
    exito: string;
  }
> = {
  PAUSAR: {
    tono: 'advertencia',
    icono: 'pause-circle-outline',
    titulo: '¿Seguro que querés pausar la publicación?',
    mensaje: 'Va a dejar de aparecer en Adoptar y no va a recibir solicitudes nuevas.',
    detalle: 'La podés reactivar cuando quieras.',
    confirmar: 'Pausar',
    exito: 'Pausamos la publicación.',
  },
  REACTIVAR: {
    tono: 'exito',
    icono: 'play-circle-outline',
    titulo: '¿Seguro que querés reactivar la publicación?',
    mensaje: 'Va a volver a aparecer en Adoptar y a recibir solicitudes.',
    confirmar: 'Reactivar',
    exito: '¡Listo! La publicación volvió a estar activa.',
  },
  FINALIZAR: {
    tono: 'peligro',
    icono: 'flag-outline',
    titulo: '¿Seguro que querés finalizar la publicación?',
    mensaje: 'Deja de aparecer en Adoptar y ya no se puede reactivar ni editar.',
    detalle:
      'Si más adelante querés volver a ofrecerla, creás una publicación nueva y esta deja de aparecer en Mis publicaciones.',
    confirmar: 'Finalizar',
    exito: 'Finalizamos la publicación.',
  },
};

export default function FichaPublicacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { vistaRefugio } = useSesion();

  const publicacionId = Number(Array.isArray(id) ? id[0] : id);
  // Desde la vista de refugio la ficha se puede ver (por ejemplo, "Ver publicación
  // asociada" de una mascota del refugio), pero no se adopta ni se guarda: el refugio no
  // tiene favoritos ni solicitudes propias.
  const puedeAdoptar = !vistaRefugio;

  const [publicacion, setPublicacion] = useState<PublicacionFeed | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  /** Cambio de estado esperando confirmación en el cartel. */
  const [accionPendiente, setAccionPendiente] = useState<AccionEstadoPublicacion | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  /** Solicitud viva del usuario sobre esta publicación, si tiene. Ver `BotonSolicitar`. */
  const [solicitudAbiertaId, setSolicitudAbiertaId] = useState<number | null>(() =>
    Number.isInteger(publicacionId) ? (solicitudEnviadaDe(publicacionId) ?? null) : null,
  );
  /** Distancia a quien publicó, cuando hay ubicación del usuario y del publicador. */
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);

  /**
   * Pide la ubicación (reusa la de la sesión) y vuelve a pedir la ficha con las coordenadas
   * para que el backend calcule la distancia. Best-effort: si no hay permiso, no se muestra.
   */
  const cargarDistancia = useCallback(async (id: number): Promise<void> => {
    const recordadas = coordenadasRecordadas();
    const resultado = recordadas
      ? ({ ok: true, coordenadas: recordadas } as const)
      : await pedirUbicacion();

    if (!resultado.ok) return;

    try {
      const conDistancia = await obtenerPublicacion(id, resultado.coordenadas);
      setDistanciaKm(conDistancia.distanciaKm);
    } catch {
      // Silencioso: la distancia es información secundaria.
    }
  }, []);

  const cargar = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(publicacionId) || publicacionId <= 0) {
      setError('La publicación no es válida.');
      setCargando(false);
      return;
    }

    try {
      setError(null);
      setPublicacion(await obtenerPublicacion(publicacionId));
      // La distancia se resuelve después, sin bloquear el contenido.
      void cargarDistancia(publicacionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar la publicación.');
    } finally {
      setCargando(false);
    }

    // Aparte y sin bloquear la ficha: si falla (por ejemplo, sin verificar) el botón
    // simplemente arranca en "Solicitar" y resuelve la precondición al tocarlo, como
    // siempre. Es la única pantalla que lo consulta al montar: acá hay una sola ficha, no
    // una grilla con una tarjeta por publicación. Solo en el perfil personal: es el único
    // que solicita, y el backend rechaza la consulta desde el de refugio.
    if (!puedeAdoptar) return;

    obtenerElegibilidad(publicacionId)
      .then((elegibilidad) => {
        // El id manda, no el motivo: si la cuenta no está verificada el backend puede
        // devolver otro código y aún así traer la solicitud ya mandada.
        if (elegibilidad.solicitudAbiertaId != null) {
          setSolicitudAbiertaId(elegibilidad.solicitudAbiertaId);
        }
      })
      .catch(() => undefined);
  }, [publicacionId, puedeAdoptar, cargarDistancia]);

  // Al tomar foco y no solo al montar: al volver de editarla, la ficha muestra los cambios.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const confirmarCambioDeEstado = async (): Promise<void> => {
    if (!publicacion || !accionPendiente) return;

    setCambiandoEstado(true);
    try {
      setPublicacion(await cambiarEstadoPublicacion(publicacion.id, accionPendiente));
      toast.mostrarExito(CAMBIOS_DE_ESTADO[accionPendiente].exito);
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos cambiar el estado. Intentalo de nuevo.',
      );
    } finally {
      setCambiandoEstado(false);
      setAccionPendiente(null);
    }
  };

  /**
   * Update optimista del corazón: cambia en el acto y se revierte si el servidor falla.
   * Las dos operaciones de favoritos son idempotentes, así que un doble toque rápido no
   * puede dejar el estado inconsistente.
   */
  const alternarFavorito = useCallback((): void => {
    if (!publicacion || guardando) return;

    const guardada = publicacion.enFavoritos;
    const nombre = publicacion.mascota.nombre ?? 'la mascota';

    setPublicacion({ ...publicacion, enFavoritos: !guardada });
    setGuardando(true);

    const operacion = guardada
      ? quitarFavorito(publicacion.mascota.id)
      : agregarFavorito(publicacion.mascota.id);

    void operacion
      .then(() => {
        toast.mostrarExito(
          guardada ? `Quitamos a ${nombre} de favoritos.` : `Guardamos a ${nombre} en favoritos.`,
        );
      })
      .catch((err: unknown) => {
        setPublicacion((actual) => (actual ? { ...actual, enFavoritos: guardada } : actual));
        toast.mostrarError(
          err instanceof Error ? err.message : 'No pudimos actualizar tus favoritos.',
        );
      })
      .finally(() => setGuardando(false));
  }, [guardando, publicacion, toast]);

  const volver = useCallback((): void => {
    // `dismiss` saca esta ficha del stack. `canGoBack` del history se ensucia con el
    // modal de solicitud y en web deja la flecha sin efecto.
    if (router.canDismiss()) {
      router.dismiss();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    router.replace('/(tabs)/adoptar');
  }, [navigation, router]);

  if (cargando && !publicacion) {
    return (
      <View className="flex-1 bg-pethood-beige">
        <EstadoCargando />
      </View>
    );
  }

  if (error || !publicacion) {
    return (
      <View className="flex-1 bg-pethood-beige">
        <SafeAreaView className="flex-1" edges={['top']}>
          <EstadoError
            mensaje={error ?? 'No encontramos la publicación.'}
            onAccion={volver}
            etiquetaAccion="Volver"
          />
        </SafeAreaView>
      </View>
    );
  }

  const { mascota } = publicacion;
  const estadoPublicacion = publicacion.estado.nombre;
  const cambioPendiente = accionPendiente ? CAMBIOS_DE_ESTADO[accionPendiente] : null;

  // Renglón de la tarjeta del formulario: quién publica y desde dónde, lo que ya se ve
  // arriba de la ficha.
  const procedencia =
    [publicacion.refugio?.nombre, publicacion.ubicacion].filter(Boolean).join(' · ') || null;

  // Enlace a Google Maps del refugio (Módulo 11). Sin link, no se muestra el ícono.
  const mapaDelRefugio = publicacion.refugio?.mapaUrl ?? null;

  // Fecha en que se publicó la mascota, para mostrarla bajo el refugio.
  const fechaPublicacion = parsearFecha(publicacion.fechaPublicacion);
  const fechaPublicacionTexto = fechaPublicacion ? aFechaVisible(fechaPublicacion) : null;

  // Distancia a quien publicó, si se pudo calcular (requiere ubicación del usuario).
  const distanciaTexto = distanciaKm !== null ? distanciaEnTexto(distanciaKm) : null;

  return (
    <View className="flex-1 bg-pethood-beige">
      {/* Se suma el inset inferior para que el último bloque no quede debajo de la barra
          del sistema cuando esta se muestra. Con el CTA fijo abajo, el hueco además tiene
          que dejar pasar el alto del pie. */}
      <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        <GaleriaFotos imagenes={publicacion.imagenes} solapeInferior={SOLAPE_TARJETA} />

        {/* Toda la ficha en una tarjeta montada sobre la foto. Cada sección usa el mismo
            encabezado: ver `components/publicaciones/FichaPublicacion.tsx`. */}
        <TarjetaFicha>
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 font-titulo text-[34px] leading-[40px] text-organic-neutral-900">
              {mascota.nombre ?? 'Sin nombre'}
            </Text>
            <View className="mt-1.5">
              <EstadoMascotaBadge estado={mascota.estado.nombre} tamanio="lg" />
            </View>
          </View>

          <PublicadoPor
            refugio={publicacion.refugio}
            persona={publicacion.publicadoPor}
            ubicacion={publicacion.ubicacion}
            distanciaTexto={distanciaTexto}
            mapaUrl={mapaDelRefugio}
            fechaTexto={fechaPublicacionTexto}
            onVerPerfil={
              publicacion.refugio
                ? () =>
                    router.push({
                      pathname: '/perfiles/refugio/[id]',
                      params: { id: publicacion.refugio!.id },
                    })
                : publicacion.publicadoPor
                  ? () =>
                      router.push({
                        pathname: '/perfiles/usuario/[id]',
                        params: { id: publicacion.publicadoPor!.id },
                      })
                  : undefined
            }
          />

          {/* Solo sobre lo propio: a quien adopta le alcanza con el estado de la mascota, y
              la publicación que ve en el feed siempre está activa. */}
          {publicacion.esPropia ? <BannerEstadoPublicacion estado={estadoPublicacion} /> : null}

          {publicacion.personalidad.length > 0 ? (
            <SeccionFicha icono="creation" titulo="Personalidad">
              <View className="flex-row flex-wrap gap-2">
                {publicacion.personalidad.map((rasgo) => (
                  <ChipRasgo key={rasgo} texto={rasgoSegunGenero(mascota.genero, rasgo)} />
                ))}
              </View>
            </SeccionFicha>
          ) : null}

          <SeccionFicha icono="paw" titulo="Características">
            <GrillaDatos datos={datosDeMascota(mascota)} />
          </SeccionFicha>

          {/* Castrado es de la mascota y desparasitado de la publicación, pero se leen juntos.
              Las vacunas salen de la historia clínica de la mascota: se tocan para ver para
              qué sirve cada una. */}
          <SeccionFicha icono="heart-pulse" titulo="Salud">
            <View className="flex-row gap-2.5">
              <CuadranteSalud tipo="CASTRADO" activo={mascota.castrado} genero={mascota.genero} />
              <CuadranteSalud
                tipo="DESPARASITADO"
                activo={publicacion.desparasitado}
                genero={mascota.genero}
              />
            </View>
            <Subtitulo texto="Vacunas" />
            <VacunasMascota vacunas={publicacion.vacunas} grande />
          </SeccionFicha>

          {publicacion.descripcion ? (
            <SeccionFicha icono="message-text" titulo={`Sobre ${mascota.nombre ?? 'la mascota'}`}>
              <CajaDescripcion texto={publicacion.descripcion} />
            </SeccionFicha>
          ) : null}

          {publicacion.requisitos.length > 0 ? (
            <SeccionFicha icono="clipboard-check-outline" titulo="Requisitos para adoptar">
              <View className="flex-row flex-wrap gap-2">
                {publicacion.requisitos.map((requisito) => (
                  <MedallaRequisito key={requisito} texto={requisito} />
                ))}
              </View>
            </SeccionFicha>
          ) : null}
        </TarjetaFicha>

        {/* Reputación de quien publica (Módulo 10, HU-10.5): antes de decidir, el adoptante
            ve cómo fue valorado el refugio por otras personas. */}
        {publicacion.refugio ? (
          <ResumenReputacion
            tipo="refugio"
            id={publicacion.refugio.id}
            titulo="Reseñas del refugio"
            mostrarLista
            className="mx-3 mt-5"
          />
        ) : null}

        {/* Acciones de quien la gestiona, debajo de la tarjeta: primero se ve la publicación
            entera tal como la ve quien adopta. Una finalizada ya no tiene ninguna: es
            terminal. Pausar solo desde activa, reactivar solo desde pausada, finalizar desde
            las dos (el backend vuelve a validar cada transición). */}
        <View className="px-3">
          {publicacion.esPropia || publicacion.puedeEditar ? null : (
            <BotonReportar
              tipo="PUBLICACION"
              objetoId={publicacion.id}
              etiqueta="Reportar publicación"
              className="mt-5"
            />
          )}
          {publicacion.puedeEditar && estadoPublicacion !== ESTADO_PUBLICACION.FINALIZADA ? (
            <View className="mt-5 gap-2.5">
              <CustomButton
                title="Editar publicación"
                variant="acento"
                onPress={() =>
                  router.push({
                    pathname: '/publicaciones/[id]/editar',
                    params: { id: publicacion.id },
                  })
                }
              />

              {estadoPublicacion === ESTADO_PUBLICACION.ACTIVA ? (
                <CustomButton
                  title="Pausar publicación"
                  variant="neutro"
                  onPress={() => setAccionPendiente('PAUSAR')}
                />
              ) : estadoPublicacion === ESTADO_PUBLICACION.PAUSADA ? (
                <CustomButton
                  title="Reactivar publicación"
                  variant="acento-borde"
                  onPress={() => setAccionPendiente('REACTIVAR')}
                />
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Finalizar publicación"
                onPress={() => setAccionPendiente('FINALIZAR')}
                className="items-center py-2 active:opacity-60"
              >
                <Text className="text-base font-semibold" style={{ color: PALETA.estado.error }}>
                  Finalizar publicación
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
      </View>

      {/* Pie fijo: el CTA no se scrollea, así está siempre a un toque. Sobre la propia
          mascota no hay nada que solicitar, así que el pie directamente no se muestra —
          el backend también lo rechaza (PUBLICACION_PROPIA) si de algún modo se llegara a
          tocar. Tampoco se muestra si el estado no es solicitable (En_Tratamiento,
          En_Transito, Adoptado…) o si la publicación no está activa (pausada o
          finalizada), salvo que ya haya una solicitud en curso — ese caso lo resuelve
          `BotonSolicitar` por dentro. */}
      {puedeAdoptar &&
      !publicacion.esPropia &&
      ((mascota.estado.nombre === ESTADO_SOLICITABLE &&
        estadoPublicacion === ESTADO_PUBLICACION.ACTIVA) ||
        solicitudAbiertaId !== null) ? (
        <View
          className="border-t border-organic-neutral-200 bg-organic-bg px-4 pt-3"
          style={{ paddingBottom: 12 + insets.bottom }}
        >
          {/* El hogar precargado del paso 2 no sale de acá: lo trae `/elegibilidad`, que
              `BotonSolicitar` consulta al tocar. Es el hogar del USUARIO, no la ubicación de
              esta mascota — antes se pasaba por error `publicacion.ubicacion`. */}
          <BotonSolicitar
            mascota={{
              publicacionId: publicacion.id,
              nombre: mascota.nombre,
              imagenUrl: mascota.imagenUrl,
              estado: mascota.estado.nombre,
              subtitulo: procedencia,
              destinatario: publicacion.refugio?.nombre ?? null,
            }}
            solicitudAbiertaId={solicitudAbiertaId}
            onCreada={(solicitud) => setSolicitudAbiertaId(solicitud.id)}
          />
        </View>
      ) : null}

      {/* Últimos hijos del root y zIndex alto: en web la galería (transform) pintaba
          encima de un overlay hermano del ScrollView y se comía la flecha. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={volver}
        hitSlop={12}
        className="h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-70"
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 12,
          zIndex: 9999,
          elevation: 9999,
        }}
      >
        <Ionicons name="arrow-back" size={20} color={PALETA.grisCalido[900]} />
      </Pressable>

      {/* Sobre la propia mascota (personal o del propio refugio) no hay nada que guardar:
          sería guardarse a uno mismo un aviso que uno mismo publicó. Tampoco desde la vista
          de refugio, que no tiene favoritos. */}
      {puedeAdoptar && !publicacion.esPropia ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            publicacion.enFavoritos ? 'Quitar de favoritos' : 'Guardar en favoritos'
          }
          onPress={alternarFavorito}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-70"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            right: 12,
            zIndex: 9999,
            elevation: 9999,
          }}
        >
          <Ionicons
            name={publicacion.enFavoritos ? 'heart' : 'heart-outline'}
            size={20}
            color={PALETA.pethood.naranja}
          />
        </Pressable>
      ) : null}
      <ConfirmDialog
        visible={cambioPendiente !== null}
        tono={cambioPendiente?.tono}
        icono={cambioPendiente?.icono}
        titulo={cambioPendiente?.titulo ?? ''}
        mensaje={cambioPendiente?.mensaje ?? ''}
        detalle={cambioPendiente?.detalle}
        textoConfirmar={cambioPendiente?.confirmar}
        cargando={cambiandoEstado}
        onConfirmar={() => void confirmarCambioDeEstado()}
        onCerrar={() => setAccionPendiente(null)}
      />
    </View>
  );
}
