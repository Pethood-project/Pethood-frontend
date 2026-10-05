/**
 * Modal de alta de reseña (HU-10.1 a HU-10.4). El backend deriva autor y receptor de la
 * transacción, así que acá solo se eligen puntuación (obligatoria, 1-5) y comentario
 * (opcional). El texto se adapta al flujo: adoptante→refugio, refugio→adoptante,
 * refugio→tránsito y adoptante→adoptante.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { Estrellas } from '@/components/resenas/Estrellas';
import { TextAreaField } from '@/components/ui/TextAreaField';
import type { FlujoResena, TransaccionElegible } from '@/services/resenas';
import { LIMITES } from '@/shared/validation/limits';

interface ResenaModalProps {
  /** `null` = modal cerrado. */
  transaccion: TransaccionElegible | null;
  enviando: boolean;
  onEnviar: (puntuacion: number, comentario: string) => void;
  onCerrar: () => void;
}

/** Cómo se cuenta cada flujo. La contraparte es el receptor de la reseña. */
function textosDe(flujo: FlujoResena, contraparte: string, mascota: string) {
  switch (flujo) {
    case 'ADOPTANTE_A_REFUGIO':
      return {
        titulo: `Valorá a ${contraparte}`,
        ayuda: `Contá cómo fue tu experiencia al adoptar a ${mascota}.`,
      };
    case 'REFUGIO_A_ADOPTANTE':
      return {
        titulo: `Valorá a ${contraparte}`,
        ayuda: `¿Cómo fue ${contraparte} como adoptante de ${mascota}?`,
      };
    case 'REFUGIO_A_TRANSITO':
      return {
        titulo: `Valorá a ${contraparte}`,
        ayuda: `¿Cómo fue ${contraparte} como hogar de tránsito de ${mascota}?`,
      };
    default:
      return {
        titulo: `Valorá a ${contraparte}`,
        ayuda: `Contá cómo fue tu experiencia con ${contraparte}.`,
      };
  }
}

export function ResenaModal({ transaccion, enviando, onEnviar, onCerrar }: ResenaModalProps) {
  const insets = useSafeAreaInsets();
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');

  // Cada apertura arranca en blanco: no hay que arrastrar la reseña anterior.
  useEffect(() => {
    if (transaccion) {
      setPuntuacion(0);
      setComentario('');
    }
  }, [transaccion]);

  const mascota = transaccion?.mascota.nombre ?? 'la mascota';
  const textos = transaccion
    ? textosDe(transaccion.flujo, transaccion.contraparte.nombre, mascota)
    : { titulo: '', ayuda: '' };

  return (
    <Modal
      visible={transaccion !== null}
      animationType="fade"
      transparent
      onRequestClose={onCerrar}
    >
      <View className="flex-1 justify-center bg-black/40 px-4" style={{ paddingTop: insets.top }}>
        <View className="overflow-hidden rounded-3xl bg-organic-neutral-100">
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text className="font-titulo text-[22px] leading-[26px] text-organic-accent-600">
              {textos.titulo}
            </Text>
            <Text className="mt-2 font-cuerpo text-[14px] leading-5 text-organic-neutral-600">
              {textos.ayuda}
            </Text>

            <View className="mt-5 items-center">
              <Estrellas
                valor={puntuacion}
                tamanio={40}
                interactivo
                onChange={setPuntuacion}
                etiqueta="Elegí una puntuación de 1 a 5 estrellas"
              />
              <Text className="mt-2 font-cuerpo-semi text-[13px] text-organic-neutral-600">
                {puntuacion === 0
                  ? 'Tocá las estrellas para puntuar'
                  : `${puntuacion} de 5`}
              </Text>
            </View>

            <View className="mt-5">
              <TextAreaField
                label="Comentario (opcional)"
                placeholder="Contá un poco más, si querés."
                maximo={LIMITES.resena.comentario.max}
                value={comentario}
                onChangeText={setComentario}
                editable={!enviando}
              />
            </View>
          </ScrollView>

          <View
            className="flex-row gap-2.5 border-t border-organic-neutral-200 bg-organic-neutral-100 px-5 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={onCerrar}
              disabled={enviando}
              className="flex-1 items-center justify-center rounded-2xl border border-organic-neutral-300 bg-organic-surface py-3.5 active:opacity-80"
            >
              <Text className="font-cuerpo-semi text-base text-organic-neutral-700">Cancelar</Text>
            </Pressable>

            <View className="flex-1">
              <CustomButton
                title="Publicar reseña"
                variant="acento"
                loading={enviando}
                disabled={puntuacion === 0}
                onPress={() => onEnviar(puntuacion, comentario)}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
