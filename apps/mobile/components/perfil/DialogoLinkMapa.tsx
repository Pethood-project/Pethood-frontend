/**
 * Diálogo para pegar/corregir a mano el link de Google Maps. Lo usan el lápiz de "Ubicación"
 * de Mi Perfil y el "corregir a mano" de Datos personales / Datos del refugio y del lugar de
 * un aviso de mascota perdida.
 */
import { useEffect, useState } from 'react';

import { useToast } from '@/components/feedback/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TextField } from '@/components/ui/TextField';
import { validarLinkMapa } from '@/lib/validacionRegistro';
import { ApiError } from '@/services/api';
import { LIMITES } from '@/shared/validation/limits';

interface DialogoLinkMapaProps {
  visible: boolean;
  valorInicial: string | null;
  /** Persiste el link. Debe lanzar (ApiError) si falla, para mostrar el motivo. */
  onGuardar: (mapaUrl: string) => Promise<void>;
  onCerrar: () => void;
  /** Qué link pegar y para qué sirve. Por defecto, los del perfil. */
  mensaje?: string;
  detalle?: string;
}

export function DialogoLinkMapa({
  visible,
  valorInicial,
  onGuardar,
  onCerrar,
  mensaje = 'Pegá el link de Google Maps de tu ubicación.',
  detalle = 'Con ese link calculamos la distancia entre vos y el refugio.',
}: DialogoLinkMapaProps) {
  const toast = useToast();
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);

  // Cada vez que se abre, arranca con el link actual; el error de la vez anterior no se arrastra.
  useEffect(() => {
    if (visible) {
      setLink(valorInicial ?? '');
      setError(undefined);
    }
  }, [visible, valorInicial]);

  const guardar = async (): Promise<void> => {
    const errorLink = validarLinkMapa(link);
    if (errorLink) {
      setError(errorLink);
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(link.trim());
      onCerrar();
      toast.mostrarExito('Ubicación actualizada');
    } catch (e) {
      setError(
        e instanceof ApiError ? e.mensaje : 'No pudimos guardar la ubicación. Revisá tu conexión.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ConfirmDialog
      visible={visible}
      tono="bloqueo"
      icono="location-outline"
      titulo="Editar ubicación"
      mensaje={mensaje}
      detalle={detalle}
      textoConfirmar="Guardar"
      cargando={guardando}
      onConfirmar={() => void guardar()}
      onCerrar={() => {
        if (!guardando) onCerrar();
      }}
    >
      <TextField
        label="Link de Google Maps"
        placeholder="https://maps.google.com/..."
        value={link}
        onChangeText={(valor) => {
          setLink(valor);
          if (error) setError(undefined);
        }}
        error={error}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        maxLength={LIMITES.usuario.mapaUrl.max}
        editable={!guardando}
      />
    </ConfirmDialog>
  );
}