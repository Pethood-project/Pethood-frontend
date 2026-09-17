/**
 * Estado de una sala de conversación (HU-5.2, GUI-14): historial paginado, envío optimista
 * y tiempo real.
 *
 * Vive en un hook y no en la pantalla porque son tres fuentes de datos que se pisan entre
 * sí (historial, POST en vuelo, eventos de socket) y la pantalla debería ocuparse sólo de
 * pintar. Las transformaciones de la lista son funciones puras en `lib/mensajesChat.ts`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  aItems,
  insertarMensaje,
  marcarMisMensajesLeidos,
  mezclarPagina,
  quitarPendienteConfirmado,
  type ItemChat,
  type MensajePendiente,
} from '@/lib/mensajesChat';
import {
  EVENTOS,
  adquirirSocket,
  type Ack,
  type EventoError,
  type EventoLeido,
  type EventoPresencia,
} from '@/lib/socketChat';
import type { ArchivoAdjunto } from '@/services/api';
import { ApiError } from '@/services/api';
import {
  enviarMensaje,
  listarMensajes,
  marcarChatLeido,
  obtenerCabeceraChat,
  type CabeceraChat,
  type Mensaje,
} from '@/services/chats';

const MENSAJE_ERROR_CARGA = 'No pudimos cargar la conversación.';

let contadorClaves = 0;

/** Identidad local de un mensaje en vuelo. Un contador alcanza: no sale de esta sesión. */
function nuevaClaveLocal(): string {
  contadorClaves += 1;
  return `pendiente-${contadorClaves}`;
}

export interface EstadoSalaChat {
  cabecera: CabeceraChat | null;
  /** Ya en orden descendente: se le pasa tal cual a una `FlatList inverted`. */
  items: ItemChat[];
  cargando: boolean;
  error: string | null;
  /** `true` mientras se trae una página más vieja, para el spinner del tope. */
  cargandoMas: boolean;
  hayMas: boolean;
  /** El contacto está conectado. Arranca en la cabecera y lo actualiza el socket. */
  enLinea: boolean;
  /** El socket está caído: la franja de "Sin conexión" del header. */
  desconectado: boolean;
  /** `false` si la cuenta del contacto se dio de baja: se puede leer pero no escribir. */
  puedeEscribir: boolean;
  recargar: () => void;
  cargarMasViejos: () => void;
  enviar: (contenido: string, foto: ArchivoAdjunto | null) => void;
  reintentar: (claveLocal: string) => void;
  descartar: (claveLocal: string) => void;
}

export function useSalaChat(chatId: number, miUsuarioId: number, token: string | null) {
  const [cabecera, setCabecera] = useState<CabeceraChat | null>(null);
  const [confirmados, setConfirmados] = useState<Mensaje[]>([]);
  const [pendientes, setPendientes] = useState<MensajePendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hayMas, setHayMas] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [enLinea, setEnLinea] = useState(false);
  const [desconectado, setDesconectado] = useState(false);

  /**
   * La pantalla se puede desmontar con peticiones en vuelo. Sin esta guarda, la respuesta
   * llamaría a `setState` sobre un componente que ya no existe.
   */
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  /** Espejo de `pendientes` para leerlo desde un callback sin capturarlo en la clausura. */
  const pendientesRef = useRef<MensajePendiente[]>([]);
  pendientesRef.current = pendientes;

  /**
   * Trae la primera página y la cabecera. Sirve para la carga inicial, para el reintento
   * del estado de error y para el refetch tras una reconexión.
   *
   * En la reconexión NO se limpia la lista: se mezcla por id sobre lo que ya hay, así el
   * usuario no ve parpadear la conversación entera por haber perdido la señal un segundo.
   */
  const cargar = useCallback(
    async (opciones: { silencioso?: boolean } = {}): Promise<void> => {
      try {
        if (!opciones.silencioso) setError(null);

        const [datosCabecera, historial] = await Promise.all([
          obtenerCabeceraChat(chatId),
          listarMensajes(chatId),
        ]);

        if (!montado.current) return;

        setCabecera(datosCabecera);
        setEnLinea(datosCabecera.enLinea);
        setConfirmados((actuales) => mezclarPagina(actuales, historial.mensajes));

        // El cursor sólo se pisa en una carga completa: en un refetch por reconexión, la
        // primera página no dice nada sobre hasta dónde llegó la paginación hacia atrás.
        if (!opciones.silencioso) {
          setHayMas(historial.hayMas);
          setCursor(historial.proximoCursor);
        }
      } catch (err) {
        if (!montado.current || opciones.silencioso) return;
        setError(err instanceof ApiError ? err.mensaje : MENSAJE_ERROR_CARGA);
      } finally {
        if (montado.current && !opciones.silencioso) setCargando(false);
      }
    },
    [chatId],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /**
   * Marca la sala como leída al abrirla (criterio del contrato: al abrir, no al renderizar
   * cada mensaje). Si falla no se le dice nada al usuario: el badge se corrige solo la
   * próxima vez que entre, y un toast por esto sería ruido sobre algo que él no pidió.
   */
  useEffect(() => {
    void marcarChatLeido(chatId).catch(() => undefined);
  }, [chatId]);

  /** Página anterior en el tiempo. La `FlatList` invertida la pide al llegar al tope. */
  const cargarMasViejos = useCallback((): void => {
    if (!hayMas || cargandoMas || cursor === null) return;

    setCargandoMas(true);

    void listarMensajes(chatId, cursor)
      .then((historial) => {
        if (!montado.current) return;
        setConfirmados((actuales) => mezclarPagina(actuales, historial.mensajes));
        setHayMas(historial.hayMas);
        setCursor(historial.proximoCursor);
      })
      // Sin estado de error propio: la conversación que ya se ve sigue estando, y el
      // usuario puede volver a scrollear para reintentar.
      .catch(() => undefined)
      .finally(() => {
        if (montado.current) setCargandoMas(false);
      });
  }, [chatId, cursor, hayMas, cargandoMas]);

  /** Manda un pendiente al servidor. Lo comparten el envío y el reintento. */
  const despachar = useCallback(
    (pendiente: MensajePendiente): void => {
      void enviarMensaje(chatId, pendiente.contenido, pendiente.foto)
        .then((mensaje) => {
          if (!montado.current) return;
          // Puede que el broadcast ya lo haya insertado: `insertarMensaje` deduplica.
          setConfirmados((actuales) => insertarMensaje(actuales, mensaje));
          setPendientes((actuales) =>
            actuales.filter((otro) => otro.claveLocal !== pendiente.claveLocal),
          );
        })
        .catch(() => {
          if (!montado.current) return;
          // La burbuja queda con la cruz y el texto intacto para reintentar.
          setPendientes((actuales) =>
            actuales.map((otro) =>
              otro.claveLocal === pendiente.claveLocal ? { ...otro, fallo: true } : otro,
            ),
          );
        });
    },
    [chatId],
  );

  const enviar = useCallback(
    (contenido: string, foto: ArchivoAdjunto | null): void => {
      const pendiente: MensajePendiente = {
        claveLocal: nuevaClaveLocal(),
        contenido,
        foto,
        fallo: false,
      };

      // La burbuja aparece ANTES de que el servidor conteste: eso es el update optimista.
      setPendientes((actuales) => [...actuales, pendiente]);
      despachar(pendiente);
    },
    [despachar],
  );

  const reintentar = useCallback(
    (claveLocal: string): void => {
      // El pendiente se busca en el ref y NO dentro de un `setPendientes`: React puede
      // ejecutar un updater más de una vez, y ahí adentro `despachar` mandaría el mensaje
      // dos veces.
      const pendiente = pendientesRef.current.find((otro) => otro.claveLocal === claveLocal);
      if (!pendiente) return;

      setPendientes((actuales) =>
        actuales.map((otro) =>
          otro.claveLocal === claveLocal ? { ...otro, fallo: false } : otro,
        ),
      );

      despachar({ ...pendiente, fallo: false });
    },
    [despachar],
  );

  const descartar = useCallback((claveLocal: string): void => {
    setPendientes((actuales) => actuales.filter((otro) => otro.claveLocal !== claveLocal));
  }, []);

  // ─── Tiempo real ───
  useEffect(() => {
    if (!token) return;

    const { socket, liberar } = adquirirSocket(token);

    const unirse = (): void => {
      socket.emit(EVENTOS.UNIRSE, { chatId }, (respuesta: Ack<{ chatId: number }>) => {
        // El backend verifica la participación antes de dejar entrar. Si rechaza, el
        // tiempo real no va a funcionar, pero la conversación se sigue leyendo por REST:
        // no se rompe la pantalla por esto.
        if (!respuesta?.ok && montado.current) setDesconectado(true);
      });
    };

    const alConectar = (): void => {
      if (!montado.current) return;
      setDesconectado(false);
      // Socket.io reconecta solo pero NO rejoinea las salas, y el server no encola nada
      // de lo que pasó mientras tanto: hay que volver a entrar y traer lo perdido.
      unirse();
      void cargar({ silencioso: true });
    };

    const alDesconectar = (): void => {
      if (montado.current) setDesconectado(true);
    };

    const alMensajeNuevo = (mensaje: Mensaje): void => {
      if (!montado.current || mensaje.chatId !== chatId) return;

      setConfirmados((actuales) => insertarMensaje(actuales, mensaje));

      // El broadcast le llega también al emisor y puede ganarle a la respuesta del POST:
      // sin esto la burbuja se vería dos veces hasta que el POST conteste.
      if (mensaje.usuarioId === miUsuarioId) {
        setPendientes((actuales) => quitarPendienteConfirmado(actuales, mensaje));
      }
    };

    const alLeido = ({ chatId: sala, usuarioId }: EventoLeido): void => {
      // Que yo haya leído no cambia el estado de MIS mensajes: el doble check se enciende
      // cuando lee el otro.
      if (!montado.current || sala !== chatId || usuarioId === miUsuarioId) return;
      setConfirmados((actuales) => marcarMisMensajesLeidos(actuales, miUsuarioId));
    };

    const alPresencia = ({ chatId: sala, usuarioId, enLinea: activo }: EventoPresencia): void => {
      if (!montado.current || sala !== chatId || usuarioId === miUsuarioId) return;
      setEnLinea(activo);
    };

    // Hoy el único caso es el vencimiento del token: el server avisa y corta. El cliente
    // HTTP ya maneja el 401 mandando al login, así que acá alcanza con reflejar la caída.
    const alError = (_evento: EventoError): void => {
      if (montado.current) setDesconectado(true);
    };

    socket.on('connect', alConectar);
    socket.on('disconnect', alDesconectar);
    socket.on('connect_error', alDesconectar);
    socket.on(EVENTOS.MENSAJE_NUEVO, alMensajeNuevo);
    socket.on(EVENTOS.LEIDO, alLeido);
    socket.on(EVENTOS.PRESENCIA, alPresencia);
    socket.on(EVENTOS.ERROR, alError);

    // Si el socket ya estaba conectado (otra pantalla lo dejó abierto), `connect` no se
    // vuelve a disparar: hay que unirse a mano.
    if (socket.connected) unirse();
    else setDesconectado(true);

    return () => {
      socket.emit(EVENTOS.SALIR, { chatId });

      socket.off('connect', alConectar);
      socket.off('disconnect', alDesconectar);
      socket.off('connect_error', alDesconectar);
      socket.off(EVENTOS.MENSAJE_NUEVO, alMensajeNuevo);
      socket.off(EVENTOS.LEIDO, alLeido);
      socket.off(EVENTOS.PRESENCIA, alPresencia);
      socket.off(EVENTOS.ERROR, alError);

      liberar();
    };
  }, [chatId, miUsuarioId, token, cargar]);

  const items = useMemo(
    () => aItems(confirmados, pendientes, miUsuarioId),
    [confirmados, pendientes, miUsuarioId],
  );

  const recargar = useCallback((): void => {
    setCargando(true);
    void cargar();
  }, [cargar]);

  return {
    cabecera,
    items,
    cargando,
    error,
    cargandoMas,
    hayMas,
    enLinea,
    desconectado,
    // Mientras no sabemos quién es el contacto se asume que sí, para no deshabilitar el
    // input durante la carga y que parpadee al habilitarse.
    puedeEscribir: cabecera?.contacto.activo ?? true,
    recargar,
    cargarMasViejos,
    enviar,
    reintentar,
    descartar,
  } satisfies EstadoSalaChat;
}
