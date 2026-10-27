/**
 * Baja de una mascota: confirmación, pedido al backend y, si lo frena una solicitud sin
 * responder (409), un diálogo que explica el bloqueo en vez de un error rojo.
 *
 * `dialogos` se renderiza una vez en la pantalla; `pedirBaja` abre la confirmación.
 */
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';

import { useToast } from '@/components/feedback/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ApiError } from '@/services/api';
import { eliminarMascota } from '@/services/mascotas';

interface MascotaABajar {
  id: number;
  nombre: string | null;
}

interface BajaMascota {
  pedirBaja: (mascota: MascotaABajar) => void;
  dialogos: ReactNode;
}

/** `alEliminar` corre cuando la baja ya se hizo: volver atrás, recargar la lista, etc. */
export function useBajaMascota(alEliminar: () => void): BajaMascota {
  const router = useRouter();
  const toast = useToast();

  const [mascota, setMascota] = useState<MascotaABajar | null>(null);
  // Aparte de `mascota`: al cerrar, el título del diálogo no tiene que vaciarse mientras se va.
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  /** Mensaje del 409: la baja quedó bloqueada por solicitudes sin responder. */
  const [bloqueo, setBloqueo] = useState<string | null>(null);

  const pedirBaja = (aBajar: MascotaABajar): void => {
    setMascota(aBajar);
    setConfirmando(true);
  };

  const confirmarBaja = async (): Promise<void> => {
    if (!mascota) return;

    const nombre = mascota.nombre ?? 'La mascota';
    setEliminando(true);

    try {
      const resultado = await eliminarMascota(mascota.id);
      setConfirmando(false);

      toast.mostrarExito(
        resultado.publicacionesDadasDeBaja > 0
          ? `Eliminamos a ${nombre} y retiramos su publicación en adopción.`
          : `Eliminamos a ${nombre} de tus mascotas.`,
      );

      alEliminar();
    } catch (err) {
      setConfirmando(false);

      if (err instanceof ApiError && err.codigo === 'SOLICITUDES_ABIERTAS') {
        setBloqueo(err.message);
        return;
      }

      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos eliminar la mascota. Intentalo de nuevo.',
      );
    } finally {
      setEliminando(false);
    }
  };

  const dialogos = (
    <>
      <ConfirmDialog
        visible={confirmando}
        tono="peligro"
        titulo={`¿Eliminar a ${mascota?.nombre ?? 'esta mascota'}?`}
        mensaje="Se va a retirar de la plataforma junto con su publicación en adopción, si tiene una."
        detalle="Esta acción no se puede deshacer desde la app."
        textoConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={() => void confirmarBaja()}
        onCerrar={() => setConfirmando(false)}
      />

      <ConfirmDialog
        visible={bloqueo !== null}
        tono="advertencia"
        titulo="No se puede eliminar todavía"
        mensaje={bloqueo ?? ''}
        detalle="Resolvélas desde la bandeja de solicitudes para poder eliminarla."
        textoConfirmar="Ver solicitudes"
        textoCancelar="Entendido"
        onConfirmar={() => {
          setBloqueo(null);
          router.push('/solicitudes');
        }}
        onCerrar={() => setBloqueo(null)}
      />
    </>
  );

  return { pedirBaja, dialogos };
}
