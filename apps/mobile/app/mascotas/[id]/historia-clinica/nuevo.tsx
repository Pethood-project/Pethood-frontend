/**
 * HU-8.1 Registrar historia clínica — GUI-20 Carga Historia Clínica.
 *
 * Lo primero es elegir qué se registra (spec 019):
 * - Vacuna: se elige del plan de vacunación de la especie, con su fecha, y la descripción se
 *   precarga con para qué sirve (se puede editar). Al guardarla aparece como medalla en la
 *   ficha de la mascota y en su publicación.
 * - Otro registro (visita, inyección, operación...): el formulario de siempre.
 *
 * La validación de acá es solo para UX: la fuente de verdad es el backend.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { useToast } from '@/components/feedback/Toast';
import { DateField } from '@/components/ui/DateField';
import { DocumentField, type DocumentoElegido } from '@/components/ui/DocumentField';
import { FormCard, FormCardColumns, FormCardRow } from '@/components/ui/FormCard';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import { SegmentedField } from '@/components/ui/SegmentedField';
import { SelectField } from '@/components/ui/SelectField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { ToggleField } from '@/components/ui/ToggleField';
import { MedallaVacuna } from '@/components/vacunas/MedallaVacuna';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { crearHistoriaClinica } from '@/services/historia-clinica';
import { obtenerMascota } from '@/services/mascotas';
import { listarVacunas, type TipoVacuna, type VacunaCatalogo } from '@/services/vacunas';
import {
  aFechaISO,
  esDiaAnteriorA,
  parsearFecha,
  validarFechaFutura,
  validarFechaPasada,
} from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';

type TipoRegistro = 'VACUNA' | 'OTRO';

const OPCIONES_TIPO: { valor: TipoRegistro; etiqueta: string }[] = [
  { valor: 'VACUNA', etiqueta: 'Vacuna' },
  { valor: 'OTRO', etiqueta: 'Otro registro' },
];

interface ErroresFormulario {
  tipoRegistro?: string;
  tipoVacuna?: string;
  fechaVisita?: string;
  fechaProxima?: string;
  titulo?: string;
  descripcion?: string;
}

const ETIQUETAS: Record<keyof ErroresFormulario, string> = {
  tipoRegistro: 'qué vas a registrar',
  tipoVacuna: 'la vacuna',
  fechaVisita: 'la fecha',
  fechaProxima: 'la fecha próxima',
  titulo: 'el título',
  descripcion: 'la descripción',
};

const MANANA = new Date(new Date().setDate(new Date().getDate() + 1));

export default function NuevaHistoriaClinicaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const mascotaId = Number(id);

  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro | null>(null);
  const [tipoVacuna, setTipoVacuna] = useState<TipoVacuna | null>(null);
  const [fechaVisita, setFechaVisita] = useState<Date | null>(null);
  const [fechaProxima, setFechaProxima] = useState<Date | null>(null);
  const [requiereRevision, setRequiereRevision] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [documento, setDocumento] = useState<DocumentoElegido | null>(null);

  /** Plan de vacunación de la especie de la mascota. */
  const [vacunas, setVacunas] = useState<VacunaCatalogo[]>([]);
  const [nacimiento, setNacimiento] = useState<Date | null>(null);
  const [cargandoVacunas, setCargandoVacunas] = useState(true);

  const [guardando, setGuardando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [tocados, setTocados] = useState<Partial<Record<keyof ErroresFormulario, boolean>>>({});

  // El plan depende de la especie, así que primero hace falta la mascota. Se trae apenas
  // se abre la pantalla para que el selector ya esté listo si se elige "Vacuna".
  useEffect(() => {
    const cargar = async (): Promise<void> => {
      try {
        const mascota = await obtenerMascota(mascotaId);
        setNacimiento(parsearFecha(mascota.fechaNacimiento));
        setVacunas(await listarVacunas(mascota.especie.id));
      } catch {
        toast.mostrarError('No pudimos cargar las vacunas de la mascota.');
      } finally {
        setCargandoVacunas(false);
      }
    };

    void cargar();
  }, [mascotaId, toast]);

  const esVacuna = tipoRegistro === 'VACUNA';
  const vacunaElegida = vacunas.find((vacuna) => vacuna.tipo === tipoVacuna) ?? null;

  const elegirVacuna = (tipo: TipoVacuna): void => {
    const anterior = vacunaElegida?.descripcion ?? '';
    const nueva = vacunas.find((vacuna) => vacuna.tipo === tipo);

    setTipoVacuna(tipo);
    // Se precarga con para qué sirve la vacuna, sin pisar lo que el usuario ya escribió.
    if (nueva && (descripcion.trim() === '' || descripcion === anterior)) {
      setDescripcion(nueva.descripcion);
    }
  };

  /**
   * La descripción es un solo estado compartido por los dos formularios, así que al cambiar de
   * tipo se reinicia: el texto de una vacuna no tiene sentido en «Otro registro». Al volver a
   * «Vacuna» con una ya elegida, se precarga de nuevo la suya.
   */
  const elegirTipoRegistro = (nuevo: TipoRegistro): void => {
    if (nuevo === tipoRegistro) return;

    setTipoRegistro(nuevo);
    setDescripcion(nuevo === 'VACUNA' ? (vacunaElegida?.descripcion ?? '') : '');
    // La descripción vuelve a "no tocada": recién vaciada, no tiene que gritar obligatoria.
    setTocados((previos) => ({ ...previos, tipoRegistro: true, descripcion: false }));
  };

  const errores = useMemo<ErroresFormulario>(() => {
    const resultado: ErroresFormulario = {};

    if (!tipoRegistro) {
      resultado.tipoRegistro = 'Elegí qué vas a registrar';
      return resultado;
    }

    const errorFecha = validarFechaPasada(
      fechaVisita,
      esVacuna ? 'La fecha de aplicación' : 'La fecha de visita',
    );
    if (errorFecha) resultado.fechaVisita = errorFecha;
    else if (esVacuna && esDiaAnteriorA(fechaVisita, nacimiento)) {
      resultado.fechaVisita = 'La fecha de aplicación no puede ser anterior al nacimiento';
    }

    const errorDescripcion = validarTexto(descripcion, {
      ...LIMITES.historiaClinica.descripcion,
      etiqueta: 'La descripción',
    });
    if (errorDescripcion) resultado.descripcion = errorDescripcion;

    if (esVacuna) {
      if (!tipoVacuna) resultado.tipoVacuna = 'La vacuna es obligatoria';
      return resultado;
    }

    const errorFechaProxima = validarFechaFutura(fechaProxima, 'La fecha próxima');
    if (errorFechaProxima) resultado.fechaProxima = errorFechaProxima;

    const errorTitulo = validarTexto(titulo, {
      ...LIMITES.historiaClinica.titulo,
      etiqueta: 'El título',
    });
    if (errorTitulo) resultado.titulo = errorTitulo;

    return resultado;
  }, [
    tipoRegistro,
    esVacuna,
    tipoVacuna,
    fechaVisita,
    nacimiento,
    fechaProxima,
    titulo,
    descripcion,
  ]);

  const formularioValido = Object.keys(errores).length === 0;

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

  const guardar = async (): Promise<void> => {
    setMostrarErrores(true);
    if (!formularioValido || !fechaVisita) return;

    setGuardando(true);
    try {
      // Una vacuna no lleva título: el backend la titula con el nombre de la vacuna.
      await crearHistoriaClinica(
        mascotaId,
        esVacuna
          ? {
              fechaVisita: aFechaISO(fechaVisita),
              requiereRevision: false,
              tipoVacuna: tipoVacuna!,
              descripcion: descripcion.trim(),
            }
          : {
              fechaVisita: aFechaISO(fechaVisita),
              fechaProxima: fechaProxima ? aFechaISO(fechaProxima) : undefined,
              requiereRevision,
              titulo: titulo.trim(),
              descripcion: descripcion.trim(),
              documento: documento
                ? { uri: documento.uri, nombre: documento.nombre, tipo: documento.tipo }
                : undefined,
            },
      );

      toast.mostrarExito(
        esVacuna && vacunaElegida
          ? `¡Listo! Registramos la vacuna ${vacunaElegida.nombre}.`
          : 'Historia clínica guardada con éxito',
      );
      router.back();
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos guardar la historia clínica.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla
          claro
          titulo="Nuevo registro"
          subtitulo="Ficha médica"
          onVolver={() => router.back()}
        />

        <FormularioConTeclado
          className="flex-1"
          contentContainerClassName="px-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <FormCard>
            <FormCardRow ultima={tipoRegistro === null}>
              <SegmentedField
                label="¿Qué vas a registrar?"
                obligatorio
                opciones={OPCIONES_TIPO}
                valor={tipoRegistro}
                onChange={elegirTipoRegistro}
                variante="tarjetas"
                error={errorDe('tipoRegistro')}
                grande
              />
              <Text className="mt-2 text-[13px] text-gray-400">
                {esVacuna
                  ? 'Se va a mostrar como medalla en la ficha de la mascota'
                  : 'Visitas, inyecciones, operaciones y demás van en «Otro registro»'}
              </Text>
            </FormCardRow>

            {esVacuna ? (
              <>
                <FormCardRow>
                  <SelectField
                    label="Vacuna"
                    obligatorio
                    placeholder={cargandoVacunas ? 'Cargando…' : 'Elegí la vacuna'}
                    opciones={vacunas.map((vacuna) => ({
                      valor: vacuna.tipo,
                      etiqueta: vacuna.nombre,
                    }))}
                    valor={tipoVacuna}
                    onChange={elegirVacuna}
                    onBlur={() => marcarTocado('tipoVacuna')}
                    deshabilitado={cargandoVacunas || vacunas.length === 0}
                    textoDeshabilitado={
                      cargandoVacunas ? 'Cargando…' : 'Esta especie no tiene vacunas cargadas'
                    }
                    error={errorDe('tipoVacuna')}
                    grande
                  />

                  {vacunaElegida ? (
                    <View className="mt-3">
                      <MedallaVacuna tipo={vacunaElegida.tipo} nombre={vacunaElegida.nombre} />
                    </View>
                  ) : null}
                </FormCardRow>

                <FormCardRow>
                  <DateField
                    label="Fecha de aplicación"
                    obligatorio
                    placeholder="Elegí la fecha"
                    valor={fechaVisita}
                    onChange={setFechaVisita}
                    onBlur={() => marcarTocado('fechaVisita')}
                    mostrarEdad={false}
                    fechaMinima={nacimiento ?? undefined}
                    error={errorDe('fechaVisita')}
                    grande
                  />
                </FormCardRow>

                <FormCardRow ultima>
                  <TextAreaField
                    label="Descripción"
                    obligatorio
                    placeholder="Elegí la vacuna y se completa sola"
                    value={descripcion}
                    onChangeText={setDescripcion}
                    onBlur={() => marcarTocado('descripcion')}
                    maximo={LIMITES.historiaClinica.descripcion.max}
                    error={errorDe('descripcion')}
                    grande
                  />
                </FormCardRow>
              </>
            ) : null}

            {tipoRegistro === 'OTRO' ? (
              <>
                <FormCardRow>
                  <TextField
                    label="Título del registro"
                    placeholder="Ej. Vacunación anual"
                    value={titulo}
                    onChangeText={setTitulo}
                    onBlur={() => marcarTocado('titulo')}
                    maxLength={LIMITES.historiaClinica.titulo.max}
                    error={errorDe('titulo')}
                    grande
                  />
                </FormCardRow>

                <FormCardRow>
                  <FormCardColumns>
                    <DateField
                      label="Fecha visita"
                      obligatorio
                      placeholder="Elegí la fecha"
                      valor={fechaVisita}
                      onChange={setFechaVisita}
                      onBlur={() => marcarTocado('fechaVisita')}
                      mostrarEdad={false}
                      error={errorDe('fechaVisita')}
                      grande
                    />

                    <DateField
                      label="Fecha próxima"
                      placeholder="Opcional"
                      valor={fechaProxima}
                      onChange={setFechaProxima}
                      onBlur={() => marcarTocado('fechaProxima')}
                      mostrarEdad={false}
                      fechaMinima={MANANA}
                      fechaMaxima={new Date(2100, 0, 1)}
                      error={errorDe('fechaProxima')}
                      grande
                    />
                  </FormCardColumns>
                </FormCardRow>

                <FormCardRow>
                  <ToggleField
                    label="Requiere revisión"
                    valor={requiereRevision}
                    onChange={setRequiereRevision}
                    grande
                  />
                </FormCardRow>

                <FormCardRow>
                  <TextAreaField
                    label="Descripción"
                    obligatorio
                    placeholder="Detalles de la visita veterinaria..."
                    value={descripcion}
                    onChangeText={setDescripcion}
                    onBlur={() => marcarTocado('descripcion')}
                    maximo={LIMITES.historiaClinica.descripcion.max}
                    error={errorDe('descripcion')}
                    grande
                  />
                </FormCardRow>

                <FormCardRow ultima>
                  <DocumentField documento={documento} onChange={setDocumento} grande />
                </FormCardRow>
              </>
            ) : null}
          </FormCard>

          <View className="mt-5">
            <CustomButton
              title={esVacuna ? 'Guardar vacuna' : 'Guardar registro'}
              variant="acento"
              loading={guardando}
              disabled={!formularioValido}
              onPress={() => void guardar()}
              onPressDeshabilitado={explicarQueFalta}
            />
          </View>
        </FormularioConTeclado>
      </SafeAreaView>
    </View>
  );
}
