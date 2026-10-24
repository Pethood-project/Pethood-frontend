/**
 * Bloque de reputación listo para embeber: trae el historial de un usuario o un refugio y
 * muestra el desglose de estrellas y, opcionalmente, los comentarios (Módulo 10, HU-10.5).
 *
 * Se usa en los perfiles, en la ficha de una publicación y en la revisión de una solicitud,
 * para no repetir el pedido ni el estado de carga en cada pantalla.
 *
 * Con `limiteInicial` no baja todo el historial: muestra solo las últimas N reseñas y, si hay
 * más, un botón "Ver más reseñas". Ese botón lleva a otra pantalla (`onVerMas`) o, sin
 * `onVerMas`, pide la página siguiente (de a `TAMANIO_PAGINA`) y la agrega abajo.
 */
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useToast } from '@/components/feedback/Toast';
import { DesgloseEstrellas } from '@/components/resenas/DesgloseEstrellas';
import { ListaResenas } from '@/components/resenas/ListaResenas';
import { PALETA } from '@/constants/theme';
import {
  obtenerResenasDeRefugio,
  obtenerResenasDeUsuario,
  type OpcionesPaginaResenas,
  type Resena,
  type ResumenResenas,
} from '@/services/resenas';

/** Cuántas reseñas se suman cada vez que se toca "Ver más reseñas" en modo paginador. */
const TAMANIO_PAGINA = 10;

interface ResumenReputacionProps {
  tipo: 'usuario' | 'refugio';
  id: number;
  /** Encabezado de la sección. Sin él, no se dibuja título. */
  titulo?: string;
  /** Con `true`, debajo del desglose se listan las reseñas con sus comentarios. */
  mostrarLista?: boolean;
  /** Muestra solo las últimas N reseñas y pagina el resto (ver arriba). Requiere `mostrarLista`. */
  limiteInicial?: number;
  /** Con `limiteInicial`: en vez de paginar acá, el botón "Ver más reseñas" llama a esto. */
  onVerMas?: () => void;
  className?: string;
}

function pedirResenas(
  tipo: 'usuario' | 'refugio',
  id: number,
  opciones?: OpcionesPaginaResenas,
): Promise<ResumenResenas> {
  return tipo === 'refugio'
    ? obtenerResenasDeRefugio(id, opciones)
    : obtenerResenasDeUsuario(id, opciones);
}

export function ResumenReputacion({
  tipo,
  id,
  titulo,
  mostrarLista = false,
  limiteInicial,
  onVerMas,
  className = '',
}: ResumenReputacionProps) {
  const toast = useToast();
  const [resumen, setResumen] = useState<ResumenResenas | null>(null);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [proximoCursor, setProximoCursor] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    void pedirResenas(tipo, id, limiteInicial ? { limite: limiteInicial } : undefined)
      .then((respuesta) => {
        if (!vigente) return;
        setResumen(respuesta);
        setResenas(respuesta.resenas);
        setHayMas(respuesta.hayMas ?? false);
        setProximoCursor(respuesta.proximoCursor ?? null);
      })
      // Silencioso: la reputación es información secundaria; si falla, la pantalla sigue.
      .catch(() => {
        if (vigente) setResumen(null);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [tipo, id, limiteInicial]);

  const cargarMas = useCallback(async (): Promise<void> => {
    if (cargandoMas || proximoCursor === null) return;

    setCargandoMas(true);
    try {
      const pagina = await pedirResenas(tipo, id, { limite: TAMANIO_PAGINA, cursor: proximoCursor });
      setResenas((actuales) => [...actuales, ...pagina.resenas]);
      setHayMas(pagina.hayMas ?? false);
      setProximoCursor(pagina.proximoCursor ?? null);
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos cargar más reseñas. Intentalo de nuevo.',
      );
    } finally {
      setCargandoMas(false);
    }
  }, [cargandoMas, proximoCursor, tipo, id, toast]);

  const restantes = resumen ? Math.max(resumen.cantidad - resenas.length, 0) : 0;

  return (
    <View className={className}>
      {titulo ? (
        <Text className="mb-2 font-cuerpo-semi text-[11px] uppercase tracking-[0.6px] text-organic-neutral-500">
          {titulo}
        </Text>
      ) : null}

      {cargando ? (
        <View className="items-center rounded-2xl bg-organic-surface py-8">
          <ActivityIndicator color={PALETA.accent[600]} />
        </View>
      ) : !resumen ? (
        <View className="rounded-2xl bg-organic-surface p-5">
          <Text className="text-center font-cuerpo text-[14px] text-organic-neutral-500">
            No pudimos cargar las reseñas.
          </Text>
        </View>
      ) : (
        <>
          <DesgloseEstrellas
            promedio={resumen.promedio}
            cantidad={resumen.cantidad}
            distribucion={resumen.distribucion}
          />
          {mostrarLista ? (
            <View className="mt-2.5">
              <ListaResenas resenas={resenas} />

              {hayMas ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver más reseñas"
                  disabled={cargandoMas}
                  onPress={onVerMas ?? (() => void cargarMas())}
                  className="mt-2.5 min-h-[46px] items-center justify-center rounded-2xl border border-organic-accent-600 px-4 py-3 active:opacity-80"
                >
                  {cargandoMas ? (
                    <ActivityIndicator color={PALETA.accent[600]} />
                  ) : (
                    <Text className="font-cuerpo-semi text-[14px] text-organic-accent-600">
                      Ver más reseñas
                      {!onVerMas && restantes > 0 ? ` (${restantes} más)` : ''}
                    </Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
