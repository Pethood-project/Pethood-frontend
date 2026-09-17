/**
 * Detalle de una solicitud, para las dos puntas:
 *
 * - quien publicó la mascota lee las respuestas del solicitante y resuelve (HU-7.5/7.4).
 *   Mismo "quién puede resolver" que el listado (spec 003 §6.2).
 * - el propio solicitante sigue el estado de lo que mandó (HU-7.3). Ve exactamente lo
 *   mismo salvo los botones de aceptar y rechazar, que no son suyos.
 *
 * Quién es quién sale de comparar el solicitante con el usuario de la sesión: el endpoint
 * es el mismo para los dos y no distingue el rol de quien pregunta.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { LineaTiempoEstados } from '@/components/solicitudes/LineaTiempoEstados';
import { ResolverSolicitudModal } from '@/components/solicitudes/ResolverSolicitudModal';
import { Avatar } from '@/components/ui/Avatar';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { EstadoSolicitudBadge } from '@/components/ui/EstadoSolicitudBadge';
import { FilaDato, TarjetaDatos } from '@/components/ui/FilaDato';
import { Nota } from '@/components/ui/Nota';
import { SeccionTitulada } from '@/components/ui/SeccionTitulada';
import {
  etiquetaEspacioExterior,
  etiquetaHorasSolo,
  etiquetaTipoSolicitud,
  etiquetaTipoVivienda,
  PREGUNTAS,
  respuestaSiNo,
} from '@/constants/Solicitudes';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { ApiError, urlAbsoluta } from '@/services/api';
import {
  obtenerSolicitud,
  resolverSolicitud,
  type EstadoResolucion,
  type SolicitudDetalle,
} from '@/services/solicitudes';
import { aFechaVisible, duracionEnTexto, parsearFecha } from '@/shared/validation/dates';

function fechaLarga(iso: string | null): string | null {
  const fecha = parsearFecha(iso);
  return fecha ? aFechaVisible(fecha) : null;
}

/**
 * Las respuestas del formulario, con la misma pregunta que se le mostró al solicitante
 * (`PREGUNTAS`): el refugio lee la conversación, no una lista de campos sueltos.
 *
 * Devuelve `null` en las solicitudes anteriores a HU-7.1, que no tienen hogar cargado.
 */
function respuestasDe(solicitud: SolicitudDetalle): { etiqueta: string; valor: string }[] | null {
  const filas: { etiqueta: string; valor: string }[] = [
    { etiqueta: PREGUNTAS.tipoSolicitud, valor: etiquetaTipoSolicitud(solicitud.tipoSolicitud) },
  ];

  const periodo = periodoEnTexto(solicitud);
  if (periodo) filas.push({ etiqueta: 'Período de tránsito', valor: periodo });

  const { hogar } = solicitud;
  if (!hogar) return filas.length > 1 ? filas : null;

  filas.push(
    { etiqueta: PREGUNTAS.direccion, valor: hogar.direccion },
    { etiqueta: PREGUNTAS.tipoVivienda, valor: etiquetaTipoVivienda(hogar.tipoVivienda) ?? '—' },
    {
      etiqueta: PREGUNTAS.espacioExterior,
      valor: etiquetaEspacioExterior(hogar.espacioExterior) ?? '—',
    },
    { etiqueta: PREGUNTAS.tieneNinios, valor: respuestaSiNo(hogar.tieneNinios) },
    {
      etiqueta: PREGUNTAS.tieneMascotas,
      // El detalle va pegado al "Sí": solo, no le dice al refugio con qué va a convivir.
      valor: hogar.tieneMascotas
        ? `Sí${hogar.detalleMascotas ? ` — ${hogar.detalleMascotas}` : ''}`
        : 'No',
    },
    { etiqueta: PREGUNTAS.experienciaPrevia, valor: respuestaSiNo(hogar.experienciaPrevia) },
    { etiqueta: PREGUNTAS.horasSolo, valor: etiquetaHorasSolo(hogar.horasSolo) ?? '—' },
  );

  if (hogar.descripcion) {
    filas.push({ etiqueta: PREGUNTAS.descripcion, valor: hogar.descripcion });
  }

  return filas;
}

/**
 * Aviso de mudanza: solo hay algo que decir si el hogar vigente HOY difiere del que se
 * declaró al enviar esta solicitud. Es la señal de control que le importa a quien resuelve
 * — y, más adelante, al seguimiento post-adopción, que mira el mismo hogar.
 */
function avisoDeCambio(solicitud: SolicitudDetalle): string | null {
  const { cambioDeHogar } = solicitud;
  if (!cambioDeHogar) return null;

  const fecha = fechaLarga(cambioDeHogar.fechaCambio) ?? 'una fecha reciente';
  return `El solicitante actualizó su domicilio el ${fecha}.\nDomicilio actual: ${cambioDeHogar.hogar.direccion}`;
}

/** "15/09/2026 → 15/12/2026 (3 meses)". Null en una adopción, que no tiene período. */
function periodoEnTexto(solicitud: SolicitudDetalle): string | null {
  if (!solicitud.transito) return null;

  const inicio = parsearFecha(solicitud.transito.fechaInicio);
  const fin = parsearFecha(solicitud.transito.fechaFin);

  if (!inicio || !fin) return null;

  return `${aFechaVisible(inicio)} → ${aFechaVisible(fin)} (${duracionEnTexto(inicio, fin)})`;
}

export default function DetalleSolicitudScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const solicitudId = Number(id);
  const router = useRouter();
  const toast = useToast();
  const { usuario } = useSesion();

  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accion, setAccion] = useState<EstadoResolucion | null>(null);
  const [resolviendo, setResolviendo] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setSolicitud(await obtenerSolicitud(solicitudId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No pudimos cargar el detalle de la solicitud.',
      );
    } finally {
      setCargando(false);
    }
  }, [solicitudId]);

  useFocusEffect(
    useCallback(() => {
      setCargando(true);
      void cargar();
    }, [cargar]),
  );

  const confirmarResolucion = async (comentario: string): Promise<void> => {
    if (!solicitud || !accion) return;

    setResolviendo(true);
    try {
      const actualizada = await resolverSolicitud(solicitud.id, accion, comentario);
      setSolicitud(actualizada);
      setAccion(null);
      toast.mostrarExito(
        accion === 'Aprobada' ? 'Aceptaste la solicitud.' : 'Rechazaste la solicitud.',
      );
    } catch (err) {
      setAccion(null);

      if (err instanceof ApiError && err.codigo === 'SOLICITUD_YA_RESUELTA') {
        toast.mostrarAdvertencia(err.mensaje);
        await cargar();
        return;
      }

      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos actualizar la solicitud. Intentalo de nuevo.',
      );
    } finally {
      setResolviendo(false);
    }
  };

  const foto = urlAbsoluta(solicitud?.mascota.imagenUrl);
  // Nadie resuelve su propia solicitud: al solicitante se le muestra el detalle completo,
  // pero sin los botones. La regla real la aplica el backend (404 si no es suya).
  const esMia = solicitud?.solicitante.id === usuario?.id;
  const sePuedeResolver = solicitud?.estado.nombre === 'Pendiente' && !esMia;
  const respuestas = solicitud ? respuestasDe(solicitud) : null;
  const aviso = solicitud ? avisoDeCambio(solicitud) : null;

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 px-[22px] pb-3.5 pt-2">
          <BotonCircular
            icono="arrow-back"
            etiqueta="Volver"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/solicitudes'))}
          />

          <View>
            <Text className="font-titulo text-[22px] leading-[22px] text-organic-accent-600">
              Solicitud
            </Text>
            {solicitud?.mascota.nombre ? (
              <Text className="mt-1 font-cuerpo text-[13px] text-organic-neutral-700">
                {solicitud.mascota.nombre}
              </Text>
            ) : null}
          </View>
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : error || !solicitud ? (
          <EstadoError
            mensaje={error ?? 'No encontramos esta solicitud.'}
            onAccion={() => {
              setCargando(true);
              void cargar();
            }}
          />
        ) : (
          <ScrollView contentContainerClassName="px-4 py-4 pb-10">
            <View className="flex-row items-center gap-3 rounded-2xl bg-organic-surface p-3 shadow-sm">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver a ${solicitud.mascota.nombre ?? 'la mascota'}`}
                onPress={() =>
                  router.push({
                    pathname: '/publicaciones/[id]',
                    params: { id: solicitud.publicacionId },
                  })
                }
                className="active:opacity-70"
              >
                {foto ? (
                  <Image source={{ uri: foto }} className="h-16 w-16 rounded-xl" />
                ) : (
                  <View className="h-16 w-16 items-center justify-center rounded-xl bg-organic-accent-100">
                    <Ionicons name="paw-outline" size={26} color={PALETA.accent[600]} />
                  </View>
                )}
              </Pressable>

              <View className="flex-1">
                <Text className="font-cuerpo-bold text-base text-organic-neutral-900">
                  {solicitud.mascota.nombre ?? 'Sin nombre'}
                </Text>
                <Text className="mt-0.5 font-cuerpo text-xs text-organic-neutral-600">
                  {etiquetaTipoSolicitud(solicitud.tipoSolicitud)}
                </Text>
              </View>

              <EstadoSolicitudBadge estado={solicitud.estado.nombre} />
            </View>

            {respuestas ? (
              <SeccionTitulada titulo="Solicitud" className="mt-5">
                <TarjetaDatos>
                  {respuestas.map((fila, indice) => (
                    <FilaDato
                      key={fila.etiqueta}
                      etiqueta={fila.etiqueta}
                      valor={fila.valor}
                      disposicion="apilada"
                      ultima={indice === respuestas.length - 1}
                    />
                  ))}
                </TarjetaDatos>

                {/* Solo aparece si el hogar vigente hoy difiere del declarado: es la señal
                    antifraude, no un dato de rutina. */}
                {aviso ? (
                  <View className="mt-2.5">
                    <Nota texto={aviso} />
                  </View>
                ) : null}
              </SeccionTitulada>
            ) : null}

            {/* Al solicitante no le sirve una ficha de sí mismo: en "Enviadas" se omite. */}
            {esMia ? null : (
            <SeccionTitulada titulo="Solicitante" className="mt-5">
              <View className="flex-row items-center gap-3 rounded-2xl bg-organic-surface p-3 shadow-sm">
                <Avatar
                  tamanio={40}
                  nombre={solicitud.solicitante.nombre}
                  apellido={solicitud.solicitante.apellido}
                />
                <View className="flex-1">
                  <Text className="font-cuerpo-semi text-sm text-organic-neutral-900">
                    {solicitud.solicitante.nombre} {solicitud.solicitante.apellido}
                  </Text>
                  <Text className="mt-0.5 font-cuerpo text-xs text-organic-neutral-600">
                    Solicitó el {fechaLarga(solicitud.fechaAlta)}
                  </Text>
                </View>
              </View>
            </SeccionTitulada>
            )}

            {solicitud.motivacion ? (
              <SeccionTitulada titulo="Motivo de la solicitud" className="mt-5">
                <View className="rounded-2xl bg-organic-surface p-3.5 shadow-sm">
                  <Text className="font-cuerpo text-sm leading-5 text-organic-neutral-700">
                    {solicitud.motivacion}
                  </Text>
                </View>
              </SeccionTitulada>
            ) : null}

            {solicitud.comentario ? (
              <SeccionTitulada titulo="Tu respuesta" className="mt-5">
                <View className="rounded-2xl bg-organic-surface p-3.5 shadow-sm">
                  <Text className="font-cuerpo text-sm leading-5 text-organic-neutral-700">
                    {solicitud.comentario}
                  </Text>
                </View>
              </SeccionTitulada>
            ) : null}

            <SeccionTitulada titulo="Estado del proceso" className="mt-5">
              <LineaTiempoEstados historial={solicitud.historial} />
            </SeccionTitulada>

            {sePuedeResolver ? (
              <View className="mt-6 flex-row gap-2.5">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAccion('Aprobada')}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3.5 active:opacity-90"
                >
                  <Ionicons name="checkmark" size={16} color={PALETA.blanco} />
                  <Text className="font-cuerpo-semi text-base text-white">Aceptar</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAccion('Rechazada')}
                  className="flex-1 items-center justify-center rounded-2xl bg-organic-neutral-200 py-3.5 active:opacity-80"
                >
                  <Text className="font-cuerpo-semi text-base text-organic-neutral-700">
                    Rechazar
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Del lado del solicitante y no resuelta por él: el CTA para hablar con quien
                publicó. Todavía no abre la sala puntual (no existe forma de crear o
                encontrar una conversación a partir de una solicitud): lleva al listado de
                Chat, de donde sí se puede seguir la charla. */}
            {esMia ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/chat')}
                className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl bg-organic-accent-600 py-3.5 active:opacity-90"
              >
                <Ionicons name="chatbubble-outline" size={17} color={PALETA.blanco} />
                <Text className="font-cuerpo-semi text-base text-white">Contactar refugio</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>

      <ResolverSolicitudModal
        accion={accion}
        nombreSolicitante={solicitud?.solicitante.nombre ?? ''}
        nombreMascota={solicitud?.mascota.nombre ?? null}
        cargando={resolviendo}
        onConfirmar={(comentario) => void confirmarResolucion(comentario)}
        onCerrar={() => setAccion(null)}
      />
    </View>
  );
}
