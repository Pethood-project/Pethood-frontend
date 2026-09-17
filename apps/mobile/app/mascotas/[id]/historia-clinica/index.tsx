/**
 * HU-8.2 Acceder a historia clínica — GUI-18 Historia Clínica.
 *
 * Lista el historial médico de una mascota propia o del refugio (HU-8.2) y da acceso al
 * alta (HU-8.1, botón flotante) y al detalle de cada registro (HU-8.3).
 */
import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useSesion } from '@/hooks/useSesion';
import { obtenerMiMascota, type Mascota } from '@/services/mascotas';
import { listarHistorial, type HistoriaClinica } from '@/services/historia-clinica';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

function TarjetaRegistro({
  registro,
  onPress,
}: {
  registro: HistoriaClinica;
  onPress: () => void;
}) {
  const fecha = parsearFecha(registro.fechaVisita);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver registro ${registro.titulo}`}
      onPress={onPress}
      className="mb-3 flex-row overflow-hidden rounded-2xl bg-white shadow-sm active:opacity-80"
    >
      <View
        className={`w-11 items-center justify-center ${
          registro.documentoUrl ? 'bg-pethood-orange' : 'bg-gray-100'
        }`}
      >
        <Ionicons
          name={registro.documentoUrl ? 'document-text' : 'medical-outline'}
          size={18}
          color={registro.documentoUrl ? '#FFFFFF' : '#9CA3AF'}
        />
      </View>

      <View className="flex-1 justify-center px-3 py-2.5">
        <Text className="text-sm font-bold text-gray-900">{registro.titulo}</Text>
        <Text className="mt-0.5 text-xs text-gray-500">
          Fecha visita: {fecha ? aFechaVisible(fecha) : '—'}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-3">
          {registro.requiereRevision ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={13} color="#3f7a43" />
              <Text className="text-[11px] font-medium text-emerald-700">Requiere revisión</Text>
            </View>
          ) : null}

          {registro.vacunacion ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="shield-checkmark-outline" size={13} color="#FF9D5C" />
              <Text className="text-[11px] font-medium text-pethood-orange">Vacuna</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="items-center justify-center pr-3">
        <Ionicons name="chevron-forward" size={18} color="#C3B69E" />
      </View>
    </Pressable>
  );
}

export default function HistoriaClinicaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mascotaId = Number(id);
  const { esRefugio } = useSesion();

  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [registros, setRegistros] = useState<HistoriaClinica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(mascotaId) || mascotaId <= 0) {
      setError('El id de la mascota no es válido.');
      setCargando(false);
      return;
    }

    try {
      setError(null);
      const [mascotaCargada, historial] = await Promise.all([
        obtenerMiMascota(mascotaId, esRefugio ? 'REFUGIO' : 'PERSONAL'),
        listarHistorial(mascotaId),
      ]);

      if (!mascotaCargada) {
        setError('La mascota no existe o no tenés acceso a ella.');
        return;
      }

      setMascota(mascotaCargada);
      setRegistros(historial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar la historia clínica.');
    } finally {
      setCargando(false);
    }
  }, [mascotaId, esRefugio]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white/70 px-4 py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-80"
          >
            <Ionicons name="chevron-back" size={20} color="#4B5563" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-xl font-bold text-pethood-orange">Historia Clínica</Text>
            {mascota ? (
              <Text className="text-xs text-gray-500">
                {[mascota.nombre, mascota.especie.nombre].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : error ? (
          <EstadoError
            mensaje={error}
            icono="alert-circle-outline"
            onAccion={() => {
              setCargando(true);
              void cargar();
            }}
          />
        ) : registros.length === 0 ? (
          <EstadoVacio
            icono="medical-outline"
            titulo="Sin historias clínicas"
            descripcion="Esta mascota no tiene historias clínicas cargadas"
          />
        ) : (
          <FlatList
            data={registros}
            keyExtractor={(registro) => String(registro.id)}
            renderItem={({ item }) => (
              <TarjetaRegistro
                registro={item}
                onPress={() =>
                  router.push({
                    pathname: '/mascotas/[id]/historia-clinica/[registroId]',
                    params: { id: mascotaId, registroId: item.id },
                  })
                }
              />
            )}
            contentContainerClassName="px-4 py-4 pb-28"
          />
        )}

        <Link
          href={{ pathname: '/mascotas/[id]/historia-clinica/nuevo', params: { id: mascotaId } }}
          asChild
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Registrar historia clínica"
            className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-pethood-orange shadow-lg active:opacity-90"
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </Pressable>
        </Link>
      </SafeAreaView>
    </View>
  );
}
