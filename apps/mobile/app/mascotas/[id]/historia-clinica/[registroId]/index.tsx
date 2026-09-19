/**
 * HU-8.2 Acceder a historia clínica — GUI-19 Detalle Historia Clínica.
 *
 * HU-8.4 (eliminar) es una baja lógica simple, sin alta de reemplazo — a diferencia de
 * "Modificar" (HU-8.3), que da de baja y crea un registro nuevo.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PressableAnimado } from '@/components/ui/PressableAnimado';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { ApiError, urlAbsoluta } from '@/services/api';
import {
  eliminarHistoriaClinica,
  obtenerHistoriaClinica,
  type HistoriaClinica,
} from '@/services/historia-clinica';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

function nombreDocumento(url: string): string {
  return url.split('/').pop() ?? 'comprobante';
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View className="flex-1">
      <Text className="font-cuerpo-semi text-[11px] uppercase tracking-wide text-organic-neutral-500">
        {etiqueta}
      </Text>
      <Text className="mt-1 font-cuerpo text-lg text-organic-neutral-900">{valor}</Text>
    </View>
  );
}

export default function DetalleHistoriaClinicaScreen() {
  const { id, registroId } = useLocalSearchParams<{ id: string; registroId: string }>();
  const router = useRouter();
  const toast = useToast();
  const { usuario, esRefugio } = useSesion();

  const mascotaId = Number(id);
  const historiaClinicaId = Number(registroId);

  const [registro, setRegistro] = useState<HistoriaClinica | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(historiaClinicaId) || historiaClinicaId <= 0) {
      setError('El registro no es válido.');
      setCargando(false);
      return;
    }

    try {
      setError(null);
      setRegistro(await obtenerHistoriaClinica(historiaClinicaId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar el registro.');
    } finally {
      setCargando(false);
    }
  }, [historiaClinicaId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  // Refleja las reglas de HU-8.3/HU-8.4 (misma regla en el backend, `puedeGestionar`): el
  // refugio gestiona cualquier registro de sus mascotas; el adoptante solo el que él mismo
  // cargó. El backend vuelve a validarlo igual al guardar o eliminar.
  const puedeGestionar = esRefugio || registro?.usuarioAlta === usuario?.id;

  const abrirDocumento = async (): Promise<void> => {
    if (!registro?.documentoUrl) return;

    const url = urlAbsoluta(registro.documentoUrl);
    if (!url) return;

    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      toast.mostrarError('No pudimos abrir el documento.');
    }
  };

  const confirmarBaja = async (): Promise<void> => {
    if (!registro) return;

    setEliminando(true);
    try {
      await eliminarHistoriaClinica(registro.id);
      setConfirmarEliminar(false);
      toast.mostrarExito('Historia clínica eliminada con éxito');
      router.back();
    } catch (err) {
      setConfirmarEliminar(false);

      toast.mostrarError(
        err instanceof ApiError
          ? err.mensaje
          : 'No pudimos eliminar el registro. Intentalo de nuevo.',
      );
    } finally {
      setEliminando(false);
    }
  };

  if (cargando) {
    return (
      <View className="flex-1 bg-organic-neutral-100">
        <EstadoCargando />
      </View>
    );
  }

  if (error || !registro) {
    return (
      <View className="flex-1 bg-organic-neutral-100">
        <SafeAreaView className="flex-1" edges={['top']}>
          <EstadoError
            mensaje={error ?? 'No encontramos el registro.'}
            etiquetaAccion="Volver"
            onAccion={() => router.back()}
          />
        </SafeAreaView>
      </View>
    );
  }

  const fechaVisita = parsearFecha(registro.fechaVisita);
  const fechaProxima = parsearFecha(registro.fechaProxima);

  return (
    <View className="flex-1 bg-organic-neutral-100">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="bg-organic-accent-600 px-4 pb-5 pt-3">
          <View className="flex-row items-center gap-3">
            <PressableAnimado
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => router.back()}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="arrow-back" size={22} color={PALETA.blanco} />
            </PressableAnimado>

            <View className="flex-1">
              <Text className="font-titulo text-2xl text-white" numberOfLines={1}>
                {registro.titulo}
              </Text>
              <Text className="font-cuerpo text-sm text-white/80">Registro #{registro.id}</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
          <View className="overflow-hidden rounded-[22px] border border-organic-neutral-200 bg-organic-neutral-100">
            <View className="border-b border-organic-neutral-200 p-4">
              <Dato
                etiqueta="Fecha visita"
                valor={fechaVisita ? aFechaVisible(fechaVisita) : '—'}
              />
            </View>

            <View className="flex-row gap-3 border-b border-organic-neutral-200 p-4">
              <View className="flex-1">
                <Text className="font-cuerpo-semi text-[11px] uppercase tracking-wide text-organic-neutral-500">
                  Requiere revisión
                </Text>
                <View className="mt-2 flex-row items-center gap-2">
                  <Ionicons
                    name={registro.requiereRevision ? 'checkmark-circle' : 'close-circle-outline'}
                    size={20}
                    color={registro.requiereRevision ? PALETA.accent[700] : PALETA.neutral[400]}
                  />
                  <Text
                    className={`font-cuerpo-semi text-base ${
                      registro.requiereRevision
                        ? 'text-organic-accent-700'
                        : 'text-organic-neutral-500'
                    }`}
                  >
                    {registro.requiereRevision ? 'Sí' : 'No'}
                  </Text>
                </View>
              </View>

              <Dato
                etiqueta="Fecha próxima"
                valor={fechaProxima ? aFechaVisible(fechaProxima) : 'Sin definir'}
              />
            </View>

            {registro.vacunacion ? (
              <View className="flex-row items-center gap-2 border-b border-organic-neutral-200 bg-organic-accent-100 px-4 py-3">
                <Ionicons name="shield-checkmark-outline" size={18} color={PALETA.accent[700]} />
                <Text className="flex-1 font-cuerpo-semi text-sm text-organic-accent-700">
                  Vacuna — visible en la ficha de la mascota
                </Text>
              </View>
            ) : null}

            <View className="border-b border-organic-neutral-200 p-4">
              <Text className="font-cuerpo-semi text-[11px] uppercase tracking-wide text-organic-neutral-500">
                Descripción
              </Text>
              <Text className="mt-1.5 font-cuerpo text-base leading-6 text-organic-neutral-700">
                {registro.descripcion}
              </Text>
            </View>

            <View className="p-4">
              <Text className="mb-2 font-cuerpo-semi text-[11px] uppercase tracking-wide text-organic-neutral-500">
                Documentos
              </Text>

              {registro.documentoUrl ? (
                <PressableAnimado
                  accessibilityRole="button"
                  accessibilityLabel="Ver comprobante médico"
                  onPress={() => void abrirDocumento()}
                  escala={0.97}
                  className="flex-row items-center gap-3 rounded-2xl border border-organic-neutral-300 bg-organic-neutral-100 px-3.5 py-3"
                >
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-organic-accent-600">
                    <Ionicons name="document-text" size={20} color={PALETA.blanco} />
                  </View>
                  <Text
                    className="flex-1 font-cuerpo-semi text-sm text-organic-neutral-900"
                    numberOfLines={1}
                  >
                    {nombreDocumento(registro.documentoUrl)}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={PALETA.neutral[400]} />
                </PressableAnimado>
              ) : (
                <Text className="font-cuerpo text-sm text-organic-neutral-400">
                  Sin documentos adjuntos
                </Text>
              )}
            </View>
          </View>

          {puedeGestionar ? (
            <View className="mt-6 flex-row gap-3">
              <PressableAnimado
                accessibilityRole="button"
                accessibilityLabel="Eliminar registro"
                onPress={() => setConfirmarEliminar(true)}
                escala={0.96}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
                style={{ backgroundColor: PALETA.calido.amarilloClaro }}
              >
                <Ionicons name="trash-outline" size={20} color={PALETA.accent[800]} />
                <Text className="font-cuerpo-semi text-lg text-organic-accent-800">Eliminar</Text>
              </PressableAnimado>

              <PressableAnimado
                accessibilityRole="button"
                accessibilityLabel="Modificar datos"
                onPress={() =>
                  router.push({
                    pathname: '/mascotas/[id]/historia-clinica/[registroId]/editar',
                    params: { id: mascotaId, registroId: registro.id },
                  })
                }
                escala={0.96}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-organic-accent-600 py-4"
                style={{
                  shadowColor: PALETA.accent[800],
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 5 },
                  elevation: 6,
                }}
              >
                <Ionicons name="pencil" size={20} color={PALETA.blanco} />
                <Text className="font-cuerpo-semi text-lg text-white">Modificar</Text>
              </PressableAnimado>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmarEliminar}
        tono="peligro"
        titulo={`¿Eliminar "${registro.titulo}"?`}
        mensaje="Se va a quitar este registro de la historia clínica de la mascota."
        detalle="Esta acción no se puede deshacer desde la app."
        textoConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={() => void confirmarBaja()}
        onCerrar={() => setConfirmarEliminar(false)}
      />
    </View>
  );
}
