/**
 * HU-8.2 Acceder a historia clínica — GUI-18 Historia Clínica.
 *
 * Lista el historial médico de una mascota propia o del refugio (HU-8.2) y da acceso al
 * alta (HU-8.1, botón flotante) y al detalle de cada registro (HU-8.3).
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { PressableAnimado } from '@/components/ui/PressableAnimado';
import { PALETA } from '@/constants/theme';
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
    <PressableAnimado
      accessibilityRole="button"
      accessibilityLabel={`Ver registro ${registro.titulo}`}
      onPress={onPress}
      escala={0.97}
      className="mb-3.5 flex-row overflow-hidden rounded-[22px] bg-organic-neutral-100 shadow-sm"
    >
      <View
        className={`w-14 items-center justify-center ${
          registro.documentoUrl ? 'bg-organic-accent-600' : 'bg-organic-neutral-200'
        }`}
      >
        <Ionicons
          name={registro.documentoUrl ? 'document-text' : 'medical-outline'}
          size={24}
          color={registro.documentoUrl ? PALETA.blanco : PALETA.neutral[400]}
        />
      </View>

      <View className="flex-1 justify-center px-4 py-3.5">
        <Text className="font-cuerpo-bold text-base text-organic-neutral-900">
          {registro.titulo}
        </Text>
        <Text className="mt-1 font-cuerpo text-sm text-organic-neutral-600">
          Fecha visita: {fecha ? aFechaVisible(fecha) : '—'}
        </Text>

        <View className="mt-2 flex-row items-center gap-3">
          {registro.requiereRevision ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="checkmark-circle" size={17} color={PALETA.accent[700]} />
              <Text className="font-cuerpo-semi text-xs text-organic-accent-700">
                Requiere revisión
              </Text>
            </View>
          ) : null}

          {registro.vacunacion ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="shield-checkmark-outline" size={17} color={PALETA.accent[600]} />
              <Text className="font-cuerpo-semi text-xs text-organic-accent-600">Vacuna</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="items-center justify-center pr-4">
        <Ionicons name="chevron-forward" size={22} color={PALETA.neutral[400]} />
      </View>
    </PressableAnimado>
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
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 border-b border-organic-neutral-300 bg-organic-neutral-100 px-4 py-4">
          <PressableAnimado
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            hitSlop={8}
            className="h-12 w-12 items-center justify-center rounded-full border border-organic-neutral-300 bg-organic-neutral-100"
          >
            <Ionicons name="arrow-back" size={22} color={PALETA.neutral[700]} />
          </PressableAnimado>

          <View className="flex-1">
            <Text className="font-titulo text-[26px] leading-8 text-organic-accent-600">
              Historia Clínica
            </Text>
            {mascota ? (
              <Text className="font-cuerpo text-sm text-organic-neutral-600">
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

        <PressableAnimado
          accessibilityRole="button"
          accessibilityLabel="Registrar historia clínica"
          onPress={() =>
            router.push({
              pathname: '/mascotas/[id]/historia-clinica/nuevo',
              params: { id: mascotaId },
            })
          }
          escala={0.92}
          className="absolute bottom-6 right-6 h-[72px] w-[72px] items-center justify-center rounded-full bg-organic-accent-600 shadow-lg"
          style={{
            shadowColor: PALETA.accent[800],
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={38} color={PALETA.blanco} />
        </PressableAnimado>
      </SafeAreaView>
    </View>
  );
}
