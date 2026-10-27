/**
 * El marco de las pantallas de filtros: encabezado crema con "Filtros" y "Limpiar", el
 * contenido en secciones y el botón de aplicar al pie. Lo usan todos los listados que
 * esconden sus filtros detrás del ícono de deslizadores del encabezado (solicitudes,
 * mascotas, publicaciones, campañas), para que se vean y se comporten igual.
 *
 * Cada uno edita un borrador propio y recién al tocar "Aplicar" avisa hacia afuera.
 *
 * Estética de la pantalla 33 (Filtros avanzados): rótulos en mayúsculas, pastillas rellenas en
 * acento al elegirse y el botón en acento. Un escalón más grande que el diseño, a pedido.
 */
import { type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotonVolver } from '@/components/ui/BotonVolver';
import { TituloPantalla } from '@/components/ui/EncabezadoPantalla';

/** Bloque con rótulo en mayúsculas, en su propia caja. */
export function SeccionFiltro({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  /** Una línea que dice para qué sirve la sección. */
  ayuda?: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-5 rounded-3xl border border-organic-neutral-300 bg-organic-surface p-4">
      <Text className="font-cuerpo-bold text-[14px] uppercase tracking-[1px] text-organic-accent-700">
        {titulo}
      </Text>
      {ayuda ? (
        <Text className="mt-1 font-cuerpo text-[14px] leading-5 text-organic-neutral-600">
          {ayuda}
        </Text>
      ) : null}
      <View className="mt-3">{children}</View>
    </View>
  );
}

interface ModalFiltrosProps {
  visible: boolean;
  /** Cuántos filtros hay elegidos en el borrador: habilita "Limpiar" y se lee en el botón. */
  activos: number;
  onLimpiar: () => void;
  onAplicar: () => void;
  onCerrar: () => void;
  children: ReactNode;
}

export function ModalFiltros({
  visible,
  activos,
  onLimpiar,
  onAplicar,
  onCerrar,
  children,
}: ModalFiltrosProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar} statusBarTranslucent>
      <View className="flex-1 bg-organic-bg">
        {/* Margen superior a mano y no con el `SafeAreaView` nativo: dentro de un `Modal`
            (otra ventana nativa) este no recibe los insets en iOS y el encabezado quedaba
            debajo de la hora y la batería. `statusBarTranslucent` hace que Android también
            dibuje debajo de la barra, así el mismo margen sirve en las dos plataformas. */}
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between border-b border-organic-neutral-300 bg-organic-neutral-100 px-[22px] pb-3.5 pt-2.5">
            <View className="flex-row items-center gap-2">
              <BotonVolver etiqueta="Cerrar filtros" onPress={onCerrar} />
              <TituloPantalla>Filtros</TituloPantalla>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpiar filtros"
              onPress={onLimpiar}
              disabled={activos === 0}
              hitSlop={12}
              className="py-2 active:opacity-70"
            >
              <Text
                className={`font-cuerpo-semi text-[17px] ${
                  activos === 0 ? 'text-organic-neutral-400' : 'text-organic-accent-700'
                }`}
              >
                Limpiar
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 22 }}>
            {children}
          </ScrollView>

          {/* El botón va sobre el mismo fondo, sin barra propia. El inset va en el padding
              para que quede arriba de la barra del sistema. */}
          <View className="px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <Pressable
              accessibilityRole="button"
              onPress={onAplicar}
              className="items-center rounded-[20px] bg-organic-accent-600 py-[18px] shadow-md active:opacity-90"
            >
              <Text className="font-cuerpo-semi text-[18px] text-white">
                {activos === 0
                  ? 'Aplicar filtros'
                  : `Aplicar filtros (${activos} activo${activos === 1 ? '' : 's'})`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
