/**
 * Modal de "Aceptar"/"Rechazar" una solicitud (HU-7.4), con comentario opcional. Lo usan
 * tanto la tarjeta del listado (GUI-27) como el detalle: es la misma decisión desde dos
 * lugares distintos, así que la confirmación vive acá una sola vez.
 */
import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TextAreaField } from '@/components/ui/TextAreaField';
import type { EstadoResolucion } from '@/services/solicitudes';
import { LIMITES } from '@/shared/validation/limits';

interface ResolverSolicitudModalProps {
  /** `null` = modal cerrado; distingue Aceptar de Rechazar. */
  accion: EstadoResolucion | null;
  nombreSolicitante: string;
  nombreMascota: string | null;
  cargando: boolean;
  onConfirmar: (comentario: string) => void;
  onCerrar: () => void;
}

export function ResolverSolicitudModal({
  accion,
  nombreSolicitante,
  nombreMascota,
  cargando,
  onConfirmar,
  onCerrar,
}: ResolverSolicitudModalProps) {
  const [comentario, setComentario] = useState('');

  // Arranca en blanco cada vez que se abre, para no arrastrar el comentario de una
  // decisión anterior sobre otra solicitud.
  useEffect(() => {
    if (accion) setComentario('');
  }, [accion]);

  const esAceptar = accion === 'Aprobada';
  const mascota = nombreMascota ?? 'la mascota';

  return (
    <ConfirmDialog
      visible={accion !== null}
      tono={esAceptar ? 'exito' : 'peligro'}
      titulo={esAceptar ? `¿Aceptar a ${nombreSolicitante}?` : `¿Rechazar a ${nombreSolicitante}?`}
      mensaje={`La solicitud sobre ${mascota} va a quedar marcada como ${
        esAceptar ? 'Aprobada' : 'Rechazada'
      }.`}
      detalle="Esta acción no se puede deshacer desde la app."
      textoConfirmar={esAceptar ? 'Aceptar' : 'Rechazar'}
      cargando={cargando}
      onConfirmar={() => onConfirmar(comentario)}
      onCerrar={onCerrar}
    >
      <TextAreaField
        label="Comentario (opcional)"
        placeholder={`Agregá un mensaje para ${nombreSolicitante}, si querés.`}
        maximo={LIMITES.solicitud.comentario.max}
        value={comentario}
        onChangeText={setComentario}
        editable={!cargando}
      />
    </ConfirmDialog>
  );
}
