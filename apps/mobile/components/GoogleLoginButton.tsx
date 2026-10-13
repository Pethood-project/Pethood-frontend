import { useState } from 'react';

import { CustomButton, FORMA_BOTON_ORGANIC } from '@/components/CustomButton';
import { enExpoGo, googleHabilitado, pedirIdTokenGoogle } from '@/lib/googleAuth';
import { ApiError } from '@/services/api';
import { loginGoogle } from '@/services/auth';
import type { Usuario } from '@/types/auth';

interface GoogleLoginButtonProps {
  onSuccess: (token: string, usuario: Usuario) => Promise<void>;
  onError: (mensaje: string) => void;
}

const ERROR_GENERICO = 'No pudimos iniciar sesión con Google. Intentalo de nuevo.';

function avisoNoDisponible(): string | null {
  if (!googleHabilitado()) {
    return 'El login con Google todavía no está configurado. Pedile al equipo el EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.';
  }
  if (enExpoGo) return 'El login con Google funciona en la app instalada, no en Expo Go.';
  return null;
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  async function iniciar() {
    const aviso = avisoNoDisponible();
    if (aviso) {
      onError(aviso);
      return;
    }

    setLoading(true);
    try {
      const idToken = await pedirIdTokenGoogle();
      if (!idToken) return; // canceló el selector de cuentas
      const respuesta = await loginGoogle(idToken);
      await onSuccess(respuesta.token, respuesta.usuario);
    } catch (error) {
      onError(error instanceof ApiError ? error.mensaje : ERROR_GENERICO);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CustomButton
      title="Continuar con Google"
      variant="acento-borde"
      grande
      style={FORMA_BOTON_ORGANIC}
      loading={loading}
      onPress={() => void iniciar()}
    />
  );
}
