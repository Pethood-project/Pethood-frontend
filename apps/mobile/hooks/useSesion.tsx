/** Estado de sesión de la app: quién está logueado y con qué rol. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { cerrarSocket } from '@/lib/socketChat';
import { pedirPermisoYObtenerDispositivo } from '@/lib/notificacionesPush';
import * as authService from '@/services/auth';
import { eliminarDispositivo, registrarDispositivo } from '@/services/notificaciones';
import {
  borrarSesion,
  esMiembroDeRefugio,
  establecerAmbito,
  guardarSesion,
  guardarUsuario,
  obtenerToken,
  obtenerUsuario,
  suscribirRefugioNoVerificado,
  suscribirSesionInvalida,
  tokenInvalidoOExpirado,
  type Ambito,
} from '@/services/sesion';
import type { Usuario } from '@/types/auth';

interface ContextoSesion {
  usuario: Usuario | null;
  /** JWT de login con email/contraseña o de OAuth 2.0 (Google). */
  token: string | null;
  autenticado: boolean;
  /** Mientras se lee la sesión guardada, para no parpadear entre login y home. */
  cargando: boolean;
  esRefugio: boolean;
  /** Si está viendo la app como refugio. Nunca es `true` para quien no pertenece a uno. */
  vistaRefugio: boolean;
  /** Lo mismo, con el nombre que usa la API (cabecera `X-Ambito`). */
  ambito: Ambito;
  /**
   * El refugio del usuario todavía no está Activo (pendiente de verificación, suspendido o de
   * baja): el backend rechaza el perfil de refugio, así que la app usa el personal y no
   * muestra el selector de perfil.
   */
  refugioEnRevision: boolean;
  cambiarVistaRefugio: (activa: boolean) => void;
  establecerSesion: (token: string, usuario: Usuario) => Promise<void>;
  actualizarUsuario: (usuario: Usuario) => Promise<void>;
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<ContextoSesion | null>(null);

export function useSesion(): ContextoSesion {
  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error('useSesion necesita estar dentro de <SesionProvider>');
  }

  return contexto;
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  // Un miembro de refugio SIEMPRE arranca en la vista de refugio, tanto al loguearse como
  // al reabrir la app: la elección no se persiste. Si quiere su perfil personal, lo cambia
  // desde Perfil. Para quien no pertenece a un refugio este valor no tiene efecto.
  const [vistaRefugioElegida, setVistaRefugioElegida] = useState(true);
  // Respaldo cuando el estado del refugio no está en la sesión (sesión vieja) o quedó viejo (lo
  // suspendieron con la app abierta): el primer 403 REFUGIO_NO_VERIFICADO lo levanta, guardando
  // el estado que había. Deja de valer apenas la sesión trae otro estado (ej. ya lo aprobaron).
  const [rechazo, setRechazo] = useState<{ estado: string | undefined } | null>(null);
  const estadoRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    void Promise.all([obtenerToken(), obtenerUsuario()])
      .then(async ([tokenGuardado, usuarioGuardado]) => {
        if (tokenGuardado && tokenInvalidoOExpirado(tokenGuardado)) {
          await borrarSesion();
          return;
        }

        setToken(tokenGuardado);
        setUsuario(usuarioGuardado);
      })
      .finally(() => setCargando(false));
  }, []);

  // La sesión puede caducar con la app abierta: el cliente avisa y acá se limpia el
  // estado para que la navegación mande al login.
  useEffect(() => {
    return suscribirSesionInvalida(() => {
      setToken(null);
      setUsuario(null);
    });
  }, []);

  // Si el backend dice que el refugio no está Activo, se cae al perfil personal: el login y la
  // app como adoptante siguen funcionando, solo el perfil de refugio queda bloqueado.
  useEffect(() => {
    return suscribirRefugioNoVerificado(() => setRechazo({ estado: estadoRef.current }));
  }, []);

  const cambiarVistaRefugio = useCallback((activa: boolean) => {
    setVistaRefugioElegida(activa);
  }, []);

  const establecerSesion = useCallback(async (nuevoToken: string, nuevoUsuario: Usuario) => {
    // Cada ingreso arranca en la vista de refugio (si pertenece a uno), aunque en la sesión
    // anterior del dispositivo se haya quedado en la personal.
    setVistaRefugioElegida(true);
    setRechazo(null);
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
    await guardarSesion(nuevoToken, nuevoUsuario);

    // Best-effort (regla 11: sin permiso, o en Expo Go sin dev build, la bandeja sigue
    // funcionando igual) — nunca bloquea ni hace fallar el login.
    void pedirPermisoYObtenerDispositivo()
      .then((dispositivo) => {
        if (dispositivo) return registrarDispositivo(dispositivo.expoPushToken, dispositivo.plataforma);
      })
      .catch(() => undefined);
  }, []);

  const actualizarUsuario = useCallback(async (nuevoUsuario: Usuario) => {
    setUsuario(nuevoUsuario);
    await guardarUsuario(nuevoUsuario);
  }, []);

  const iniciarSesion = useCallback(
    async (email: string, contrasena: string) => {
      const respuesta = await authService.login(email, contrasena);
      await establecerSesion(respuesta.token, respuesta.usuario);
    },
    [establecerSesion],
  );

  const cerrarSesion = useCallback(async () => {
    const tokenActual = token;

    // Antes de borrar la sesión guardada (regla 10): el dispositivo deja de recibir push de
    // esta cuenta. Best-effort — sin permiso otorgado no hay token que dar de baja.
    await pedirPermisoYObtenerDispositivo()
      .then((dispositivo) => (dispositivo ? eliminarDispositivo(dispositivo.expoPushToken) : undefined))
      .catch(() => undefined);

    setToken(null);
    setUsuario(null);
    setVistaRefugioElegida(true);
    setRechazo(null);
    // El socket quedó autenticado en el handshake con un token que ya no vale: no alcanza
    // con que la pantalla suelte su referencia, hay que cortarlo sí o sí.
    cerrarSocket();
    await borrarSesion();
    if (tokenActual) {
      await authService.logout(tokenActual).catch(() => undefined);
    }
  }, [token]);

  const esRefugio = esMiembroDeRefugio(usuario);
  // El estado viene en la sesión: se sabe de entrada, sin esperar al primer 403. El 403 queda
  // como respaldo (sesión vieja sin estado, o refugio suspendido con la app abierta).
  const estadoRefugio = usuario?.refugio?.estado;
  estadoRef.current = estadoRefugio;
  const refugioEnRevision =
    esRefugio &&
    ((estadoRefugio !== undefined && estadoRefugio !== 'Activo') ||
      (rechazo !== null && rechazo.estado === estadoRefugio));
  // Se cruza con el rol y no se usa el valor elegido tal cual: si al usuario le sacan el
  // refugio, la app tiene que volver sola a la vista de adoptante.
  const vistaRefugio = esRefugio && vistaRefugioElegida && !refugioEnRevision;
  const ambito: Ambito = vistaRefugio ? 'REFUGIO' : 'PERSONAL';

  // Se escribe durante el render y no en un efecto a propósito: los efectos de los hijos
  // (las pantallas que piden datos al montarse) corren ANTES que los del provider, así que
  // con un efecto el primer pedido saldría con el perfil anterior. Es idempotente.
  establecerAmbito(ambito);

  const valor = useMemo<ContextoSesion>(
    () => ({
      usuario,
      token,
      autenticado: Boolean(token),
      cargando,
      esRefugio,
      vistaRefugio,
      ambito,
      refugioEnRevision,
      cambiarVistaRefugio,
      establecerSesion,
      actualizarUsuario,
      iniciarSesion,
      cerrarSesion,
    }),
    [
      usuario,
      token,
      cargando,
      esRefugio,
      vistaRefugio,
      ambito,
      refugioEnRevision,
      cambiarVistaRefugio,
      establecerSesion,
      actualizarUsuario,
      iniciarSesion,
      cerrarSesion,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
