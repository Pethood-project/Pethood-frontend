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
 * cada perfil muestra solo lo suyo. En la vista de refugio la tarjeta es la del REFUGIO
 * (spec 017, artboard 19: foto, nombre, dirección, reseñas y sus números), no la de la
 * persona; y el ícono del encabezado ofrece elegir entre los datos personales y los del
 * refugio.
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
import { HojaOpciones } from '@/components/ui/HojaOpciones';
import { LogoRefugio } from '@/components/ui/LogoRefugio';
import { SwitchRefugio } from '@/components/ui/SwitchRefugio';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { ApiError, urlAbsoluta } from '@/services/api';
import { obtenerPerfilRefugio } from '@/services/refugio';
import { obtenerPerfil } from '@/services/usuarios';
import type { Perfil } from '@/types/auth';
import type { PerfilRefugio } from '@/types/refugio';

type NombreIcono = keyof typeof Ionicons.glyphMap;

type ItemMenu = { icono: NombreIcono; label: string; ruta?: Href };

/** Sin `ruta`, la fila queda visible pero desactivada: esa sección todavía no existe. */
const MENU_ADOPTANTE: ItemMenu[] = [
  { icono: 'paw-outline', label: 'Mis mascotas', ruta: '/(tabs)/mis-mascotas' },
  { icono: 'megaphone-outline', label: 'Mis publicaciones', ruta: '/publicaciones' as Href },
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
  // Misma pantalla que "Mis publicaciones": desde esta vista trae todo lo del refugio.
  {
    icono: 'megaphone-outline',
    label: 'Publicaciones del refugio',
    ruta: '/publicaciones' as Href,
  },
  {
    icono: 'file-tray-full-outline',
    label: 'Solicitudes recibidas',
    ruta: { pathname: '/solicitudes', params: { vista: 'recibidas' } },
  },
  { icono: 'footsteps-outline', label: 'Seguimientos', ruta: '/seguimientos' },
  { icono: 'heart-circle-outline', label: 'Campañas del refugio' },
];

/** Solo se muestra en la vista personal: en la de refugio la tarjeta es la del refugio. */
function etiquetaRol(roles: string[]): string {
  return roles.includes('ADMIN') ? 'Admin' : 'Adoptante';
}

function formatearValoracion(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—';
  return valor.toFixed(1);
}

function Contador({ valor, etiqueta }: { valor: string | number; etiqueta: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="font-titulo text-[26px] leading-[29px] text-organic-accent-600">
        {valor}
      </Text>
      <Text className="mt-1 text-center font-cuerpo text-[13px] text-organic-neutral-600">
        {etiqueta}
      </Text>
    </View>
  );
}

/** Artboard 19: la tarjeta es la del refugio, no la de quien lo está usando. */
function TarjetaRefugio({ refugio }: { refugio: PerfilRefugio }) {
  const { promedio, cantidad } = refugio.valoracion;

  return (
    <View className="rounded-[30px] bg-organic-surface p-6 shadow-sm">
      <View className="flex-row items-center">
        <LogoRefugio uri={urlAbsoluta(refugio.imagenUrl)} tamanio={80} />

        <View className="ml-4 flex-1">
          <Text className="font-titulo text-[22px] leading-[26px] text-organic-neutral-900">
            {refugio.nombre}
          </Text>
          <Text
            numberOfLines={2}
            className="mt-1 font-cuerpo text-[13px] text-organic-neutral-600"
          >
            {refugio.direccion}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-1">
            <Ionicons name="star" size={14} color={PALETA.calido.amarillo} />
            {promedio === null ? (
              <Text className="font-cuerpo text-[13px] text-organic-neutral-500">
                Sin reseñas todavía
              </Text>
            ) : (
              <>
                <Text className="font-cuerpo-semi text-[13px] text-organic-accent-700">
                  {formatearValoracion(promedio)}
                </Text>
                <Text className="font-cuerpo text-[12px] text-organic-neutral-500">
                  ({cantidad} {cantidad === 1 ? 'reseña' : 'reseñas'})
                </Text>
              </>
            )}
          </View>
          {refugio.verificado ? null : (
            <View className="mt-2 flex-row">
              <Chip etiqueta="Pendiente de verificación" />
            </View>
          )}
        </View>
      </View>

      <View className="mt-5 flex-row border-t border-organic-neutral-200 pt-5">
        <Contador valor={refugio.estadisticas.enRefugio} etiqueta="En el refugio" />
        <Contador valor={refugio.estadisticas.adopciones} etiqueta="Adopciones" />
        <Contador
          valor={refugio.estadisticas.solicitudesAbiertas}
          etiqueta="Solicitudes abiertas"
        />
      </View>
    </View>
  );
}

export default function PerfilScreen() {
  const router = useRouter();
  const toast = useToast();
  const { usuario, token, esRefugio, vistaRefugio, cambiarVistaRefugio, actualizarUsuario } =
    useSesion();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [perfilRefugio, setPerfilRefugio] = useState<PerfilRefugio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [eligiendoDatos, setEligiendoDatos] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    if (!token) return;
    try {
      // El perfil personal se pide igual en la vista de refugio: es lo que mantiene al día
      // los roles y el refugio de la sesión.
      const [respuesta, refugio] = await Promise.all([
        obtenerPerfil(token),
        vistaRefugio ? obtenerPerfilRefugio(token) : Promise.resolve(null),
      ]);
      setPerfil(respuesta.usuario);
      setPerfilRefugio(refugio?.refugio ?? null);
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
  }, [token, vistaRefugio, actualizarUsuario]);

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
  // Cada vista avisa de lo suyo: la personal, de los datos de la persona; la de refugio,
  // de los del refugio (que son los que se ven en su tarjeta).
  const incompleto = vistaRefugio
    ? Boolean(perfilRefugio) &&
      (!perfilRefugio?.imagenUrl || !perfilRefugio?.telefono || !perfilRefugio?.descripcion)
    : !visible?.imagenUrl || !visible?.telefono || !visible?.ubicacion;
  const rutaCompletar = (vistaRefugio ? '/perfil/refugio' : '/perfil/editar') as Href;
  const esperandoDatos = vistaRefugio ? !perfilRefugio : !visible;

  const irA = (ruta: string): void => {
    setEligiendoDatos(false);
    router.push(ruta as Href);
  };

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between border-b border-organic-neutral-300 bg-organic-neutral-100 px-[21px] py-[13px]">
          <Text className="font-titulo text-[24px] leading-[29px] text-organic-accent-600">
            {vistaRefugio ? 'Mi Refugio' : 'Mi Perfil'}
          </Text>
          {/* El ícono sigue siendo el de perfil (no una ruedita de configuración): entra a
              "Ver y editar mi perfil", donde viven los datos completos y las acciones sensibles.
              En la vista de refugio hay dos juegos de datos, así que primero pregunta cuál. */}
          <BotonCircular
            icono="person-circle-outline"
            etiqueta={vistaRefugio ? 'Ver y editar datos' : 'Ver y editar mi perfil'}
            variante="organic"
            onPress={() =>
              vistaRefugio ? setEligiendoDatos(true) : router.push('/perfil/editar' as Href)
            }
          />
        </View>

        {cargando && esperandoDatos ? (
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
                onPress={() => router.push(rutaCompletar)}
                className="mb-4 flex-row items-center gap-3 rounded-[22px] border border-organic-accent-300 bg-organic-accent-100 px-4 py-3.5"
              >
                <Ionicons
                  name={vistaRefugio ? 'business-outline' : 'person-add-outline'}
                  size={20}
                  color={PALETA.accent[700]}
                />
                <Text className="flex-1 font-cuerpo-semi text-[15px] text-organic-accent-700">
                  {vistaRefugio
                    ? 'Completá el perfil del refugio con foto, teléfono y descripción'
                    : 'Completá tu perfil con foto e información personal'}
                </Text>
              </Pressable>
            ) : null}

            {vistaRefugio ? (
              perfilRefugio ? <TarjetaRefugio refugio={perfilRefugio} /> : null
            ) : (
              <View className="rounded-[30px] bg-organic-surface p-6 shadow-sm">
                <View className="flex-row items-center">
                  <Avatar
                    uri={foto}
                    nombre={visible?.nombre}
                    apellido={visible?.apellido}
                    tamanio={92}
                    variante="organic"
                    tono="neutro"
                  />

                  <View className="ml-4 flex-1">
                    <Text className="font-titulo text-[24px] leading-[27px] text-organic-neutral-900">
                      {visible?.nombre} {visible?.apellido}
                    </Text>
                    {/* El mail no va acá: se ve recién dentro de "Ver y editar mi perfil". */}
                    <View className="mt-2">
                      <Chip etiqueta={etiquetaRol(visible?.roles ?? [])} grande />
                    </View>
                  </View>
                </View>

                <View className="mt-5 flex-row border-t border-organic-neutral-200 pt-5">
                  <Contador valor={perfil?.mascotas ?? 0} etiqueta="Mascotas" />
                  <Contador valor={perfil?.favoritos ?? 0} etiqueta="Favoritos" />
                  <Contador valor={formatearValoracion(perfil?.valoracion)} etiqueta="Valoración" />
                </View>
              </View>
            )}

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

      <HojaOpciones
        visible={eligiendoDatos}
        titulo="Ver y editar datos"
        subtitulo="¿Cuáles querés ver?"
        opciones={[
          {
            icono: 'person-outline',
            etiqueta: 'Mis datos personales',
            onPress: () => irA('/perfil/editar'),
          },
          {
            icono: 'business-outline',
            etiqueta: 'Datos del refugio',
            onPress: () => irA('/perfil/refugio'),
          },
        ]}
        onCerrar={() => setEligiendoDatos(false)}
      />
    </View>
  );
}
