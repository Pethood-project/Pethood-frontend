import '../global.css';

import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import {
  Figtree_400Regular,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { useFonts } from 'expo-font';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { BarraNavegacionSistema } from '@/components/BarraNavegacionSistema';
import { ToastProvider } from '@/components/feedback/Toast';
import { SesionProvider, useSesion } from '@/hooks/useSesion';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    // Requisito de react-native-gesture-handler: sin esta raíz, el arrastre del mazo de
    // tarjetas de Adoptar no recibe eventos en Android.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SesionProvider>
        {/* El provider de toasts envuelve al Stack para que un toast disparado antes de
            navegar siga visible en la pantalla siguiente. */}
        <ToastProvider>
          <StatusBar style="dark" />
          {/* Oculta la barra de navegación del sistema para ganar la franja inferior. No
              queda bloqueada: Android la vuelve a mostrar cuando el usuario desliza desde
              el borde y la esconde sola al rato. El módulo es solo de Android; en iOS y
              web BarraNavegacionSistema no importa expo-navigation-bar. */}
          <BarraNavegacionSistema />
          <RootNavigator />
        </ToastProvider>
      </SesionProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { autenticado, cargando } = useSesion();
  // Caprasimo para títulos y Figtree para el resto. Hasta que estén, no se dibuja nada:
  // el sistema sustituiría por la fuente por defecto y la pantalla saltaría al cargar.
  const [fuentesListas] = useFonts({
    Caprasimo_400Regular,
    Figtree_400Regular,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  if (cargando || !fuentesListas) {
    return <View className="flex-1 bg-organic-bg" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={!autenticado}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={autenticado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="home" />
        {/* GUI-12. Va en el stack y no en las tabs porque se entra desde la Home y desde
            el Perfil, y el back tiene que volver al origen real. */}
        <Stack.Screen name="favoritos" />
        <Stack.Screen name="mascotas/crear" options={{ presentation: 'card' }} />
        <Stack.Screen name="mascotas/[id]/editar" options={{ presentation: 'card' }} />
        <Stack.Screen name="publicaciones/crear" options={{ presentation: 'card' }} />
        {/* Se abre tocando una tarjeta del mazo de Adoptar, sin descartarla. */}
        <Stack.Screen name="publicaciones/[id]" options={{ presentation: 'card' }} />
        {/* GUI-27. Bandeja de quien publicó la mascota (HU-7.4/7.5) — refugio o adoptante
            particular, no una tab fija: se entra desde el Perfil y desde el bloqueo al
            eliminar una mascota con solicitudes abiertas. */}
        <Stack.Screen name="solicitudes" options={{ presentation: 'card' }} />
        <Stack.Screen name="solicitudes/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="perfil/editar" options={{ presentation: 'card' }} />
        <Stack.Screen name="perfil/password" options={{ presentation: 'card' }} />
        {/* HU-9.1/HU-9.2. Fuera de las tabs: se entra desde Perfil y el back vuelve al
            origen real, igual que Favoritos. */}
        <Stack.Screen name="seguimientos/index" />
        <Stack.Screen name="seguimientos/[solicitudId]/index" />
        <Stack.Screen
          name="seguimientos/[solicitudId]/actualizacion"
          options={{ presentation: 'card' }}
        />
        {/* HU-9.3. Ruta propia y no hija del expediente: se puede abrir suelta. */}
        <Stack.Screen name="seguimientos/actualizaciones/[seguimientoId]" />
        {/* GUI-14. Fuera de las tabs para que la conversación ocupe la pantalla entera y el
            back vuelva al listado. Sólo recibe el chatId: el contacto lo trae la API. */}
        <Stack.Screen name="chats/[chatId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="+not-found" />
      </Stack.Protected>
    </Stack>
  );
}
