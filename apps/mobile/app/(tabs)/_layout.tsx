import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
// Import interno (expo-router no lo re-exporta): es el mismo botón que la barra usa por
// defecto. Se reusa en vez de escribir un Pressable propio porque trae el centrado de
// ícono y label — sustituirlo por uno hecho a mano los desalinea.
import { PlatformPressable } from 'expo-router/build/react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotonTabCentral } from '@/components/ui/BotonTabCentral';
import { IndicadorTabs } from '@/components/ui/IndicadorTabs';
import { PALETA } from '@/constants/theme';

/**
 * Navegación inferior del área autenticada.
 *
 * El diseño de referencia: Inicio, Mascotas, Adoptar, Chat, Perfil.
 * La pestaña Mapa del prototipo queda fuera porque el proyecto excluye el mapa interactivo.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PALETA.accent[600],
        tabBarInactiveTintColor: PALETA.gris[400],
        tabBarStyle: {
          backgroundColor: PALETA.blanco,
          borderTopColor: PALETA.gris[100],
          height: 64 + paddingBottom,
          paddingTop: 8,
          paddingBottom,
          overflow: 'visible',
        },
        tabBarItemStyle: { paddingTop: 2 },
        tabBarBackground: () => <IndicadorTabs />,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500', paddingTop: 2, paddingBottom: 0 },
        // Sin ripple: el cambio de color de la pestaña activa ya es feedback suficiente, y
        // el de Android es `borderless` y sin radio, así que se derramaba fuera de la barra.
        tabBarButton: (props) => <PlatformPressable {...props} pressColor="transparent" />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mis-mascotas"
        options={{
          title: 'Mascotas',
          tabBarIcon: ({ color, size }) => <Ionicons name="paw-outline" size={size} color={color} />,
        }}
      />
      {/* Es una tab real y no un atajo a otra ruta: la barra inferior queda presente sobre
          el mazo de tarjetas, con este botón resaltado. */}
      <Tabs.Screen
        name="adoptar"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarButton: ({ onPress, accessibilityState }) => (
            <BotonTabCentral
              icono="paw"
              etiqueta="Adoptar"
              activo={Boolean(accessibilityState?.selected)}
              onPress={onPress}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
