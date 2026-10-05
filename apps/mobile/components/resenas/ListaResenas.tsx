/**
 * Lista de reseñas históricas de un usuario o refugio (Módulo 10, HU-10.5). Cada fila trae
 * autor, puntuación, fecha, el flujo reseñado y el comentario si lo hay.
 */
import { Text, View } from 'react-native';

import { BotonReportar } from '@/components/reportes/BotonReportar';
import { Estrellas } from '@/components/resenas/Estrellas';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { useSesion } from '@/hooks/useSesion';
import { urlAbsoluta } from '@/services/api';
import { etiquetaFlujo, type Resena } from '@/services/resenas';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

function fechaVisible(iso: string): string {
  const fecha = parsearFecha(iso);
  return fecha ? aFechaVisible(fecha) : '';
}

export function ListaResenas({ resenas }: { resenas: Resena[] }) {
  const { usuario } = useSesion();

  if (resenas.length === 0) {
    return (
      <View className="rounded-2xl bg-organic-surface p-5">
        <Text className="text-center font-cuerpo text-[14px] text-organic-neutral-500">
          Todavía no hay reseñas.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2.5">
      {resenas.map((resena) => (
        <View key={resena.id} className="rounded-2xl bg-organic-surface p-3.5 shadow-sm">
          <View className="flex-row items-center gap-3">
            <Avatar
              uri={urlAbsoluta(resena.autor.imagenUrl)}
              nombre={resena.autor.nombre}
              apellido={resena.autor.apellido}
              tamanio={40}
              variante="organic"
              tono="neutro"
            />
            <View className="flex-1">
              <Text className="font-cuerpo-semi text-[15px] text-organic-neutral-900">
                {resena.autor.nombre} {resena.autor.apellido}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Estrellas valor={resena.puntuacion} tamanio={13} />
                <Text className="font-cuerpo text-[11px] text-organic-neutral-500">
                  {fechaVisible(resena.fecha)}
                </Text>
              </View>
            </View>
            {resena.autor.id === usuario?.id ? null : (
              <BotonReportar
                tipo="RESENA"
                objetoId={resena.id}
                etiqueta="Reportar reseña"
                soloIcono
              />
            )}
          </View>

          {resena.comentario ? (
            <Text className="mt-2.5 font-cuerpo text-[14px] leading-5 text-organic-neutral-700">
              {resena.comentario}
            </Text>
          ) : null}

          <View className="mt-2.5 flex-row">
            <Chip etiqueta={etiquetaFlujo(resena.flujo)} variante="filtro" />
          </View>


        </View>
      ))}
    </View>
  );
}
