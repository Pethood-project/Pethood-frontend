/**
 * Popup de detalle de un aviso de mascota perdida o encontrada (pantalla 6b del diseño). Se
 * abre al tocar una tarjeta del portal y se cierra con la cruz, tocando afuera o con el
 * botón atrás de Android.
 *
 * Diferencias con el diseño, por lo que el aviso tiene y no tiene (ver la spec 020):
 * - El subtítulo del diseño es "Perro macho · Golden Retriever · 3 años", pero el aviso sólo
 *   sabe la especie: va "especie · hace cuánto", igual que en la tarjeta.
 * - El diseño muestra un teléfono de contacto que la API no expone. En su lugar va quién
 *   publicó el aviso, que es con quien se va a hablar.
 * - "Enviar mensaje" abre la conversación con quien publicó el aviso (HU-13.2); si ya tenían
 *   una, entra a ésa. En un aviso propio no se muestra —no hay a quién escribirle— y en su
 *   lugar va "Marcar como resuelto", que cierra el caso **pero no la conversación**. Un aviso
 *   ya resuelto no ofrece ninguno de los dos. Abierto desde la tarjeta del chat tampoco hay
 *   "Enviar mensaje": ya se está en esa conversación.
 * - En un aviso propio, además, "Editar" y "Eliminar" (HU-13.3), si la pantalla los pasa. Uno
 *   resuelto no se elimina: el botón está igual y explica por qué, en vez de desaparecer sin
 *   decir nada.
 * - Dos agregados que el diseño no trae, de cuando el lugar pasó al catálogo de provincias: a
 *   qué distancia está el lugar (si el usuario dio su ubicación y el lugar se pudo ubicar en
 *   el mapa) y un botón para verlo en Google Maps.
 *
 * El aviso puede traer hasta 5 fotos: la tarjeta del portal muestra sólo la portada y acá se
 * deslizan todas, con puntos que marcan en cuál se está.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { BotonReportar } from '@/components/reportes/BotonReportar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EstadoAnimalPerdidoBadge } from '@/components/ui/EstadoAnimalPerdidoBadge';
import { LEYENDA_RESUELTO } from '@/constants/EstadosAnimalPerdido';
import { PALETA } from '@/constants/theme';
import { distanciaEnTexto } from '@/lib/ubicacion';
import { urlAbsoluta } from '@/services/api';
import { estaResuelto, type AvisoPerdido } from '@/services/animalesPerdidos';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

import { subtituloAviso } from './TarjetaAviso';

/**
 * El día del hecho, que el diseño muestra dentro de la descripción ("Se perdió el 19/06…").
 * En un aviso resuelto no se sabe si empezó perdido o encontrado, así que va sin verbo.
 */
function textoSuceso(aviso: AvisoPerdido): string | null {
  const fecha = parsearFecha(aviso.fechaSuceso);
  if (!fecha) return null;

  const dia = aFechaVisible(fecha);
  if (aviso.estado.nombre === 'Perdido') return `Se perdió el ${dia}`;
  if (aviso.estado.nombre === 'Encontrado') return `Se encontró el ${dia}`;
  return `Sucedió el ${dia}`;
}

interface DetalleAvisoModalProps {
  /** El aviso a mostrar, o `null` con el popup cerrado. */
  aviso: AvisoPerdido | null;
  onCerrar: () => void;
  /**
   * Reclamar el aviso (HU-13.2). Lo resuelve la pantalla, que es la que navega a la sala: el
   * popup no conoce el router ni el servicio. Sin esto no hay "Enviar mensaje" (desde el chat).
   */
  onReclamar?: (aviso: AvisoPerdido) => Promise<void>;
  /** Cerrar el caso. Devuelve el aviso actualizado para que la pantalla lo reemplace. */
  onResolver: (aviso: AvisoPerdido) => Promise<void>;
  /** HU-13.3: ir a editar el aviso propio. Sin esto no hay botón "Editar". */
  onEditar?: (aviso: AvisoPerdido) => void;
  /** HU-13.3: eliminar el aviso propio, ya confirmado. Sin esto no hay botón "Eliminar". */
  onEliminar?: (aviso: AvisoPerdido) => Promise<void>;
}

export function DetalleAvisoModal({
  aviso,
  onCerrar,
  onReclamar,
  onResolver,
  onEditar,
  onEliminar,
}: DetalleAvisoModalProps) {
  return (
    <Modal
      visible={aviso !== null}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      {/* Fondo y tarjeta son hermanos: un Pressable dentro de otro en web (React 19)
          dispara onPress al renderizar y tira el handler de cerrar. */}
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={onCerrar}
          className="absolute inset-0"
        />

        {aviso ? (
          <TarjetaDetalle
            aviso={aviso}
            onCerrar={onCerrar}
            onReclamar={onReclamar}
            onResolver={onResolver}
            onEditar={onEditar}
            onEliminar={onEliminar}
          />
        ) : null}
      </View>
    </Modal>
  );
}

function TarjetaDetalle({
  aviso,
  onCerrar,
  onReclamar,
  onResolver,
  onEditar,
  onEliminar,
}: Omit<DetalleAvisoModalProps, 'aviso'> & { aviso: AvisoPerdido }) {
  // Un solo estado para todas las acciones: cada una tiene su confirmación, así que nunca se
  // está haciendo más de una a la vez.
  const [enViaje, setEnViaje] = useState(false);
  const [confirmarResuelto, setConfirmarResuelto] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  /** Se tocó "Eliminar" en un caso resuelto: se explica por qué no se puede. */
  const [explicarNoSeElimina, setExplicarNoSeElimina] = useState(false);

  const resuelto = estaResuelto(aviso);
  const gestionPropia = aviso.esPropio && (onEditar !== undefined || onEliminar !== undefined);

  const reclamar = async (): Promise<void> => {
    if (!onReclamar) return;
    setEnViaje(true);
    try {
      await onReclamar(aviso);
    } finally {
      // La pantalla puede haber cerrado el popup al navegar; el estado se descarta con él.
      setEnViaje(false);
    }
  };

  const resolver = async (): Promise<void> => {
    setEnViaje(true);
    try {
      await onResolver(aviso);
      setConfirmarResuelto(false);
    } finally {
      setEnViaje(false);
    }
  };

  const eliminar = async (): Promise<void> => {
    if (!onEliminar) return;
    setEnViaje(true);
    try {
      await onEliminar(aviso);
      setConfirmarEliminar(false);
    } finally {
      setEnViaje(false);
    }
  };

  const fotos = aviso.imagenes
    .map(urlAbsoluta)
    .filter((url): url is string => url !== null);
  const nombre = aviso.nombre ?? 'Sin nombre';
  const reportante = `${aviso.reportante.nombre} ${aviso.reportante.apellido}`.trim();
  const suceso = textoSuceso(aviso);
  // "Godoy Cruz - Mendoza · a 2,3 km", como la zona de la ficha de una publicación.
  const lugar = [
    aviso.ubicacion,
    aviso.distanciaKm !== null ? distanciaEnTexto(aviso.distanciaKm) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const mapaUrl = aviso.mapaUrl;

  return (
    <View
      className="z-10 max-h-[88%] w-full overflow-hidden rounded-[28px] bg-organic-surface"
      accessibilityViewIsModal
    >
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <View className="w-full bg-organic-neutral-200" style={{ aspectRatio: 4 / 3 }}>
          {fotos.length > 0 ? (
            <GaleriaFotos fotos={fotos} nombre={nombre} />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="paw-outline" size={48} color={PALETA.neutral[400]} />
            </View>
          )}

          <View className="absolute left-3 top-3">
            <EstadoAnimalPerdidoBadge estado={aviso.estado.nombre} tamanio="md" />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar el aviso"
            onPress={onCerrar}
            hitSlop={10}
            className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white/90 active:opacity-70"
          >
            <Ionicons name="close" size={20} color={PALETA.neutral[700]} />
          </Pressable>
        </View>

        <View className="px-5 pb-5 pt-4">
          <Text className="font-titulo text-[24px] leading-[28px] text-organic-neutral-900">
            {nombre}
          </Text>
          <Text className="mt-1 font-cuerpo text-[14px] text-organic-neutral-600">
            {subtituloAviso(aviso)}
          </Text>

          <Text className="mt-3.5 font-cuerpo text-[15px] leading-[22px] text-organic-neutral-800">
            {aviso.descripcion}
          </Text>

          <View className="mt-4 gap-2.5">
            {lugar ? <DatoConIcono icono="location-outline" texto={lugar} /> : null}
            {suceso ? <DatoConIcono icono="calendar-outline" texto={suceso} /> : null}
            <DatoConIcono icono="person-outline" texto={`Lo publicó ${reportante}`} />
          </View>

          {mapaUrl ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Ver el lugar en Google Maps"
              onPress={() => void Linking.openURL(mapaUrl).catch(() => undefined)}
              className="mt-5 h-[48px] flex-row items-center justify-center gap-2 rounded-full border border-organic-accent-600 active:opacity-70"
            >
              <Ionicons name="map-outline" size={19} color={PALETA.accent[600]} />
              <Text className="font-cuerpo-bold text-[16px] text-organic-accent-600">
                Ver en Google Maps
              </Text>
            </Pressable>
          ) : null}

          {/* Caso cerrado: ni se reclama ni se vuelve a resolver, así que en lugar de un
              botón va la marca que pide el criterio de aceptación de la HU. */}
          {resuelto ? (
            <View
              className={`${mapaUrl ? 'mt-3' : 'mt-5'} flex-row items-center justify-center gap-2 rounded-2xl bg-organic-accent-100 px-4 py-3`}
            >
              <Ionicons name="heart-circle-outline" size={20} color={PALETA.accent[700]} />
              <Text className="font-cuerpo-bold text-[15px] text-organic-accent-700">
                {LEYENDA_RESUELTO}
              </Text>
            </View>
          ) : aviso.esPropio ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Marcar el aviso como resuelto"
              accessibilityState={{ disabled: enViaje }}
              disabled={enViaje}
              onPress={() => setConfirmarResuelto(true)}
              className={`${mapaUrl ? 'mt-3' : 'mt-5'} h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-organic-accent-600 active:opacity-70 ${enViaje ? 'opacity-60' : ''}`}
            >
              <Ionicons name="checkmark-circle-outline" size={19} color={PALETA.blanco} />
              <Text className="font-cuerpo-bold text-[16px] text-white">Marcar como resuelto</Text>
            </Pressable>
          ) : onReclamar ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Enviar un mensaje a ${reportante}`}
              accessibilityState={{ disabled: enViaje, busy: enViaje }}
              disabled={enViaje}
              onPress={() => void reclamar()}
              className={`${mapaUrl ? 'mt-3' : 'mt-5'} h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-organic-accent-600 active:opacity-70 ${enViaje ? 'opacity-60' : ''}`}
            >
              {enViaje ? (
                <ActivityIndicator size="small" color={PALETA.blanco} />
              ) : (
                <Ionicons name="chatbubble-outline" size={19} color={PALETA.blanco} />
              )}
              <Text className="font-cuerpo-bold text-[16px] text-white">Enviar mensaje</Text>
            </Pressable>
          ) : null}

          {gestionPropia ? (
            <View className="mt-3 flex-row gap-3">
              {onEditar ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Editar el aviso"
                  disabled={enViaje}
                  onPress={() => onEditar(aviso)}
                  className="h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-full border border-organic-accent-600 active:opacity-70"
                >
                  <Ionicons name="create-outline" size={19} color={PALETA.accent[600]} />
                  <Text className="font-cuerpo-bold text-[16px] text-organic-accent-600">
                    Editar
                  </Text>
                </Pressable>
              ) : null}
              {onEliminar ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar el aviso"
                  disabled={enViaje}
                  onPress={() =>
                    resuelto ? setExplicarNoSeElimina(true) : setConfirmarEliminar(true)
                  }
                  className="h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-full border border-red-300 active:opacity-70"
                >
                  <Ionicons name="trash-outline" size={19} color={PALETA.estado.error} />
                  <Text className="font-cuerpo-bold text-[16px] text-red-600">Eliminar</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {aviso.esPropio ? null : (
            <BotonReportar
              tipo="ANIMAL_PERDIDO"
              objetoId={aviso.id}
              etiqueta="Reportar aviso"
              className="mt-4"
            />
          )}
        </View>
      </ScrollView>

      {/* Acción crítica y, por ahora, irreversible: "Resuelto" es terminal hasta HU-13.3.
          Regla transversal 6 — confirmación antes de ejecutarla. */}
      <ConfirmDialog
        visible={confirmarResuelto}
        tono="exito"
        icono="checkmark-circle-outline"
        titulo="¿El caso se resolvió?"
        mensaje={`Vamos a marcar el aviso de ${nombre} como resuelto.`}
        detalle="Vas a poder seguir hablando con quien te escribió, pero no vas a poder volver atrás."
        textoConfirmar="Sí, se resolvió"
        textoCancelar="Cancelar"
        cargando={enViaje}
        onConfirmar={() => void resolver()}
        onCerrar={() => setConfirmarResuelto(false)}
      />

      {/* Regla transversal 6: la baja se confirma. Las conversaciones no se tocan: la tarjeta
          del aviso queda en el chat y, al tocarla, dice que se eliminó. */}
      <ConfirmDialog
        visible={confirmarEliminar}
        tono="peligro"
        titulo="¿Eliminar el aviso?"
        mensaje={`Vamos a eliminar el aviso de ${nombre}.`}
        detalle="Deja de verse en Mascotas Perdidas y en Mis publicaciones. Si alguien ya te escribió por este aviso, la conversación sigue igual."
        textoConfirmar="Sí, eliminar"
        textoCancelar="Cancelar"
        cargando={enViaje}
        onConfirmar={() => void eliminar()}
        onCerrar={() => setConfirmarEliminar(false)}
      />

      {/* Sin `onConfirmar`: un solo "Entendido". No hay nada que el usuario pueda hacer. */}
      <ConfirmDialog
        visible={explicarNoSeElimina}
        tono="bloqueo"
        icono="heart-circle-outline"
        titulo="Este aviso no se puede eliminar"
        mensaje="El caso ya está resuelto."
        detalle="Un aviso resuelto queda como registro de que la mascota volvió con su dueño, así que no se puede eliminar."
        onCerrar={() => setExplicarNoSeElimina(false)}
      />
    </View>
  );
}

/**
 * Las fotos una al lado de la otra, de a una por pantalla. Cada página mide exactamente lo
 * que la caja de la foto, así que se espera a medirla antes de pintarlas.
 */
function GaleriaFotos({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [medidas, setMedidas] = useState<{ ancho: number; alto: number } | null>(null);
  const [actual, setActual] = useState(0);

  return (
    <View
      className="h-full w-full"
      onLayout={(evento) => {
        const { width, height } = evento.nativeEvent.layout;
        setMedidas({ ancho: width, alto: height });
      }}
    >
      {medidas ? (
        <ScrollView
          horizontal
          pagingEnabled
          nestedScrollEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          // `onScroll` y no `onMomentumScrollEnd`, que en web no se dispara.
          onScroll={(evento) =>
            setActual(Math.round(evento.nativeEvent.contentOffset.x / medidas.ancho))
          }
        >
          {fotos.map((uri, indice) => (
            <Image
              key={`${uri}-${indice}`}
              source={{ uri }}
              style={{ width: medidas.ancho, height: medidas.alto }}
              resizeMode="cover"
              accessibilityLabel={
                fotos.length > 1
                  ? `Foto ${indice + 1} de ${fotos.length} de ${nombre}`
                  : `Foto de ${nombre}`
              }
            />
          ))}
        </ScrollView>
      ) : null}

      {fotos.length > 1 ? (
        <View pointerEvents="none" className="absolute bottom-3 left-0 right-0 items-center">
          <View className="flex-row items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1.5">
            {fotos.map((uri, indice) => (
              <View
                key={`${uri}-${indice}`}
                className={`h-2 rounded-full ${indice === actual ? 'w-5 bg-white' : 'w-2 bg-white/60'}`}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function DatoConIcono({ icono, texto }: { icono: keyof typeof Ionicons.glyphMap; texto: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={icono} size={17} color={PALETA.neutral[600]} />
      <Text className="min-w-0 flex-1 font-cuerpo text-[14px] text-organic-neutral-700">
        {texto}
      </Text>
    </View>
  );
}
