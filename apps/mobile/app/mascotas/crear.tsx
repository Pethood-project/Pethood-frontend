/**
 * GUI-16 Crear Mascota Adoptante / GUI-30 Crear Mascota Refugio.
 *
 * Una sola pantalla para los dos actores: comparten los campos base y difieren en uno.
 * El adoptante elige si la mascota es propia o para adopción; el refugio elige el estado
 * con el que la mascota entra al sistema.
 *
 * La validación de acá es solo para UX: la fuente de verdad es el backend.
 */
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { ChipGroupField } from '@/components/ui/ChipGroupField';
import { DateField } from '@/components/ui/DateField';
import { FormCard, FormCardColumns, FormCardRow } from '@/components/ui/FormCard';
import { PhotoPicker, type FotoElegida } from '@/components/ui/PhotoPicker';
import { SegmentedField } from '@/components/ui/SegmentedField';
import { SelectField, type OpcionSelect } from '@/components/ui/SelectField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { ToggleField } from '@/components/ui/ToggleField';
import { estiloDeEstado } from '@/constants/EstadosMascota';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import {
  listarEspecies,
  listarEstadosMascota,
  listarRazas,
  type EstadoMascota,
  type OpcionCatalogo,
} from '@/services/catalogos';
import { crearMascota, type Destino, type Genero, type Tamanio } from '@/services/mascotas';
import { aFechaISO, validarFechaPasada } from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';
import { filtrarEntradaDecimal, validarDecimal } from '@/shared/validation/numbers';
import { validarTexto } from '@/shared/validation/text';

const OPCIONES_GENERO: OpcionSelect<Genero>[] = [
  { valor: 'MACHO', etiqueta: 'Macho' },
  { valor: 'HEMBRA', etiqueta: 'Hembra' },
];

const OPCIONES_TAMANIO: OpcionSelect<Tamanio>[] = [
  { valor: 'PEQUENO', etiqueta: 'Pequeño' },
  { valor: 'MEDIANO', etiqueta: 'Mediano' },
  { valor: 'GRANDE', etiqueta: 'Grande' },
];

const OPCIONES_DESTINO = [
  { valor: 'ADOPCION' as Destino, etiqueta: 'Para adopción' },
  { valor: 'PROPIA' as Destino, etiqueta: 'Es mía' },
];

interface ErroresFormulario {
  foto?: string;
  nombre?: string;
  fechaNacimiento?: string;
  genero?: string;
  peso?: string;
  tamanio?: string;
  especieId?: string;
  razaId?: string;
  descripcion?: string;
  destino?: string;
  estadoMascotaId?: string;
}

/** Nombre visible de cada campo, para poder decir qué falta al tocar el botón. */
const ETIQUETAS: Record<keyof ErroresFormulario, string> = {
  foto: 'la foto',
  nombre: 'el nombre',
  fechaNacimiento: 'la fecha de nacimiento',
  genero: 'el sexo',
  peso: 'el peso',
  tamanio: 'el tamaño',
  especieId: 'la especie',
  razaId: 'la raza',
  descripcion: 'la descripción',
  destino: 'si es para adopción',
  estadoMascotaId: 'el estado',
};

export default function CrearMascotaScreen() {
  const router = useRouter();
  const toast = useToast();
  const { esRefugio } = useSesion();

  const [foto, setFoto] = useState<FotoElegida | null>(null);
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [genero, setGenero] = useState<Genero | null>(null);
  const [peso, setPeso] = useState('');
  const [tamanio, setTamanio] = useState<Tamanio | null>(null);
  const [especieId, setEspecieId] = useState<number | null>(null);
  const [razaId, setRazaId] = useState<number | null>(null);
  const [castrado, setCastrado] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [destino, setDestino] = useState<Destino | null>(null);
  const [estadoMascotaId, setEstadoMascotaId] = useState<number | null>(null);

  const [especies, setEspecies] = useState<OpcionCatalogo[]>([]);
  const [razas, setRazas] = useState<OpcionCatalogo[]>([]);
  const [estados, setEstados] = useState<EstadoMascota[]>([]);

  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [cargandoRazas, setCargandoRazas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  /** Revela todos los errores de golpe al intentar guardar. */
  const [mostrarErrores, setMostrarErrores] = useState(false);
  /** Campos de los que el usuario ya salió: sus errores se muestran sin haber guardado. */
  const [tocados, setTocados] = useState<Partial<Record<keyof ErroresFormulario, boolean>>>({});

  useEffect(() => {
    const cargar = async (): Promise<void> => {
      try {
        const [especiesCargadas, estadosCargados] = await Promise.all([
          listarEspecies(),
          esRefugio ? listarEstadosMascota() : Promise.resolve([]),
        ]);

        setEspecies(especiesCargadas);
        setEstados(estadosCargados.filter((estado) => estado.seleccionableEnAlta));
      } catch {
        toast.mostrarError('No pudimos cargar las especies. Revisá tu conexión.');
      } finally {
        setCargandoCatalogos(false);
      }
    };

    void cargar();
  }, [esRefugio, toast]);

  // La raza depende de la especie: al cambiarla se recarga el listado.
  useEffect(() => {
    if (especieId === null) {
      setRazas([]);
      return;
    }

    const cargar = async (): Promise<void> => {
      setCargandoRazas(true);
      try {
        setRazas(await listarRazas(especieId));
      } catch {
        toast.mostrarError('No pudimos cargar las razas de esa especie.');
      } finally {
        setCargandoRazas(false);
      }
    };

    void cargar();
  }, [especieId, toast]);

  const errores = useMemo<ErroresFormulario>(() => {
    const resultado: ErroresFormulario = {};

    if (!foto) resultado.foto = 'Debe agregar al menos una foto de la mascota';

    const errorNombre = validarTexto(nombre, {
      ...LIMITES.mascota.nombre,
      etiqueta: 'El nombre',
    });
    if (errorNombre) resultado.nombre = errorNombre;

    const errorFecha = validarFechaPasada(fechaNacimiento, 'La fecha de nacimiento');
    if (errorFecha) resultado.fechaNacimiento = errorFecha;

    if (!genero) resultado.genero = 'El sexo es obligatorio';

    const errorPeso = validarDecimal(peso, { ...LIMITES.mascota.peso, etiqueta: 'El peso' });
    if (errorPeso) resultado.peso = errorPeso;

    if (!tamanio) resultado.tamanio = 'El tamaño es obligatorio';
    if (especieId === null) resultado.especieId = 'La especie es obligatoria';
    if (razaId === null) resultado.razaId = 'La raza es obligatoria';

    const errorDescripcion = validarTexto(descripcion, {
      max: LIMITES.mascota.descripcion.max,
      etiqueta: 'La descripción',
      obligatorio: false,
    });
    if (errorDescripcion) resultado.descripcion = errorDescripcion;

    if (esRefugio) {
      if (estadoMascotaId === null) resultado.estadoMascotaId = 'El estado es obligatorio';
    } else if (!destino) {
      resultado.destino = 'Indicá si es tu mascota o si es para adopción';
    }

    return resultado;
  }, [
    foto,
    nombre,
    fechaNacimiento,
    genero,
    peso,
    tamanio,
    especieId,
    razaId,
    descripcion,
    esRefugio,
    estadoMascotaId,
    destino,
  ]);

  const formularioValido = Object.keys(errores).length === 0;

  /**
   * Un error se muestra cuando el campo ya fue tocado o cuando se intentó guardar, para
   * que el formulario no aparezca todo en rojo apenas se abre.
   */
  const errorDe = (campo: keyof ErroresFormulario): string | undefined =>
    mostrarErrores || tocados[campo] ? errores[campo] : undefined;

  const marcarTocado = (campo: keyof ErroresFormulario): void =>
    setTocados((previos) => ({ ...previos, [campo]: true }));

  /** El refugio lo decide por el estado; el adoptante, por el destino elegido. */
  const permitePublicar = esRefugio
    ? (estados.find((estado) => estado.id === estadoMascotaId)?.habilitaPublicacion ?? false)
    : destino === 'ADOPCION';

  /** Al tocar un botón deshabilitado: revelar todos los errores y nombrar qué falta. */
  const explicarQueFalta = (): void => {
    setMostrarErrores(true);

    const faltantes = (Object.keys(errores) as (keyof ErroresFormulario)[]).map(
      (campo) => ETIQUETAS[campo],
    );

    if (faltantes.length === 0) {
      toast.mostrarAdvertencia(
        esRefugio
          ? 'Con el estado "En tratamiento" todavía no se puede publicar en adopción.'
          : 'Elegí "Para adopción" si querés publicarla.',
      );
      return;
    }

    const lista =
      faltantes.length === 1
        ? faltantes[0]
        : `${faltantes.slice(0, -1).join(', ')} y ${faltantes[faltantes.length - 1]}`;

    toast.mostrarAdvertencia(`Todavía falta completar ${lista}.`);
  };

  const guardar = async (continuarAPublicacion: boolean): Promise<void> => {
    setMostrarErrores(true);
    if (!formularioValido || !foto || !fechaNacimiento) return;

    setGuardando(true);
    try {
      const mascota = await crearMascota({
        nombre: nombre.trim(),
        fechaNacimiento: aFechaISO(fechaNacimiento),
        genero: genero!,
        peso,
        tamanio: tamanio!,
        especieId: especieId!,
        razaId: razaId!,
        castrado,
        descripcion: descripcion.trim(),
        destino: esRefugio ? undefined : destino!,
        estadoMascotaId: esRefugio ? estadoMascotaId! : undefined,
        foto,
      });

      toast.mostrarExito(`¡Listo! ${mascota.nombre} ya está en tus mascotas.`);

      if (continuarAPublicacion && mascota.habilitaPublicacion) {
        router.replace({ pathname: '/publicaciones/crear', params: { mascotaId: mascota.id } });
      } else {
        router.replace('/(tabs)/mis-mascotas' as Href);
      }
    } catch (err) {
      // Se queda en la pantalla con todo lo cargado, para poder reintentar.
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos crear la mascota. Intentalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-80"
          >
            <Ionicons name="chevron-back" size={20} color={PALETA.gris[600]} />
          </Pressable>

          <Text className="text-2xl font-bold text-pethood-orange">Nueva Mascota</Text>
        </View>

        {cargandoCatalogos ? (
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
              <PhotoPicker foto={foto} onChange={setFoto} error={errorDe('foto')} />

              <FormCard>
                <FormCardRow>
                  <TextField
                    label="Nombre"
                    obligatorio
                    placeholder="Nombre de la mascota"
                    value={nombre}
                    onChangeText={setNombre}
                    onBlur={() => marcarTocado('nombre')}
                    maxLength={LIMITES.mascota.nombre.max}
                    error={errorDe('nombre')}
                  />
                </FormCardRow>

                <FormCardRow>
                  <FormCardColumns>
                    <SelectField
                      label="Especie"
                      obligatorio
                      placeholder="Elegí"
                      opciones={especies.map((especie) => ({
                        valor: especie.id,
                        etiqueta: especie.nombre,
                      }))}
                      valor={especieId}
                      onChange={(nuevaEspecie) => {
                        setEspecieId(nuevaEspecie);
                        setRazaId(null);
                      }}
                      onBlur={() => marcarTocado('especieId')}
                      error={errorDe('especieId')}
                    />

                    <SelectField
                      label="Sexo"
                      obligatorio
                      placeholder="Elegí"
                      opciones={OPCIONES_GENERO}
                      valor={genero}
                      onChange={setGenero}
                      onBlur={() => marcarTocado('genero')}
                      error={errorDe('genero')}
                    />
                  </FormCardColumns>
                </FormCardRow>

                <FormCardRow>
                  <FormCardColumns>
                    <SelectField
                      label="Raza"
                      obligatorio
                      placeholder={cargandoRazas ? 'Cargando…' : 'Elegí'}
                      opciones={razas.map((raza) => ({ valor: raza.id, etiqueta: raza.nombre }))}
                      valor={razaId}
                      onChange={setRazaId}
                      onBlur={() => marcarTocado('razaId')}
                      deshabilitado={especieId === null || cargandoRazas}
                      textoDeshabilitado="Elegí la especie"
                      error={errorDe('razaId')}
                    />

                    <DateField
                      label="Nacimiento"
                      obligatorio
                      placeholder="Elegí la fecha"
                      valor={fechaNacimiento}
                      onChange={setFechaNacimiento}
                      onBlur={() => marcarTocado('fechaNacimiento')}
                      error={errorDe('fechaNacimiento')}
                    />
                  </FormCardColumns>
                </FormCardRow>

                <FormCardRow>
                  <FormCardColumns>
                    <SelectField
                      label="Tamaño"
                      obligatorio
                      placeholder="Elegí"
                      opciones={OPCIONES_TAMANIO}
                      valor={tamanio}
                      onChange={setTamanio}
                      onBlur={() => marcarTocado('tamanio')}
                      error={errorDe('tamanio')}
                    />

                    <TextField
                      label="Peso (kg)"
                      obligatorio
                      placeholder="Ej. 12,5"
                      keyboardType="decimal-pad"
                      value={peso}
                      onChangeText={(texto) =>
                        setPeso(filtrarEntradaDecimal(texto, LIMITES.mascota.peso.decimales))
                      }
                      onBlur={() => marcarTocado('peso')}
                      error={errorDe('peso')}
                    />
                  </FormCardColumns>
                </FormCardRow>

                <FormCardRow>
                  <ToggleField
                    label="Castrado / Esterilizado"
                    valor={castrado}
                    onChange={setCastrado}
                  />
                </FormCardRow>

                {esRefugio ? (
                  <FormCardRow>
                    <ChipGroupField
                      label="Estado"
                      obligatorio
                      opciones={estados.map((estado) => ({
                        valor: estado.id,
                        etiqueta: estiloDeEstado(estado.nombre).etiqueta,
                      }))}
                      valor={estadoMascotaId}
                      onChange={(nuevo) => {
                        setEstadoMascotaId(nuevo);
                        marcarTocado('estadoMascotaId');
                      }}
                      error={errorDe('estadoMascotaId')}
                    />
                  </FormCardRow>
                ) : (
                  <FormCardRow>
                    <SegmentedField
                      label="¿Para adopción o es propia?"
                      obligatorio
                      opciones={OPCIONES_DESTINO}
                      valor={destino}
                      onChange={(nuevo) => {
                        setDestino(nuevo);
                        marcarTocado('destino');
                      }}
                      error={errorDe('destino')}
                    />
                  </FormCardRow>
                )}

                <FormCardRow ultima>
                  <TextAreaField
                    label="Descripción"
                    placeholder="Contanos sobre su personalidad…"
                    value={descripcion}
                    onChangeText={setDescripcion}
                    onBlur={() => marcarTocado('descripcion')}
                    maximo={LIMITES.mascota.descripcion.max}
                    error={errorDe('descripcion')}
                  />
                </FormCardRow>
              </FormCard>

              <View className="mt-5 gap-3">
                <CustomButton
                  title="Crear mascota"
                  loading={guardando}
                  disabled={!formularioValido}
                  onPress={() => void guardar(false)}
                  onPressDeshabilitado={explicarQueFalta}
                />

                <CustomButton
                  title="Crear publicación"
                  variant="secondary"
                  disabled={!formularioValido || !permitePublicar || guardando}
                  onPress={() => void guardar(true)}
                  onPressDeshabilitado={explicarQueFalta}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}
