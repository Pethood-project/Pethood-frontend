/**
 * GUI-7.1.1 y GUI-7.1.2 — HU-7.1: el formulario por pasos para solicitar una adopción o un
 * tránsito, y su confirmación.
 *
 * Es un modal y no una ruta del stack porque se abre desde dos lugares (la ficha del animal
 * y la grilla de Favoritos) y el borrador es estado de este componente: como ruta habría
 * que pasar la mascota entera por params o levantar un store para algo que vive lo que dura
 * el formulario.
 *
 * Acá solo está la orquestación: qué paso se muestra, cuándo se puede avanzar y el envío.
 * La forma del borrador y su validación viven en `borrador.ts`, y cada paso en su archivo.
 */
import { useCallback, useState, type ReactElement } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { BarraPasos } from '@/components/ui/BarraPasos';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  crearSolicitud,
  type HogarSolicitante,
  type SolicitudDetalle,
} from '@/services/solicitudes';

import { PasoConfirmacion } from './PasoConfirmacion';
import { PasoExito } from './PasoExito';
import { PasoHogar } from './PasoHogar';
import { PasoMotivo } from './PasoMotivo';
import { PasoTipo } from './PasoTipo';
import type { PasoProps } from './PasoProps';
import {
  aNuevaSolicitud,
  borradorInicial,
  hogarCambio,
  TITULOS_PASOS,
  TOTAL_PASOS,
  VALIDADORES,
  type Borrador,
  type Errores,
  type MascotaDeSolicitud,
} from './borrador';

/** En el orden en que se recorren: el índice 0 es el paso 1. */
const PASOS: ((props: PasoProps) => ReactElement)[] = [
  PasoTipo,
  PasoHogar,
  PasoMotivo,
  PasoConfirmacion,
];

/** El paso del hogar, para el caso especial de la advertencia al avanzar. */
const PASO_HOGAR = 2;

interface SolicitudModalProps {
  visible: boolean;
  mascota: MascotaDeSolicitud;
  /** Lo que el usuario ya declaró antes, si tiene. Viene de `/elegibilidad`. */
  hogarPrecargado: HogarSolicitante | null;
  /**
   * Al cerrar se manda la solicitud si ya se creó: el "Volver" del éxito tiene que
   * dejarla en el botón de atrás, no solo desmontar el modal.
   */
  onCerrar: (solicitudCreada?: SolicitudDetalle | null) => void;
  /** Se avisa con la solicitud creada, para refrescar la pantalla de atrás. */
  onCreada: (solicitud: SolicitudDetalle) => void;
  /** Salida a "Mi solicitud" desde la pantalla de éxito; la navegación la hace la pantalla. */
  onVerSolicitud: (solicitud: SolicitudDetalle) => void;
}

export function SolicitudModal({
  visible,
  mascota,
  hogarPrecargado,
  onCerrar,
  onCreada,
  onVerSolicitud,
}: SolicitudModalProps) {
  const [paso, setPaso] = useState(1);
  const [borrador, setBorrador] = useState<Borrador>(() => borradorInicial(hogarPrecargado));
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [creada, setCreada] = useState<SolicitudDetalle | null>(null);

  /**
   * Si el paso 2 muestra el formulario completo. Arranca en `false` cuando hay hogar
   * precargado (se ve el resumen primero); sin precarga no hay nada que resumir, así que
   * `PasoHogar` va directo al formulario sin mirar este estado.
   */
  const [editandoHogar, setEditandoHogar] = useState(false);

  /** Se avisa al confirmar un cambio real sobre lo que ya tenía declarado (paso 2). */
  const [advirtiendoCambioHogar, setAdvirtiendoCambioHogar] = useState(false);

  /** Cambia un campo y limpia su error: corregir algo no debería dejar el aviso puesto. */
  const editar = useCallback<PasoProps['editar']>((campo, valor) => {
    setBorrador((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actuales) => {
      if (!(campo in actuales)) return actuales;
      const { [campo]: _corregido, ...resto } = actuales;
      return resto;
    });
  }, []);

  const cerrar = useCallback((): void => {
    // Mientras la solicitud está viajando no se cierra: quedaría una petición sin feedback.
    if (enviando) return;
    onCerrar(creada);
  }, [creada, enviando, onCerrar]);

  const enviar = useCallback(async (): Promise<void> => {
    setEnviando(true);
    setErrorEnvio(null);

    try {
      const solicitud = await crearSolicitud(aNuevaSolicitud(borrador, mascota.publicacionId));
      setCreada(solicitud);
      onCreada(solicitud);
    } catch (err) {
      setErrorEnvio(
        err instanceof Error
          ? err.message
          : 'No pudimos enviar tu solicitud. Revisá tu conexión e intentalo de nuevo.',
      );
    } finally {
      setEnviando(false);
    }
  }, [borrador, mascota.publicacionId, onCreada]);

  /**
   * Valida solo el paso actual: así el usuario no llega al final para enterarse de que le
   * falta la dirección. En el último paso, avanzar es enviar.
   *
   * Caso especial del paso 2: si tocó "Actualizar mis datos" y lo que dejó difiere de lo
   * que tenía declarado, se avisa antes de seguir — no antes de tocar el botón, porque
   * hasta ese momento no hay nada confirmado que advertir.
   */
  const avanzar = useCallback((): void => {
    const encontrados = VALIDADORES[paso - 1]!(borrador);
    setErrores(encontrados);

    if (Object.keys(encontrados).length > 0) return;

    if (paso === PASO_HOGAR && editandoHogar && hogarCambio(borrador, hogarPrecargado)) {
      setAdvirtiendoCambioHogar(true);
      return;
    }

    if (paso < TOTAL_PASOS) {
      setPaso(paso + 1);
      return;
    }

    void enviar();
  }, [borrador, editandoHogar, enviar, hogarPrecargado, paso]);

  const confirmarCambioHogar = useCallback((): void => {
    setAdvirtiendoCambioHogar(false);
    setPaso((actual) => actual + 1);
  }, []);

  const PasoActual = PASOS[paso - 1]!;

  const cuerpo = (
    <>
      <View className="flex-1 bg-organic-bg">
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          {creada ? (
            <PasoExito
              solicitud={creada}
              mascota={mascota}
              onVerSolicitud={() => {
                const solicitud = creada;
                cerrar();
                onVerSolicitud(solicitud);
              }}
              onVolver={cerrar}
            />
          ) : (
            <>
              <BarraPasos
                paso={paso}
                total={TOTAL_PASOS}
                titulo={TITULOS_PASOS[paso - 1]!}
                onVolver={paso > 1 ? () => setPaso(paso - 1) : cerrar}
                onCerrar={cerrar}
              />

              <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ zIndex: 0, overflow: 'hidden' }}
              >
                <ScrollView
                  className="flex-1"
                  contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <PasoActual
                    borrador={borrador}
                    errores={errores}
                    mascota={mascota}
                    editar={editar}
                    hogarPrecargado={hogarPrecargado}
                    editandoHogar={editandoHogar}
                    onEditarHogar={() => setEditandoHogar(true)}
                  />

                  {errorEnvio ? (
                    <Text className="text-center text-[13px] text-red-500">{errorEnvio}</Text>
                  ) : null}
                </ScrollView>
              </KeyboardAvoidingView>

              <View
                className="flex-row gap-2.5 border-t border-organic-neutral-200 px-4 pb-2 pt-3"
                style={{ zIndex: 2 }}
              >
                {paso > 1 ? (
                  <View className="w-[112px]">
                    <CustomButton
                      title="Atrás"
                      variant="neutro"
                      disabled={enviando}
                      onPress={() => setPaso(paso - 1)}
                    />
                  </View>
                ) : null}

                <View className="flex-1">
                  <CustomButton
                    title={paso === TOTAL_PASOS ? 'Confirmar Solicitud' : 'Siguiente'}
                    variant="acento"
                    loading={enviando}
                    onPress={avanzar}
                  />
                </View>
              </View>
            </>
          )}
        </SafeAreaView>
      </View>

      <ConfirmDialog
        visible={advirtiendoCambioHogar}
        tono="advertencia"
        titulo="Estás cambiando tu hogar"
        mensaje="Tus solicitudes pendientes van a mostrarle al refugio que actualizaste tus datos y desde cuándo. Las que ya te aprobaron conservan lo que declaraste."
        textoConfirmar="Sí, continuar"
        textoCancelar="Volver"
        onConfirmar={confirmarCambioHogar}
        onCerrar={() => setAdvirtiendoCambioHogar(false)}
      />
    </>
  );

  // En web no se usa `Modal`: al cerrarlo, RN-web saca un portal del `document.body` y
  // Expo remonta la ficha, que vuelve a pintar "Solicitar adopción". Un overlay `fixed`
  // se oculta sin desmontarse. El portal evita que el pie de la ficha recorte el overlay.
  if (Platform.OS === 'web') {
    const overlay = (
      <View
        pointerEvents={visible ? 'auto' : 'none'}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          display: visible ? 'flex' : 'none',
        }}
      >
        {cuerpo}
      </View>
    );

    const { createPortal } = require('react-dom') as typeof import('react-dom');
    return createPortal(overlay, document.body);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      {cuerpo}
    </Modal>
  );
}
