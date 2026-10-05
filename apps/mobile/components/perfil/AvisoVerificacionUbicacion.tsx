/**
 * Bloque de verificación de la dirección en Datos personales / Datos del refugio.
 *
 * Cuando los tres campos están completos, el backend geocodifica (preview) y acá se muestra el
 * link de Google Maps para que el usuario lo abra y confirme que el pin es correcto. Si no lo
 * es, puede corregir el link a mano.
 *
 * También lo usa el alta de un aviso de mascota perdida para el lugar donde se perdió o se
 * encontró: los textos que hablan de "tu dirección" se cambian con `textos`.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { DialogoLinkMapa } from '@/components/perfil/DialogoLinkMapa';
import { PALETA } from '@/constants/theme';
import type { UbicacionPreview } from '@/types/auth';

export interface TextosVerificacionUbicacion {
  /** Lo que se ve mientras faltan campos para ubicar la dirección. */
  incompleta: string;
  verificada: string;
  /** Lo que explica el diálogo de corregir el link a mano. */
  dialogoMensaje: string;
  dialogoDetalle: string;
}

const TEXTOS_PERFIL: TextosVerificacionUbicacion = {
  incompleta: 'Completá provincia, localidad y calle y altura para ubicar tu dirección en el mapa.',
  verificada: 'Dirección verificada',
  dialogoMensaje: 'Pegá el link de Google Maps de tu ubicación.',
  dialogoDetalle: 'Con ese link calculamos la distancia entre vos y el refugio.',
};

interface AvisoVerificacionUbicacionProps {
  ubicacion: UbicacionPreview | null;
  cargando: boolean;
  error: string | null;
  verificada: boolean;
  onVerificar: () => void;
  onGuardarManual: (mapaUrl: string) => Promise<void>;
  /** Por defecto, los del perfil. */
  textos?: TextosVerificacionUbicacion;
}

export function AvisoVerificacionUbicacion({
  ubicacion,
  cargando,
  error,
  verificada,
  onVerificar,
  onGuardarManual,
  textos = TEXTOS_PERFIL,
}: AvisoVerificacionUbicacionProps) {
  const [editandoManual, setEditandoManual] = useState(false);
  // Link cargado a mano: pisa al geocodificado mientras la dirección no cambie.
  const [linkManual, setLinkManual] = useState<string | null>(null);

  const mapaUrl = linkManual ?? ubicacion?.mapaUrl ?? null;

  // Si cambia la dirección, el preview es otro: el link manual deja de aplicar.
  useEffect(() => {
    setLinkManual(null);
  }, [ubicacion?.mapaUrl]);

  const guardarManual = async (nuevoLink: string): Promise<void> => {
    await onGuardarManual(nuevoLink);
    setLinkManual(nuevoLink);
  };

  return (
    <View className="mt-1 rounded-2xl border border-organic-neutral-300 bg-organic-neutral-100 p-3.5">
      <Text className="font-cuerpo-bold text-[11px] uppercase tracking-wider text-organic-neutral-500">
        Ubicación en el mapa
      </Text>

      {cargando ? (
        <View className="mt-2 flex-row items-center gap-2">
          <ActivityIndicator size="small" color={PALETA.accent[600]} />
          <Text className="font-cuerpo text-[14px] text-organic-neutral-600">
            Buscando la ubicación…
          </Text>
        </View>
      ) : error ? (
        <View className="mt-2">
          <View className="flex-row items-start gap-2">
            <Ionicons name="alert-circle-outline" size={18} color={PALETA.estado.advertencia} />
            <Text className="flex-1 font-cuerpo text-[14px] text-organic-neutral-700">{error}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditandoManual(true)}
            className="mt-2 flex-row items-center gap-1.5 self-start rounded-full bg-organic-accent-100 px-3 py-1.5 active:opacity-70"
          >
            <Ionicons name="pencil" size={14} color={PALETA.accent[700]} />
            <Text className="font-cuerpo-semi text-[13px] text-organic-accent-700">
              Corregir el link a mano
            </Text>
          </Pressable>
        </View>
      ) : ubicacion && mapaUrl ? (
        <View className="mt-2">
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Ver la ubicación en Google Maps"
            onPress={() => void Linking.openURL(mapaUrl)}
            className="flex-row items-center gap-1.5 active:opacity-70"
          >
            <Ionicons name="location" size={17} color={PALETA.accent[600]} />
            <Text className="flex-1 font-cuerpo-semi text-[15px] text-organic-accent-700">
              Ver en el mapa
            </Text>
          </Pressable>

          {verificada ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Ionicons name="checkmark-circle" size={18} color={PALETA.estado.exito} />
              <Text className="flex-1 font-cuerpo-semi text-[14px] text-emerald-700">
                {textos.verificada}
              </Text>
            </View>
          ) : (
            <>
              <View className="mt-2 flex-row items-start gap-2">
                <Ionicons name="alert-circle-outline" size={18} color={PALETA.estado.advertencia} />
                <Text className="flex-1 font-cuerpo text-[14px] text-organic-neutral-700">
                  Verificá que el pin sea el correcto. Si no lo es, corregí el link a mano.
                </Text>
              </View>
              <View className="mt-2 flex-row items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  onPress={onVerificar}
                  className="flex-row items-center gap-1.5 rounded-full bg-organic-accent-600 px-3.5 py-2 active:opacity-80"
                >
                  <Ionicons name="checkmark" size={15} color={PALETA.blanco} />
                  <Text className="font-cuerpo-semi text-[13px] text-white">Verificar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setEditandoManual(true)}
                  className="flex-row items-center gap-1.5 rounded-full border border-organic-neutral-300 px-3.5 py-2 active:opacity-70"
                >
                  <Ionicons name="pencil" size={14} color={PALETA.accent[700]} />
                  <Text className="font-cuerpo-semi text-[13px] text-organic-accent-700">
                    Corregir a mano
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      ) : (
        <Text className="mt-2 font-cuerpo text-[14px] text-organic-neutral-500">
          {textos.incompleta}
        </Text>
      )}

      <DialogoLinkMapa
        visible={editandoManual}
        valorInicial={mapaUrl}
        mensaje={textos.dialogoMensaje}
        detalle={textos.dialogoDetalle}
        onGuardar={guardarManual}
        onCerrar={() => setEditandoManual(false)}
      />
    </View>
  );
}