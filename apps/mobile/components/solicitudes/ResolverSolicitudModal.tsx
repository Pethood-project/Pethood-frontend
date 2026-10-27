/**
 * Modal de "Aceptar"/"Rechazar" una solicitud, con comentario opcional. Rechazar además pide
 * la causa: es lo que después permite distinguir un rechazo por requisitos de uno porque la
 * mascota ya tenía hogar. Lo usan tanto la tarjeta del listado como el detalle: es la misma
 * decisión desde dos lugares distintos, así que la confirmación vive acá una sola vez.
 */
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Nota } from '@/components/ui/Nota';
import { SelectorChips } from '@/components/ui/SelectorChips';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { OPCIONES_MOTIVO_RECHAZO } from '@/constants/Solicitudes';
import type { EstadoResolucion, MotivoRechazo } from '@/services/solicitudes';
import { LIMITES } from '@/shared/validation/limits';

interface ResolverSolicitudModalProps {
  /** `null` = modal cerrado; distingue Aceptar de Rechazar. */
  accion: EstadoResolucion | null;
  nombreSolicitante: string;
  nombreMascota: string | null;
  /** Aceptar una adopción hace más que cambiar el estado: se avisa antes. */
  esAdopcion?: boolean;
  cargando: boolean;
  onConfirmar: (comentario: string, motivo?: MotivoRechazo) => void;
  onCerrar: () => void;
}

export function ResolverSolicitudModal({
  accion,
  nombreSolicitante,
  nombreMascota,
  esAdopcion = false,
  cargando,
  onConfirmar,
  onCerrar,
}: ResolverSolicitudModalProps) {
  const [comentario, setComentario] = useState('');
  const [motivo, setMotivo] = useState<MotivoRechazo | undefined>(undefined);
  const [faltaMotivo, setFaltaMotivo] = useState(false);

  // Arranca en blanco cada vez que se abre, para no arrastrar lo de una decisión anterior
  // sobre otra solicitud.
  useEffect(() => {
    if (accion) {
      setComentario('');
      setMotivo(undefined);
      setFaltaMotivo(false);
    }
  }, [accion]);

  const esAceptar = accion === 'Aprobada';
  const mascota = nombreMascota ?? 'la mascota';

  const confirmar = (): void => {
    if (!esAceptar && !motivo) {
      setFaltaMotivo(true);
      return;
    }

    onConfirmar(comentario, esAceptar ? undefined : motivo);
  };

  return (
    <ConfirmDialog
      visible={accion !== null}
      tono={esAceptar ? 'exito' : 'peligro'}
      titulo={
        esAceptar
          ? `¿Aceptar la solicitud de ${nombreSolicitante}?`
          : `¿Rechazar la solicitud de ${nombreSolicitante}?`
      }
      mensaje={`La solicitud sobre ${mascota} va a quedar marcada como ${
        esAceptar ? 'Aprobada' : 'Rechazada'
      }.`}
      textoConfirmar={esAceptar ? 'Aceptar' : 'Rechazar'}
      cargando={cargando}
      onConfirmar={confirmar}
      onCerrar={onCerrar}
    >
      {/* Lo que pasa al confirmar, en amarillo: es lo que hay que leer antes de apretar. */}
      <View className="mb-4">
        <Nota
          texto={
            esAceptar && esAdopcion
              ? 'Se finaliza la publicación, la mascota pasa a ser de quien la adopta y las demás solicitudes abiertas se cierran con un aviso.'
              : esAceptar
                ? 'La persona recibe el aviso y pueden coordinar la entrega por el chat.'
                : 'Esta acción no se puede deshacer desde la app. La persona recibe un aviso con cuidado.'
          }
          grande
        />
      </View>

      {esAceptar ? null : (
        <View className="mb-4">
          <Text className="mb-2 font-cuerpo-bold text-[14px] text-organic-accent-800">
            ¿Por qué la rechazás?
          </Text>
          <SelectorChips
            prefijo="motivo-rechazo"
            opciones={OPCIONES_MOTIVO_RECHAZO}
            valor={motivo}
            variante="filtro"
            onChange={(valor) => {
              setMotivo(valor);
              setFaltaMotivo(false);
            }}
          />
          {faltaMotivo ? (
            <Text className="mt-1.5 font-cuerpo-semi text-[13px] text-organic-accent-700">
              Elegí un motivo para continuar.
            </Text>
          ) : null}
        </View>
      )}

      <TextAreaField
        label="Mensaje (opcional)"
        placeholder={`Agregá un mensaje para ${nombreSolicitante}, si querés.`}
        maximo={LIMITES.solicitud.comentario.max}
        value={comentario}
        onChangeText={setComentario}
        editable={!cargando}
        variante="pregunta"
        altoMinimo={88}
      />
    </ConfirmDialog>
  );
}
