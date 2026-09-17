/**
 * HU-6.2 Editar mascota.
 *
 * El diseño no tiene pantalla propia de edición, así que reusa el layout y los campos del
 * alta (GUI-16 / GUI-30) sin los campos que no se editan: el estado lo ignora el backend y
 * el destino solo existe en el alta.
 *
 * Edición parcial de verdad: en vez de marcar "campos tocados" se guarda la mascota
 * original y se compara contra ella al guardar. Si el usuario escribe algo y lo deshace,
 * no viaja ningún cambio.
 *
 * La validación de acá es solo para UX: la fuente de verdad es el backend.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { useSesion } from '@/hooks/useSesion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DateField } from '@/components/ui/DateField';
import { FormCard, FormCardColumns, FormCardRow } from '@/components/ui/FormCard';
import { PhotoPicker, type FotoElegida } from '@/components/ui/PhotoPicker';
import { SelectField, type OpcionSelect } from '@/components/ui/SelectField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { ToggleField } from '@/components/ui/ToggleField';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import { listarEspecies, listarRazas, type OpcionCatalogo } from '@/services/catalogos';
import {
  editarMascota,
  obtenerMiMascota,
  type CambiosMascota,
  type Genero,
  type Mascota,
  type Tamanio,
} from '@/services/mascotas';
import { aFechaISO, parsearFecha, validarFechaPasada } from '@/shared/validation/dates';
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

interface ErroresFormulario {
  nombre?: string;
  fechaNacimiento?: string;
  peso?: string;
  razaId?: string;
  descripcion?: string;
}

/** El peso viaja como texto con coma; en la mascota vuelve como número. */
function pesoAtexto(peso: number | null): string {
  return peso === null ? '' : String(peso).replace('.', ',');
}

function textoAPeso(texto: string): number | null {
  const numero = Number(texto.trim().replace(',', '.'));
  return texto.trim() && Number.isFinite(numero) ? numero : null;
}

export default function EditarMascotaScreen() {
  const router = useRouter();
  const toast = useToast();
  const { esRefugio } = useSesion();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mascotaId = Number(id);

  const [original, setOriginal] = useState<Mascota | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

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

  const [especies, setEspecies] = useState<OpcionCatalogo[]>([]);
  const [razas, setRazas] = useState<OpcionCatalogo[]>([]);
  const [cargandoRazas, setCargandoRazas] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [tocados, setTocados] = useState<Partial<Record<keyof ErroresFormulario, boolean>>>({});
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  // Precarga: no hay GET /mascotas/:id, así que la ficha sale del listado propio. Eso ya
  // garantiza que la mascota es del usuario logueado.
  useEffect(() => {
    const cargar = async (): Promise<void> => {
      if (!Number.isInteger(mascotaId) || mascotaId <= 0) {
        setErrorCarga('El id de la mascota no es válido');
        setCargando(false);
        return;
      }

      try {
        const [mascota, especiesCargadas] = await Promise.all([
          obtenerMiMascota(mascotaId, esRefugio ? 'REFUGIO' : 'PERSONAL'),
          listarEspecies(),
        ]);

        if (!mascota) {
          setErrorCarga('La mascota no existe o no es tuya');
          return;
        }

        setOriginal(mascota);
        setEspecies(especiesCargadas);

        setNombre(mascota.nombre ?? '');
        setFechaNacimiento(parsearFecha(mascota.fechaNacimiento));
        setGenero(mascota.genero);
        setPeso(pesoAtexto(mascota.peso));
        setTamanio(mascota.tamanio);
        setEspecieId(mascota.especie.id);
        setRazaId(mascota.raza.id);
        setCastrado(mascota.castrado);
        setDescripcion(mascota.descripcion ?? '');
      } catch (err) {
        setErrorCarga(err instanceof Error ? err.message : 'No pudimos cargar la mascota.');
      } finally {
        setCargando(false);
      }
    };

    void cargar();
  }, [mascotaId, esRefugio]);

  // La raza depende de la especie, igual que en el alta.
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

    const errorNombre = validarTexto(nombre, {
      ...LIMITES.mascota.nombre,
      etiqueta: 'El nombre',
    });
    if (errorNombre) resultado.nombre = errorNombre;

    const errorFecha = validarFechaPasada(fechaNacimiento, 'La fecha de nacimiento');
    if (errorFecha) resultado.fechaNacimiento = errorFecha;

    const errorPeso = validarDecimal(peso, { ...LIMITES.mascota.peso, etiqueta: 'El peso' });
    if (errorPeso) resultado.peso = errorPeso;

    // Cambiar la especie limpia la raza: sin este chequeo el cambio de especie se
    // descartaría en silencio, porque el par especie+raza solo viaja completo.
    if (razaId === null) resultado.razaId = 'La raza es obligatoria';

    const errorDescripcion = validarTexto(descripcion, {
      max: LIMITES.mascota.descripcion.max,
      etiqueta: 'La descripción',
      obligatorio: false,
    });
    if (errorDescripcion) resultado.descripcion = errorDescripcion;

    return resultado;
  }, [nombre, fechaNacimiento, peso, razaId, descripcion]);

  const formularioValido = Object.keys(errores).length === 0;

  /**
   * Diff honesto contra la mascota original: acá `castrado` entra solo si cambió, para que
   * el botón no se habilite sin motivo. Al enviar se agrega siempre — ver `guardar`.
   */
  const cambios = useMemo<CambiosMascota>(() => {
    if (!original) return {};

    const resultado: CambiosMascota = {};

    const nombreLimpio = nombre.trim();
    if (nombreLimpio !== (original.nombre ?? '')) resultado.nombre = nombreLimpio;

    const fechaISO = fechaNacimiento ? aFechaISO(fechaNacimiento) : null;
    if (fechaISO && fechaISO !== original.fechaNacimiento) resultado.fechaNacimiento = fechaISO;

    if (genero && genero !== original.genero) resultado.genero = genero;
    if (tamanio && tamanio !== original.tamanio) resultado.tamanio = tamanio;

    const pesoNumero = textoAPeso(peso);
    if (pesoNumero !== null && pesoNumero !== original.peso) resultado.peso = peso.trim();

    if (castrado !== original.castrado) resultado.castrado = castrado;

    // Vaciar la descripción es un cambio: viaja como '' para que el backend la borre.
    const descripcionLimpia = descripcion.trim();
    if (descripcionLimpia !== (original.descripcion ?? '')) {
      resultado.descripcion = descripcionLimpia;
    }

    // Especie y raza son inseparables para el backend: si cambió cualquiera, van las dos.
    if (
      especieId !== null &&
      razaId !== null &&
      (especieId !== original.especie.id || razaId !== original.raza.id)
    ) {
      resultado.especieId = especieId;
      resultado.razaId = razaId;
    }

    return resultado;
  }, [original, nombre, fechaNacimiento, genero, tamanio, peso, castrado, descripcion, especieId, razaId]);

  const hayCambios = Object.keys(cambios).length > 0 || foto !== null;

  const errorDe = (campo: keyof ErroresFormulario): string | undefined =>
    mostrarErrores || tocados[campo] ? errores[campo] : undefined;

  const marcarTocado = (campo: keyof ErroresFormulario): void =>
    setTocados((previos) => ({ ...previos, [campo]: true }));

  const volver = (): void => {
    // HU-1.4 fija el patrón: cancelar con cambios sin guardar pide confirmación.
    if (hayCambios) {
      setConfirmarSalida(true);
      return;
    }

    router.back();
  };

  const guardar = async (): Promise<void> => {
    setMostrarErrores(true);
    if (!formularioValido || !hayCambios || !original) return;

    setGuardando(true);
    try {
      // `castrado` se agrega siempre: para el backend, omitirlo y mandarlo en false son
      // cosas distintas, y el switch está en pantalla.
      const editada = await editarMascota(original.id, {
        ...cambios,
        castrado,
        foto: foto ?? undefined,
      });

      toast.mostrarExito(`Guardamos los cambios de ${editada.nombre}.`);
      router.back();
    } catch (err) {
      // Se queda en la pantalla con todo lo cargado, para poder reintentar.
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos guardar los cambios. Intentalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const explicarQueFalta = (): void => {
    setMostrarErrores(true);

    if (formularioValido && !hayCambios) {
      toast.mostrarAdvertencia('Todavía no cambiaste nada.');
      return;
    }

    toast.mostrarAdvertencia('Revisá los campos marcados en rojo.');
  };

  /** Mientras no se elija una foto nueva se muestra la que ya tiene la mascota. */
  const fotoVisible: FotoElegida | null =
    foto ??
    (original?.imagenUrl
      ? { uri: urlAbsoluta(original.imagenUrl)!, nombre: 'actual', tipo: 'image/jpeg' }
      : null);

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={volver}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-80"
          >
            <Ionicons name="chevron-back" size={20} color={PALETA.gris[600]} />
          </Pressable>

          <Text className="text-2xl font-bold text-pethood-orange">Editar mascota</Text>
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : errorCarga ? (
          <EstadoError
            mensaje={errorCarga}
            icono="alert-circle-outline"
            etiquetaAccion="Volver"
            onAccion={() => router.back()}
          />
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
              <PhotoPicker foto={fotoVisible} onChange={setFoto} permiteQuitar={foto !== null} />

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
                        if (nuevaEspecie === especieId) return;

                        setEspecieId(nuevaEspecie);
                        // La raza vieja puede no pertenecer a la especie nueva: se limpia y
                        // se marca tocada para que el "elegí la raza" salte en el momento.
                        setRazaId(null);
                        marcarTocado('razaId');
                      }}
                    />

                    <SelectField
                      label="Sexo"
                      obligatorio
                      placeholder="Elegí"
                      opciones={OPCIONES_GENERO}
                      valor={genero}
                      onChange={setGenero}
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

              <View className="mt-5">
                <CustomButton
                  title="Guardar cambios"
                  loading={guardando}
                  disabled={!formularioValido || !hayCambios}
                  onPress={() => void guardar()}
                  onPressDeshabilitado={explicarQueFalta}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmarSalida}
        tono="advertencia"
        titulo="¿Descartar los cambios?"
        mensaje="Si salís ahora vas a perder lo que editaste."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        onConfirmar={() => {
          setConfirmarSalida(false);
          router.back();
        }}
        onCerrar={() => setConfirmarSalida(false)}
      />
    </View>
  );
}
