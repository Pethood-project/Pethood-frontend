import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export function googleHabilitado(): boolean {
  return Boolean(GOOGLE_WEB_CLIENT_ID);
}

export function useGoogleIdToken() {
  const webClientId = GOOGLE_WEB_CLIENT_ID;
  return Google.useIdTokenAuthRequest({
    clientId: webClientId,
    webClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || webClientId,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || webClientId,
  });
}
