/**
 * GUI-24 Nueva publicación de adopción.
 *
 * Se puede llegar con una mascota ya elegida desde el alta, o entrar directo y elegirla
 * acá. La validación es para UX; la fuente de verdad es el backend.
 */
import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { EstadoCargando } from '@/components/feedback/EstadosPantalla';
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
import { PALETA } from '@/constants/theme';
import { crearPublicacion, listarMisMascotas, type Mascota } from '@/services/mascotas';
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
  const params = useLocalSearchParams<{ mascotaId?: string }>();

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
  const [publicando, setPublicando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [tocados, setTocados] = useState<Partial<Record<keyof ErroresFormulario, boolean>>>({});

  useEffect(() => {
    const cargar = async (): Promise<void> => {
      try {
        const mias = await listarMisMascotas();
        setPublicables(mias.filter((mascota) => mascota.habilitaPublicacion));
      } catch {
        toast.mostrarError('No pudimos cargar tus mascotas. Revisá tu conexión.');
      } finally {
        setCargandoMascotas(false);
      }
    };

    void cargar();
  }, [toast]);

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
      router.replace('/(tabs)/mis-mascotas' as Href);
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
            // elegida). Si se entra suelto y no hay historial, cae a "Mis mascotas".
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/(tabs)/mis-mascotas' as Href)
            }
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
                    placeholder={
                      publicables.length === 0 ? 'No tenés mascotas publicables' : 'Elegí una'
                    }
                    opciones={publicables.map((mascota) => ({
                      valor: mascota.id,
                      etiqueta: `${mascota.nombre} (${mascota.especie.nombre} · ${estiloDeEstado(mascota.estado.nombre).etiqueta})`,
                    }))}
                    valor={mascotaId}
                    onChange={setMascotaId}
                    onBlur={() => marcarTocado('mascotaId')}
                    deshabilitado={publicables.length === 0}
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
