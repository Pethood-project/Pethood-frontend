/**
 * La nota privada de quien publicó sobre esta solicitud: un solo texto editable donde dejar
 * constancia de lo hablado o de por qué se decidió algo. La ven y la editan todos los de ese
 * lado; el solicitante nunca la recibe. No guarda historial ni autor: gana lo último escrito.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { CustomButton } from '@/components/CustomButton';
import { useToast } from '@/components/feedback/Toast';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { guardarNota, type SolicitudDetalle } from '@/services/solicitudes';
import { LIMITES } from '@/shared/validation/limits';

interface NotaRefugioProps {
  solicitudId: number;
  /** Lo guardado hasta ahora, o `null` si todavía no hay nota. */
  notaGuardada: string | null;
  onGuardada: (solicitud: SolicitudDetalle) => void;
}

export function NotaRefugio({ solicitudId, notaGuardada, onGuardada }: NotaRefugioProps) {
  const toast = useToast();
  const [texto, setTexto] = useState(notaGuardada ?? '');
  const [guardando, setGuardando] = useState(false);

  const modificada = texto.trim() !== (notaGuardada ?? '').trim();

  // Si la solicitud se recarga con otra nota (alguien más del refugio la editó), se refleja,
  // salvo que se esté escribiendo algo: lo que está en el teclado no se pisa.
  useEffect(() => {
    setTexto((actual) => (actual.trim() === '' || !modificada ? (notaGuardada ?? '') : actual));
    // `modificada` se calcula con el valor que se está reemplazando; solo importa la nota nueva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notaGuardada]);

  const guardar = async (): Promise<void> => {
    setGuardando(true);

    try {
      const actualizada = await guardarNota(solicitudId, texto);
      onGuardada(actualizada);
      toast.mostrarExito('Guardamos tu nota.');
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos guardar la nota. Intentalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View className="gap-3">
      <TextAreaField
        label="Nota del refugio"
        placeholder="Anotá lo que hablaron o lo que te hizo decidir. Solo la ven quienes gestionan esta solicitud."
        value={texto}
        onChangeText={setTexto}
        maximo={LIMITES.solicitud.nota.max}
        variante="pregunta"
        altoMinimo={96}
        editable={!guardando}
      />

      {modificada ? (
        <CustomButton
          title="Guardar nota"
          variant="acento-borde"
          loading={guardando}
          onPress={() => void guardar()}
        />
      ) : null}
    </View>
  );
}
