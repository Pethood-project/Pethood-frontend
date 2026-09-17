/**
 * Home autenticada — grilla de acceso a las secciones principales.
 *
 * Tiene dos vistas con la misma estética y distintas secciones: la del adoptante y la del
 * refugio. Cuál se muestra sale del interruptor de Perfil, no de esta pantalla.
 */
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TarjetaAcceso } from '@/components/home/TarjetaAcceso';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { ACCESOS_ADOPTANTE, ACCESOS_REFUGIO } from '@/constants/home';
import { useSesion } from '@/hooks/useSesion';
import { saludoPara } from '@/lib/saludo';

export default function InicioScreen() {
  const { usuario, vistaRefugio } = useSesion();
  const router = useRouter();

  const accesos = vistaRefugio ? ACCESOS_REFUGIO : ACCESOS_ADOPTANTE;
  // Dos filas de dos: la grilla del diseño, armada con flex para que las tarjetas se
  // repartan el alto que sobra entre el encabezado y la barra inferior.
  const filas = [accesos.slice(0, 2), accesos.slice(2)];

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-start justify-between gap-3 px-[22px] pb-2 pt-2">
          <View className="flex-1">
            <Text className="font-titulo text-[27px] leading-[27px] text-organic-accent-600">
              PetHood
            </Text>
            {vistaRefugio ? (
              <Text className="mt-[5px] font-cuerpo-semi text-[15px] text-organic-neutral-700">
                {nombreVisible(usuario?.nombre, usuario?.apellido)}
              </Text>
            ) : (
              <Text className="mt-[5px] font-cuerpo text-[13.5px] text-organic-neutral-700">
                {saludoPara(usuario?.nombre)}
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            {/* El refugio no adopta: su encabezado no lleva favoritos. */}
            {vistaRefugio ? null : (
              <BotonCircular
                icono="heart-outline"
                etiqueta="Favoritos"
                onPress={() => router.push('/favoritos')}
              />
            )}
            {/* Todavía no hay pantalla de notificaciones: se ve, pero no navega. Es del
                Módulo 4, y de ahí cuelga el pendiente de HU-9.3 (entrar a una actualización
                de seguimiento desde su notificación): ver "Pendientes por dependencias de
                otros módulos" en el README. */}
            <BotonCircular icono="notifications-outline" etiqueta="Notificaciones" />
          </View>
        </View>

        <View className="flex-1 gap-[14px] px-[22px] pb-4">
          {filas.map((fila) => (
            <View key={fila[0].titulo} className="flex-1 flex-row gap-[14px]">
              {fila.map((acceso) => (
                <TarjetaAcceso
                  key={acceso.titulo}
                  acceso={acceso}
                  onPress={acceso.destino ? () => router.push(acceso.destino!) : undefined}
                />
              ))}
            </View>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

/** En la vista de refugio el encabezado identifica la cuenta en vez de saludar. */
function nombreVisible(nombre?: string, apellido?: string): string {
  return [nombre, apellido].filter(Boolean).join(' ').trim() || 'Mi refugio';
}
