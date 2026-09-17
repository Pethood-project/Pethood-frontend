/**
 * HU-8.1 Registrar historia clínica — GUI-20 Carga Historia Clínica.
 *
 * La validación de acá es solo para UX: la fuente de verdad es el backend.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { useToast } from '@/components/feedback/Toast';
import { DateField } from '@/components/ui/DateField';
import { DocumentField, type DocumentoElegido } from '@/components/ui/DocumentField';
import { FormCard, FormCardColumns, FormCardRow } from '@/components/ui/FormCard';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { ToggleField } from '@/components/ui/ToggleField';
import { crearHistoriaClinica } from '@/services/historia-clinica';
import { aFechaISO, validarFechaFutura, validarFechaPasada } from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';

interface ErroresFormulario {
  fechaVisita?: string;
  fechaProxima?: string;
  titulo?: string;
  descripcion?: string;
}

const ETIQUETAS: Record<keyof ErroresFormulario, string> = {
  fechaVisita: 'la fecha de visita',
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

  const [fechaVisita, setFechaVisita] = useState<Date | null>(null);
  const [fechaProxima, setFechaProxima] = useState<Date | null>(null);
  const [requiereRevision, setRequiereRevision] = useState(false);
  const [vacunacion, setVacunacion] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [documento, setDocumento] = useState<DocumentoElegido | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [tocados, setTocados] = useState<Partial<Record<keyof ErroresFormulario, boolean>>>({});

  const errores = useMemo<ErroresFormulario>(() => {
    const resultado: ErroresFormulario = {};

    const errorFecha = validarFechaPasada(fechaVisita, 'La fecha de visita');
    if (errorFecha) resultado.fechaVisita = errorFecha;

    const errorFechaProxima = validarFechaFutura(fechaProxima, 'La fecha próxima');
    if (errorFechaProxima) resultado.fechaProxima = errorFechaProxima;

    const errorTitulo = validarTexto(titulo, {
      ...LIMITES.historiaClinica.titulo,
      etiqueta: 'El título',
    });
    if (errorTitulo) resultado.titulo = errorTitulo;

    const errorDescripcion = validarTexto(descripcion, {
      ...LIMITES.historiaClinica.descripcion,
      etiqueta: 'La descripción',
    });
    if (errorDescripcion) resultado.descripcion = errorDescripcion;

    return resultado;
  }, [fechaVisita, fechaProxima, titulo, descripcion]);

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
      await crearHistoriaClinica(mascotaId, {
        fechaVisita: aFechaISO(fechaVisita),
        fechaProxima: fechaProxima ? aFechaISO(fechaProxima) : undefined,
        requiereRevision,
        vacunacion,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        documento: documento
          ? { uri: documento.uri, nombre: documento.nombre, tipo: documento.tipo }
          : undefined,
      });

      toast.mostrarExito('Historia clínica guardada con éxito');
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
            <Ionicons name="chevron-back" size={20} color="#4B5563" />
          </Pressable>

          <Text className="text-2xl font-bold text-pethood-orange">Nuevo registro</Text>
        </View>

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
            <FormCard>
              <FormCardRow>
                <TextField
                  label="Título del registro"
                  obligatorio
                  placeholder="Ej. Vacunación anual"
                  value={titulo}
                  onChangeText={setTitulo}
                  onBlur={() => marcarTocado('titulo')}
                  maxLength={LIMITES.historiaClinica.titulo.max}
                  error={errorDe('titulo')}
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
                  />
                </FormCardColumns>
              </FormCardRow>

              <FormCardRow>
                <ToggleField
                  label="Requiere revisión"
                  valor={requiereRevision}
                  onChange={setRequiereRevision}
                />
              </FormCardRow>

              <FormCardRow>
                <ToggleField label="¿Es vacuna?" valor={vacunacion} onChange={setVacunacion} />
                <Text className="mt-1.5 text-[10px] text-gray-400">
                  Se va a mostrar en la ficha de la mascota
                </Text>
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
                />
              </FormCardRow>

              <FormCardRow ultima>
                <DocumentField documento={documento} onChange={setDocumento} />
              </FormCardRow>
            </FormCard>

            <View className="mt-5">
              <CustomButton
                title="Guardar registro"
                loading={guardando}
                disabled={!formularioValido}
                onPress={() => void guardar()}
                onPressDeshabilitado={explicarQueFalta}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
