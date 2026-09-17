import { Redirect } from 'expo-router';

/** La home autenticada vive en la pestaña Inicio (`/(tabs)`). */
export default function HomeRedirect() {
  return <Redirect href="/(tabs)" />;
}
