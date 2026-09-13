/**
 * Ficha del animal — detalle completo de una publicación en adopción.
 *
 * Se abre tocando una tarjeta del mazo de Adoptar. La mascota NO se descarta de la pila al
 * entrar acá: esa pantalla conserva su estado y el back devuelve a la misma tarjeta.
 *
 * El corazón guarda y quita de favoritos, y el pie tiene el CTA de solicitar adopción o
 * tránsito (HU-7.1). El botón resuelve solo las precondiciones y el formulario: acá solo se
 * le pasa la mascota y se refresca la ficha cuando la solicitud queda creada.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GaleriaFotos } from '@/components/adoptar/GaleriaFotos';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { BotonSolicitar } from '@/components/solicitudes/BotonSolicitar';
import { Chip } from '@/components/ui/Chip';
import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { SeccionTitulada } from '@/components/ui/SeccionTitulada';
import { resumenMascota } from '@/constants/Mascotas';
import { PALETA } from '@/constants/theme';
import { agregarFavorito, quitarFavorito } from '@/services/favoritos';
import { obtenerPublicacion, type PublicacionFeed } from '@/services/publicaciones';

/** Ítem de una lista con viñeta, para requisitos y vacunas. */
function Vinieta({ texto, icono }: { texto: string; icono: 'checkmark-circle' | 'ellipse' }) {
  return (
    <View className="mb-1.5 flex-row items-start gap-2">
      <Ionicons
        name={icono}
        size={icono === 'ellipse' ? 7 : 16}
        color={PALETA.pethood.naranja}
        style={{ marginTop: icono === 'ellipse' ? 7 : 1 }}
      />
      <Text className="flex-1 text-[15px] leading-6 text-gray-700">{texto}</Text>
    </View>
  );
}

/** Dato suelto en la grilla de características. */
function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-3">
      <Text className="text-[11px] uppercase tracking-wide text-gray-400">{etiqueta}</Text>
      <Text className="mt-0.5 text-[15px] font-semibold text-gray-800">{valor}</Text>
    </View>
  );
}

export default function FichaPublicacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [publicacion, setPublicacion] = useState<PublicacionFeed | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const publicacionId = Number(id);

  const cargar = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(publicacionId) || publicacionId <= 0) {
      setError('La publicación no es válida.');
      setCargando(false);
      return;
    }

    try {
      setError(null);
      setPublicacion(await obtenerPublicacion(publicacionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar la publicación.');
    } finally {
      setCargando(false);
    }
  }, [publicacionId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

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
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/adoptar');
  }, [router]);

  if (cargando) {
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
  const vacunas = publicacion.vacunas?.trim();

  // Renglón de la tarjeta del formulario: quién publica y desde dónde, lo que ya se ve
  // arriba de la ficha.
  const procedencia =
    [publicacion.refugio?.nombre, publicacion.ubicacion].filter(Boolean).join(' · ') || null;

  return (
    <View className="flex-1 bg-pethood-beige">
      {/* Se suma el inset inferior para que el último bloque no quede debajo de la barra
          del sistema cuando esta se muestra. Con el CTA fijo abajo, el hueco además tiene
          que dejar pasar el alto del pie. */}
      <ScrollView contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        <GaleriaFotos imagenes={publicacion.imagenes} />

        {/* Los controles flotan sobre la galería, como en el diseño. El SafeAreaView los
            baja lo justo para no quedar bajo la barra de estado. */}
        <SafeAreaView className="absolute left-0 right-0 top-0" edges={['top']}>
          <View className="flex-row items-center justify-between px-3 pt-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={volver}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-70"
            >
              <Ionicons name="arrow-back" size={20} color={PALETA.grisCalido[900]} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                publicacion.enFavoritos ? 'Quitar de favoritos' : 'Guardar en favoritos'
              }
              onPress={alternarFavorito}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-70"
            >
              <Ionicons
                name={publicacion.enFavoritos ? 'heart' : 'heart-outline'}
                size={20}
                color={PALETA.pethood.naranja}
              />
            </Pressable>
          </View>
        </SafeAreaView>

        <View className="px-4 pt-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {mascota.nombre ?? 'Sin nombre'}
              </Text>
              <Text className="mt-1 text-sm text-gray-500">{resumenMascota(mascota)}</Text>
            </View>

            <View className="mt-1">
              <EstadoMascotaBadge estado={mascota.estado.nombre} />
            </View>
          </View>

          {publicacion.refugio ? (
            <View className="mt-3 flex-row items-center gap-1.5">
              <Ionicons name="business-outline" size={14} color={PALETA.grisCalido[500]} />
              <Text className="flex-1 text-[13px] text-gray-500">
                {publicacion.refugio.nombre}
                {publicacion.ubicacion ? ` · ${publicacion.ubicacion}` : ''}
              </Text>
            </View>
          ) : publicacion.ubicacion ? (
            <View className="mt-3 flex-row items-center gap-1.5">
              <Ionicons name="location-outline" size={14} color={PALETA.grisCalido[500]} />
              <Text className="flex-1 text-[13px] text-gray-500">{publicacion.ubicacion}</Text>
            </View>
          ) : null}

          {publicacion.personalidad.length > 0 ? (
            <View className="mt-3.5 flex-row flex-wrap gap-2">
              {publicacion.personalidad.map((rasgo) => (
                <Chip key={rasgo} etiqueta={rasgo} />
              ))}
            </View>
          ) : null}

          <SeccionTitulada className="mt-5" titulo="Características">
            <View className="gap-2.5">
              <View className="flex-row gap-2.5">
                <Dato etiqueta="Especie" valor={mascota.especie.nombre} />
                <Dato etiqueta="Raza" valor={mascota.raza.nombre} />
              </View>
              <View className="flex-row gap-2.5">
                <Dato
                  etiqueta="Peso"
                  valor={mascota.peso === null ? 'Sin dato' : `${mascota.peso} kg`}
                />
                <Dato etiqueta="Castrado" valor={mascota.castrado ? 'Sí' : 'No'} />
              </View>
            </View>
          </SeccionTitulada>

          {publicacion.descripcion ? (
            <SeccionTitulada className="mt-5" titulo={`Sobre ${mascota.nombre ?? 'la mascota'}`}>
              <Text className="text-[15px] leading-6 text-gray-700">{publicacion.descripcion}</Text>
            </SeccionTitulada>
          ) : null}

          <SeccionTitulada className="mt-5" titulo="Salud">
            <View className="rounded-2xl bg-emerald-50 p-3.5">
              {vacunas ? (
                <Vinieta texto={`Vacunas: ${vacunas}`} icono="checkmark-circle" />
              ) : (
                <Vinieta texto="No se informaron vacunas" icono="ellipse" />
              )}
              <Vinieta
                texto={publicacion.desparasitado ? 'Desparasitado' : 'Sin desparasitar'}
                icono={publicacion.desparasitado ? 'checkmark-circle' : 'ellipse'}
              />
            </View>
          </SeccionTitulada>

          {publicacion.requisitos.length > 0 ? (
            <SeccionTitulada className="mt-5" titulo="Requisitos para adoptar">
              <View className="rounded-2xl bg-white p-3.5">
                {publicacion.requisitos.map((requisito) => (
                  <Vinieta key={requisito} texto={requisito} icono="ellipse" />
                ))}
              </View>
            </SeccionTitulada>
          ) : null}
        </View>
      </ScrollView>

      {/* Pie fijo: el CTA no se scrollea, así está siempre a un toque. */}
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
            subtitulo: procedencia,
            destinatario: publicacion.refugio?.nombre ?? null,
          }}
        />
      </View>
    </View>
  );
}
