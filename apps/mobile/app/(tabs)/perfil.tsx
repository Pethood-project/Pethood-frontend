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
 *
 * Menú, contadores y chip siguen al switch refugio/adoptante (ver `services/sesion.ts`):
 * cada perfil muestra solo lo suyo.
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

type ItemMenu = { icono: NombreIcono; label: string; ruta?: Href };

/** Sin `ruta`, la fila queda visible pero desactivada: esa sección todavía no existe. */
const MENU_ADOPTANTE: ItemMenu[] = [
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

/**
 * El refugio no solicita ni guarda favoritos: solo gestiona lo suyo. "Solicitudes
 * recibidas" y "Seguimientos" abren las mismas pantallas, que desde esta vista traen solo lo
 * del refugio.
 */
const MENU_REFUGIO: ItemMenu[] = [
  { icono: 'paw-outline', label: 'Mascotas del refugio', ruta: '/(tabs)/mis-mascotas' },
  {
    icono: 'file-tray-full-outline',
    label: 'Solicitudes recibidas',
    ruta: { pathname: '/solicitudes', params: { vista: 'recibidas' } },
  },
  { icono: 'footsteps-outline', label: 'Seguimientos', ruta: '/seguimientos' },
  { icono: 'heart-circle-outline', label: 'Campañas del refugio' },
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
  const alternarVista = (activa: boolean): void => {
    cambiarVistaRefugio(activa);
    router.push('/(tabs)' as Href);
  };

  const menu = vistaRefugio ? MENU_REFUGIO : MENU_ADOPTANTE;

  const visible = perfil ?? usuario;
  const foto = urlAbsoluta(visible?.imagenUrl);
  const incompleto = !visible?.imagenUrl || !visible?.telefono || !visible?.ubicacion;

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between border-b border-organic-neutral-300 bg-organic-neutral-100 px-[21px] py-[13px]">
          <Text className="font-titulo text-[24px] leading-[29px] text-organic-accent-600">
            Mi Perfil
          </Text>
          {/* El ícono sigue siendo el de perfil (no una ruedita de configuración): entra a
              "Ver y editar mi perfil", donde viven los datos completos y las acciones sensibles. */}
          <BotonCircular
            icono="person-circle-outline"
            etiqueta="Ver y editar mi perfil"
            variante="organic"
            onPress={() => router.push('/perfil/editar' as Href)}
          />
        </View>

        {cargando && !visible ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={PALETA.accent[600]} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-8 pt-3"
          >
            {incompleto ? (
              <Pressable
                onPress={() => router.push('/perfil/editar' as Href)}
                className="mb-4 flex-row items-center gap-3 rounded-[22px] border border-organic-accent-300 bg-organic-accent-100 px-4 py-3.5"
              >
                <Ionicons name="person-add-outline" size={20} color={PALETA.accent[700]} />
                <Text className="flex-1 font-cuerpo-semi text-[15px] text-organic-accent-700">
                  Completá tu perfil con foto e información personal
                </Text>
              </Pressable>
            ) : null}

            <View className="rounded-[30px] bg-organic-surface p-6 shadow-sm">
              <View className="flex-row items-center">
                <Avatar
                  uri={foto}
                  nombre={visible?.nombre}
                  apellido={visible?.apellido}
                  tamanio={92}
                  variante="organic"
                  tono={vistaRefugio ? 'acento' : 'neutro'}
                />

                <View className="ml-4 flex-1">
                  <Text className="font-titulo text-[24px] leading-[27px] text-organic-neutral-900">
                    {visible?.nombre} {visible?.apellido}
                  </Text>
                  {/* El mail no va acá: se ve recién dentro de "Ver y editar mi perfil". */}
                  <View className="mt-2">
                    <Chip etiqueta={etiquetaRol(visible?.roles ?? [], vistaRefugio)} grande />
                  </View>
                </View>
              </View>

              <View className="mt-5 flex-row border-t border-organic-neutral-200 pt-5">
                <View className="flex-1 items-center">
                  <Text className="font-titulo text-[26px] leading-[29px] text-organic-accent-600">
                    {perfil?.mascotas ?? 0}
                  </Text>
                  <Text className="mt-1 font-cuerpo text-[13px] text-organic-neutral-600">
                    {vistaRefugio ? 'Del refugio' : 'Mascotas'}
                  </Text>
                </View>
                {/* El refugio no tiene favoritos: el contador es del perfil personal. */}
                {vistaRefugio ? null : (
                  <View className="flex-1 items-center">
                    <Text className="font-titulo text-[26px] leading-[29px] text-organic-accent-600">
                      {perfil?.favoritos ?? 0}
                    </Text>
                    <Text className="mt-1 font-cuerpo text-[13px] text-organic-neutral-600">
                      Favoritos
                    </Text>
                  </View>
                )}
                <View className="flex-1 items-center">
                  <Text className="font-titulo text-[26px] leading-[29px] text-organic-accent-600">
                    {formatearValoracion(perfil?.valoracion)}
                  </Text>
                  <Text className="mt-1 font-cuerpo text-[13px] text-organic-neutral-600">
                    Valoración
                  </Text>
                </View>
              </View>
            </View>

            {/* Solo para quien administra un refugio: el resto no tiene qué alternar. */}
            {esRefugio ? (
              <View className="mt-5">
                <SwitchRefugio activo={vistaRefugio} onCambiar={alternarVista} />
              </View>
            ) : null}

            <View className="mt-5 overflow-hidden rounded-[26px] bg-organic-surface shadow-sm">
              {menu.map(({ icono, label, ruta }, index) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  disabled={!ruta}
                  onPress={ruta ? () => router.push(ruta) : undefined}
                  className={`flex-row items-center px-5 py-4 ${
                    index < menu.length - 1 ? 'border-b border-organic-neutral-200' : ''
                  } ${ruta ? 'active:bg-organic-neutral-100' : 'opacity-40'}`}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-organic-calido-amarilloClaro">
                    <Ionicons name={icono} size={21} color={PALETA.accent[600]} />
                  </View>
                  <Text className="ml-4 flex-1 font-cuerpo-semi text-[17px] text-organic-neutral-900">
                    {label}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={PALETA.neutral[400]} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
