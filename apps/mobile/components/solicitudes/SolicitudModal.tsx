/**
 * El formulario por pasos para solicitar una adopción o un tránsito, y su confirmación.
 *
 * Es un modal y no una ruta del stack porque se abre desde dos lugares (la ficha del animal
 * y la grilla de Favoritos) y el borrador es estado de este componente: como ruta habría
 * que pasar la mascota entera por params o levantar un store para algo que vive lo que dura
 * el formulario.
 *
 * Acá solo está la orquestación: qué paso se muestra, cuándo se puede avanzar y el envío.
 * La forma del borrador y su validación viven en `borrador.ts`, y cada paso en su archivo.
 * Los pasos dependen de la mascota: si su refugio tiene preguntas propias se suma uno, entre
 * el saludo y la confirmación.
 *
 * Al enviarla se muestra un momento breve de confirmación que avanza solo a la conversación
 * con el refugio o la persona que publicó, donde ya están la tarjeta de la solicitud y el
 * saludo. Si no se pudo abrir esa conversación, la confirmación se queda quieta con sus
 * botones.
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Modal, Platform, Text, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { BarraPasos } from '@/components/ui/BarraPasos';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import { vibrar } from '@/lib/haptics';
import { ApiError } from '@/services/api';
import {
  crearSolicitud,
  type HogarSolicitante,
  type PreguntaAplicable,
  type SolicitudDetalle,
} from '@/services/solicitudes';

import { PasoConfirmacion } from './PasoConfirmacion';
import { PasoExito } from './PasoExito';
import { PasoHogar } from './PasoHogar';
import { PasoPreguntas } from './PasoPreguntas';
import { PasoSaludo } from './PasoSaludo';
import { PasoTipo } from './PasoTipo';
import type { PasoProps } from './PasoProps';
import {
  aNuevaSolicitud,
  borradorInicial,
  hogarCambio,
  pasosDe,
  tituloDelPaso,
  validarPaso,
  type Borrador,
  type ClavePaso,
  type Errores,
  type MascotaDeSolicitud,
} from './borrador';

const COMPONENTES: Record<ClavePaso, (props: PasoProps) => ReactElement> = {
  tipo: PasoTipo,
  hogar: PasoHogar,
  saludo: PasoSaludo,
  preguntas: PasoPreguntas,
  confirmacion: PasoConfirmacion,
};

interface SolicitudModalProps {
  visible: boolean;
  mascota: MascotaDeSolicitud;
  /** Lo que el usuario ya declaró antes, si tiene. Viene de `/elegibilidad`. */
  hogarPrecargado: HogarSolicitante | null;
  /** Las preguntas propias del refugio para esta mascota. Vienen de `/elegibilidad`. */
  preguntas: PreguntaAplicable[];
  /**
   * Al cerrar se manda la solicitud si ya se creó: el "Volver" de la confirmación tiene que
   * dejarla en el botón de atrás, no solo desmontar el modal.
   */
  onCerrar: (solicitudCreada?: SolicitudDetalle | null) => void;
  /** Se avisa con la solicitud creada, para refrescar la pantalla de atrás. */
  onCreada: (solicitud: SolicitudDetalle) => void;
  /** Salida a "Mi solicitud" desde la confirmación quieta; la navegación la hace la pantalla. */
  onVerSolicitud: (solicitud: SolicitudDetalle) => void;
  /**
   * A la conversación donde quedó la tarjeta. Como `onVerSolicitud`, la navegación la hace la
   * pantalla: el modal no conoce el router.
   */
  onIrAlChat: (chatId: number) => void;
  /** El refugio cambió sus preguntas mientras se completaba: la pantalla vuelve a pedirlas. */
  onPreguntasDesactualizadas: () => void;
}

export function SolicitudModal({
  visible,
  mascota,
  hogarPrecargado,
  preguntas,
  onCerrar,
  onCreada,
  onVerSolicitud,
  onIrAlChat,
  onPreguntasDesactualizadas,
}: SolicitudModalProps) {
  const insets = useSafeAreaInsets();
  const pasos = pasosDe(preguntas);
  const [paso, setPaso] = useState(1);
  const [borrador, setBorrador] = useState<Borrador>(() => borradorInicial(hogarPrecargado));
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [creada, setCreada] = useState<SolicitudDetalle | null>(null);
  /** Alto del pie con Atrás/Siguiente, para que el scroll deje el campo enfocado encima. */
  const [altoPie, setAltoPie] = useState(0);
  /** Hay que llevar a quien completa al paso de preguntas apenas aparezca o se actualice. */
  const [irAPreguntas, setIrAPreguntas] = useState(false);

  /**
   * Si el paso 2 muestra el formulario completo. Arranca en `false` cuando hay hogar
   * precargado (se ve el resumen primero); sin precarga no hay nada que resumir, así que
   * `PasoHogar` va directo al formulario sin mirar este estado.
   */
  const [editandoHogar, setEditandoHogar] = useState(false);

  /** Se avisa al confirmar un cambio real sobre lo que ya tenía declarado (paso 2). */
  const [advirtiendoCambioHogar, setAdvirtiendoCambioHogar] = useState(false);

  const clave = pasos[paso - 1] ?? pasos[pasos.length - 1]!;

  // El refugio agregó o cambió preguntas con el formulario abierto: cuando llegan las nuevas
  // se lo lleva a verlas, en vez de dejarlo en la confirmación sin saber qué cambió.
  useEffect(() => {
    if (!irAPreguntas) return;
    const indice = pasos.indexOf('preguntas');
    if (indice === -1) return;

    setPaso(indice + 1);
    setIrAPreguntas(false);
  }, [irAPreguntas, pasos, preguntas]);

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
      const solicitud = await crearSolicitud(
        aNuevaSolicitud(borrador, mascota.publicacionId, preguntas),
      );
      onCreada(solicitud);
      setCreada(solicitud);
    } catch (err) {
      vibrar.error();

      if (err instanceof ApiError && err.codigo === 'PREGUNTAS_DESACTUALIZADAS') {
        setErrorEnvio(err.mensaje);
        setIrAPreguntas(true);
        onPreguntasDesactualizadas();
      } else {
        setErrorEnvio(
          err instanceof Error
            ? err.message
            : 'No pudimos enviar tu solicitud. Revisá tu conexión e intentalo de nuevo.',
        );
      }
    } finally {
      setEnviando(false);
    }
  }, [borrador, mascota.publicacionId, onCreada, onPreguntasDesactualizadas, preguntas]);

  /**
   * Valida solo el paso actual: así el usuario no llega al final para enterarse de que le
   * falta la dirección. En el último paso, avanzar es enviar.
   *
   * Caso especial del paso del hogar: si tocó "Actualizar mis datos" y lo que dejó difiere
   * de lo que tenía declarado, se avisa antes de seguir — no antes de tocar el botón, porque
   * hasta ese momento no hay nada confirmado que advertir.
   */
  const avanzar = useCallback((): void => {
    const encontrados = validarPaso(clave, borrador, preguntas);
    setErrores(encontrados);

    if (Object.keys(encontrados).length > 0) {
      vibrar.error();
      return;
    }

    if (clave === 'hogar' && editandoHogar && hogarCambio(borrador, hogarPrecargado)) {
      setAdvirtiendoCambioHogar(true);
      return;
    }

    if (paso < pasos.length) {
      vibrar.toque();
      setPaso(paso + 1);
      return;
    }

    void enviar();
  }, [borrador, clave, editandoHogar, enviar, hogarPrecargado, paso, pasos.length, preguntas]);

  const confirmarCambioHogar = useCallback((): void => {
    setAdvirtiendoCambioHogar(false);
    setPaso((actual) => actual + 1);
  }, []);

  const irAlChat = useCallback((): void => {
    if (creada?.chatId != null) onIrAlChat(creada.chatId);
  }, [creada, onIrAlChat]);

  const PasoActual = COMPONENTES[clave];

  const cuerpo = (
    <>
      <View className="flex-1 bg-organic-bg">
        {creada ? (
          // La confirmación ocupa toda la pantalla, también detrás de la barra de estado: el
          // destello de color tiene que llegar a los bordes.
          <PasoExito
            solicitud={creada}
            mascota={mascota}
            avanzaSolo={creada.chatId != null}
            onAvanzar={irAlChat}
            onVerSolicitud={() => {
              const solicitud = creada;
              cerrar();
              onVerSolicitud(solicitud);
            }}
            onVolver={cerrar}
          />
        ) : (
          // Margen superior a mano y no con el `SafeAreaView` nativo: dentro de un `Modal`
          // (otra ventana nativa) este no recibe los insets en iOS y el encabezado quedaba
          // debajo de la hora y la batería. `statusBarTranslucent` hace que Android también
          // dibuje debajo de la barra, así el mismo margen sirve en las dos plataformas.
          <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
            <BarraPasos
              paso={paso}
              total={pasos.length}
              titulo={tituloDelPaso(clave)}
              onVolver={paso > 1 ? () => setPaso(paso - 1) : cerrar}
              onCerrar={cerrar}
            />

            <FormularioConTeclado
              className="flex-1"
              style={{ zIndex: 0, overflow: 'hidden' }}
              contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}
              altoPieFijo={altoPie}
            >
              <PasoActual
                borrador={borrador}
                errores={errores}
                mascota={mascota}
                editar={editar}
                hogarPrecargado={hogarPrecargado}
                editandoHogar={editandoHogar}
                onEditarHogar={() => setEditandoHogar(true)}
                preguntas={preguntas}
              />

              {errorEnvio ? (
                <Text className="text-center text-[13px] text-red-500">{errorEnvio}</Text>
              ) : null}
            </FormularioConTeclado>

            {/* El pie sube pegado al teclado para que Siguiente se alcance sin cerrarlo. Ya
                está separado `insets.bottom` del borde, así que con el teclado abierto se
                descuenta eso para que quede apoyado justo encima. El fondo es el mismo del
                modal: con el teclado cerrado no cambia nada, y abierto tapa el contenido que
                pasa por detrás al desplazarse. */}
            <KeyboardStickyView
              offset={{ opened: insets.bottom }}
              onLayout={(evento) => setAltoPie(evento.nativeEvent.layout.height)}
              style={{ zIndex: 2 }}
            >
              <View className="flex-row gap-2.5 border-t border-organic-neutral-200 bg-organic-bg px-4 pb-2 pt-3">
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
                    title={clave === 'confirmacion' ? 'Confirmar Solicitud' : 'Siguiente'}
                    variant="acento"
                    loading={enviando}
                    onPress={avanzar}
                  />
                </View>
              </View>
            </KeyboardStickyView>
          </View>
        )}
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
  // Expo remonta la ficha, que vuelve a pintar "Solicitar adopción". Un overlay absoluto
  // se oculta sin desmontarse. El portal evita que el pie de la ficha recorte el overlay.
  if (Platform.OS === 'web') {
    const overlay = (
      <View
        pointerEvents={visible ? 'auto' : 'none'}
        style={{
          position: 'absolute',
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
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar} statusBarTranslucent>
      {cuerpo}
    </Modal>
  );
}
