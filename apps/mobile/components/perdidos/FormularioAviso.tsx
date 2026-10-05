/**
 * El formulario de un aviso de mascota perdida o encontrada: lo usan el alta (GUI-25, HU-13.1,
 * `app/perdidos/nuevo.tsx`) y la edición por quien lo publicó (HU-13.3,
 * `app/perdidos/[id]/editar.tsx`). Es el mismo formulario porque el aviso es el mismo: editar
 * no tiene diseño propio y repetir la pantalla haría que las dos se desincronicen.
 *
 * Lo que cambia al editar:
 * - Arranca con lo que el aviso ya tiene, fotos incluidas (las existentes viajan por su ruta).
 * - Las coordenadas del teléfono no se piden: son las del momento de publicar y no cambian.
 * - El pin del mapa arranca en el que el aviso ya tenía, sin volver a geocodificar, hasta que
 *   se cambie el lugar.
 * - En un caso resuelto no se ofrece Perdida / Encontrada: el estado ya no cambia.
 * - El título y el botón dicen "Editar aviso" y "Guardar cambios".
 *
 * Lo que sigue, del alta:
 *
 * Sigue la pantalla 26 del diseño ("Reportar mascota"): selector Perdida / Encontrada, fotos
 * (hasta 5, la primera es la portada), y en la tarjeta nombre, descripción, lugar y fecha, con un único botón "Publicar reporte".
 * La flecha de atrás hace de "Cancelar" (criterio 6). Dos agregados sobre el diseño, porque el
 * backend los exige: la especie (también la usa el filtro del portal) y el permiso de
 * ubicación, cuyas coordenadas se toman al publicar (precondición de la HU).
 *
 * El lugar se carga como la dirección del perfil: provincia y localidad del catálogo, más una
 * referencia libre y opcional ("frente a la plaza"). Arranca con la provincia y la localidad
 * del perfil, porque casi siempre pasa cerca de casa, pero se cambian si el animal se perdió
 * o se encontró en otro lado. También como en el perfil, debajo se ve el lugar en Google Maps
 * para verificar el pin o corregirlo pegando un link a mano; ese punto viaja en el alta y es
 * desde donde se mide la distancia en el portal. Por eso los campos del lugar van últimos en
 * la tarjeta, pegados al mapa (el diseño tiene la fecha al final).
 *
 * La validación de acá es sólo para UX: la real la hace el backend y sus mensajes se muestran
 * tal cual. Mismo patrón que el alta de mascota: el botón se habilita con todo válido, y
 * tocarlo deshabilitado marca en rojo lo que falta y lo nombra en un aviso (criterio 5).
 */
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import {
  AvisoVerificacionUbicacion,
  type TextosVerificacionUbicacion,
} from '@/components/perfil/AvisoVerificacionUbicacion';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { DateField } from '@/components/ui/DateField';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import { Nota } from '@/components/ui/Nota';
import { PhotosPickerField, type FotoElegida } from '@/components/ui/PhotosPickerField';
import { Segmentado, type OpcionSegmento } from '@/components/ui/Segmentado';
import { SelectField } from '@/components/ui/SelectField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { LEYENDA_RESUELTO } from '@/constants/EstadosAnimalPerdido';
import { PROVINCIAS, localidadesDe } from '@/constants/Provincias';
import { usePreviewUbicacion, type DireccionEstructurada } from '@/hooks/usePreviewUbicacion';
import { useSesion } from '@/hooks/useSesion';
import type { useUbicacionDispositivo } from '@/hooks/useUbicacionDispositivo';
import { avisarAvisoCreado, avisarAvisoEditado } from '@/lib/avisoRecienCreado';
import { ApiError, urlAbsoluta } from '@/services/api';
import {
  crearAviso,
  editarAviso,
  estaResuelto,
  leerLinkMapa,
  ubicarLugar,
  type AvisoPerdido,
} from '@/services/animalesPerdidos';
import {
  listarEspecies,
  listarEstadosAnimalPerdido,
  type OpcionCatalogo,
} from '@/services/catalogos';
import { parsearFecha, validarFechaPasada } from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';
import type { UbicacionPreview, Usuario } from '@/types/auth';

/** El estado que exige nombre, como regla del backend: en uno encontrado puede faltar. */
const ESTADO_CON_NOMBRE = 'Perdido';

/**
 * Las opciones del diseño van en femenino ("Perdida / Encontrada", de "la mascota"); el
 * catálogo del backend, en masculino. Un estado sin traducción se muestra tal cual.
 */
const ETIQUETA_EN_ALTA: Record<string, string> = {
  Perdido: 'Perdida',
  Encontrado: 'Encontrada',
};

const { animalPerdido } = LIMITES;

const TEXTOS_MAPA: TextosVerificacionUbicacion = {
  incompleta: 'Elegí la provincia y la localidad para ver el lugar en el mapa.',
  verificada: 'Lugar verificado',
  dialogoMensaje: 'Pegá el link de Google Maps del lugar donde se perdió o se encontró.',
  dialogoDetalle: 'Desde ahí se calcula a qué distancia está el aviso de quien lo vea.',
};

/** El preview del lugar, con la forma que espera el hook de la dirección del perfil. */
function previsualizarLugar(lugar: DireccionEstructurada): Promise<UbicacionPreview> {
  // La referencia hace de "calle y altura": es el tercer dato del lugar, y es opcional.
  return ubicarLugar({
    provincia: lugar.provincia,
    localidad: lugar.localidad,
    referencia: lugar.calleAltura,
  });
}

const OPCIONES_PROVINCIA = PROVINCIAS.map((provincia) => ({
  valor: provincia.nombre,
  etiqueta: provincia.nombre,
}));

/**
 * El lugar del perfil para precargar, sólo si es del catálogo: un perfil cargado antes de los
 * selectores puede tener texto libre, y ese no se arrastra al aviso.
 */
function lugarDelPerfil(usuario: Usuario | null): {
  provincia: string | null;
  localidad: string | null;
} {
  const provincia = PROVINCIAS.find((opcion) => opcion.nombre === usuario?.provincia)?.nombre;
  if (!provincia) return { provincia: null, localidad: null };

  const localidad = localidadesDe(provincia).find((opcion) => opcion === usuario?.localidad);
  return { provincia, localidad: localidad ?? null };
}

interface ErroresFormulario {
  foto?: string;
  nombre?: string;
  especieId?: string;
  descripcion?: string;
  provincia?: string;
  localidad?: string;
  referencia?: string;
  fechaSuceso?: string;
}

/** Nombre visible de cada campo, para decir qué falta al tocar el botón deshabilitado. */
const ETIQUETAS: Record<keyof ErroresFormulario, string> = {
  foto: 'la foto',
  nombre: 'el nombre',
  especieId: 'la especie',
  descripcion: 'la descripción',
  provincia: 'la provincia',
  localidad: 'la localidad',
  referencia: 'la referencia',
  fechaSuceso: 'la fecha',
};

function enumerar(elementos: string[]): string {
  if (elementos.length === 1) return elementos[0]!;
  return `${elementos.slice(0, -1).join(', ')} y ${elementos[elementos.length - 1]}`;
}

/** Las fotos que ya tiene el aviso, en su orden, como las entiende el selector. */
function fotosExistentes(imagenes: string[]): FotoElegida[] {
  return imagenes.map((ruta) => ({
    uri: urlAbsoluta(ruta) ?? ruta,
    nombre: ruta.split('/').pop() ?? 'foto.jpg',
    tipo: 'image/jpeg',
    remota: ruta,
  }));
}

/** El pin que el aviso ya tiene, con la forma del preview del mapa. */
function pinDe(aviso: AvisoPerdido | undefined): UbicacionPreview | null {
  if (!aviso?.lugar || !aviso.mapaUrl) return null;
  return { mapaUrl: aviso.mapaUrl, ...aviso.lugar };
}

type FormularioAvisoProps =
  | {
      /** El alta: pide la ubicación del teléfono, que viaja con el aviso. */
      aviso?: undefined;
      ubicacion: ReturnType<typeof useUbicacionDispositivo>;
    }
  | {
      /** La edición de este aviso. */
      aviso: AvisoPerdido;
      ubicacion?: undefined;
    };

export function FormularioAviso({ aviso, ubicacion }: FormularioAvisoProps) {
  const router = useRouter();
  const toast = useToast();
  const { usuario } = useSesion();
  const edicion = aviso !== undefined;
  /** Un caso cerrado: su estado ya no cambia, así que no se ofrece Perdida / Encontrada. */
  const resuelto = aviso !== undefined && estaResuelto(aviso);

  const [estados, setEstados] = useState<OpcionCatalogo[]>([]);
  const [especies, setEspecies] = useState<OpcionCatalogo[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);

  const [estadoId, setEstadoId] = useState<number | null>(aviso?.estado.id ?? null);
  const [fotos, setFotos] = useState<FotoElegida[]>(() =>
    aviso ? fotosExistentes(aviso.imagenes) : [],
  );
  const [nombre, setNombre] = useState(aviso?.nombre ?? '');
  const [especieId, setEspecieId] = useState<number | null>(aviso?.especie?.id ?? null);
  const [descripcion, setDescripcion] = useState(aviso?.descripcion ?? '');
  const [provincia, setProvincia] = useState<string | null>(() =>
    aviso ? aviso.provincia : lugarDelPerfil(usuario).provincia,
  );
  const [localidad, setLocalidad] = useState<string | null>(() =>
    aviso ? aviso.localidad : lugarDelPerfil(usuario).localidad,
  );
  const [referencia, setReferencia] = useState(aviso?.referencia ?? '');
  /** El usuario confirmó que el pin del mapa es el lugar. Como en el perfil, no bloquea. */
  const [verificada, setVerificada] = useState(false);
  /**
   * El punto del link que pegó a mano: pisa al del preview hasta que cambie el lugar. Al
   * editar arranca en el pin que el aviso ya tenía, que cumple el mismo papel.
   */
  const [puntoManual, setPuntoManual] = useState<UbicacionPreview | null>(() => pinDe(aviso));
  /**
   * Si el lugar ya se tocó. Al editar, el preview no corre hasta entonces: el aviso ya tiene su
   * pin y geocodificarlo de nuevo podría moverlo de donde el usuario lo dejó. Sin pin (un aviso
   * que no se pudo ubicar) corre de entrada, para mostrar algo.
   */
  const [lugarTocado, setLugarTocado] = useState(() => !aviso || pinDe(aviso) === null);
  // Casi siempre se reporta en el día: arranca en hoy y se cambia si hace falta.
  const [fechaSuceso, setFechaSuceso] = useState<Date | null>(() =>
    aviso ? parsearFecha(aviso.fechaSuceso) : new Date(),
  );

  const [guardando, setGuardando] = useState(false);
  /** Revela todos los errores de golpe al intentar publicar. */
  const [mostrarErrores, setMostrarErrores] = useState(false);
  /** Campos de los que el usuario ya salió: sus errores se ven sin haber publicado. */
  const [tocados, setTocados] = useState<Partial<Record<keyof ErroresFormulario, boolean>>>({});

  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const cargar = async (): Promise<void> => {
      setCargandoCatalogos(true);
      setErrorCatalogos(null);

      try {
        const [estadosCargados, especiesCargadas] = await Promise.all([
          listarEstadosAnimalPerdido(),
          listarEspecies(),
        ]);

        // Sólo los que el backend acepta en un alta: Resuelto nunca es un punto de partida.
        const enAlta = estadosCargados.filter((estado) => estado.seleccionableEnAlta);
        setEstados(enAlta);
        setEspecies(especiesCargadas);
        // El diseño arranca con "Perdida" elegida.
        setEstadoId(
          (actual) =>
            actual ??
            enAlta.find((estado) => estado.nombre === ESTADO_CON_NOMBRE)?.id ??
            enAlta[0]?.id ??
            null,
        );
      } catch (err) {
        setErrorCatalogos(
          err instanceof ApiError
            ? err.message
            : 'No pudimos cargar el formulario. Revisá tu conexión e intentalo de nuevo.',
        );
      } finally {
        setCargandoCatalogos(false);
      }
    };

    void cargar();
  }, [intento]);

  const nombreEstado = estados.find((estado) => estado.id === estadoId)?.nombre ?? null;
  const nombreObligatorio = nombreEstado === ESTADO_CON_NOMBRE;

  const opcionesEstado: OpcionSegmento<number>[] = estados.map((estado) => ({
    valor: estado.id,
    etiqueta: ETIQUETA_EN_ALTA[estado.nombre] ?? estado.nombre,
  }));

  const opcionesLocalidad = useMemo(
    () => localidadesDe(provincia).map((opcion) => ({ valor: opcion, etiqueta: opcion })),
    [provincia],
  );

  // Con el lugar sin tocar se le pasa vacío: así el hook no geocodifica (ver `lugarTocado`).
  const mapa = usePreviewUbicacion(
    lugarTocado
      ? { provincia: provincia ?? '', localidad: localidad ?? '', calleAltura: referencia }
      : { provincia: '', localidad: '', calleAltura: '' },
    previsualizarLugar,
    { calleAlturaOpcional: true },
  );

  /**
   * Otro lugar es otro pin: la verificación y el link pegado a mano eran del anterior. El
   * bloque del mapa se vuelve a montar con la misma clave, así tampoco muestra el link viejo.
   */
  const claveDelLugar = `${provincia ?? ''}|${localidad ?? ''}|${referencia.trim()}`;
  const olvidarPin = (): void => {
    setVerificada(false);
    setPuntoManual(null);
    setLugarTocado(true);
  };

  /** Al cambiar de provincia se limpia la localidad: las de la anterior ya no aplican. */
  const elegirProvincia = (nueva: string): void => {
    if (nueva === provincia) return;
    setProvincia(nueva);
    setLocalidad(null);
    olvidarPin();
  };

  const elegirLocalidad = (nueva: string): void => {
    if (nueva === localidad) return;
    setLocalidad(nueva);
    olvidarPin();
  };

  const cambiarReferencia = (nueva: string): void => {
    setReferencia(nueva);
    if (nueva.trim() !== referencia.trim()) olvidarPin();
  };

  /** "Corregir a mano": el backend lee el punto del link. Si no puede, el diálogo lo dice. */
  const guardarLinkManual = useCallback(async (link: string): Promise<void> => {
    setPuntoManual(await leerLinkMapa(link));
    setVerificada(true);
  }, []);

  /**
   * El punto que viaja en el alta: el pegado a mano o el del preview. Mientras el preview se
   * recalcula no se manda ninguno, porque el que hay es del lugar anterior: el backend lo
   * geocodifica al publicar.
   */
  const puntoDelLugar = puntoManual ?? (mapa.cargando ? null : mapa.ubicacion);

  const errores = useMemo<ErroresFormulario>(() => {
    const resultado: ErroresFormulario = {};

    if (fotos.length === 0) resultado.foto = 'Agregá una foto del animal';

    const errorNombre = validarTexto(nombre, {
      max: animalPerdido.nombre.max,
      etiqueta: 'El nombre',
      obligatorio: nombreObligatorio,
    });
    if (errorNombre) resultado.nombre = errorNombre;

    if (especieId === null) resultado.especieId = 'La especie es obligatoria';

    const errorDescripcion = validarTexto(descripcion, {
      max: animalPerdido.descripcion.max,
      etiqueta: 'La descripción',
    });
    if (errorDescripcion) resultado.descripcion = errorDescripcion;

    if (provincia === null) resultado.provincia = 'La provincia es obligatoria';
    if (localidad === null) resultado.localidad = 'La localidad es obligatoria';

    const errorReferencia = validarTexto(referencia, {
      max: animalPerdido.referencia.max,
      etiqueta: 'La referencia',
      obligatorio: false,
    });
    if (errorReferencia) resultado.referencia = errorReferencia;

    const errorFecha = validarFechaPasada(fechaSuceso, 'La fecha');
    if (errorFecha) resultado.fechaSuceso = errorFecha;

    return resultado;
  }, [
    fotos,
    nombre,
    nombreObligatorio,
    especieId,
    descripcion,
    provincia,
    localidad,
    referencia,
    fechaSuceso,
  ]);

  const formularioValido = Object.keys(errores).length === 0;
  // Al editar no hace falta la ubicación del teléfono: es la del alta y no cambia.
  const ubicacionLista = edicion || ubicacion?.estado === 'concedido';
  const puedePublicar = formularioValido && ubicacionLista && estadoId !== null;

  /**
   * Un error se muestra cuando el campo ya fue tocado o cuando se intentó publicar, para que
   * el formulario no aparezca todo en rojo apenas se abre.
   */
  const errorDe = (campo: keyof ErroresFormulario): string | undefined =>
    mostrarErrores || tocados[campo] ? errores[campo] : undefined;

  const marcarTocado = (campo: keyof ErroresFormulario): void =>
    setTocados((previos) => ({ ...previos, [campo]: true }));

  /** Al tocar el botón deshabilitado: revelar los errores y decir qué falta (criterio 5). */
  const explicarQueFalta = (): void => {
    setMostrarErrores(true);

    const faltantes = (Object.keys(errores) as (keyof ErroresFormulario)[]).map(
      (campo) => ETIQUETAS[campo],
    );

    if (faltantes.length > 0) {
      toast.mostrarAdvertencia(`Todavía falta completar ${enumerar(faltantes)}.`);
      return;
    }

    if (!ubicacionLista) {
      toast.mostrarAdvertencia('Permití el acceso a tu ubicación para publicar el aviso.');
    }
  };

  const publicar = async (): Promise<void> => {
    setMostrarErrores(true);
    if (
      !puedePublicar ||
      fotos.length === 0 ||
      !fechaSuceso ||
      estadoId === null ||
      especieId === null ||
      provincia === null ||
      localidad === null
    ) {
      return;
    }

    const datos = {
      estadoId,
      nombre: nombre.trim(),
      especieId,
      descripcion: descripcion.trim(),
      provincia,
      localidad,
      referencia: referencia.trim(),
      puntoDelLugar: puntoDelLugar
        ? { latitud: puntoDelLugar.latitud, longitud: puntoDelLugar.longitud }
        : null,
      fechaSuceso,
      fotos,
    };

    setGuardando(true);
    try {
      if (aviso) {
        const actualizado = await editarAviso(aviso.id, datos);
        toast.mostrarExito('Guardaste los cambios del aviso.');
        avisarAvisoEditado(actualizado);
        router.back();
        return;
      }

      const coordenadas = await ubicacion.obtenerCoordenadas();
      const creado = await crearAviso({
        ...datos,
        latitud: coordenadas.latitud,
        longitud: coordenadas.longitud,
      });

      // Criterio 4, en voseo: la HU lo escribe "Has creado una publicación".
      toast.mostrarExito('Creaste una publicación.');
      avisarAvisoCreado(creado);
      router.back();
    } catch (err) {
      // Se queda en la pantalla con todo lo cargado, para poder reintentar. Los mensajes del
      // backend y los de la ubicación ya vienen listos para mostrar.
      toast.mostrarError(
        err instanceof Error
          ? err.message
          : edicion
            ? 'No pudimos guardar los cambios. Intentalo de nuevo.'
            : 'No pudimos publicar el aviso. Intentalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 border-b border-organic-neutral-300 bg-organic-surface px-[22px] pb-4 pt-2">
          <BotonCircular
            icono="arrow-back"
            etiqueta="Cancelar y volver"
            onPress={() => router.back()}
            grande
          />
          <Text className="font-titulo text-[28px] leading-[32px] text-organic-accent-600">
            {edicion ? 'Editar aviso' : 'Reportar mascota'}
          </Text>
        </View>

        {cargandoCatalogos ? (
          <EstadoCargando />
        ) : errorCatalogos ? (
          <EstadoError mensaje={errorCatalogos} onAccion={() => setIntento((n) => n + 1)} />
        ) : (
          <FormularioConTeclado
            className="flex-1"
            contentContainerClassName="gap-4 px-4 pb-10 pt-4"
            showsVerticalScrollIndicator={false}
          >
            {resuelto ? (
              <Nota
                texto={`Este caso ya está resuelto (${LEYENDA_RESUELTO.toLowerCase()}), así que su estado no cambia. El resto del aviso lo podés corregir.`}
              />
            ) : (
              <Segmentado
                opciones={opcionesEstado}
                valor={estadoId}
                onChange={setEstadoId}
                variante="organica"
                grande
              />
            )}

            <PhotosPickerField
              fotos={fotos}
              onChange={setFotos}
              maximo={animalPerdido.imagenes.max}
              error={errorDe('foto')}
            />

            <FormCard>
              <FormCardRow>
                <TextField
                  label={nombreObligatorio ? 'Nombre' : 'Nombre (si se sabe)'}
                  obligatorio={nombreObligatorio}
                  placeholder="Ej. Rocky"
                  value={nombre}
                  onChangeText={setNombre}
                  onBlur={() => marcarTocado('nombre')}
                  maxLength={animalPerdido.nombre.max}
                  error={errorDe('nombre')}
                  grande
                />
              </FormCardRow>

              <FormCardRow>
                <SelectField
                  label="Especie"
                  obligatorio
                  placeholder="Elegí"
                  opciones={especies.map((especie) => ({
                    valor: especie.id,
                    etiqueta: especie.nombre,
                  }))}
                  valor={especieId}
                  onChange={setEspecieId}
                  onBlur={() => marcarTocado('especieId')}
                  error={errorDe('especieId')}
                  grande
                />
              </FormCardRow>

              <FormCardRow>
                <TextAreaField
                  label="Descripción"
                  obligatorio
                  placeholder="Color, raza, señas particulares…"
                  value={descripcion}
                  onChangeText={setDescripcion}
                  onBlur={() => marcarTocado('descripcion')}
                  maximo={animalPerdido.descripcion.max}
                  error={errorDe('descripcion')}
                  grande
                />
              </FormCardRow>

              <FormCardRow>
                <DateField
                  label="Fecha"
                  obligatorio
                  placeholder="Elegí la fecha"
                  valor={fechaSuceso}
                  onChange={setFechaSuceso}
                  onBlur={() => marcarTocado('fechaSuceso')}
                  fechaMaxima={new Date()}
                  mostrarEdad={false}
                  error={errorDe('fechaSuceso')}
                  grande
                />
              </FormCardRow>

              <FormCardRow>
                <SelectField
                  label="Provincia"
                  obligatorio
                  placeholder="Elegí la provincia"
                  opciones={OPCIONES_PROVINCIA}
                  valor={provincia}
                  onChange={elegirProvincia}
                  onBlur={() => marcarTocado('provincia')}
                  error={errorDe('provincia')}
                  buscable
                  grande
                />
              </FormCardRow>

              <FormCardRow>
                <SelectField
                  label="Localidad"
                  obligatorio
                  placeholder="Elegí la localidad"
                  opciones={opcionesLocalidad}
                  valor={localidad}
                  onChange={elegirLocalidad}
                  onBlur={() => marcarTocado('localidad')}
                  error={errorDe('localidad')}
                  deshabilitado={provincia === null}
                  textoDeshabilitado="Elegí primero la provincia"
                  buscable
                  grande
                />
              </FormCardRow>

              <FormCardRow ultima>
                <TextField
                  label="Referencia (opcional)"
                  placeholder="Ej. frente a la plaza"
                  value={referencia}
                  onChangeText={cambiarReferencia}
                  onBlur={() => marcarTocado('referencia')}
                  maxLength={animalPerdido.referencia.max}
                  error={errorDe('referencia')}
                  grande
                />
              </FormCardRow>
            </FormCard>

            {/* Con un link pegado a mano, ese es el pin: tapa el error del preview, si lo hubo. */}
            <AvisoVerificacionUbicacion
              key={claveDelLugar}
              ubicacion={mapa.ubicacion ?? puntoManual}
              cargando={mapa.cargando}
              error={puntoManual ? null : mapa.error}
              verificada={verificada}
              onVerificar={() => setVerificada(true)}
              onGuardarManual={guardarLinkManual}
              textos={TEXTOS_MAPA}
            />

            {ubicacion && (ubicacion.estado === 'denegado' || ubicacion.estado === 'bloqueado') ? (
              <Nota
                texto="Para publicar el aviso necesitamos la ubicación de tu teléfono en ese momento. No se muestra en la publicación: ahí sólo va el lugar que elegiste."
                accion={{
                  etiqueta:
                    ubicacion.estado === 'bloqueado' ? 'Abrir ajustes' : 'Permitir ubicación',
                  onPress: ubicacion.permitir,
                }}
              />
            ) : null}

            <CustomButton
              title={edicion ? 'Guardar cambios' : 'Publicar reporte'}
              variant="acento"
              loading={guardando}
              disabled={!puedePublicar}
              onPress={() => void publicar()}
              onPressDeshabilitado={explicarQueFalta}
            />
          </FormularioConTeclado>
        )}
      </SafeAreaView>
    </View>
  );
}
