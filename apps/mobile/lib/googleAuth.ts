import Constants, { ExecutionEnvironment } from 'expo-constants';

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

// El login con Google usa un módulo nativo que no existe en Expo Go: solo anda en la app instalada.
export const enExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function googleHabilitado(): boolean {
  return Boolean(GOOGLE_WEB_CLIENT_ID);
}

/**
 * Abre el selector de cuentas nativo y devuelve el idToken, o `null` si el usuario canceló.
 * Con `webClientId` el token sale con el client web como `aud`, que es el que valida el backend.
 */
export async function pedirIdTokenGoogle(): Promise<string | null> {
  // Import diferido: en Expo Go el módulo nativo no está y el import fallaría al cargar la pantalla.
  const { GoogleSignin, isSuccessResponse } = await import('@react-native-google-signin/google-signin');

  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  await GoogleSignin.hasPlayServices();
  const respuesta = await GoogleSignin.signIn();
  if (!isSuccessResponse(respuesta)) return null;

  if (!respuesta.data.idToken) throw new Error('Google no devolvió un token de identidad.');
  return respuesta.data.idToken;
}
