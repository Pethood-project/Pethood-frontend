/**
 * HU-8.3 Modificar historia clínica.
 *
 * El backend nunca actualiza el registro persistido: da de baja el que se edita y crea uno
 * nuevo con los campos fusionados (`vacunacion` no es editable y siempre se arrastra). Por
 * eso el registro resultante tiene un id distinto al que se abrió acá.
 *
 * Edición parcial de verdad: se compara contra el registro original y solo viaja lo que
 * cambió, igual que en `mascotas/[id]/editar.tsx`.
 *
 * La validación de acá es solo para UX: la fuente de verdad es el backend, que además es
 * quien decide si el usuario tiene permiso para editar (HU-8.3, mensaje "No tenés permisos
 * para editar este registro").
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DateField } from '@/components/ui/DateField';
import { DocumentField, type DocumentoElegido } from '@/components/ui/DocumentField';
import { FormCard, FormCardColumns, FormCardRow } from '@/components/ui/FormCard';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { ToggleField } from '@/components/ui/ToggleField';
import { useSesion } from '@/hooks/useSesion';
import {
  editarHistoriaClinica,
  obtenerHistoriaClinica,
  type CambiosHistoriaClinica,
  type HistoriaClinica,
} from '@/services/historia-clinica';
import { aFechaISO, parsearFecha, validarFechaFutura, validarFechaPasada } from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';

interface ErroresFormulario {
  fechaVisita?: string;
  fechaProxima?: string;
  titulo?: string;
  descripcion?: string;
}

const MANANA = new Date(new Date().setDate(new Date().getDate() + 1));

export default function EditarHistoriaClinicaScreen() {
  const { id, registroId } = useLocalSearchParams<{ id: string; registroId: string }>();
  const router = useRouter();
  const toast = useToast();
  const { usuario, esRefugio } = useSesion();

  const mascotaId = Number(id);
  const historiaClinicaId = Number(registroId);

  const [original, setOriginal] = useState<HistoriaClinica | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [sinPermiso, setSinPermiso] = useState(false);

  const [fechaVisita, setFechaVisita] = useState<Date | null>(null);
  const [fechaProxima, setFechaProxima] = useState<Date | null>(null);
  const [requiereRevision, setRequiereRevision] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [documento, setDocumento] = useState<DocumentoElegido | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [tocados, setTocados] = useState<Partial<Record<keyof ErroresFormulario, boolean>>>({});
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  useEffect(() => {
    const cargar = async (): Promise<void> => {
      if (!Number.isInteger(historiaClinicaId) || historiaClinicaId <= 0) {
        setErrorCarga('El registro no es válido.');
        setCargando(false);
        return;
      }

      try {
        const registro = await obtenerHistoriaClinica(historiaClinicaId);

        const permitido = esRefugio || registro.usuarioAlta === usuario?.id;
        if (!permitido) {
          setSinPermiso(true);
          return;
        }

        setOriginal(registro);
        setFechaVisita(parsearFecha(registro.fechaVisita));
        setFechaProxima(parsearFecha(registro.fechaProxima));
        setRequiereRevision(registro.requiereRevision);
        setTitulo(registro.titulo);
        setDescripcion(registro.descripcion);
      } catch (err) {
        setErrorCarga(err instanceof Error ? err.message : 'No pudimos cargar el registro.');
      } finally {
        setCargando(false);
      }
    };

    void cargar();
  }, [historiaClinicaId, esRefugio, usuario?.id]);

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

  const cambios = useMemo<CambiosHistoriaClinica>(() => {
    if (!original) return {};

    const resultado: CambiosHistoriaClinica = {};

    const fechaVisitaISO = fechaVisita ? aFechaISO(fechaVisita) : null;
    if (fechaVisitaISO && fechaVisitaISO !== original.fechaVisita) {
      resultado.fechaVisita = fechaVisitaISO;
    }

    const fechaProximaISO = fechaProxima ? aFechaISO(fechaProxima) : null;
    if (fechaProximaISO && fechaProximaISO !== original.fechaProxima) {
      resultado.fechaProxima = fechaProximaISO;
    }

    if (requiereRevision !== original.requiereRevision) {
      resultado.requiereRevision = requiereRevision;
    }

    const tituloLimpio = titulo.trim();
    if (tituloLimpio !== original.titulo) resultado.titulo = tituloLimpio;

    const descripcionLimpia = descripcion.trim();
    if (descripcionLimpia !== original.descripcion) resultado.descripcion = descripcionLimpia;

    if (documento) {
      resultado.documento = { uri: documento.uri, nombre: documento.nombre, tipo: documento.tipo };
    }

    return resultado;
  }, [original, fechaVisita, fechaProxima, requiereRevision, titulo, descripcion, documento]);

  const hayCambios = Object.keys(cambios).length > 0;

  const errorDe = (campo: keyof ErroresFormulario): string | undefined =>
    mostrarErrores || tocados[campo] ? errores[campo] : undefined;

  const marcarTocado = (campo: keyof ErroresFormulario): void =>
    setTocados((previos) => ({ ...previos, [campo]: true }));

  const volver = (): void => {
    if (hayCambios) {
      setConfirmarSalida(true);
      return;
    }
    router.back();
  };

  const explicarQueFalta = (): void => {
    setMostrarErrores(true);

    if (formularioValido && !hayCambios) {
      toast.mostrarAdvertencia('Todavía no cambiaste nada.');
      return;
    }

    toast.mostrarAdvertencia('Revisá los campos marcados en rojo.');
  };

  const guardar = async (): Promise<void> => {
    setMostrarErrores(true);
    if (!formularioValido || !hayCambios || !original) return;

    setGuardando(true);
    try {
      await editarHistoriaClinica(original.id, cambios);

      toast.mostrarExito('Modificación realizada con éxito');
      router.replace({
        pathname: '/mascotas/[id]/historia-clinica',
        params: { id: mascotaId },
      });
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos guardar los cambios. Intentalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View className="flex-1 bg-pethood-beige">
        <EstadoCargando />
      </View>
    );
  }

  if (sinPermiso) {
    return (
      <View className="flex-1 bg-pethood-beige">
        <SafeAreaView className="flex-1" edges={['top']}>
          <EstadoError
            mensaje="No tenés permisos para editar este registro"
            icono="lock-closed-outline"
            etiquetaAccion="Volver"
            onAccion={() => router.back()}
          />
        </SafeAreaView>
      </View>
    );
  }

  if (errorCarga || !original) {
    return (
      <View className="flex-1 bg-pethood-beige">
        <SafeAreaView className="flex-1" edges={['top']}>
          <EstadoError
            mensaje={errorCarga ?? 'No encontramos el registro.'}
            icono="alert-circle-outline"
            etiquetaAccion="Volver"
            onAccion={() => router.back()}
          />
        </SafeAreaView>
      </View>
    );
  }

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
            <Ionicons name="chevron-back" size={20} color="#4B5563" />
          </Pressable>

          <Text className="text-2xl font-bold text-pethood-orange">Modificar registro</Text>
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
                <DocumentField
                  documento={documento}
                  onChange={setDocumento}
                  urlExistente={original.documentoUrl}
                  nombreExistente={original.documentoUrl?.split('/').pop()}
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
