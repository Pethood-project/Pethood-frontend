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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, Platform, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraEscritura } from '@/components/chat/BarraEscritura';
import { BurbujaMensaje } from '@/components/chat/BurbujaMensaje';
import { CabeceraConversacion } from '@/components/chat/CabeceraConversacion';
import { HojaAdjuntos, type OrigenAdjunto } from '@/components/chat/HojaAdjuntos';
import { VisorAdjuntos } from '@/components/chat/VisorAdjuntos';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditorFotoModal } from '@/components/ui/EditorFotoModal';
import { SeparadorFecha } from '@/components/ui/SeparadorFecha';
import { PALETA } from '@/constants/theme';
import { useSalaChat } from '@/hooks/useSalaChat';
import { useSesion } from '@/hooks/useSesion';
import {
  elegirAdjuntosDeGaleria,
  grabarVideoConCamara,
  sacarFotoConCamara,
  validarAssetAdjunto,
} from '@/lib/elegirImagen';
import { esMimeDeVideo, tipoDeMime, type Adjunto } from '@/lib/adjuntos';
import { intercalarSeparadores, type FilaSala } from '@/lib/mensajesChat';
import type { ArchivoAdjunto } from '@/services/api';
import { LIMITES } from '@/shared/validation/limits';

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

  /**
   * Adjuntos elegidos y todavía sin enviar: hasta `LIMITES.mensaje.fotos.maximo` fotos, o
   * un único video.
   */
  const [fotos, setFotos] = useState<ArchivoAdjunto[]>([]);
  /**
   * Fotos recién elegidas que todavía no pasaron por el editor de recorte/rotación. Se
   * revisan de a una, en orden: la primera de la cola es la que está en el editor. Al
   * confirmarla pasa a `fotos`; al cancelarla se descarta.
   */
  const [enRevision, setEnRevision] = useState<ArchivoAdjunto[]>([]);
  /** Hoja "Enviar en el chat" del botón `+`. */
  const [hojaAbierta, setHojaAbierta] = useState(false);
  /**
   * Cartel informativo de las reglas de adjuntos (qué entra, cuánto pesa, qué convive con
   * qué). Va por `ConfirmDialog` y no por `Alert.alert` porque el nativo no admite la
   * paleta ni la tipografía de PetHood. Los pedidos de PERMISO sí siguen siendo nativos:
   * son del sistema operativo, no de la app.
   */
  const [aviso, setAviso] = useState<{ titulo: string; mensaje: string } | null>(null);
  /**
   * Lo que se está viendo a pantalla completa: los adjuntos del mensaje tocado y cuál de
   * ellos, o `null`. Un solo visor para toda la lista; recibe el mensaje entero para poder
   * deslizar entre sus adjuntos sin volver a la conversación.
   */
  const [ampliado, setAmpliado] = useState<{ adjuntos: Adjunto[]; indice: number } | null>(null);

  const sala = useSalaChat(chatId, usuario?.id ?? 0, token);

  /**
   * Alto del teclado, para levantar la barra de escritura junto con él.
   *
   * No se usa `KeyboardAvoidingView`: desde que Expo activa edge-to-edge por defecto en
   * Android (SDK 54+), la ventana ya NO se redimensiona al abrir el teclado —pasa a ser un
   * inset— así que el componente no tiene de dónde calcular el desplazamiento y la pantalla
   * se queda quieta tapando lo que se escribe.
   *
   * Tampoco se usa `useAnimatedKeyboard` de Reanimated, que era lo que había acá: para
   * medir el inset instala un listener nativo sobre la ventana y le apaga el
   * `decorFitsSystemWindows`, y al desmontarse lo restaura. Si la pantalla se va con el
   * teclado abierto —que es exactamente lo que pasa al tocar la flecha para volver— esa
   * restauración deja la ventana medida como si el teclado siguiera ahí, y la siguiente
   * conversación abre con media pantalla en blanco hasta que un nuevo ciclo de abrir y
   * cerrar el teclado fuerza otra medición.
   *
   * Acá el alto sale de los eventos de `Keyboard`, que son de sólo lectura: no tocan la
   * ventana, así que no hay nada que pueda quedar trabado. La animación sigue corriendo en
   * el hilo de UI con un shared value, que además arranca en cero en cada montaje.
   */
  const altoTeclado = useSharedValue(0);

  useEffect(() => {
    // iOS avisa ANTES de animar y con la duración real, así que la barra viaja junto al
    // teclado. Android sólo avisa cuando ya terminó: ahí se acompaña con una transición
    // corta para que no sea un salto seco.
    const evtMostrar = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const evtOcultar = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const alAbrir = Keyboard.addListener(evtMostrar, (evento) => {
      altoTeclado.value = withTiming(evento.endCoordinates.height, {
        duration: evento.duration || 120,
      });
    });

    const alCerrar = Keyboard.addListener(evtOcultar, (evento) => {
      altoTeclado.value = withTiming(0, { duration: evento.duration || 120 });
    });

    return () => {
      alAbrir.remove();
      alCerrar.remove();
    };
  }, [altoTeclado]);

  const estiloConTeclado = useAnimatedStyle(() => ({
    flex: 1,
    paddingBottom: altoTeclado.value,
  }));

  /**
   * Cierra el teclado al salir de la sala: dejarlo abierto mientras se desmonta la pantalla
   * hace que la animación de salida arranque con el hueco todavía puesto.
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
   * Criterio 6: adjuntar abre el explorador nativo. De dónde sacar la foto ya lo eligió el
   * usuario en la hoja; acá sólo se abre el selector que corresponde y se valida lo que
   * vuelve.
   *
   * El tope se calcula contra lo que ya hay elegido, así dos pasadas seguidas no se pasan
   * del máximo que el backend acepta.
   */
  const elegirAdjuntos = useCallback(
    (origen: OrigenAdjunto): void => {
      setHojaAbierta(false);

      // Un video viaja solo: ni acompañado de fotos ni con otro video. El backend lo rechaza
      // con `ADJUNTOS_MEZCLADOS`/`DEMASIADOS_ARCHIVOS`, pero avisar acá evita hacerle subir
      // un archivo que va a volver rebotado.
      if (fotos.some((adjunto) => esMimeDeVideo(adjunto.tipo))) {
        setAviso({
          titulo: 'El video va solo',
          mensaje:
            'Un mensaje puede llevar un video o varias fotos, no las dos cosas. Mandá el video y después seguí con las fotos.',
        });
        return;
      }

      const lugar = LIMITES.mensaje.fotos.maximo - fotos.length;

      if (lugar <= 0) {
        setAviso({
          titulo: 'Llegaste al máximo',
          mensaje: `Podés mandar hasta ${LIMITES.mensaje.fotos.maximo} archivos por mensaje.`,
        });
        return;
      }

      if (origen === 'camara-video' && fotos.length > 0) {
        setAviso({
          titulo: 'El video va solo',
          mensaje: 'Sacá las fotos de este mensaje o mandalas primero, y después grabá el video.',
        });
        return;
      }

      const seleccion =
        origen === 'camara-foto'
          ? sacarFotoConCamara()
          : origen === 'camara-video'
            ? grabarVideoConCamara()
            : elegirAdjuntosDeGaleria(lugar);

      void seleccion.then((resultado) => {
        if ('permisoDenegado' in resultado) {
          // Los permisos son del sistema: acá sí va el diálogo del sistema, como en el
          // resto de la app.
          if (resultado.permisoDenegado === 'camara') {
            Alert.alert(
              'Necesitamos la cámara',
              'Dale permiso a PetHood para usar la cámara, o elegí algo de la galería.',
            );
          } else {
            Alert.alert('Necesitamos tus fotos', 'Necesitamos permiso para acceder a tus fotos.');
          }
          return;
        }

        const imagenes: ArchivoAdjunto[] = [];
        const videos: ArchivoAdjunto[] = [];

        for (const asset of resultado.assets) {
          // Validación de UX, salvo la duración del video: esa es la única barrera que
          // existe, porque el backend no puede medirla sin `ffmpeg`.
          const problema = validarAssetAdjunto(asset);
          if (problema) {
            setAviso({ titulo: 'No pudimos adjuntarlo', mensaje: problema });
            continue;
          }

          const tipo = normalizarTipo(asset.mimeType);
          const destino = tipoDeMime(tipo) === 'VIDEO' ? videos : imagenes;

          destino.push({
            uri: asset.uri,
            nombre:
              asset.fileName ??
              `mensaje-${imagenes.length + videos.length}.${EXTENSION_POR_TIPO[tipo] ?? 'jpg'}`,
            tipo,
          });
        }

        // De la galería se pueden elegir fotos y videos a la vez, pero el mensaje no los
        // mezcla: gana el video y se avisa que las fotos quedaron afuera.
        if (videos.length > 0) {
          const primero = videos[0]!;

          // Ya había fotos elegidas en este mensaje: el video no puede convivir con ellas, y
          // descartarlas en silencio sería peor que no adjuntar el video.
          if (fotos.length > 0) {
            setAviso({
              titulo: 'El video va solo',
              mensaje: 'Este mensaje ya tiene fotos. Mandalas primero y después adjuntá el video.',
            });
            return;
          }

          if (videos.length > 1 || imagenes.length > 0) {
            setAviso({
              titulo: 'Va sólo el video',
              mensaje:
                'Un mensaje lleva un video o varias fotos, no las dos cosas. Adjuntamos el primer video; el resto lo podés mandar aparte.',
            });
          }

          // El video no pasa por el editor: recortar y girar no aplican, y el backend
          // tampoco los aplicaría sobre un archivo que no es una imagen.
          setFotos([primero]);
          return;
        }

        // Las fotos no se confirman todavía: primero pasan por el editor, donde se pueden
        // recortar y girar.
        if (imagenes.length > 0) setEnRevision((actuales) => [...actuales, ...imagenes]);
      });
    },
    [fotos],
  );

  const enviar = useCallback(
    (contenido: string): void => {
      sala.enviar(contenido, fotos);
      // Las fotos se sueltan junto con el texto: ya viajaron al pendiente, que conserva su
      // copia para poder reintentar.
      setFotos([]);
    },
    [sala, fotos],
  );

  const quitarFoto = useCallback((indice: number): void => {
    setFotos((actuales) => actuales.filter((_, posicion) => posicion !== indice));
  }, []);

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
            onAbrirImagen={(indice) => setAmpliado({ adjuntos: fila.item.adjuntos, indice })}
            onVerSolicitud={
              fila.item.solicitud
                ? () => router.push(`/solicitudes/${fila.item.solicitud!.id}`)
                : undefined
            }
          />
        )}
      </View>
    ),
    [sala, router],
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
          minutosRespuesta={sala.cabecera?.minutosRespuesta ?? null}
          solicitud={sala.cabecera?.solicitud ?? null}
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
            fotos={fotos}
            onAdjuntar={() => setHojaAbierta(true)}
            onQuitarFoto={quitarFoto}
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
      <VisorAdjuntos
        adjuntos={ampliado?.adjuntos ?? []}
        indiceInicial={ampliado?.indice ?? null}
        onCerrar={() => setAmpliado(null)}
      />

      <HojaAdjuntos
        visible={hojaAbierta}
        onCerrar={() => setHojaAbierta(false)}
        onElegirAdjunto={elegirAdjuntos}
      />

      {/* Reglas de adjuntos: informativo, un solo botón. `tono="advertencia"` porque no
          falla nada — se avisa que algo no entra y qué hacer en cambio. */}
      <ConfirmDialog
        visible={aviso !== null}
        tono="advertencia"
        titulo={aviso?.titulo ?? ''}
        mensaje={aviso?.mensaje ?? ''}
        onCerrar={() => setAviso(null)}
      />

      {/* Una foto por vez: la primera de la cola. El editor devuelve un archivo nuevo sólo
          si hubo recorte o giro; si no, se conserva el original con su nombre y tipo. */}
      <EditorFotoModal
        visible={enRevision.length > 0}
        uri={enRevision[0]?.uri ?? ''}
        onCancelar={() => setEnRevision((actuales) => actuales.slice(1))}
        onConfirmar={(resultado) => {
          const original = enRevision[0];
          if (!original) return;

          const seReescribio = resultado.uri !== original.uri;
          setFotos((actuales) => [
            ...actuales,
            {
              uri: resultado.uri,
              nombre: seReescribio ? `mensaje-${actuales.length}.jpg` : original.nombre,
              tipo: seReescribio ? 'image/jpeg' : original.tipo,
            },
          ]);
          setEnRevision((actuales) => actuales.slice(1));
        }}
      />
    </View>
  );
}
