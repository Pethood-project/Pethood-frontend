import { useEffect, useState } from 'react';

import { CustomButton } from '@/components/CustomButton';
import { googleHabilitado, useGoogleIdToken } from '@/lib/googleAuth';
import { ApiError } from '@/services/api';
import { loginGoogle } from '@/services/auth';
import type { Usuario } from '@/types/auth';

interface GoogleLoginButtonProps {
  onSuccess: (token: string, usuario: Usuario) => Promise<void>;
  onError: (mensaje: string) => void;
}

function GoogleLoginButtonConfigured({ onSuccess, onError }: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [request, googleResponse, promptAsync] = useGoogleIdToken();

  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type !== 'success') {
      setLoading(false);
      if (googleResponse.type === 'error') {
        onError('No pudimos iniciar sesión con Google. Intentalo de nuevo.');
      }
      return;
    }

    const idToken =
      googleResponse.params.id_token ?? googleResponse.authentication?.idToken ?? undefined;
    if (!idToken) {
      setLoading(false);
      onError('Google no devolvió un token de identidad.');
      return;
    }

    void (async () => {
      try {
        const respuesta = await loginGoogle(idToken);
        await onSuccess(respuesta.token, respuesta.usuario);
      } catch (error) {
        const mensaje =
          error instanceof ApiError
            ? error.mensaje
            : 'No pudimos iniciar sesión con Google. Intentalo de nuevo.';
        onError(mensaje);
      } finally {
        setLoading(false);
      }
    })();
  }, [googleResponse, onError, onSuccess]);

  return (
    <CustomButton
      title="Continuar con Google"
      variant="secondary"
      loading={loading}
      disabled={!request}
      onPress={() => {
        setLoading(true);
        void promptAsync().catch(() => {
          onError('No pudimos abrir Google. Intentalo de nuevo.');
          setLoading(false);
        });
      }}
    />
  );
}

export function GoogleLoginButton(props: GoogleLoginButtonProps) {
  if (!googleHabilitado()) {
    return (
      <CustomButton
        title="Continuar con Google"
        variant="secondary"
        onPress={() =>
          props.onError(
            'El login con Google todavía no está configurado. Pedile al equipo el EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.',
          )
        }
      />
    );
  }

  return <GoogleLoginButtonConfigured {...props} />;
}
