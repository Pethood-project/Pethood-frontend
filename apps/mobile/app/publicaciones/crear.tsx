/**
 * GUI-24 Nueva publicación de adopción.
 *
 * Se puede llegar con una mascota ya elegida desde el alta, o entrar directo (desde "Mis
 * publicaciones") y elegirla acá. El selector ofrece las mascotas del perfil activo que
 * todavía no tienen publicación (`GET /mascotas/publicables`) y, primera, la opción "Crear
 * mascota nueva". Esa opción (y el botón del estado vacío, si no hay ninguna publicable) abre
 * el alta de mascota ENCIMA de este formulario, así no se pierde lo que ya se escribió; al
 * crearla vuelve acá con ella ya elegida (ver `lib/mascotaParaPublicar.ts`).
 *
 * `origen=publicaciones` indica que el flujo arrancó en "Mis publicaciones": al publicar se
 * vuelve ahí y no a "Mis mascotas". Pasar por el alta de mascota no lo pierde: esa pantalla
 * se abre encima y vuelve a esta.
 *
 * La validación es para UX; la fuente de verdad es el backend.
 */
import { Ionicons } from '@expo/vector-icons';
import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { ChipMultiField } from '@/components/ui/ChipMultiField';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { PhotosPickerField, type FotoElegida } from '@/components/ui/PhotosPickerField';
import { SelectField } from '@/components/ui/SelectField';
import { TagInputField } from '@/components/ui/TagInputField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { ToggleField } from '@/components/ui/ToggleField';
import { estiloDeEstado } from '@/constants/EstadosMascota';
import { tomarMascotaParaPublicar } from '@/lib/mascotaParaPublicar';
import { PALETA } from '@/constants/theme';
import { crearPublicacion, listarPublicables, type Mascota } from '@/services/mascotas';
import { textoSegunGenero } from '@/shared/genero';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';

/**
 * Rasgos de prueba hasta que exista un catálogo propio. Cuando se defina, salen de la API
 * como el resto de los catálogos.
 *
 * "Bueno con chicos" y "Bueno con otras mascotas" no son rasgos cualquiera: son los dos
 * que resuelven los toggles de "Compatible con" del filtro de Adoptar. El backend los
 * matchea por texto exacto (`publicaciones.dto.ts`), así que cambiar la redacción de
 * cualquiera de los dos rompe el filtro en silencio.
 */
const RASGOS_DE_PERSONALIDAD = [
  'Juguetón',
  'Cariñoso',
  'Tranquilo',
  'Activo',
  'Protector',
  'Sociable',
  'Independiente',
  'Bueno con chicos',
  'Bueno con otras mascotas',
];

/**
 * Forma femenina de cada rasgo, solo para mostrar (ver `ChipMultiField.etiquetaDe`). Los dos
 * de compatibilidad se traducen igual que el resto: lo que cambia es la etiqueta, nunca el
 * texto que viaja al backend.
 */
const RASGO_FEMENINO: Partial<Record<string, string>> = {
  Juguetón: 'Juguetona',
  Cariñoso: 'Cariñosa',
  Tranquilo: 'Tranquila',
  Activo: 'Activa',
  Protector: 'Protectora',
  'Bueno con chicos': 'Buena con chicos',
  'Bueno con otras mascotas': 'Buena con otras mascotas',
};

/**
 * Valor de la opción "Crear mascota nueva" del selector. No es un id: los ids son positivos,
 * así que nunca choca con una mascota real, y nunca queda elegido (abre el alta).
 */
const CREAR_MASCOTA = -1;

interface ErroresFormulario {
  mascotaId?: string;
  descripcion?: string;
  ubicacion?: string;
}

const ETIQUETAS: Record<keyof ErroresFormulario, string> = {
  mascotaId: 'la mascota',
  descripcion: 'la descripción',
  ubicacion: 'la ubicación',
};

export default function CrearPublicacionScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ mascotaId?: string; origen?: string }>();
  const desdeMisPublicaciones = params.origen === 'publicaciones';

  const [mascotaId, setMascotaId] = useState<number | null>(
    params.mascotaId ? Number(params.mascotaId) : null,
  );
  const [fotos, setFotos] = useState<FotoElegida[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [desparasitado, setDesparasitado] = useState(false);
  const [vacunas, setVacunas] = useState('');
  const [personalidad, setPersonalidad] = useState<string[]>([]);
  const [requisitos, setRequisitos] = useState<string[]>([]);
  const [ubicacion, setUbicacion] = useState('');

  const [publicables, setPublicables] = useState<Mascota[]>([]);
  const [cargandoMascotas, setCargandoMascotas] = useState(true);
  const [errorMascotas, setErrorMascotas] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [tocados, setTocados] = useState<Partial<Record<keyof ErroresFormulario, boolean>>>({});

  /** `elegir`: la mascota que hay que dejar elegida (la que se acaba de crear). */
  const cargarPublicables = useCallback(async (elegir?: number): Promise<void> => {
    try {
      setErrorMascotas(null);
      const disponibles = await listarPublicables();
      setPublicables(disponibles);
      // Si la que había que elegir (o la que ya estaba elegida) no se puede publicar —por
      // ejemplo, ya tiene publicación—, se suelta: el selector no puede mostrar un valor que
      // no está entre sus opciones.
      setMascotaId((elegida) => {
        const buscada = elegir ?? elegida;
        return buscada !== null && disponibles.some((mascota) => mascota.id === buscada)
          ? buscada
          : null;
      });
    } catch (err) {
      setErrorMascotas(
        err instanceof Error ? err.message : 'No pudimos cargar tus mascotas. Revisá tu conexión.',
      );
    } finally {
      setCargandoMascotas(false);
    }
  }, []);

  useEffect(() => {
    void cargarPublicables();
  }, [cargarPublicables]);

  // Al volver del alta de mascota: si se creó una, se recarga la lista y queda elegida. Si
  // se volvió sin crear nada, no hay aviso y el formulario sigue como estaba.
  useFocusEffect(
    useCallback(() => {
      const nueva = tomarMascotaParaPublicar();
      if (nueva === null) return;

      setMascotaId(nueva);
      void cargarPublicables(nueva);
    }, [cargarPublicables]),
  );

  /**
   * Abre el alta de mascota en modo "para publicar". `push` y no `replace`: esta pantalla se
   * queda debajo con lo ya escrito, y el alta vuelve acá al terminar.
   */
  const irACargarMascota = (): void => {
    router.push({ pathname: '/mascotas/crear', params: { paraPublicar: '1' } });
  };

  const salir = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace((desdeMisPublicaciones ? '/publicaciones' : '/(tabs)/mis-mascotas') as Href);
  };

  const errores = useMemo<ErroresFormulario>(() => {
    const resultado: ErroresFormulario = {};

    if (mascotaId === null) resultado.mascotaId = 'Elegí la mascota que querés publicar';

    const errorDescripcion = validarTexto(descripcion, {
      min: 1,
      max: LIMITES.publicacion.descripcion.max,
      etiqueta: 'La descripción',
    });
    if (errorDescripcion) resultado.descripcion = errorDescripcion;

    const errorUbicacion = validarTexto(ubicacion, {
      min: 1,
      max: LIMITES.publicacion.ubicacion.max,
      etiqueta: 'La ubicación',
    });
    if (errorUbicacion) resultado.ubicacion = errorUbicacion;

    return resultado;
  }, [mascotaId, descripcion, ubicacion]);

  const formularioValido = Object.keys(errores).length === 0;

  /** El género de la mascota elegida decide cómo concordar "Desparasitado" y los rasgos. */
  const generoMascota = publicables.find((mascota) => mascota.id === mascotaId)?.genero ?? null;

  const etiquetaDeRasgo = (rasgo: string): string =>
    textoSegunGenero(generoMascota, rasgo, RASGO_FEMENINO[rasgo] ?? rasgo);

  const errorDe = (campo: keyof ErroresFormulario): string | undefined =>
    mostrarErrores || tocados[campo] ? errores[campo] : undefined;

  const marcarTocado = (campo: keyof ErroresFormulario): void =>
    setTocados((previos) => ({ ...previos, [campo]: true }));

  const explicarQueFalta = (): void => {
    setMostrarErrores(true);

    const faltantes = (Object.keys(errores) as (keyof ErroresFormulario)[]).map(
      (campo) => ETIQUETAS[campo],
    );
    if (faltantes.length === 0) return;

    const lista =
      faltantes.length === 1
        ? faltantes[0]
        : `${faltantes.slice(0, -1).join(', ')} y ${faltantes[faltantes.length - 1]}`;

    toast.mostrarAdvertencia(`Todavía falta completar ${lista}.`);
  };

  const publicar = async (): Promise<void> => {
    setMostrarErrores(true);
    if (!formularioValido || mascotaId === null) return;

    setPublicando(true);
    try {
      await crearPublicacion({
        mascotaId,
        descripcion: descripcion.trim(),
        ubicacion: ubicacion.trim(),
        requisitos,
        personalidad,
        desparasitado,
        vacunas: vacunas.trim(),
        fotos,
      });

      toast.mostrarExito('¡Listo! Tu publicación ya está activa.');
      if (desdeMisPublicaciones) {
        // Vuelve a la grilla que abrió el flujo, salteando el alta de mascota si se pasó por
        // ella. La grilla se recarga al tomar foco y muestra la nueva primera.
        router.dismissTo('/publicaciones' as Href);
      } else {
        router.replace('/(tabs)/mis-mascotas' as Href);
      }
    } catch (err) {
      // Se queda en la pantalla con todo lo cargado, para poder reintentar.
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos publicar. Intentalo de nuevo.',
      );
    } finally {
      setPublicando(false);
    }
  };

  return (
    // Transición chica de entrada además de la del stack: refuerza que se navegó a otra
    // pantalla en vez de que "todo cambió de golpe".
    <Animated.View entering={FadeInDown.duration(220)} className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 border-b border-organic-neutral-300 bg-organic-neutral-100 px-5 py-[13px]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            // Vuelve al alta de la mascota cuando se llegó desde ahí (con la mascota ya
            // elegida). Si se entra suelto y no hay historial, cae al listado de origen.
            onPress={salir}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full border border-organic-neutral-300 bg-organic-neutral-100 active:opacity-80"
          >
            <Ionicons name="chevron-back" size={22} color={PALETA.neutral[700]} />
          </Pressable>

          <Text className="font-titulo text-[24px] leading-[29px] text-organic-accent-600">
            Poner en adopción
          </Text>
        </View>

        {cargandoMascotas ? (
          <EstadoCargando />
        ) : errorMascotas ? (
          <EstadoError
            mensaje={errorMascotas}
            onAccion={() => {
              setCargandoMascotas(true);
              void cargarPublicables();
            }}
          />
        ) : publicables.length === 0 ? (
          <EstadoVacio
            icono="paw-outline"
            titulo="Primero cargá la mascota"
            descripcion="Para publicar necesitás una mascota cargada que todavía no esté publicada y que esté disponible o en tránsito. Cargala y seguimos con la publicación."
          >
            <CustomButton title="Cargar mascota" variant="acento" onPress={irACargarMascota} />
          </EstadoVacio>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
          >
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 pb-10"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <PhotosPickerField
                fotos={fotos}
                onChange={setFotos}
                maximo={LIMITES.publicacion.imagenes.max}
              />

              <FormCard>
                <FormCardRow>
                  <SelectField
                    label="Seleccionar mascota"
                    obligatorio
                    placeholder="Elegí una"
                    opciones={[
                      // Primera, para quien viene a publicar una que todavía no cargó.
                      { valor: CREAR_MASCOTA, etiqueta: '＋ Crear mascota nueva' },
                      ...publicables.map((mascota) => ({
                        valor: mascota.id,
                        etiqueta: `${mascota.nombre} (${mascota.especie.nombre} · ${estiloDeEstado(mascota.estado.nombre).etiqueta})`,
                      })),
                    ]}
                    valor={mascotaId}
                    onChange={(valor) => {
                      if (valor === CREAR_MASCOTA) {
                        irACargarMascota();
                        return;
                      }
                      setMascotaId(valor);
                    }}
                    onBlur={() => marcarTocado('mascotaId')}
                    error={errorDe('mascotaId')}
                    grande
                  />
                </FormCardRow>

                <FormCardRow>
                  <TextAreaField
                    label="Descripción para el swipe"
                    obligatorio
                    placeholder="Contá qué lo hace especial"
                    value={descripcion}
                    onChangeText={setDescripcion}
                    onBlur={() => marcarTocado('descripcion')}
                    maximo={LIMITES.publicacion.descripcion.max}
                    error={errorDe('descripcion')}
                    grande
                  />
                </FormCardRow>

                <FormCardRow>
                  <ToggleField
                    label={textoSegunGenero(generoMascota, 'Desparasitado', 'Desparasitada')}
                    valor={desparasitado}
                    onChange={setDesparasitado}
                    grande
                  />
                </FormCardRow>

                <FormCardRow>
                  <TextField
                    label="Vacunas"
                    placeholder="Ej. Rabia, Parvovirus"
                    value={vacunas}
                    onChangeText={setVacunas}
                    maxLength={LIMITES.publicacion.vacunas.max}
                    grande
                  />
                </FormCardRow>

                <FormCardRow>
                  <ChipMultiField
                    label="Personalidad"
                    opciones={RASGOS_DE_PERSONALIDAD}
                    seleccionadas={personalidad}
                    onChange={setPersonalidad}
                    etiquetaDe={etiquetaDeRasgo}
                    grande
                  />
                </FormCardRow>

                <FormCardRow>
                  <TagInputField
                    label="Requisitos de adoptante"
                    placeholder="Ej. Casa con patio"
                    etiquetas={requisitos}
                    onChange={setRequisitos}
                    maximoPorEtiqueta={LIMITES.publicacion.requisito.max}
                    grande
                  />
                </FormCardRow>

                <FormCardRow ultima>
                  <TextField
                    label="Ubicación"
                    obligatorio
                    placeholder="Ej. Palermo, CABA"
                    value={ubicacion}
                    onChangeText={setUbicacion}
                    onBlur={() => marcarTocado('ubicacion')}
                    maxLength={LIMITES.publicacion.ubicacion.max}
                    error={errorDe('ubicacion')}
                    grande
                  />
                </FormCardRow>
              </FormCard>

              <View className="mt-5">
                <CustomButton
                  title="Publicar en adopción"
                  variant="acento"
                  loading={publicando}
                  disabled={!formularioValido}
                  onPress={() => void publicar()}
                  onPressDeshabilitado={explicarQueFalta}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
