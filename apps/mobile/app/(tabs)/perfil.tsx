/**
 * GUI-09 Mi Perfil — HU-1.3 visualizar, HU-1.5 completar.
 *
 * Resumen liviano: foto, nombre, chip de rol y el menú de secciones. A propósito no muestra
 * el mail ni las acciones sensibles de la cuenta (cerrar sesión, dar de baja) — esas viven en
 * `/perfil/editar`, a la que se entra con el ícono de perfil del encabezado, para que no
 * queden botones tan delicados a un solo toque apenas se abre esta pantalla.
 *
 * Las filas del menú solo navegan cuando su sección ya existe; el resto se muestra
 * desactivado hasta que se implemente.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/feedback/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { Chip } from '@/components/ui/Chip';
import { SwitchRefugio } from '@/components/ui/SwitchRefugio';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { ApiError, urlAbsoluta } from '@/services/api';
import { obtenerPerfil } from '@/services/usuarios';
import type { Perfil } from '@/types/auth';

type NombreIcono = keyof typeof Ionicons.glyphMap;

/** Sin `ruta`, la fila queda visible pero desactivada: esa sección todavía no existe. */
const MENU: { icono: NombreIcono; label: string; ruta?: Href }[] = [
  { icono: 'paw-outline', label: 'Mis mascotas', ruta: '/(tabs)/mis-mascotas' },
  // Las dos abren la misma pantalla del otro lado: lo que pedí (HU-7.3) y lo que me llegó
  // sobre mis mascotas publicadas (HU-7.5).
  {
    icono: 'document-text-outline',
    label: 'Mis solicitudes',
    ruta: { pathname: '/solicitudes', params: { vista: 'enviadas' } },
  },
  {
    icono: 'file-tray-full-outline',
    label: 'Solicitudes recibidas',
    ruta: { pathname: '/solicitudes', params: { vista: 'recibidas' } },
  },
  { icono: 'footsteps-outline', label: 'Seguimientos', ruta: '/seguimientos' },
  { icono: 'heart-outline', label: 'Favoritos', ruta: '/favoritos' },
  { icono: 'heart-circle-outline', label: 'Campañas' },
];

function etiquetaRol(roles: string[], esRefugio: boolean): string {
  if (roles.includes('ADMIN')) return 'Admin';
  if (esRefugio) return 'Refugio';
  return 'Adoptante';
}

function formatearValoracion(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—';
  return valor.toFixed(1);
}

export default function PerfilScreen() {
  const router = useRouter();
  const toast = useToast();
  const { usuario, token, esRefugio, vistaRefugio, cambiarVistaRefugio, actualizarUsuario } =
    useSesion();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async (): Promise<void> => {
    if (!token) return;
    try {
      const respuesta = await obtenerPerfil(token);
      setPerfil(respuesta.usuario);
      await actualizarUsuario(respuesta.usuario);
    } catch (error) {
      const mensaje =
        error instanceof ApiError
          ? error.mensaje
          : 'No pudimos cargar tu perfil. Revisá tu conexión.';
      toast.mostrarError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [token, actualizarUsuario]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  // Cambiar de vista cambia la app entera, no solo esta pantalla: se va a Inicio para que
  // se vea, en vez de dejar al usuario mirando un interruptor que aparentemente no hizo nada.
  const alternarVista = async (activa: boolean): Promise<void> => {
    await cambiarVistaRefugio(activa);
    router.push('/(tabs)' as Href);
  };

  const visible = perfil ?? usuario;
  const foto = urlAbsoluta(visible?.imagenUrl);
  const incompleto = !visible?.imagenUrl || !visible?.telefono || !visible?.ubicacion;

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
          <Text className="text-2xl font-bold text-pethood-orange">Mi Perfil</Text>
          <BotonCircular
            icono="person-circle-outline"
            etiqueta="Ver y editar mi perfil"
            variante="clasico"
            onPress={() => router.push('/perfil/editar' as Href)}
          />
        </View>

        {cargando && !visible ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={PALETA.pethood.naranja} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-8 pt-2"
          >
            {incompleto ? (
              <Pressable
                onPress={() => router.push('/perfil/editar' as Href)}
                className="mb-4 rounded-2xl bg-orange-50 px-4 py-3"
              >
                <Text className="text-base font-medium text-orange-800">
                  Completá tu perfil con foto e información personal
                </Text>
              </Pressable>
            ) : null}

            <View className="rounded-[28px] bg-white p-5 shadow-sm">
              <View className="flex-row items-center">
                <Avatar
                  uri={foto}
                  nombre={visible?.nombre}
                  apellido={visible?.apellido}
                  tamanio={80}
                />

                <View className="ml-4 flex-1">
                  <Text className="text-2xl font-bold text-gray-900">
                    {visible?.nombre} {visible?.apellido}
                  </Text>
                  {/* El mail no va acá: se ve recién dentro de "Ver y editar mi perfil". */}
                  <View className="mt-2">
                    <Chip etiqueta={etiquetaRol(visible?.roles ?? [], esRefugio)} grande />
                  </View>
                </View>
              </View>

              <View className="mt-5 flex-row border-t border-gray-100 pt-4">
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-pethood-orange">
                    {perfil?.mascotas ?? 0}
                  </Text>
                  <Text className="mt-0.5 text-sm text-gray-500">Mascotas</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-pethood-orange">
                    {perfil?.favoritos ?? 0}
                  </Text>
                  <Text className="mt-0.5 text-sm text-gray-500">Favoritos</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-pethood-orange">
                    {formatearValoracion(perfil?.valoracion)}
                  </Text>
                  <Text className="mt-0.5 text-sm text-gray-500">Valoración</Text>
                </View>
              </View>
            </View>

            {/* Solo para quien administra un refugio: el resto no tiene qué alternar. */}
            {esRefugio ? (
              <View className="mt-4">
                <SwitchRefugio activo={vistaRefugio} onCambiar={alternarVista} />
              </View>
            ) : null}

            <View className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-sm">
              {MENU.map(({ icono, label, ruta }, index) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  disabled={!ruta}
                  onPress={ruta ? () => router.push(ruta) : undefined}
                  className={`flex-row items-center px-4 py-3.5 ${
                    index < MENU.length - 1 ? 'border-b border-gray-100' : ''
                  } ${ruta ? 'active:bg-gray-50' : 'opacity-40'}`}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                    <Ionicons name={icono} size={18} color={PALETA.pethood.naranja} />
                  </View>
                  <Text className="ml-3 flex-1 text-lg text-gray-800">{label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={PALETA.gris[300]} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
