/**
 * "Compartir una mascota": la lista de mascotas que se pueden compartir en esta conversación,
 * para elegir una. Se abre desde la hoja "Enviar en el chat".
 *
 * Qué aparece depende de quién comparte, y la regla la aplica el backend:
 *
 * - **Como persona**, las que tiene **en favoritos** y que son **de su contacto** (de ese
 *   refugio, o personales de esa persona): "me interesa esta tuya".
 * - **Como refugio**, las **mascotas publicadas del refugio**: "mirá esta otra que podés
 *   adoptar". El refugio no tiene favoritos.
 *
 * Acá sólo cambian los textos del subtítulo y del estado vacío.
 *
 * Mismo estilo que `HojaOpciones` (artboard 38): velo, tarjeta redondeada abajo y título en
 * Caprasimo. Cada fila es una mascota con su foto, como las de Favoritos. Estados de carga,
 * vacío y error, como todo listado de la app.
 */
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resumenMascota } from '@/constants/Mascotas';
import { PALETA } from '@/constants/theme';
import { ApiError, urlAbsoluta } from '@/services/api';
import { listarMascotasCompartibles, type MascotaEnChat } from '@/services/chats';

/** Lado de la foto de cada fila. */
const FOTO = 52;
/** Cuánto de la pantalla puede ocupar la lista antes de scrollear. */
const FRACCION_ALTO_LISTA = 0.5;

interface HojaMascotasCompartiblesProps {
  visible: boolean;
  chatId: number;
  /** Para el subtítulo y el estado vacío: "de Huellitas del Sur". */
  nombreContacto: string;
  /** Comparte el refugio: la lista son sus mascotas publicadas, no favoritas. */
  vistaRefugio: boolean;
  onCerrar: () => void;
  onElegir: (mascota: MascotaEnChat) => void;
}

function FilaMascota({ mascota, onPress }: { mascota: MascotaEnChat; onPress: () => void }) {
  const foto = urlAbsoluta(mascota.imagenUrl);
  const nombre = mascota.nombre ?? mascota.especie;
  const resumen = resumenMascota(mascota);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Compartir a ${nombre}`}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-[17px] bg-organic-bg px-[11px] py-[9px] active:opacity-80"
    >
      <View
        style={{ width: FOTO, height: FOTO, borderRadius: 14 }}
        className="items-center justify-center overflow-hidden bg-organic-calido-naranja"
      >
        {foto ? (
          <Image
            source={{ uri: foto }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            accessibilityLabel={`Foto de ${nombre}`}
          />
        ) : (
          <Ionicons name="paw" size={22} color="rgba(255,255,255,0.75)" />
        )}
      </View>

      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-cuerpo-semi text-[15px] text-organic-neutral-900">
          {nombre}
        </Text>
        <Text numberOfLines={1} className="font-cuerpo text-[12px] text-organic-neutral-600">
          {[`${mascota.especie} · ${mascota.raza}`, resumen].filter(Boolean).join(' · ')}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={PALETA.neutral[500]} />
    </Pressable>
  );
}

export function HojaMascotasCompartibles({
  visible,
  chatId,
  nombreContacto,
  vistaRefugio,
  onCerrar,
  onElegir,
}: HojaMascotasCompartiblesProps) {
  const { height: altoPantalla } = useWindowDimensions();
  const [mascotas, setMascotas] = useState<MascotaEnChat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    setMascotas(null);
    setError(null);
    try {
      const respuesta = await listarMascotasCompartibles(chatId);
      setMascotas(respuesta.mascotas);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No pudimos cargar tus mascotas favoritas.',
      );
    }
  }, [chatId]);

  // Cada apertura vuelve a pedir la lista: los favoritos pueden haber cambiado desde la última.
  useEffect(() => {
    if (visible) void cargar();
  }, [visible, cargar]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android: sin esto el botón físico de retroceso no cierra la hoja.
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      {/* El velo cierra al tocarlo, que es lo que espera cualquiera frente a una hoja. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        onPress={onCerrar}
        style={{ backgroundColor: 'rgba(43,22,9,0.28)' }}
        className="flex-1 justify-end"
      >
        <SafeAreaView edges={['bottom']}>
          {/* Un Pressable sin acción frena el toque: tocar la hoja no la cierra. */}
          <Pressable
            onPress={() => undefined}
            style={{
              shadowColor: PALETA.accent[800],
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.18,
              shadowRadius: 20,
              elevation: 12,
            }}
            className="m-[11px] rounded-[27px] bg-organic-neutral-100 p-4"
          >
            <Text className="font-titulo text-[17px] text-organic-neutral-900">
              Compartir una mascota
            </Text>
            <Text className="mt-1 font-cuerpo text-[13px] text-organic-neutral-600">
              {vistaRefugio
                ? 'Las mascotas publicadas de tu refugio'
                : `Tus favoritas de ${nombreContacto}`}
            </Text>

            <View className="mt-3">
              {error ? (
                <View className="items-center gap-3 py-6">
                  <Text className="text-center font-cuerpo text-[14px] text-organic-neutral-700">
                    {error}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void cargar()}
                    className="rounded-full bg-organic-accent-600 px-5 py-2.5 active:opacity-85"
                  >
                    <Text className="font-cuerpo-semi text-[13px] text-white">Reintentar</Text>
                  </Pressable>
                </View>
              ) : mascotas === null ? (
                <View className="items-center py-8">
                  <ActivityIndicator color={PALETA.accent[600]} />
                </View>
              ) : mascotas.length === 0 ? (
                <View className="items-center gap-2 px-2 py-6">
                  <Ionicons
                    name={vistaRefugio ? 'paw-outline' : 'heart-outline'}
                    size={30}
                    color={PALETA.accent[600]}
                  />
                  <Text className="text-center font-cuerpo-semi text-[15px] text-organic-neutral-900">
                    {vistaRefugio
                      ? 'Tu refugio no tiene mascotas publicadas'
                      : 'No tenés mascotas para compartir'}
                  </Text>
                  <Text className="text-center font-cuerpo text-[13px] leading-[19px] text-organic-neutral-600">
                    {vistaRefugio
                      ? 'Publicá una mascota en adopción y vas a poder compartirla desde acá.'
                      : `Acá aparecen las mascotas de ${nombreContacto} que guardaste en Favoritos. Guardá alguna y volvé a intentarlo.`}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={{ maxHeight: altoPantalla * FRACCION_ALTO_LISTA }}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {mascotas.map((mascota) => (
                    <FilaMascota
                      key={mascota.id}
                      mascota={mascota}
                      onPress={() => onElegir(mascota)}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}
