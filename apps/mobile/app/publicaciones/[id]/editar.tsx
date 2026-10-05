/**
 * Editar publicación.
 *
 * No hay HU ni pantalla propia en el diseño: reusa los campos del alta (GUI-24) a través de
 * `CamposPublicacion`, así cada campo sigue exactamente las mismas reglas. La mascota no se
 * cambia: se muestra fija en el lugar del selector.
 *
 * Se entra desde la ficha propia (`publicaciones/[id]`), que solo ofrece el botón a quien la
 * puede gestionar (`puedeEditar`) y mientras no esté finalizada. Igual se vuelve a chequear
 * acá, por si se llega con un link viejo; el backend es la fuente de verdad.
 *
 * El formulario manda la publicación entera, como el alta: las fotos que ya estaban viajan
 * por su ruta y las nuevas como archivo, en el orden de la galería.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import {
  CamposPublicacion,
  ETIQUETAS_CAMPOS,
  VALORES_INICIALES,
  validarCamposPublicacion,
  type CampoValidado,
  type ValoresPublicacion,
} from '@/components/publicaciones/CamposPublicacion';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import type { FotoElegida } from '@/components/ui/PhotosPickerField';
import { TextField } from '@/components/ui/TextField';
import { PALETA } from '@/constants/theme';
import { pedirUbicacion } from '@/lib/ubicacion';
import { urlAbsoluta } from '@/services/api';
import {
  ESTADO_PUBLICACION,
  editarPublicacion,
  obtenerPublicacion,
  type PublicacionFeed,
} from '@/services/publicaciones';

/** Las fotos que ya tiene la publicación, en su orden, como las entiende el selector. */
function fotosExistentes(imagenes: string[]): FotoElegida[] {
  return imagenes.map((ruta) => ({
    uri: urlAbsoluta(ruta) ?? ruta,
    nombre: ruta.split('/').pop() ?? 'foto.jpg',
    tipo: 'image/jpeg',
    remota: ruta,
  }));
}

function valoresDe(publicacion: PublicacionFeed): ValoresPublicacion {
  return {
    fotos: fotosExistentes(publicacion.imagenes),
    descripcion: publicacion.descripcion ?? '',
    desparasitado: publicacion.desparasitado,
    personalidad: publicacion.personalidad,
    requisitos: publicacion.requisitos,
    ubicacion: publicacion.ubicacion ?? '',
  };
}

export default function EditarPublicacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const publicacionId = Number(Array.isArray(id) ? id[0] : id);

  const [publicacion, setPublicacion] = useState<PublicacionFeed | null>(null);
  const [valores, setValores] = useState<ValoresPublicacion>(VALORES_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [tocados, setTocados] = useState<Partial<Record<CampoValidado, boolean>>>({});

  const cargar = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(publicacionId) || publicacionId <= 0) {
      setError('La publicación no es válida.');
      setCargando(false);
      return;
    }

    try {
      setError(null);
      const cargada = await obtenerPublicacion(publicacionId);

      if (!cargada.puedeEditar) {
        setError('No podés editar esta publicación.');
      } else if (cargada.estado.nombre === ESTADO_PUBLICACION.FINALIZADA) {
        setError('La publicación está finalizada y ya no se puede editar.');
      } else {
        setPublicacion(cargada);
        setValores(valoresDe(cargada));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar la publicación.');
    } finally {
      setCargando(false);
    }
  }, [publicacionId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const salir = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({ pathname: '/publicaciones/[id]', params: { id: publicacionId } });
  };

  const errores = useMemo(() => validarCamposPublicacion(valores), [valores]);
  const formularioValido = Object.keys(errores).length === 0;

  const errorDe = (campo: CampoValidado): string | undefined =>
    mostrarErrores || tocados[campo] ? errores[campo] : undefined;

  const marcarTocado = (campo: CampoValidado): void =>
    setTocados((previos) => ({ ...previos, [campo]: true }));

  const explicarQueFalta = (): void => {
    setMostrarErrores(true);

    const faltantes = (Object.keys(errores) as CampoValidado[]).map(
      (campo) => ETIQUETAS_CAMPOS[campo],
    );
    if (faltantes.length === 0) return;

    toast.mostrarAdvertencia(`Todavía falta completar ${faltantes.join(' y ')}.`);
  };

  const guardar = async (): Promise<void> => {
    setMostrarErrores(true);
    if (!formularioValido || !publicacion) return;

    setGuardando(true);
    try {
      // Coordenadas best-effort, igual que al publicar (Módulo 11).
      const ubicacion = await pedirUbicacion();

      await editarPublicacion(publicacion.id, {
        descripcion: valores.descripcion.trim(),
        ubicacion: valores.ubicacion.trim(),
        ...(ubicacion.ok
          ? { latitud: ubicacion.coordenadas.latitud, longitud: ubicacion.coordenadas.longitud }
          : {}),
        requisitos: valores.requisitos,
        personalidad: valores.personalidad,
        desparasitado: valores.desparasitado,
        fotos: valores.fotos,
      });

      toast.mostrarExito('¡Listo! Guardamos los cambios de la publicación.');
      salir();
    } catch (err) {
      // Se queda en la pantalla con todo lo cargado, para poder reintentar.
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos guardar los cambios. Intentalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const { mascota } = publicacion ?? {};

  return (
    <Animated.View entering={FadeInDown.duration(220)} className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 border-b border-organic-neutral-300 bg-organic-neutral-100 px-5 py-[13px]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={salir}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full border border-organic-neutral-300 bg-organic-neutral-100 active:opacity-80"
          >
            <Ionicons name="chevron-back" size={22} color={PALETA.neutral[700]} />
          </Pressable>

          <Text className="font-titulo text-[24px] leading-[29px] text-organic-accent-600">
            Editar publicación
          </Text>
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : error || !publicacion || !mascota ? (
          <EstadoError
            mensaje={error ?? 'No encontramos la publicación.'}
            onAccion={salir}
            etiquetaAccion="Volver"
          />
        ) : (
          <FormularioConTeclado
              className="flex-1"
              contentContainerClassName="px-4 pb-10"
              showsVerticalScrollIndicator={false}
            >
              <CamposPublicacion
                valores={valores}
                onChange={(cambios) => setValores((previos) => ({ ...previos, ...cambios }))}
                generoMascota={mascota.genero}
                errorDe={errorDe}
                onBlur={marcarTocado}
                filaMascota={
                  // La mascota se elige al publicar y no se cambia: se muestra fija.
                  <TextField
                    label="Mascota"
                    value={`${mascota.nombre ?? 'Sin nombre'} (${mascota.especie.nombre})`}
                    editable={false}
                    ayuda="La mascota de una publicación no se puede cambiar."
                    grande
                  />
                }
              />

              <View className="mt-5">
                <CustomButton
                  title="Guardar cambios"
                  variant="acento"
                  loading={guardando}
                  disabled={!formularioValido}
                  onPress={() => void guardar()}
                  onPressDeshabilitado={explicarQueFalta}
                />
              </View>
          </FormularioConTeclado>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
