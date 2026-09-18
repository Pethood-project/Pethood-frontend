/**
 * GUI-14 Conversación — HU-5.2: envío y recepción de mensajes en la sala de chat.
 *
 * Se entra desde el listado (GUI-08 / GUI-31), pero por la navegación viaja SÓLO el
 * `chatId`: el nombre y la foto del contacto los trae `GET /chats/:chatId`. Es a propósito
 * — así la pantalla también se puede abrir desde una notificación (HU-4.3) o un deep link,
 * que no pasan por el listado.
 *
 * El estado de los mensajes vive en `useSalaChat`; acá sólo se pinta.
 *
 * Estilo del artboard 35 del diseño Organic (con las fotos del 37), sobre una maqueta de
 * 262px con el factor ×1,33: la lista con 12 → 16 de padding y 8 → 11 entre mensajes y el
 * chip de día centrado.
 *
 * El acuse de lectura NO va al pie de la conversación como en el artboard ("✓✓ Visto 10:39"):
 * va mensaje por mensaje, dentro de la burbuja, que es lo que la gente espera de un chat.
 * Lo pinta `TicksMensaje`.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, Text, View } from 'react-native';
import Animated, {
  KeyboardState,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraEscritura } from '@/components/chat/BarraEscritura';
import { BurbujaMensaje } from '@/components/chat/BurbujaMensaje';
import { CabeceraConversacion } from '@/components/chat/CabeceraConversacion';
import { VisorImagen } from '@/components/chat/VisorImagen';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { SeparadorFecha } from '@/components/ui/SeparadorFecha';
import { PALETA } from '@/constants/theme';
import { useSalaChat } from '@/hooks/useSalaChat';
import { useSesion } from '@/hooks/useSesion';
import { abrirSelectorImagen, validarAssetImagen } from '@/lib/elegirImagen';
import { intercalarSeparadores, type FilaSala } from '@/lib/mensajesChat';
import type { ArchivoAdjunto } from '@/services/api';

const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Algunos Android devuelven 'image/jpg', que no es un MIME real. */
function normalizarTipo(tipo?: string | null): string {
  const minuscula = tipo?.toLowerCase().trim() ?? '';
  return minuscula === 'image/jpg' ? 'image/jpeg' : minuscula || 'image/jpeg';
}

export default function ConversacionScreen() {
  const router = useRouter();
  const { usuario, token } = useSesion();
  const { chatId: parametro } = useLocalSearchParams<{ chatId: string }>();
  const chatId = Number(parametro);

  const [foto, setFoto] = useState<ArchivoAdjunto | null>(null);
  /** Foto que se está viendo a pantalla completa, o `null`. Un solo visor para toda la lista. */
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

  const sala = useSalaChat(chatId, usuario?.id ?? 0, token);

  /**
   * Alto del teclado, para levantar la barra de escritura junto con él.
   *
   * No se usa `KeyboardAvoidingView`: desde que Expo activa edge-to-edge por defecto en
   * Android (SDK 54+), la ventana ya NO se redimensiona al abrir el teclado —pasa a ser un
   * inset— así que el componente no tiene de dónde calcular el desplazamiento y la pantalla
   * se queda quieta tapando lo que se escribe.
   *
   * `useAnimatedKeyboard` lee ese inset directo y anima en el hilo de UI. Está marcado como
   * deprecado a favor de `react-native-keyboard-controller`, que es la opción recomendada
   * pero trae un módulo nativo: el equipo prueba con Expo Go y eso obligaría a todos a pasar
   * a una dev build. Cuando el proyecto migre a dev build, conviene cambiarlo.
   */
  const teclado = useAnimatedKeyboard({
    // Con edge-to-edge las dos barras del sistema son translúcidas y la app dibuja por
    // debajo. Sin declararlo, el alto del teclado se mide contra una ventana que no es la
    // real y la barra de escritura queda corrida.
    isStatusBarTranslucentAndroid: true,
    isNavigationBarTranslucentAndroid: true,
  });

  const estiloConTeclado = useAnimatedStyle(() => {
    // El alto se aplica SÓLO con el teclado abierto o en movimiento. Salir de la sala con el
    // teclado abierto desmonta la pantalla antes de que llegue el evento de cierre, así que
    // al volver a entrar el hook arranca con la última altura conocida y en estado
    // `UNKNOWN`: sin esta guarda quedaba media pantalla en blanco hasta abrir y cerrar el
    // teclado a mano.
    const abierto =
      teclado.state.value === KeyboardState.OPENING ||
      teclado.state.value === KeyboardState.OPEN ||
      teclado.state.value === KeyboardState.CLOSING;

    return { flex: 1, paddingBottom: abierto ? teclado.height.value : 0 };
  });

  /**
   * Cierra el teclado al salir de la sala, para que el hook vea el evento mientras la
   * pantalla sigue montada y la próxima entrada arranque en cero.
   *
   * Va en el desenfoque y no sólo en el botón de volver porque también se sale con el gesto
   * de retroceso y con el botón físico de Android, que no pasan por `volver`.
   */
  useFocusEffect(
    useCallback(() => {
      return () => Keyboard.dismiss();
    }, []),
  );

  /**
   * Criterio 6: el clip abre el explorador nativo. Se reusa el selector del proyecto, que
   * ya resuelve el menú Cámara/Galería, los permisos y el caso web.
   */
  const elegirFoto = useCallback((): void => {
    abrirSelectorImagen({
      titulo: 'Adjuntar una foto',
      mensaje: '¿De dónde querés sacarla?',
      opciones: { mediaTypes: ['images'], quality: 0.8 },
      onElegida: (asset) => {
        // Validación de UX nada más: el backend valida igual formato y peso.
        const problema = validarAssetImagen(asset);
        if (problema) {
          Alert.alert('No pudimos adjuntarla', problema);
          return;
        }

        const tipo = normalizarTipo(asset.mimeType);
        setFoto({
          uri: asset.uri,
          nombre: asset.fileName ?? `mensaje.${EXTENSION_POR_TIPO[tipo] ?? 'jpg'}`,
          tipo,
        });
      },
      onErrorPermisoGaleria: (mensaje) => Alert.alert('Necesitamos tus fotos', mensaje),
      onErrorPermisoCamara: () =>
        Alert.alert(
          'Necesitamos la cámara',
          'Dale permiso a PetHood para usar la cámara, o elegí una foto de la galería.',
        ),
    });
  }, []);

  const enviar = useCallback(
    (contenido: string): void => {
      sala.enviar(contenido, foto);
      // La foto se suelta junto con el texto: ya viajó al pendiente, que conserva su copia
      // para poder reintentar.
      setFoto(null);
    },
    [sala, foto],
  );

  /**
   * Los mensajes más los chips de día. Se recalcula sólo cuando cambia la lista: el día de
   * cada mensaje no cambia, y el "Hoy" pasa a "Ayer" recién con el próximo mensaje o al
   * reabrir la pantalla, que alcanza.
   */
  const filas = useMemo(() => intercalarSeparadores(sala.items, new Date()), [sala.items]);

  const renderItem = useCallback(
    ({ item: fila }: { item: FilaSala }) => (
      <View className="mb-[11px]">
        {fila.tipo === 'separador' ? (
          <SeparadorFecha etiqueta={fila.etiqueta} />
        ) : (
          <BurbujaMensaje
            item={fila.item}
            onReintentar={() => sala.reintentar(fila.item.clave)}
            onDescartar={() => sala.descartar(fila.item.clave)}
            onAbrirImagen={
              fila.item.imagen ? () => setImagenAmpliada(fila.item.imagen) : undefined
            }
          />
        )}
      </View>
    ),
    [sala],
  );

  const volver = useCallback((): void => {
    // Antes de navegar: si el teclado se cierra junto con la pantalla, la animación de
    // salida arranca con el hueco todavía puesto.
    Keyboard.dismiss();

    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/chat');
  }, [router]);

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <CabeceraConversacion
          contacto={sala.cabecera?.contacto ?? null}
          enLinea={sala.enLinea}
          desconectado={sala.desconectado}
          onVolver={volver}
        />

        {/* El padding inferior sigue al teclado, así la barra de escritura sube con él y el
            último mensaje nunca queda tapado. Vale para las dos plataformas. */}
        <Animated.View style={estiloConTeclado}>
          {sala.cargando ? (
            <EstadoCargando />
          ) : sala.error ? (
            <EstadoError mensaje={sala.error} onAccion={sala.recargar} />
          ) : (
            <FlatList
              data={filas}
              keyExtractor={(fila) => fila.clave}
              renderItem={renderItem}
              // La lista va invertida: el scroll arranca abajo sin trucos y el backend ya
              // devuelve los mensajes del más reciente al más viejo, así que no hay que
              // dar vuelta nada.
              inverted={sala.items.length > 0}
              contentContainerStyle={
                sala.items.length === 0
                  ? { flexGrow: 1 }
                  : { paddingHorizontal: 16, paddingVertical: 16 }
              }
              // Con la lista invertida, el "final" de los datos es el mensaje más viejo:
              // o sea, el tope visual. Paginar acá es cargar hacia atrás en el tiempo.
              onEndReached={sala.cargarMasViejos}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                sala.cargandoMas ? (
                  <View className="py-3">
                    <ActivityIndicator color={PALETA.accent[600]} />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <EstadoVacio
                  icono="chatbubble-ellipses-outline"
                  titulo="Todavía no hay mensajes"
                  descripcion="Escribí el primero para empezar la conversación."
                />
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          )}

          {/* La barra se muestra aunque el historial esté cargando o haya fallado: el
              usuario puede escribir igual, y el envío no depende de haber podido leer. */}
          <BarraEscritura
            foto={foto}
            onElegirFoto={elegirFoto}
            onQuitarFoto={() => setFoto(null)}
            onEnviar={enviar}
            habilitada={sala.puedeEscribir}
          />

          {sala.puedeEscribir ? null : (
            <View className="flex-row items-center justify-center gap-1.5 bg-organic-neutral-100 px-4 pb-2">
              <Ionicons name="information-circle-outline" size={13} color={PALETA.neutral[600]} />
              <Text className="font-cuerpo text-[12px] text-organic-neutral-600">
                Esta cuenta fue dada de baja. Podés leer la conversación, pero no responder.
              </Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>

      {/* Un solo visor para toda la conversación: montar un Modal por burbuja sería un
          componente por mensaje para algo que sólo se ve de a uno. */}
      <VisorImagen uri={imagenAmpliada} onCerrar={() => setImagenAmpliada(null)} />
    </View>
  );
}
