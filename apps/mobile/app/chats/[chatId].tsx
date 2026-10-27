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
 *
 * Responder un mensaje puntual (deslizarlo a la derecha) y eliminar uno propio (mantenerlo
 * apretado) no salen de ninguna HU: los pidió el equipo el 2026-10-12, con WhatsApp de
 * referencia. Ver "Responder y eliminar" en `pethood-backend/docs/api-chat-sala.md`.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraEscritura } from '@/components/chat/BarraEscritura';
import { BotonIrAlFinal } from '@/components/chat/BotonIrAlFinal';
import { BurbujaMensaje } from '@/components/chat/BurbujaMensaje';
import { CabeceraConversacion } from '@/components/chat/CabeceraConversacion';
import { HojaAdjuntos, type OrigenAdjunto } from '@/components/chat/HojaAdjuntos';
import { HojaMascotasCompartibles } from '@/components/chat/HojaMascotasCompartibles';
import { DetalleAvisoModal } from '@/components/perdidos/DetalleAvisoModal';
import { VisorAdjuntos } from '@/components/chat/VisorAdjuntos';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { ReporteModal, type ObjetoReportado } from '@/components/reportes/ReporteModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditorFotoModal } from '@/components/ui/EditorFotoModal';
import { SeparadorFecha } from '@/components/ui/SeparadorFecha';
import { ESPERA_ENTRE_MODALES_MS } from '@/constants/modales';
import { PALETA } from '@/constants/theme';
import { useGestionAviso } from '@/hooks/useGestionAviso';
import { useSalaChat } from '@/hooks/useSalaChat';
import { useSesion } from '@/hooks/useSesion';
import {
  elegirAdjuntosDeGaleria,
  grabarVideoConCamara,
  sacarFotoConCamara,
  validarAssetAdjunto,
} from '@/lib/elegirImagen';
import { esMimeDeVideo, tipoDeMime, type Adjunto } from '@/lib/adjuntos';
import { tomarAvisoEditado } from '@/lib/avisoRecienCreado';
import { citaDe, intercalarSeparadores, type CitaChat, type FilaSala } from '@/lib/mensajesChat';
import { coordenadasRecordadas } from '@/lib/ubicacion';
import { obtenerAviso, type AvisoPerdido } from '@/services/animalesPerdidos';
import { ApiError, type ArchivoAdjunto } from '@/services/api';
import {
  obtenerUbicacionRefugio,
  type MascotaEnChat,
  type UbicacionRefugioEnChat,
} from '@/services/chats';
import { LIMITES } from '@/shared/validation/limits';

const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Cuánto dura el destello del mensaje al que se llega tocando una cita. */
const DURACION_RESALTADO_MS = 1400;

/**
 * Cuánto hay que subir (en px, desde el último mensaje) para que aparezca la flechita de
 * volver abajo. Menos que esto es medio mensaje: volver con el dedo es igual de rápido.
 */
const DISTANCIA_BOTON_BAJAR = 300;

/** Algunos Android devuelven 'image/jpg', que no es un MIME real. */
function normalizarTipo(tipo?: string | null): string {
  const minuscula = tipo?.toLowerCase().trim() ?? '';
  return minuscula === 'image/jpg' ? 'image/jpeg' : minuscula || 'image/jpeg';
}

export default function ConversacionScreen() {
  const router = useRouter();
  const toast = useToast();
  const { usuario, token, vistaRefugio } = useSesion();
  /** Lo que se está reportando (un mensaje o el contacto), o `null` con el modal cerrado. */
  const [reportado, setReportado] = useState<ObjetoReportado | null>(null);
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
  /** El mensaje que se está respondiendo (se deslizó su burbuja), o `null`. */
  const [respondiendo, setRespondiendo] = useState<CitaChat | null>(null);
  /** El mensaje propio que se pidió eliminar, a la espera de confirmación, o `null`. */
  const [aEliminar, setAEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);
  /** Clave del mensaje al que se acaba de llegar desde una cita: destella un momento. */
  const [resaltado, setResaltado] = useState<string | null>(null);

  const lista = useRef<FlatList<FilaSala>>(null);

  /** Se subió en la conversación: se muestra la flechita para volver al último mensaje. */
  const [lejosDelFinal, setLejosDelFinal] = useState(false);
  /** Espejo de `lejosDelFinal` para leerlo sin recrear callbacks en cada scroll. */
  const lejosDelFinalRef = useRef(false);
  /** Mensajes del otro que llegaron mientras se estaba arriba: el número de la flechita. */
  const [nuevosSinVer, setNuevosSinVer] = useState(0);

  const sala = useSalaChat(chatId, usuario?.id ?? 0, token);
  /** Para la cita de un mensaje ajeno. Mientras carga la cabecera, "Contacto". */
  const nombreContacto = sala.cabecera?.contacto.nombre ?? 'Contacto';

  /**
   * La lista va invertida, así que el offset 0 es el ÚLTIMO mensaje: "ir al final" es volver
   * a 0. Lo usan la flechita y el envío.
   */
  const irAlFinal = useCallback((): void => {
    lista.current?.scrollToOffset({ offset: 0, animated: true });
    setNuevosSinVer(0);
  }, []);

  /** Sólo actualiza estado cuando se cruza el umbral, no en cada píxel de scroll. */
  const alScrollear = useCallback((evento: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const lejos = evento.nativeEvent.contentOffset.y > DISTANCIA_BOTON_BAJAR;
    if (lejos === lejosDelFinalRef.current) return;

    lejosDelFinalRef.current = lejos;
    setLejosDelFinal(lejos);
    if (!lejos) setNuevosSinVer(0);
  }, []);

  /**
   * Cuenta los mensajes ajenos que entran mientras se está arriba. Se mira el primero de la
   * lista (el más nuevo): si cambió y no es propio, llegó algo del otro. Cargar páginas viejas
   * agrega al final y no lo cambia; confirmar un pendiente propio sí, pero es propio.
   */
  const masNuevoVisto = useRef<string | null>(null);
  useEffect(() => {
    const masNuevo = sala.items[0];
    const anterior = masNuevoVisto.current;
    masNuevoVisto.current = masNuevo?.clave ?? null;

    if (!masNuevo || anterior === null || masNuevo.clave === anterior) return;
    if (!masNuevo.esMio && lejosDelFinalRef.current) setNuevosSinVer((cuantos) => cuantos + 1);
  }, [sala.items]);

  /**
   * El aviso de la tarjeta tocada, abierto en su popup encima de la conversación (HU-13.2). Se
   * pide fresco por su id: la tarjeta trae sólo un resumen, y así el popup muestra el estado de
   * hoy y la distancia, como en el portal.
   */
  const [avisoAbierto, setAvisoAbierto] = useState<AvisoPerdido | null>(null);
  /** Candado contra el doble toque mientras se trae el aviso. */
  const abriendoAviso = useRef(false);

  const verAviso = useCallback(async (avisoId: number): Promise<void> => {
    if (abriendoAviso.current) return;
    abriendoAviso.current = true;

    try {
      setAvisoAbierto(await obtenerAviso(avisoId, coordenadasRecordadas()));
    } catch (err) {
      // La tarjeta queda en la conversación aunque quien lo publicó lo haya eliminado: es lo
      // que se habló. Al tocarla se explica qué pasó en vez de abrir un popup vacío.
      setAviso(
        err instanceof ApiError && err.codigo === 'AVISO_ELIMINADO'
          ? {
              titulo: 'Se eliminó esta publicación',
              mensaje:
                'Quien la publicó la eliminó, así que ya no se puede ver. Pueden seguir hablando por acá.',
            }
          : {
              titulo: 'No pudimos abrir el aviso',
              mensaje:
                err instanceof ApiError ? err.message : 'Revisá tu conexión e intentalo de nuevo.',
            },
      );
    } finally {
      abriendoAviso.current = false;
    }
  }, []);

  // Resolver o editar cambia lo que muestra la tarjeta (el estado, la foto): la conversación
  // se recarga para que la tarjeta lo refleje. Eliminar no la cambia: la tarjeta queda igual.
  const { recargar } = sala;
  const gestionAviso = useGestionAviso({
    onActualizado: useCallback(
      (actualizado: AvisoPerdido) => {
        setAvisoAbierto(actualizado);
        recargar();
      },
      [recargar],
    ),
    onEliminado: useCallback(() => setAvisoAbierto(null), []),
    onAntesDeEditar: useCallback(() => setAvisoAbierto(null), []),
  });

  useFocusEffect(
    useCallback(() => {
      if (tomarAvisoEditado()) recargar();
    }, [recargar]),
  );

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
      sala.enviar(contenido, fotos, respondiendo);
      // Las fotos y la cita se sueltan junto con el texto: ya viajaron al pendiente, que
      // conserva su copia para poder reintentar.
      setFotos([]);
      setRespondiendo(null);
      // Lo que se acaba de mandar tiene que quedar a la vista, aunque se estuviera leyendo
      // algo de más arriba (por ejemplo, el mensaje que se respondió).
      irAlFinal();
    },
    [sala, fotos, respondiendo, irAlFinal],
  );

  const confirmarEliminacion = useCallback(async (): Promise<void> => {
    if (aEliminar === null) return;

    setEliminando(true);
    try {
      await sala.eliminar(aEliminar);
      // Si justo se estaba respondiendo ese mensaje, la cita ya no tiene sentido.
      setRespondiendo((actual) => (actual?.id === aEliminar ? null : actual));
      setAEliminar(null);
    } catch (err) {
      toast.mostrarError(
        err instanceof ApiError
          ? err.message
          : 'No pudimos eliminar el mensaje. Intentalo de nuevo.',
      );
    } finally {
      setEliminando(false);
    }
  }, [aEliminar, sala, toast]);

  // ─── Tarjetas de la hoja "Enviar en el chat": mascota y ubicación ───

  /** La hoja con las mascotas compartibles está abierta. */
  const [eligiendoMascota, setEligiendoMascota] = useState(false);
  /** La mascota elegida, a la espera de que se confirme compartirla. */
  const [mascotaAConfirmar, setMascotaAConfirmar] = useState<MascotaEnChat | null>(null);
  /** La ubicación del refugio, a la espera de que se confirme mandarla. */
  const [ubicacionAConfirmar, setUbicacionAConfirmar] = useState<UbicacionRefugioEnChat | null>(
    null,
  );
  const [enviandoTarjeta, setEnviandoTarjeta] = useState(false);

  /** Cierra la hoja de adjuntos y abre la lista de lo que se puede compartir. */
  const abrirCompartirMascota = useCallback((): void => {
    setHojaAbierta(false);
    setTimeout(() => setEligiendoMascota(true), ESPERA_ENTRE_MODALES_MS);
  }, []);

  const elegirMascota = useCallback((mascota: MascotaEnChat): void => {
    setEligiendoMascota(false);
    setTimeout(() => setMascotaAConfirmar(mascota), ESPERA_ENTRE_MODALES_MS);
  }, []);

  /**
   * Trae del perfil del refugio lo que se va a mandar y recién ahí pregunta: el diálogo muestra
   * la dirección y el link reales, no un texto genérico. Sin ubicación cargada no hay nada que
   * confirmar: se explica dónde cargarla.
   */
  const abrirUbicacion = useCallback(async (): Promise<void> => {
    setHojaAbierta(false);

    try {
      const ubicacion = await obtenerUbicacionRefugio(chatId);
      setTimeout(() => setUbicacionAConfirmar(ubicacion), ESPERA_ENTRE_MODALES_MS);
    } catch (err) {
      if (err instanceof ApiError && err.codigo === 'REFUGIO_SIN_UBICACION') {
        setTimeout(
          () =>
            setAviso({ titulo: 'Tu refugio no tiene ubicación cargada', mensaje: err.message }),
          ESPERA_ENTRE_MODALES_MS,
        );
        return;
      }

      toast.mostrarError(
        err instanceof ApiError ? err.message : 'No pudimos traer la ubicación del refugio.',
      );
    }
  }, [chatId, toast]);

  /** Manda la tarjeta confirmada y lleva al final, donde va a aparecer. */
  const confirmarTarjeta = useCallback(
    async (enviar: () => Promise<void>, cerrar: () => void): Promise<void> => {
      setEnviandoTarjeta(true);
      try {
        await enviar();
        cerrar();
        irAlFinal();
      } catch (err) {
        toast.mostrarError(
          err instanceof ApiError ? err.message : 'No pudimos enviarlo. Intentalo de nuevo.',
        );
      } finally {
        setEnviandoTarjeta(false);
      }
    },
    [irAlFinal, toast],
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

  /**
   * Tocar una cita lleva al mensaje citado y lo hace destellar. Si es más viejo que lo que
   * está cargado no se puede saltar ahí sin traer páginas a ciegas: se avisa en vez de no
   * hacer nada.
   */
  const irAMensaje = useCallback(
    (mensajeId: number): void => {
      const indice = filas.findIndex(
        (fila) => fila.tipo === 'mensaje' && fila.item.mensajeId === mensajeId,
      );

      if (indice === -1) {
        toast.mostrarAdvertencia(
          'Ese mensaje es más viejo de lo que está cargado. Subí en la conversación para verlo.',
        );
        return;
      }

      lista.current?.scrollToIndex({ index: indice, viewPosition: 0.5, animated: true });
      setResaltado(filas[indice]!.clave);
    },
    [filas, toast],
  );

  useEffect(() => {
    if (resaltado === null) return;
    const id = setTimeout(() => setResaltado(null), DURACION_RESALTADO_MS);
    return () => clearTimeout(id);
  }, [resaltado]);

  const renderItem = useCallback(
    ({ item: fila }: { item: FilaSala }) => (
      <View className="mb-[11px]">
        {fila.tipo === 'separador' ? (
          <SeparadorFecha etiqueta={fila.etiqueta} />
        ) : (
          <BurbujaMensaje
            item={fila.item}
            nombreContacto={nombreContacto}
            resaltado={resaltado === fila.clave}
            onReintentar={() => sala.reintentar(fila.item.clave)}
            onDescartar={() => sala.descartar(fila.item.clave)}
            onAbrirImagen={(indice) => setAmpliado({ adjuntos: fila.item.adjuntos, indice })}
            onReportar={() => setReportado({ tipo: 'MENSAJE', objetoId: Number(fila.item.clave) })}
            onEliminar={
              fila.item.mensajeId !== null ? () => setAEliminar(fila.item.mensajeId) : undefined
            }
            // Con la cuenta del otro dada de baja no se puede escribir, así que tampoco
            // responder.
            onResponder={
              sala.puedeEscribir
                ? () => {
                    const cita = citaDe(fila.item);
                    if (cita) setRespondiendo(cita);
                  }
                : undefined
            }
            onIrACita={irAMensaje}
            onVerSolicitud={
              fila.item.solicitud
                ? () => router.push(`/solicitudes/${fila.item.solicitud!.id}`)
                : undefined
            }
            // El popup del aviso se abre acá mismo, sin pasar por el portal.
            onVerAviso={fila.item.aviso ? () => void verAviso(fila.item.aviso!.id) : undefined}
            // "Ver mascota" lleva a la publicación, igual que una tarjeta de Favoritos.
            onVerMascota={
              fila.item.mascota?.publicacionId
                ? () =>
                    router.push({
                      pathname: '/publicaciones/[id]',
                      params: { id: fila.item.mascota!.publicacionId! },
                    })
                : undefined
            }
          />
        )}
      </View>
    ),
    [sala, router, verAviso, nombreContacto, resaltado, irAMensaje],
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
          aviso={sala.cabecera?.aviso ?? null}
          contexto={sala.cabecera?.contexto ?? null}
          desconectado={sala.desconectado}
          onVolver={volver}
          onReportar={() => {
            const contacto = sala.cabecera?.contacto;
            if (contacto) setReportado({ tipo: contacto.tipo, objetoId: contacto.id });
          }}
          onVerPerfil={() => {
            const contacto = sala.cabecera?.contacto;
            if (!contacto) return;
            if (contacto.tipo === 'REFUGIO') {
              router.push({ pathname: '/perfiles/refugio/[id]', params: { id: contacto.id } });
            } else {
              router.push({ pathname: '/perfiles/usuario/[id]', params: { id: contacto.id } });
            }
          }}
        />

        {/* El padding inferior sigue al teclado, así la barra de escritura sube con él y el
            último mensaje nunca queda tapado. Vale para las dos plataformas. */}
        <Animated.View style={estiloConTeclado}>
          {/* Contenedor propio de la lista: la flechita de volver abajo flota adentro, pegada
              a su borde inferior, que es justo arriba de la barra de escritura. */}
          <View className="flex-1">
            {sala.cargando ? (
              <EstadoCargando />
            ) : sala.error ? (
              <EstadoError mensaje={sala.error} onAccion={sala.recargar} />
            ) : (
              <FlatList
                ref={lista}
                data={filas}
                onScroll={alScrollear}
                // Basta con enterarse unas 10 veces por segundo: sólo importa cruzar el umbral.
                scrollEventThrottle={100}
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
                  ) : undefined
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
                // `scrollToIndex` a una fila que todavía no se midió falla: se acerca con un
                // offset estimado y se reintenta cuando ya está renderizada.
                onScrollToIndexFailed={(info) => {
                  lista.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true,
                  });
                  setTimeout(() => {
                    lista.current?.scrollToIndex({
                      index: info.index,
                      viewPosition: 0.5,
                      animated: true,
                    });
                  }, 250);
                }}
              />
            )}

            <BotonIrAlFinal
              visible={lejosDelFinal && !sala.cargando && !sala.error}
              nuevos={nuevosSinVer}
              onPress={irAlFinal}
            />
          </View>

          {/* La barra se muestra aunque el historial esté cargando o haya fallado: el
              usuario puede escribir igual, y el envío no depende de haber podido leer. */}
          <BarraEscritura
            fotos={fotos}
            onAdjuntar={() => setHojaAbierta(true)}
            onQuitarFoto={quitarFoto}
            onEnviar={enviar}
            habilitada={sala.puedeEscribir}
            respondiendoA={
              respondiendo
                ? { cita: respondiendo, autor: respondiendo.esMia ? 'Vos' : nombreContacto }
                : null
            }
            onCancelarRespuesta={() => setRespondiendo(null)}
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
      <ReporteModal objeto={reportado} onCerrar={() => setReportado(null)} />

      {/* Sin "Enviar mensaje": ya se está en la conversación. Si el aviso es propio, quedan
          las acciones de quien lo publicó. */}
      <DetalleAvisoModal
        aviso={avisoAbierto}
        onCerrar={() => setAvisoAbierto(null)}
        onResolver={gestionAviso.resolver}
        onEditar={gestionAviso.editar}
        onEliminar={gestionAviso.eliminar}
      />
      <VisorAdjuntos
        adjuntos={ampliado?.adjuntos ?? []}
        indiceInicial={ampliado?.indice ?? null}
        onCerrar={() => setAmpliado(null)}
      />

      <HojaAdjuntos
        visible={hojaAbierta}
        onCerrar={() => setHojaAbierta(false)}
        onElegirAdjunto={elegirAdjuntos}
        vistaRefugio={vistaRefugio}
        onCompartirMascota={abrirCompartirMascota}
        onUbicacionRefugio={() => void abrirUbicacion()}
      />

      <HojaMascotasCompartibles
        visible={eligiendoMascota}
        chatId={chatId}
        nombreContacto={nombreContacto}
        vistaRefugio={vistaRefugio}
        onCerrar={() => setEligiendoMascota(false)}
        onElegir={elegirMascota}
      />

      {/* Antes de compartir, se pregunta: le va a llegar una tarjeta al otro. */}
      <ConfirmDialog
        visible={mascotaAConfirmar !== null}
        tono="bloqueo"
        icono="paw-outline"
        titulo={`¿Querés compartir a ${
          mascotaAConfirmar?.nombre ?? 'esta mascota'
        } con ${nombreContacto}?`}
        mensaje="Le va a llegar una tarjeta con sus datos y un botón para ver la publicación."
        textoConfirmar="Enviar"
        cargando={enviandoTarjeta}
        onConfirmar={() => {
          const mascota = mascotaAConfirmar;
          if (!mascota) return;
          void confirmarTarjeta(
            () => sala.compartirMascota(mascota.id),
            () => setMascotaAConfirmar(null),
          );
        }}
        onCerrar={() => setMascotaAConfirmar(null)}
      />

      {/* La ubicación sale del perfil del refugio: se muestra lo que se va a mandar, con el
          link para chequearlo antes. */}
      <ConfirmDialog
        visible={ubicacionAConfirmar !== null}
        tono="bloqueo"
        icono="location-outline"
        titulo={`¿Querés mandar la ubicación del refugio a ${nombreContacto}?`}
        mensaje={
          ubicacionAConfirmar?.ubicacion ??
          'El perfil del refugio tiene cargado sólo el link de Google Maps.'
        }
        textoConfirmar="Enviar"
        cargando={enviandoTarjeta}
        onConfirmar={() =>
          void confirmarTarjeta(
            () => sala.enviarUbicacion(),
            () => setUbicacionAConfirmar(null),
          )
        }
        onCerrar={() => setUbicacionAConfirmar(null)}
      >
        {ubicacionAConfirmar?.mapaUrl ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Ver la ubicación en Google Maps"
            onPress={() =>
              void Linking.openURL(ubicacionAConfirmar.mapaUrl!).catch(() => undefined)
            }
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-organic-accent-600 py-[10px] active:opacity-70"
          >
            <Ionicons name="map-outline" size={17} color={PALETA.accent[600]} />
            <Text className="font-cuerpo-semi text-[13px] text-organic-accent-600">
              Ver en Google Maps
            </Text>
          </Pressable>
        ) : null}
      </ConfirmDialog>

      {/* Eliminar un mensaje propio es para los dos y no se deshace: acción crítica, con
          confirmación (regla transversal 6). Queda cargando hasta que el servidor responde. */}
      <ConfirmDialog
        visible={aEliminar !== null}
        tono="peligro"
        titulo="¿Eliminar este mensaje?"
        mensaje="Se va a eliminar para los dos. En la conversación va a quedar el aviso «Eliminaste este mensaje»."
        textoConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={() => void confirmarEliminacion()}
        onCerrar={() => setAEliminar(null)}
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
