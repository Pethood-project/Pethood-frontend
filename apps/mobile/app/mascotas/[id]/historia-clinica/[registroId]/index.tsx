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
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
      <Text className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
        {etiqueta}
      </Text>
      <Text className="mt-1 text-[15px] text-gray-800">{valor}</Text>
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
      <View className="flex-1 bg-white">
        <EstadoCargando />
      </View>
    );
  }

  if (error || !registro) {
    return (
      <View className="flex-1 bg-white">
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
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="bg-pethood-orange px-4 pb-4 pt-2">
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => router.back()}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/20 active:opacity-80"
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </Pressable>

            <View className="flex-1">
              <Text className="text-lg font-bold text-white" numberOfLines={1}>
                {registro.titulo}
              </Text>
              <Text className="text-xs text-white/80">Registro #{registro.id}</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
          <View className="overflow-hidden rounded-2xl border border-gray-100">
            <View className="border-b border-gray-100 p-3.5">
              <Dato
                etiqueta="Fecha visita"
                valor={fechaVisita ? aFechaVisible(fechaVisita) : '—'}
              />
            </View>

            <View className="flex-row gap-3 border-b border-gray-100 p-3.5">
              <View className="flex-1">
                <Text className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                  Requiere revisión
                </Text>
                <View className="mt-1.5 flex-row items-center gap-1.5">
                  <Ionicons
                    name={registro.requiereRevision ? 'checkmark-circle' : 'close-circle-outline'}
                    size={16}
                    color={registro.requiereRevision ? '#3f7a43' : '#9CA3AF'}
                  />
                  <Text
                    className={`text-sm font-semibold ${
                      registro.requiereRevision ? 'text-emerald-700' : 'text-gray-500'
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
              <View className="flex-row items-center gap-1.5 border-b border-gray-100 bg-orange-50/60 px-3.5 py-2.5">
                <Ionicons name="shield-checkmark-outline" size={14} color="#E0742E" />
                <Text className="text-xs font-semibold text-pethood-orange">
                  Vacuna — visible en la ficha de la mascota
                </Text>
              </View>
            ) : null}

            <View className="border-b border-gray-100 p-3.5">
              <Text className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                Descripción
              </Text>
              <Text className="mt-1 text-[13px] leading-5 text-gray-700">
                {registro.descripcion}
              </Text>
            </View>

            <View className="p-3.5">
              <Text className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                Documentos
              </Text>

              {registro.documentoUrl ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver comprobante médico"
                  onPress={() => void abrirDocumento()}
                  className="flex-row items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 active:opacity-80"
                >
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-pethood-orange">
                    <Ionicons name="document-text" size={16} color="#FFFFFF" />
                  </View>
                  <Text className="flex-1 text-xs font-semibold text-gray-800" numberOfLines={1}>
                    {nombreDocumento(registro.documentoUrl)}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#C3B69E" />
                </Pressable>
              ) : (
                <Text className="text-xs text-gray-400">Sin documentos adjuntos</Text>
              )}
            </View>
          </View>

          {puedeGestionar ? (
            <View className="mt-5 flex-row gap-2.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Eliminar registro"
                onPress={() => setConfirmarEliminar(true)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 active:opacity-80"
              >
                <Ionicons name="trash-outline" size={16} color="#C0392B" />
                <Text className="text-base font-semibold text-red-700">Eliminar</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Modificar datos"
                onPress={() =>
                  router.push({
                    pathname: '/mascotas/[id]/historia-clinica/[registroId]/editar',
                    params: { id: mascotaId, registroId: registro.id },
                  })
                }
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-pethood-orange py-3.5 active:opacity-90"
              >
                <Ionicons name="pencil" size={16} color="#FFFFFF" />
                <Text className="text-base font-semibold text-white">Modificar</Text>
              </Pressable>
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
