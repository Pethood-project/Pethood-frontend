/**
 * Scroll infinito sobre un listado paginado por cursor, el estándar de los listados de la
 * app (`AGENTS.md`). Lo usa el portal de mascotas perdidas (GUI-06) y sirve tal cual para
 * cualquier endpoint que responda `{ <items>, hayMas, proximoCursor }`.
 *
 * Qué resuelve para que la pantalla no tenga que hacerlo:
 * - **Primera página** al montar y cada vez que cambia `cargarPagina` (o sea, los filtros):
 *   el listado vuelve a arrancar sin cursor, como pide el contrato.
 * - **Página siguiente** al llegar al final, de a una: `onEndReached` se dispara varias veces
 *   seguidas y dos pedidos con el mismo cursor traerían la misma página dos veces.
 * - **Respuestas viejas descartadas:** si el usuario cambia los filtros o refresca mientras
 *   una página viaja, esa respuesta ya no corresponde a lo que se ve y se ignora.
 * - **Errores separados:** si falla la primera página no hay nada que mostrar y la pantalla
 *   pone su estado de error; si falla una siguiente, lo ya cargado se queda y el pie ofrece
 *   reintentar. Mientras haya un error en el pie no se reintenta solo al scrollear, para no
 *   martillar un servidor caído.
 *
 * `cargarPagina` tiene que ser estable (`useCallback` con los filtros como dependencia):
 * cada identidad nueva reinicia el listado.
 *
 * `claveDe` también tiene que ser estable (definida fuera del componente): de ella dependen
 * `agregarAlPrincipio` y la carga de páginas siguientes, y una función inline los recrea en
 * cada render. Si la pantalla usa `agregarAlPrincipio` en un efecto, eso lo redispara en bucle.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  agregarAlPrincipio as ponerArriba,
  reemplazar as reemplazarEnLista,
  unirPagina,
  type PaginaCursor,
} from '@/lib/paginacion';
import { ApiError } from '@/services/api';

export type { PaginaCursor };

interface OpcionesPaginacion<T> {
  /** Trae una página. `cursor` en `null` es la primera. */
  cargarPagina: (cursor: number | null) => Promise<PaginaCursor<T>>;
  /** Identidad de cada ítem, para no repetirlos entre páginas. */
  claveDe: (item: T) => number | string;
  /**
   * Mensaje cuando el pedido falla sin respuesta del servidor (sin conexión). Si el servidor
   * respondió con un error, se muestra su `mensaje` tal cual, que ya viene en rioplatense.
   */
  mensajeSinConexion: string;
}

export interface PaginacionCursor<T> {
  items: T[];
  /** Primera página en viaje, sin nada para mostrar todavía. */
  cargando: boolean;
  /** Pull-to-refresh en viaje: lo ya cargado sigue a la vista. */
  refrescando: boolean;
  /** Página siguiente en viaje: el pie muestra un indicador. */
  cargandoMas: boolean;
  /** Falló la primera página. */
  error: string | null;
  /** Falló una página siguiente: lo ya cargado se queda. */
  errorMas: string | null;
  hayMas: boolean;
  /** Vuelve a pedir la primera página desde cero (el botón de la pantalla de error). */
  recargar: () => void;
  refrescar: () => void;
  /** Para `onEndReached`: no hace nada si no hay más, si ya hay un pedido o si falló el anterior. */
  cargarMas: () => void;
  /** El "Reintentar" del pie después de un error. */
  reintentarMas: () => void;
  /** Inserta arriba un ítem recién creado sin recargar el listado. */
  agregarAlPrincipio: (item: T) => void;
  /** Actualiza un ítem que ya está en la lista, sin moverlo de lugar ni recargar. */
  reemplazar: (item: T) => void;
}

function mensajeDe(err: unknown, sinConexion: string): string {
  return err instanceof ApiError ? err.message : sinConexion;
}

export function usePaginacionCursor<T>({
  cargarPagina,
  claveDe,
  mensajeSinConexion,
}: OpcionesPaginacion<T>): PaginacionCursor<T> {
  const [items, setItems] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorMas, setErrorMas] = useState<string | null>(null);
  const [hayMas, setHayMas] = useState(false);

  /** Cursor de la página siguiente. En una ref porque lo leen callbacks que no se recrean. */
  const cursor = useRef<number | null>(null);
  /**
   * Número de "listado vigente". Cada primera página nueva lo incrementa, y toda respuesta
   * que llega con un número viejo se descarta: pertenece a otros filtros o a un refresco
   * anterior.
   */
  const generacion = useRef(0);
  /** Candado contra los `onEndReached` que se disparan varias veces seguidas. */
  const pidiendoMas = useRef(false);

  const primeraPagina = useCallback(
    async (modo: 'cargando' | 'refrescando'): Promise<void> => {
      const pedido = ++generacion.current;
      pidiendoMas.current = false;
      setCargandoMas(false);
      setErrorMas(null);

      if (modo === 'cargando') {
        cursor.current = null;
        setCargando(true);
        setError(null);
      } else {
        setRefrescando(true);
      }

      try {
        const pagina = await cargarPagina(null);
        if (pedido !== generacion.current) return;

        cursor.current = pagina.proximoCursor;
        setItems(pagina.items);
        setHayMas(pagina.hayMas);
        setError(null);
      } catch (err) {
        if (pedido !== generacion.current) return;

        // Sin la primera página no hay listado coherente que mostrar, tampoco después de
        // un refresco: se pasa a la pantalla de error, igual que en Favoritos.
        setItems([]);
        setHayMas(false);
        setError(mensajeDe(err, mensajeSinConexion));
      } finally {
        if (pedido === generacion.current) {
          setCargando(false);
          setRefrescando(false);
        }
      }
    },
    [cargarPagina, mensajeSinConexion],
  );

  useEffect(() => {
    void primeraPagina('cargando');
  }, [primeraPagina]);

  const siguientePagina = useCallback(async (): Promise<void> => {
    if (pidiendoMas.current || cursor.current === null) return;

    const pedido = generacion.current;
    pidiendoMas.current = true;
    setCargandoMas(true);
    setErrorMas(null);

    try {
      const pagina = await cargarPagina(cursor.current);
      if (pedido !== generacion.current) return;

      cursor.current = pagina.proximoCursor;
      setHayMas(pagina.hayMas);
      setItems((actuales) => unirPagina(actuales, pagina.items, claveDe));
    } catch (err) {
      if (pedido !== generacion.current) return;
      setErrorMas(mensajeDe(err, mensajeSinConexion));
    } finally {
      if (pedido === generacion.current) {
        pidiendoMas.current = false;
        setCargandoMas(false);
      }
    }
  }, [cargarPagina, claveDe, mensajeSinConexion]);

  const cargarMas = useCallback((): void => {
    if (!hayMas || errorMas !== null || cargando || refrescando) return;
    void siguientePagina();
  }, [hayMas, errorMas, cargando, refrescando, siguientePagina]);

  const agregarAlPrincipio = useCallback(
    (item: T): void => {
      setItems((actuales) => ponerArriba(actuales, item, claveDe));
    },
    [claveDe],
  );

  const reemplazar = useCallback(
    (item: T): void => {
      setItems((actuales) => reemplazarEnLista(actuales, item, claveDe));
    },
    [claveDe],
  );

  // Estables a propósito: las pantallas las ponen como dependencia de `useFocusEffect`, y una
  // función nueva en cada render volvería a correr ese efecto en cada render.
  const recargar = useCallback((): void => void primeraPagina('cargando'), [primeraPagina]);
  const refrescar = useCallback((): void => void primeraPagina('refrescando'), [primeraPagina]);
  const reintentarMas = useCallback((): void => void siguientePagina(), [siguientePagina]);

  return {
    items,
    cargando,
    refrescando,
    cargandoMas,
    error,
    errorMas,
    hayMas,
    recargar,
    refrescar,
    cargarMas,
    reintentarMas,
    agregarAlPrincipio,
    reemplazar,
  };
}
