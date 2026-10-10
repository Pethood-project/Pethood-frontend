/**
 * GUI-37 Crear Campaña — HU-12.1 (spec 026). Pantalla 27 del diseño («Nueva Campaña»).
 *
 * Campos: imagen, título, descripción (≤300), meta (sólo números, $10.000 a $2.500.000),
 * fecha de inicio (desde hoy), fecha límite (posterior al inicio), alias y CBU/CVU (al menos
 * uno). Botones literales de la HU: «Cancelar» (rojo, vuelve al listado) y «Confirmar» (verde,
 * crea la campaña). Validación sólo para UX: la real es del backend y sus mensajes se muestran
 * tal cual (incluido el límite de 5 campañas).
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/feedback/Toast';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { DateField } from '@/components/ui/DateField';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import { PhotoPicker, type FotoElegida } from '@/components/ui/PhotoPicker';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { avisarCampaniaCreada } from '@/lib/campaniaRecienCreada';
import { ApiError } from '@/services/api';
import { crearCampania } from '@/services/campanias';
import { validarAlias, validarCbu } from '@/shared/validation/bancario';
import { esDiaAnteriorA, validarFechaNoPasada } from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';
import { filtrarEntradaDecimal, validarDecimal } from '@/shared/validation/numbers';
import { validarTexto } from '@/shared/validation/text';

const { campania: LIM } = LIMITES;
const FECHA_MAXIMA = new Date(2100, 0, 1);

interface Errores {
  imagen?: string;
  titulo?: string;
  descripcion?: string;
  objetivo?: string;
  fechaInicio?: string;
  fechaFin?: string;
  alias?: string;
  cbu?: string;
}

function hoy(): Date {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

/** La fecha límite tiene que ser posterior al inicio: el picker arranca en el día siguiente. */
function diaSiguiente(fecha: Date): Date {
  const siguiente = new Date(fecha);
  siguiente.setHours(0, 0, 0, 0);
  siguiente.setDate(siguiente.getDate() + 1);
  return siguiente;
}

export default function NuevaCampaniaScreen() {
  const router = useRouter();
  const toast = useToast();

  const [imagen, setImagen] = useState<FotoElegida | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [alias, setAlias] = useState('');
  const [cbu, setCbu] = useState('');
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const errores = useMemo<Errores>(() => {
    const e: Errores = {};

    if (!imagen) e.imagen = 'Agregá una imagen para la campaña';
    const eTitulo = validarTexto(titulo, { ...LIM.titulo, etiqueta: 'El título' });
    if (eTitulo) e.titulo = eTitulo;
    const eDescripcion = validarTexto(descripcion, {
      max: LIM.descripcion.max,
      etiqueta: 'La descripción',
    });
    if (eDescripcion) e.descripcion = eDescripcion;
    const eObjetivo = validarDecimal(objetivo, { ...LIM.objetivo, etiqueta: 'La meta' });
    if (eObjetivo) e.objetivo = eObjetivo;
    const eInicio = validarFechaNoPasada(fechaInicio, 'La fecha de inicio');
    if (eInicio) e.fechaInicio = eInicio;
    if (!fechaFin) e.fechaFin = 'La fecha límite es obligatoria';
    // Por día, como el backend: con la hora del picker, «mismo día» pasaba acá y rebotaba allá.
    else if (fechaInicio && !esDiaAnteriorA(fechaInicio, fechaFin)) {
      e.fechaFin = 'La fecha límite tiene que ser posterior a la de inicio';
    }
    const eAlias = validarAlias(alias);
    if (eAlias) e.alias = eAlias;
    const eCbu = validarCbu(cbu);
    if (eCbu) e.cbu = eCbu;
    if (!alias.trim() && !cbu.trim())
      e.alias = 'Cargá el alias o el CBU/CVU para que puedan donarte';

    return e;
  }, [imagen, titulo, descripcion, objetivo, fechaInicio, fechaFin, alias, cbu]);

  const valido = Object.keys(errores).length === 0;
  const errorDe = (campo: keyof Errores): string | undefined =>
    mostrarErrores ? errores[campo] : undefined;

  const confirmar = async (): Promise<void> => {
    setMostrarErrores(true);
    if (!valido || !imagen || !fechaInicio || !fechaFin) {
      toast.mostrarAdvertencia('Revisá los campos marcados antes de confirmar.');
      return;
    }

    setGuardando(true);
    try {
      const creada = await crearCampania({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        objetivo,
        fechaInicio,
        fechaFin,
        alias: alias.trim(),
        cbu: cbu.replace(/\s+/g, ''),
        imagen,
      });
      toast.mostrarExito('Creaste la campaña.');
      avisarCampaniaCreada(creada);
      router.back();
    } catch (err) {
      // Se queda con todo cargado para reintentar (incluido el límite de 5 campañas).
      toast.mostrarError(
        err instanceof ApiError ? err.message : 'No pudimos crear la campaña. Intentalo de nuevo.',
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
            Nueva Campaña
          </Text>
        </View>

        <FormularioConTeclado className="flex-1" contentContainerClassName="gap-4 px-4 pb-10 pt-4">
          <PhotoPicker foto={imagen} onChange={setImagen} error={errorDe('imagen')} grande />

          <FormCard>
            <FormCardRow>
              <TextField
                label="Título"
                obligatorio
                placeholder="Nombre de la campaña"
                value={titulo}
                onChangeText={setTitulo}
                maxLength={LIM.titulo.max}
                error={errorDe('titulo')}
                grande
              />
            </FormCardRow>
            <FormCardRow>
              <TextAreaField
                label="Descripción"
                obligatorio
                placeholder="¿Para qué se usarán los fondos?"
                value={descripcion}
                onChangeText={setDescripcion}
                maximo={LIM.descripcion.max}
                error={errorDe('descripcion')}
                grande
              />
            </FormCardRow>
            <FormCardRow>
              <TextField
                label="Meta de recaudación ($)"
                obligatorio
                placeholder="Entre 10000 y 2500000"
                keyboardType="number-pad"
                value={objetivo}
                onChangeText={(texto) => setObjetivo(filtrarEntradaDecimal(texto, 0))}
                error={errorDe('objetivo')}
                grande
              />
            </FormCardRow>
            <FormCardRow>
              <DateField
                label="Fecha de inicio"
                obligatorio
                placeholder="Elegí la fecha"
                valor={fechaInicio}
                onChange={setFechaInicio}
                fechaMinima={hoy()}
                fechaMaxima={FECHA_MAXIMA}
                mostrarEdad={false}
                error={errorDe('fechaInicio')}
                grande
              />
            </FormCardRow>
            <FormCardRow>
              <DateField
                label="Fecha límite"
                obligatorio
                placeholder="Elegí la fecha"
                valor={fechaFin}
                onChange={setFechaFin}
                fechaMinima={diaSiguiente(fechaInicio ?? hoy())}
                fechaMaxima={FECHA_MAXIMA}
                mostrarEdad={false}
                error={errorDe('fechaFin')}
                grande
              />
            </FormCardRow>
            <FormCardRow>
              <TextField
                label="Alias"
                placeholder="Ej. refugio.patitas.mp"
                autoCapitalize="none"
                value={alias}
                onChangeText={setAlias}
                maxLength={LIM.alias.max}
                error={errorDe('alias')}
                ayuda="Cargá el alias, el CBU/CVU o los dos."
                grande
              />
            </FormCardRow>
            <FormCardRow ultima>
              <TextField
                label="CBU / CVU"
                placeholder="22 números"
                keyboardType="number-pad"
                value={cbu}
                onChangeText={(texto) => setCbu(texto.replace(/[^\d\s]/g, ''))}
                error={errorDe('cbu')}
                grande
              />
            </FormCardRow>
          </FormCard>

          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              className="flex-1 items-center rounded-full bg-red-600 py-3.5 active:opacity-90"
            >
              <Text className="font-cuerpo-bold text-[16px] text-white">Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: guardando, busy: guardando }}
              disabled={guardando}
              onPress={() => void confirmar()}
              className={`flex-1 items-center rounded-full bg-emerald-600 py-3.5 active:opacity-90 ${guardando ? 'opacity-60' : ''}`}
            >
              <Text className="font-cuerpo-bold text-[16px] text-white">
                {guardando ? 'Creando…' : 'Confirmar'}
              </Text>
            </Pressable>
          </View>
        </FormularioConTeclado>
      </SafeAreaView>
    </View>
  );
}
