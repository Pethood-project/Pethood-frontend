/**
 * Detalle de una campaña del refugio, con edición en el lugar (spec 028 del backend). No está
 * en el diseño: se entra tocando la tarjeta en «Mis Campañas».
 *
 * Muestra todos los datos. Los editables (imagen, título, descripción, meta y fecha límite)
 * llevan un lápiz que abre ese campo; alias, CBU y fecha de inicio quedan fijos. Apenas algo
 * difiere de la campaña original aparecen «Cancelar» (descarta todo) y «Guardar cambios», y
 * sólo viaja lo que cambió. Una campaña finalizada no se edita. La validación de acá es para
 * UX: la real es del backend y sus mensajes se muestran tal cual.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraProgreso } from '@/components/campanias/BarraProgreso';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DateField } from '@/components/ui/DateField';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { EstadoCampaniaBadge } from '@/components/ui/EstadoCampaniaBadge';
import { FilaDato, TarjetaDatos } from '@/components/ui/FilaDato';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import { Nota } from '@/components/ui/Nota';
import { PhotoPicker, type FotoElegida } from '@/components/ui/PhotoPicker';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { PALETA } from '@/constants/theme';
import { formatearPesos, puedeEditar, textoDonantes } from '@/lib/campanias';
import { ApiError, urlAbsoluta } from '@/services/api';
import {
  editarCampania,
  obtenerCampania,
  type Campania,
  type CambiosCampania,
} from '@/services/campanias';
import {
  aFechaISO,
  aFechaVisible,
  esDiaAnteriorA,
  parsearFecha,
  validarFechaFutura,
} from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';
import { filtrarEntradaDecimal, validarDecimal } from '@/shared/validation/numbers';
import { validarTexto } from '@/shared/validation/text';

const { campania: LIM } = LIMITES;
const FECHA_MAXIMA = new Date(2100, 0, 1);

type Campo = 'imagen' | 'titulo' | 'descripcion' | 'objetivo' | 'fechaFin';
type Errores = Partial<Record<Exclude<Campo, 'imagen'>, string>>;

/** La fecha límite tiene que ser posterior a hoy y al inicio: el picker arranca un día después. */
function primerDiaPosible(fechaInicio: Date | null): Date {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const desde = fechaInicio && fechaInicio > hoy ? new Date(fechaInicio) : hoy;
  desde.setHours(0, 0, 0, 0);
  desde.setDate(desde.getDate() + 1);
  return desde;
}

function fechaVisible(iso: string): string {
  const fecha = parsearFecha(iso);
  return fecha ? aFechaVisible(fecha) : iso;
}

function BotonLapiz({ etiqueta, onPress }: { etiqueta: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Editar ${etiqueta.toLowerCase()}`}
      onPress={onPress}
      hitSlop={10}
      className="h-8 w-8 items-center justify-center rounded-full bg-organic-bg active:opacity-70"
    >
      <Ionicons name="pencil" size={15} color={PALETA.accent[600]} />
    </Pressable>
  );
}

/**
 * Un dato que se puede editar: en lectura muestra etiqueta, valor y el lápiz (si se puede
 * editar); en edición, el campo que se le pase.
 */
function CampoEditable({
  etiqueta,
  valor,
  editable,
  editando,
  onEditar,
  children,
  ultima = false,
}: {
  etiqueta: string;
  valor: string;
  editable: boolean;
  editando: boolean;
  onEditar: () => void;
  children: ReactNode;
  ultima?: boolean;
}) {
  const separador = ultima ? '' : 'border-b border-organic-neutral-200';

  if (editando) return <View className={`px-3.5 py-3 ${separador}`}>{children}</View>;

  return (
    <View className={`flex-row items-start gap-3 px-3.5 py-3 ${separador}`}>
      <View className="flex-1">
        <Text className="font-cuerpo-semi text-[11px] text-organic-neutral-600">{etiqueta}</Text>
        <Text className="mt-1 font-cuerpo text-[15px] leading-5 text-organic-neutral-900">
          {valor}
        </Text>
      </View>
      {editable ? <BotonLapiz etiqueta={etiqueta} onPress={onEditar} /> : null}
    </View>
  );
}

export default function DetalleCampaniaRefugioScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaniaId = Number(id);

  const [original, setOriginal] = useState<Campania | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const [editando, setEditando] = useState<Partial<Record<Campo, boolean>>>({});
  const [imagen, setImagen] = useState<FotoElegida | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  /** Alto de la barra de guardar: el campo enfocado tiene que quedar por encima de ella. */
  const [altoPie, setAltoPie] = useState(0);

  /** Vuelve todos los campos a lo que tiene la campaña y cierra los que estaban abiertos. */
  const descartar = (campania: Campania): void => {
    setEditando({});
    setImagen(null);
    setTitulo(campania.titulo);
    setDescripcion(campania.descripcion);
    setObjetivo(String(campania.objetivo));
    setFechaFin(parsearFecha(campania.fechaFin));
    setMostrarErrores(false);
  };

  useEffect(() => {
    const cargar = async (): Promise<void> => {
      if (!Number.isInteger(campaniaId) || campaniaId <= 0) {
        setErrorCarga('La campaña no es válida');
        setCargando(false);
        return;
      }

      try {
        const campania = await obtenerCampania(campaniaId);
        setOriginal(campania);
        descartar(campania);
      } catch (err) {
        setErrorCarga(
          err instanceof ApiError
            ? err.message
            : 'No pudimos cargar la campaña. Revisá tu conexión e intentalo de nuevo.',
        );
      } finally {
        setCargando(false);
      }
    };

    void cargar();
  }, [campaniaId]);

  const editable = original !== null && puedeEditar(original.estado.nombre);
  const fechaInicio = original ? parsearFecha(original.fechaInicio) : null;

  /** Sólo lo que difiere de la original: si se escribe algo y se deshace, no viaja nada. */
  const cambios = useMemo<CambiosCampania>(() => {
    if (!original) return {};
    const resultado: CambiosCampania = {};

    if (titulo.trim() !== original.titulo) resultado.titulo = titulo.trim();
    if (descripcion.trim() !== original.descripcion) resultado.descripcion = descripcion.trim();
    if (objetivo !== String(original.objetivo)) resultado.objetivo = objetivo;
    if (fechaFin && aFechaISO(fechaFin) !== original.fechaFin) resultado.fechaFin = fechaFin;

    return resultado;
  }, [original, titulo, descripcion, objetivo, fechaFin]);

  const hayCambios = Object.keys(cambios).length > 0 || imagen !== null;

  const errores = useMemo<Errores>(() => {
    const e: Errores = {};
    if (!original) return e;

    const eTitulo = validarTexto(titulo, { ...LIM.titulo, etiqueta: 'El título' });
    if (eTitulo) e.titulo = eTitulo;
    const eDescripcion = validarTexto(descripcion, {
      max: LIM.descripcion.max,
      etiqueta: 'La descripción',
    });
    if (eDescripcion) e.descripcion = eDescripcion;

    const eObjetivo = validarDecimal(objetivo, { ...LIM.objetivo, etiqueta: 'La meta' });
    if (eObjetivo) e.objetivo = eObjetivo;
    else if (Number(objetivo) < original.recaudado) {
      e.objetivo = `La meta no puede ser menor a lo que ya recaudaste (${formatearPesos(original.recaudado)})`;
    }

    // La fecha que ya tenía no se revalida: una campaña que termina hoy se puede seguir
    // editando sin tocar su fecha.
    if (!fechaFin) e.fechaFin = 'La fecha límite es obligatoria';
    else if (cambios.fechaFin) {
      const eFin = validarFechaFutura(fechaFin, 'La fecha límite');
      if (eFin) e.fechaFin = eFin;
      // Por día, como el backend.
      else if (fechaInicio && !esDiaAnteriorA(fechaInicio, fechaFin)) {
        e.fechaFin = 'La fecha límite tiene que ser posterior a la de inicio';
      }
    }

    return e;
  }, [original, titulo, descripcion, objetivo, fechaFin, cambios.fechaFin, fechaInicio]);

  const valido = Object.keys(errores).length === 0;
  /** El error se ve apenas se toca el campo, o en todos al intentar guardar. */
  const errorDe = (campo: keyof Errores): string | undefined =>
    mostrarErrores || campo in cambios ? errores[campo] : undefined;

  const abrir = (campo: Campo): void => setEditando((previos) => ({ ...previos, [campo]: true }));

  const volver = (): void => {
    if (hayCambios) {
      setConfirmarSalida(true);
      return;
    }
    router.back();
  };

  const guardar = async (): Promise<void> => {
    setMostrarErrores(true);
    if (!original || !hayCambios) return;
    if (!valido) {
      toast.mostrarAdvertencia('Revisá los campos marcados antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const editada = await editarCampania(original.id, {
        ...cambios,
        ...(imagen ? { imagen } : {}),
      });
      setOriginal(editada);
      descartar(editada);
      toast.mostrarExito(
        editada.estado.nombre === 'Finalizada'
          ? 'Guardaste los cambios. La campaña llegó a su meta y se finalizó.'
          : 'Guardaste los cambios.',
      );
    } catch (err) {
      // Se queda con todo cargado para reintentar.
      toast.mostrarError(
        err instanceof ApiError
          ? err.message
          : 'No pudimos guardar los cambios. Intentalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const imagenActual = urlAbsoluta(original?.imagenUrl);

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <EncabezadoPantalla barra titulo="Campaña" onVolver={volver} />

        {cargando ? (
          <EstadoCargando />
        ) : errorCarga || !original ? (
          <EstadoError
            mensaje={errorCarga ?? 'No pudimos cargar la campaña.'}
            icono="alert-circle-outline"
            etiquetaAccion="Volver"
            onAccion={() => router.back()}
          />
        ) : (
          <>
            <FormularioConTeclado
              className="flex-1"
              style={{ zIndex: 0 }}
              contentContainerClassName="gap-4 px-4 pb-10 pt-4"
              altoPieFijo={altoPie}
            >
              {editando.imagen ? (
                <PhotoPicker
                  foto={
                    imagen ??
                    (imagenActual
                      ? { uri: imagenActual, nombre: 'actual', tipo: 'image/jpeg' }
                      : null)
                  }
                  onChange={setImagen}
                  permiteQuitar={imagen !== null}
                  grande
                />
              ) : (
                <View
                  className="w-full overflow-hidden rounded-[24px] bg-organic-neutral-200"
                  style={{ aspectRatio: 16 / 9 }}
                >
                  {imagenActual ? (
                    <Image
                      source={{ uri: imagenActual }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <Ionicons name="gift-outline" size={36} color={PALETA.neutral[400]} />
                    </View>
                  )}
                  {editable ? (
                    <View className="absolute right-3 top-3">
                      <BotonLapiz etiqueta="Imagen" onPress={() => abrir('imagen')} />
                    </View>
                  ) : null}
                </View>
              )}

              <View className="flex-row items-center justify-between">
                <EstadoCampaniaBadge estado={original.estado.nombre} />
                <Text className="font-cuerpo text-[13px] text-organic-neutral-600">
                  {original.porcentaje}% · {textoDonantes(original.donantes)}
                </Text>
              </View>
              <View className="gap-2 rounded-[22px] bg-organic-surface p-4">
                <View className="flex-row justify-between">
                  <Text className="font-cuerpo-bold text-[14px] text-organic-neutral-900">
                    Recaudado: {formatearPesos(original.recaudado)}
                  </Text>
                  <Text className="font-cuerpo text-[14px] text-organic-neutral-600">
                    Meta: {formatearPesos(original.objetivo)}
                  </Text>
                </View>
                <BarraProgreso porcentaje={original.porcentaje} />
              </View>

              {!editable ? (
                <Nota texto="Una campaña finalizada no se puede editar." />
              ) : null}

              <TarjetaDatos>
                <CampoEditable
                  etiqueta="Título"
                  valor={original.titulo}
                  editable={editable}
                  editando={editando.titulo === true}
                  onEditar={() => abrir('titulo')}
                >
                  <TextField
                    label="Título"
                    obligatorio
                    placeholder="Nombre de la campaña"
                    value={titulo}
                    onChangeText={setTitulo}
                    maxLength={LIM.titulo.max}
                    error={errorDe('titulo')}
                    autoFocus
                  />
                </CampoEditable>
                <CampoEditable
                  etiqueta="Descripción"
                  valor={original.descripcion}
                  editable={editable}
                  editando={editando.descripcion === true}
                  onEditar={() => abrir('descripcion')}
                >
                  <TextAreaField
                    label="Descripción"
                    obligatorio
                    placeholder="¿Para qué se usarán los fondos?"
                    value={descripcion}
                    onChangeText={setDescripcion}
                    maximo={LIM.descripcion.max}
                    error={errorDe('descripcion')}
                  />
                </CampoEditable>
                <CampoEditable
                  etiqueta="Meta de recaudación"
                  valor={formatearPesos(original.objetivo)}
                  editable={editable}
                  editando={editando.objetivo === true}
                  onEditar={() => abrir('objetivo')}
                >
                  <TextField
                    label="Meta de recaudación ($)"
                    obligatorio
                    placeholder="Entre 10000 y 2500000"
                    keyboardType="number-pad"
                    value={objetivo}
                    onChangeText={(texto) => setObjetivo(filtrarEntradaDecimal(texto, 0))}
                    error={errorDe('objetivo')}
                    ayuda={
                      original.recaudado > 0
                        ? `Ya recaudaste ${formatearPesos(original.recaudado)}: la meta no puede ser menor.`
                        : undefined
                    }
                    autoFocus
                  />
                </CampoEditable>
                <CampoEditable
                  etiqueta="Fecha límite"
                  valor={fechaVisible(original.fechaFin)}
                  editable={editable}
                  editando={editando.fechaFin === true}
                  onEditar={() => abrir('fechaFin')}
                  ultima
                >
                  <DateField
                    label="Fecha límite"
                    obligatorio
                    placeholder="Elegí la fecha"
                    valor={fechaFin}
                    onChange={setFechaFin}
                    fechaMinima={primerDiaPosible(fechaInicio)}
                    fechaMaxima={FECHA_MAXIMA}
                    mostrarEdad={false}
                    error={errorDe('fechaFin')}
                  />
                </CampoEditable>
              </TarjetaDatos>

              <TarjetaDatos>
                <FilaDato etiqueta="Inicio" valor={fechaVisible(original.fechaInicio)} />
                <FilaDato etiqueta="Alias" valor={original.alias ?? '—'} />
                <FilaDato etiqueta="CBU / CVU" valor={original.cbu ?? '—'} ultima />
              </TarjetaDatos>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push(`/campanias/refugio/${original.id}/donaciones` as Href)
                }
                className="items-center rounded-full border border-organic-accent-600 py-3 active:opacity-70"
              >
                <Text className="font-cuerpo-bold text-[15px] text-organic-accent-600">
                  Revisar donaciones
                </Text>
              </Pressable>
            </FormularioConTeclado>

            {/* La barra sube pegada al teclado (spec 028): sin esto quedaba debajo y tapaba lo
                que se estaba escribiendo. Ya está separada `insets.bottom` del borde, así que
                con el teclado abierto se descuenta eso para que quede apoyada justo encima. */}
            <KeyboardStickyView
              offset={{ opened: insets.bottom }}
              onLayout={(evento) => setAltoPie(evento.nativeEvent.layout.height)}
              style={{ zIndex: 2 }}
            >
              {hayCambios ? (
                <View className="flex-row gap-3 border-t border-organic-neutral-200 bg-organic-surface px-4 py-3">
                  <Pressable
                    accessibilityRole="button"
                    disabled={guardando}
                    onPress={() => descartar(original)}
                    className="flex-1 items-center rounded-full bg-red-600 py-3.5 active:opacity-90"
                  >
                    <Text className="font-cuerpo-bold text-[16px] text-white">Cancelar</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: guardando, busy: guardando }}
                    disabled={guardando}
                    onPress={() => void guardar()}
                    className={`flex-1 items-center rounded-full bg-emerald-600 py-3.5 active:opacity-90 ${guardando ? 'opacity-60' : ''}`}
                  >
                    <Text className="font-cuerpo-bold text-[16px] text-white">
                      {guardando ? 'Guardando…' : 'Guardar cambios'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </KeyboardStickyView>
          </>
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
