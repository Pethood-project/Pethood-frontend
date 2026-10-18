/**
 * Modal de reporte (spec 008, HU-3.1 a HU-3.3): un solo campo, el motivo, de texto libre.
 * Sirve para cualquier `TipoReporte`; quien lo abre solo dice qué se reporta. El backend
 * decide si se puede (objeto propio, duplicado, tope de 5 pendientes) y su mensaje se
 * muestra tal cual.
 *
 * Con el teclado abierto la tarjeta sube y se recentra en lo que queda arriba, como
 * `ConfirmDialog`; si no entra, se achica y el scroll deja el motivo a la vista.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
// El de la librería y no el de React Native: con edge-to-edge en Android el nativo no se
// entera del teclado y no mueve nada.
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { CustomButton } from '@/components/CustomButton';
import { useToast } from '@/components/feedback/Toast';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { useCampoAlFinalVisible } from '@/hooks/useCampoAlFinalVisible';
import { useMargenesDeModal } from '@/hooks/useMargenesDeModal';
import { ApiError } from '@/services/api';
import { CODIGOS_REPORTE_ADVERTENCIA, crearReporte, type TipoReporte } from '@/services/reportes';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';

export interface ObjetoReportado {
  tipo: TipoReporte;
  objetoId: number;
}

interface ReporteModalProps {
  /** `null` = modal cerrado. */
  objeto: ObjetoReportado | null;
  onCerrar: () => void;
}

const TITULOS: Record<TipoReporte, string> = {
  PUBLICACION: 'Reportar publicación',
  USUARIO: 'Reportar persona',
  REFUGIO: 'Reportar refugio',
  RESENA: 'Reportar reseña',
  ANIMAL_PERDIDO: 'Reportar aviso',
  CAMPANIA: 'Reportar campaña',
  MENSAJE: 'Reportar mensaje',
};

export function ReporteModal({ objeto, onCerrar }: ReporteModalProps) {
  const margenes = useMargenesDeModal();
  const { scrollRef, propsScroll, propsCampo } = useCampoAlFinalVisible();
  const toast = useToast();
  const [motivo, setMotivo] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Cada apertura arranca en blanco.
  useEffect(() => {
    if (objeto) {
      setMotivo('');
      setIntentado(false);
    }
  }, [objeto]);

  const error = validarTexto(motivo, {
    ...LIMITES.reporte.motivo,
    etiqueta: 'El motivo',
    // Texto literal de REQUISITOS.md §5 (GUI-0.1.4).
    errorObligatorio: 'Este campo es obligatorio. Completalo para poder continuar.',
  });

  const enviar = async (): Promise<void> => {
    if (!objeto) return;
    setIntentado(true);
    if (error) return;

    setEnviando(true);
    try {
      await crearReporte(objeto.tipo, objeto.objetoId, motivo);
      toast.mostrarExito('¡Gracias por avisarnos! Recibimos tu reporte y un administrador lo va a revisar.');
      onCerrar();
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'No pudimos enviar el reporte. Intentalo de nuevo.';
      if (err instanceof ApiError && CODIGOS_REPORTE_ADVERTENCIA.includes(err.codigo)) {
        toast.mostrarAdvertencia(mensaje);
      } else {
        toast.mostrarError(mensaje);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    // `statusBarTranslucent`: el modal ocupa la pantalla entera también en Android, así el
    // teclado se mide contra el mismo alto que en el resto de la app.
    <Modal
      visible={objeto !== null}
      animationType="fade"
      transparent
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      {/* El velo va por fuera para que cubra toda la pantalla mientras la tarjeta sube. */}
      <View className="flex-1 bg-black/40">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <View
            className="flex-1 justify-center px-4"
            style={{ paddingTop: margenes.arriba + 8, paddingBottom: 8 }}
          >
            <View className="max-h-full overflow-hidden rounded-3xl bg-organic-neutral-100">
              <ScrollView
                ref={scrollRef}
                {...propsScroll}
                contentContainerStyle={{ padding: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                <Text className="font-titulo text-[22px] leading-[26px] text-organic-accent-600">
                  {objeto ? TITULOS[objeto.tipo] : ''}
                </Text>
                <Text className="mt-2 font-cuerpo text-[14px] leading-5 text-organic-neutral-600">
                  Ayudanos a cuidar a la comunidad. Contanos qué pasó y el equipo de PetHood lo va a revisar. Tu reporte es confidencial.
                </Text>
                {objeto?.tipo === 'MENSAJE' ? (
                  <Text className="mt-2 font-cuerpo-semi text-[13px] leading-5 text-organic-neutral-700">
                    Un administrador podrá ver este mensaje y los cercanos.
                  </Text>
                ) : null}

                <View className="mt-5">
                  <TextAreaField
                    label="Motivo"
                    obligatorio
                    placeholder="Contanos qué está mal y por qué."
                    maximo={LIMITES.reporte.motivo.max}
                    value={motivo}
                    onChangeText={setMotivo}
                    error={intentado && error ? error : undefined}
                    editable={!enviando}
                    {...propsCampo}
                  />
                </View>
              </ScrollView>

              <View className="flex-row gap-2.5 border-t border-organic-neutral-200 bg-organic-neutral-100 px-5 pb-4 pt-3">
                <Pressable
                  accessibilityRole="button"
                  onPress={onCerrar}
                  disabled={enviando}
                  className="flex-1 items-center justify-center rounded-2xl border border-organic-neutral-300 bg-organic-surface py-3.5 active:opacity-80"
                >
                  <Text className="font-cuerpo-semi text-base text-organic-neutral-700">
                    Cancelar
                  </Text>
                </Pressable>

                <View className="flex-1">
                  <CustomButton
                    title="Enviar reporte"
                    variant="acento"
                    loading={enviando}
                    onPress={() => void enviar()}
                  />
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
