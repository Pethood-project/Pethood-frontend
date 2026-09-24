/** Estado de sesión de la app: quién está logueado y con qué rol. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { cerrarSocket } from '@/lib/socketChat';
import * as authService from '@/services/auth';
import {
  borrarSesion,
  esMiembroDeRefugio,
  establecerAmbito,
  guardarSesion,
  guardarUsuario,
  obtenerToken,
  obtenerUsuario,
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

  const cambiarVistaRefugio = useCallback((activa: boolean) => {
    setVistaRefugioElegida(activa);
  }, []);

  const establecerSesion = useCallback(async (nuevoToken: string, nuevoUsuario: Usuario) => {
    // Cada ingreso arranca en la vista de refugio (si pertenece a uno), aunque en la sesión
    // anterior del dispositivo se haya quedado en la personal.
    setVistaRefugioElegida(true);
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
    await guardarSesion(nuevoToken, nuevoUsuario);
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
    setToken(null);
    setUsuario(null);
    setVistaRefugioElegida(true);
    // El socket quedó autenticado en el handshake con un token que ya no vale: no alcanza
    // con que la pantalla suelte su referencia, hay que cortarlo sí o sí.
    cerrarSocket();
    await borrarSesion();
    if (tokenActual) {
      await authService.logout(tokenActual).catch(() => undefined);
    }
  }, [token]);

  const esRefugio = esMiembroDeRefugio(usuario);
  // Se cruza con el rol y no se usa el valor elegido tal cual: si al usuario le sacan el
  // refugio, la app tiene que volver sola a la vista de adoptante.
  const vistaRefugio = esRefugio && vistaRefugioElegida;
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
      cambiarVistaRefugio,
      establecerSesion,
      actualizarUsuario,
      iniciarSesion,
      cerrarSesion,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
