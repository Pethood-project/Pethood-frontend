/**
 * Lo que quien publicó un aviso de mascota perdida puede hacer desde su popup de detalle:
 * marcarlo como resuelto (HU-13.2), editarlo y eliminarlo (HU-13.3).
 *
 * El popup se abre desde tres lugares —el portal, Mis publicaciones y la tarjeta del aviso en
 * el chat— y cada uno refleja el resultado a su manera (reemplaza la tarjeta, la saca de la
 * grilla, recarga la sala). Acá vive lo que es igual en los tres: llamar a la API, avisar con un
 * toast y navegar a la edición.
 *
 * Los errores se avisan acá y no se relanzan: el popup sólo espera a que termine para soltar
 * el botón.
 */
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useToast } from '@/components/feedback/Toast';
import { eliminarAviso, resolverAviso, type AvisoPerdido } from '@/services/animalesPerdidos';
import { ApiError } from '@/services/api';

interface OpcionesGestion {
  /** El aviso quedó resuelto: la pantalla lo reemplaza donde lo esté mostrando. */
  onActualizado: (aviso: AvisoPerdido) => void;
  /** El aviso se eliminó: la pantalla lo saca y cierra el popup. */
  onEliminado: (aviso: AvisoPerdido) => void;
  /** Antes de ir a la edición: la pantalla cierra el popup. */
  onAntesDeEditar?: () => void;
}

export function useGestionAviso({ onActualizado, onEliminado, onAntesDeEditar }: OpcionesGestion) {
  const router = useRouter();
  const toast = useToast();

  /** Cierra el caso. No toca ninguna conversación (spec 024 §9). */
  const resolver = useCallback(
    async (aviso: AvisoPerdido): Promise<void> => {
      try {
        onActualizado(await resolverAviso(aviso.id));
        toast.mostrarExito('Marcamos el aviso como resuelto. ¡Qué alegría!');
      } catch (err) {
        toast.mostrarError(
          err instanceof ApiError ? err.message : 'No pudimos resolver el aviso. Probá de nuevo.',
        );
      }
    },
    [onActualizado, toast],
  );

  /** Baja lógica. El popup ya pidió confirmación, y a uno resuelto ni lo deja llegar acá. */
  const eliminar = useCallback(
    async (aviso: AvisoPerdido): Promise<void> => {
      try {
        await eliminarAviso(aviso.id);
        onEliminado(aviso);
        toast.mostrarExito('Eliminaste el aviso.');
      } catch (err) {
        toast.mostrarError(
          err instanceof ApiError ? err.message : 'No pudimos eliminar el aviso. Probá de nuevo.',
        );
      }
    },
    [onEliminado, toast],
  );

  const editar = useCallback(
    (aviso: AvisoPerdido): void => {
      onAntesDeEditar?.();
      router.push({ pathname: '/perdidos/[id]/editar', params: { id: aviso.id } });
    },
    [onAntesDeEditar, router],
  );

  return { resolver, eliminar, editar };
}
