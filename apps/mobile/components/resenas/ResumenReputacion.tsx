/**
 * Bloque de reputación listo para embeber: trae el historial de un usuario o un refugio y
 * muestra el desglose de estrellas y, opcionalmente, los comentarios (Módulo 10, HU-10.5).
 *
 * Se usa en los perfiles, en la ficha de una publicación y en la revisión de una solicitud,
 * para no repetir el pedido ni el estado de carga en cada pantalla.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { DesgloseEstrellas } from '@/components/resenas/DesgloseEstrellas';
import { ListaResenas } from '@/components/resenas/ListaResenas';
import { PALETA } from '@/constants/theme';
import {
  obtenerResenasDeRefugio,
  obtenerResenasDeUsuario,
  type ResumenResenas,
} from '@/services/resenas';

interface ResumenReputacionProps {
  tipo: 'usuario' | 'refugio';
  id: number;
  /** Encabezado de la sección. Sin él, no se dibuja título. */
  titulo?: string;
  /** Con `true`, debajo del desglose se listan las reseñas con sus comentarios. */
  mostrarLista?: boolean;
  className?: string;
}

export function ResumenReputacion({
  tipo,
  id,
  titulo,
  mostrarLista = false,
  className = '',
}: ResumenReputacionProps) {
  const [resumen, setResumen] = useState<ResumenResenas | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    const pedido =
      tipo === 'refugio' ? obtenerResenasDeRefugio(id) : obtenerResenasDeUsuario(id);

    void pedido
      .then((respuesta) => {
        if (vigente) setResumen(respuesta);
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
  }, [tipo, id]);

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
              <ListaResenas resenas={resumen.resenas} />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
