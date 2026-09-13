/**
 * HU-7.1 — el botón que abre el formulario de solicitud, con todo lo que tiene que pasar
 * antes: consultar las precondiciones, mostrar el cartel del bloqueo si no se cumplen y
 * abrir el modal si se cumplen.
 *
 * Está en un componente y no en cada pantalla porque son dos entradas al mismo flujo (la
 * ficha del animal y la grilla de Favoritos) y las reglas son las mismas: si estuviera
 * escrito dos veces, el día que cambie un mensaje quedaría distinto según de dónde entrás.
 *
 * Las precondiciones se consultan al TOCAR y no al montar: en una grilla de favoritos
 * serían tantas peticiones como tarjetas, y ninguna sirve hasta que el usuario decide.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CustomButton } from '@/components/CustomButton';
import { useToast } from '@/components/feedback/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PALETA } from '@/constants/theme';
import {
  obtenerElegibilidad,
  type Elegibilidad,
  type HogarSolicitante,
  type MotivoBloqueo,
  type SolicitudDetalle,
} from '@/services/solicitudes';

import { SolicitudModal } from './SolicitudModal';
import type { MascotaDeSolicitud } from './borrador';

/**
 * El cartel de cada bloqueo. El `mensaje` NO se escribe acá: lo manda el backend con el
 * texto literal que fija la HU, y esta tabla solo aporta el título, el ícono y la salida.
 */
const CARTELES: Record<
  MotivoBloqueo,
  { titulo: string; icono: keyof typeof Ionicons.glyphMap; accion: string; descartar: string }
> = {
  NO_VERIFICADO: {
    titulo: 'Tenés que verificarte para solicitar',
    icono: 'shield-checkmark-outline',
    accion: 'Verificar mi cuenta',
    descartar: 'Más tarde',
  },
  LIMITE_ALCANZADO: {
    titulo: 'No podés solicitar otra mascota',
    icono: 'alert-circle-outline',
    accion: 'Ver mis solicitudes',
    descartar: 'Entendido',
  },
  YA_SOLICITADA: {
    titulo: 'Ya enviaste una solicitud',
    icono: 'document-text-outline',
    accion: 'Ver mi solicitud',
    descartar: 'Entendido',
  },
};

export type VarianteBotonSolicitar =
  /** Botón ancho al pie de la ficha del animal (GUI-10). */
  | 'ficha'
  /** Botón bajo, dentro de la tarjeta de la grilla de Favoritos (GUI-12). */
  | 'tarjeta';

interface BotonSolicitarProps {
  mascota: MascotaDeSolicitud;
  variante?: VarianteBotonSolicitar;
  /**
   * Solicitud viva que el usuario ya tiene sobre esta publicación, si la pantalla la
   * conoce. Con valor, el botón muestra el estado enviado sin consultar nada.
   */
  solicitudAbiertaId?: number | null;
  /** Se avisa al crear, para que la pantalla refresque su listado. */
  onCreada?: (solicitud: SolicitudDetalle) => void;
}

export function BotonSolicitar({
  mascota,
  variante = 'ficha',
  solicitudAbiertaId = null,
  onCreada,
}: BotonSolicitarProps) {
  const router = useRouter();
  const toast = useToast();

  const [verificando, setVerificando] = useState(false);
  const [bloqueo, setBloqueo] = useState<Elegibilidad | null>(null);
  const [abierto, setAbierto] = useState(false);
  /** Lo que ya declaró en una solicitud anterior, si tiene. Viene de `/elegibilidad`. */
  const [hogarPrecargado, setHogarPrecargado] = useState<HogarSolicitante | null>(null);

  /**
   * Solicitud descubierta en esta pantalla: la que se acaba de crear, o la que devolvió el
   * chequeo previo. Se combina con la prop en vez de inicializar el estado con ella: en una
   * grilla, `FlatList` reusa el componente entre refrescos y un `useState(prop)` se
   * quedaría con el valor de la primera vez.
   */
  const [enviadaLocal, setEnviadaLocal] = useState<number | null>(null);
  const enviadaId = enviadaLocal ?? solicitudAbiertaId;

  /** Sin id se va al listado propio; con id, directo al detalle de esa solicitud. */
  const irASolicitud = useCallback(
    (id: number | null): void => {
      if (id === null) {
        router.push({ pathname: '/solicitudes', params: { vista: 'enviadas' } });
        return;
      }
      router.push({ pathname: '/solicitudes/[id]', params: { id } });
    },
    [router],
  );

  const intentar = useCallback(async (): Promise<void> => {
    setVerificando(true);

    try {
      const elegibilidad = await obtenerElegibilidad(mascota.publicacionId);

      if (elegibilidad.puedeSolicitar) {
        setHogarPrecargado(elegibilidad.hogar);
        setAbierto(true);
        return;
      }

      // "Ya solicitaste esta mascota" no es un bloqueo que haya que explicar con un cartel
      // si la pantalla ya lo sabía: se refleja en el botón y listo.
      if (elegibilidad.motivo === 'YA_SOLICITADA') {
        setEnviadaLocal(elegibilidad.solicitudAbiertaId);
      }

      setBloqueo(elegibilidad);
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos abrir la solicitud. Intentalo de nuevo.',
      );
    } finally {
      setVerificando(false);
    }
  }, [mascota.publicacionId, toast]);

  const resolverBloqueo = useCallback((): void => {
    const motivo = bloqueo?.motivo;
    const idAbierta = bloqueo?.solicitudAbiertaId ?? null;
    setBloqueo(null);

    if (motivo === 'NO_VERIFICADO') {
      // TODO: cuando exista la pantalla de verificación documental (subir DNI y selfie),
      // apuntar ahí. Hasta entonces se lo deja en el Perfil, que es donde va a vivir; el
      // cartel ya le explicó qué necesita.
      router.push('/(tabs)/perfil');
      return;
    }

    irASolicitud(motivo === 'YA_SOLICITADA' ? idAbierta : null);
  }, [bloqueo, irASolicitud, router]);

  const cartel = bloqueo?.motivo ? CARTELES[bloqueo.motivo] : null;

  return (
    <>
      {enviadaId === null ? (
        <BotonAbrir variante={variante} cargando={verificando} onPress={() => void intentar()} />
      ) : (
        <EstadoEnviada variante={variante} onVer={() => irASolicitud(enviadaId)} />
      )}

      {cartel && bloqueo ? (
        <ConfirmDialog
          visible
          tono="bloqueo"
          icono={cartel.icono}
          titulo={cartel.titulo}
          mensaje={bloqueo.mensaje ?? ''}
          detalle={detalleDe(bloqueo)}
          accionPrincipal={{ etiqueta: cartel.accion, onPress: resolverBloqueo }}
          textoDescartar={cartel.descartar}
          onCerrar={() => setBloqueo(null)}
        />
      ) : null}

      {/* Solo se monta al abrirlo: en la grilla de Favoritos habría un formulario entero
          por tarjeta, todos invisibles y con su propio estado. */}
      {abierto ? (
        <SolicitudModal
          visible
          mascota={mascota}
          hogarPrecargado={hogarPrecargado}
          onCerrar={() => setAbierto(false)}
          onCreada={(solicitud) => {
            setEnviadaLocal(solicitud.id);
            onCreada?.(solicitud);
          }}
          onVerSolicitud={(solicitud) => irASolicitud(solicitud.id)}
        />
      ) : null}
    </>
  );
}

/** Segunda línea del cartel: explica el bloqueo con los números concretos del usuario. */
function detalleDe(elegibilidad: Elegibilidad): string | undefined {
  if (elegibilidad.motivo === 'NO_VERIFICADO') {
    return 'Necesitamos tu DNI y una selfie para confirmar tu identidad. La verificación tarda como máximo 24 horas.';
  }

  if (elegibilidad.motivo === 'LIMITE_ALCANZADO') {
    return `Ya tenés ${elegibilidad.pendientes} solicitudes abiertas al mismo tiempo. Cerrá alguna o esperá la respuesta del refugio para enviar una nueva.`;
  }

  return undefined;
}

interface BotonAbrirProps {
  variante: VarianteBotonSolicitar;
  cargando: boolean;
  onPress: () => void;
}

function BotonAbrir({ variante, cargando, onPress }: BotonAbrirProps) {
  if (variante === 'ficha') {
    return (
      <CustomButton
        title="Solicitar adopción"
        variant="acento"
        loading={cargando}
        onPress={onPress}
      />
    );
  }

  // En la tarjeta el botón compite con la foto y el badge: va más bajo y con menos texto.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Solicitar adopción"
      accessibilityState={{ busy: cargando }}
      disabled={cargando}
      onPress={onPress}
      className={`items-center justify-center rounded-xl bg-organic-accent-600 py-2 active:opacity-90 ${
        cargando ? 'opacity-60' : ''
      }`}
    >
      <Text className="font-cuerpo-semi text-[12.5px] text-white">
        {cargando ? 'Abriendo…' : 'Solicitar'}
      </Text>
    </Pressable>
  );
}

/** Lo que reemplaza al botón cuando ya hay una solicitud viva por esa mascota. */
function EstadoEnviada({
  variante,
  onVer,
}: {
  variante: VarianteBotonSolicitar;
  onVer: () => void;
}) {
  if (variante === 'ficha') {
    return (
      <View className="gap-2.5">
        <View className="flex-row items-center justify-center gap-2 rounded-2xl bg-organic-neutral-200 py-4">
          <Ionicons name="checkmark" size={17} color={PALETA.neutral[500]} />
          <Text className="font-cuerpo-semi text-[15px] text-organic-neutral-500">
            Solicitud enviada
          </Text>
        </View>

        <CustomButton title="Ver mi solicitud" variant="acento-borde" onPress={onVer} />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ver mi solicitud"
      onPress={onVer}
      className="flex-row items-center justify-center gap-1.5 rounded-xl border border-organic-accent-300 bg-organic-accent-100 py-2 active:opacity-80"
    >
      <Ionicons name="checkmark" size={13} color={PALETA.accent[600]} />
      <Text className="font-cuerpo-semi text-[12.5px] text-organic-accent-600">Enviada</Text>
    </Pressable>
  );
}
