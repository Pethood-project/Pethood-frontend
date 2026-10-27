/**
 * Detalle de una solicitud, para las dos puntas:
 *
 * - quien publicó la mascota la revisa en una pantalla guiada: el camino de estados, lo que
 *   pide la mascota frente a lo que declaró la persona, su saludo y sus respuestas, su perfil,
 *   una nota privada y, al final, lo que puede hacer en cada etapa. Abrirla por primera vez
 *   marca la solicitud "en revisión", sin que nadie tenga que apretar nada.
 * - el solicitante sigue lo que mandó. Si lo aprobaron, la pantalla es otra: un hito con su
 *   propia cabecera y lo que sigue; si no salió, un mensaje cuidado; y mientras está abierta
 *   puede escribirle a quien publicó o retirarla.
 *
 * Quién es quién sale de comparar el solicitante con el usuario de la sesión: el endpoint
 * es el mismo para los dos y no distingue el rol de quien pregunta.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { HeroAprobada } from '@/components/solicitudes/HeroAprobada';
import { LineaTiempoEstados } from '@/components/solicitudes/LineaTiempoEstados';
import { MensajeFinal } from '@/components/solicitudes/MensajeFinal';
import { NotaRefugio } from '@/components/solicitudes/NotaRefugio';
import { PerfilSolicitante } from '@/components/solicitudes/PerfilSolicitante';
import { ProgresoSolicitud } from '@/components/solicitudes/ProgresoSolicitud';
import { olvidarEnviada } from '@/components/solicitudes/BotonSolicitar';
import { ProximosPasos } from '@/components/solicitudes/ProximosPasos';
import { RequisitosMascota } from '@/components/solicitudes/RequisitosMascota';
import { ResolverSolicitudModal } from '@/components/solicitudes/ResolverSolicitudModal';
import { ResumenHogar } from '@/components/solicitudes/ResumenHogar';
import { Avatar } from '@/components/ui/Avatar';
import { BotonVolver } from '@/components/ui/BotonVolver';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { EstadoSolicitudBadge } from '@/components/ui/EstadoSolicitudBadge';
import { EtiquetaTipoSolicitud } from '@/components/ui/EtiquetaTipoSolicitud';
import { FilaDato, TarjetaDatos } from '@/components/ui/FilaDato';
import { Nota } from '@/components/ui/Nota';
import { SeccionTitulada } from '@/components/ui/SeccionTitulada';
import type { VistaSolicitud } from '@/constants/EstadosSolicitud';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { vibrar } from '@/lib/haptics';
import { ApiError, urlAbsoluta } from '@/services/api';
import {
  iniciarRevision,
  marcarRevisada,
  obtenerSolicitud,
  resolverSolicitud,
  retirarSolicitud,
  type EstadoResolucion,
  type MotivoRechazo,
  type SolicitudDetalle,
} from '@/services/solicitudes';
import { textoSegunGenero } from '@/shared/genero';
import { aFechaVisible, duracionEnTexto, parsearFecha } from '@/shared/validation/dates';

/** Una aprobación de hace menos de esto todavía se celebra con animación. */
const DIAS_DE_CELEBRACION = 3;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function fechaLarga(iso: string | null): string | null {
  const fecha = parsearFecha(iso);
  return fecha ? aFechaVisible(fecha) : null;
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

/** Lo que se le dice a quien espera, según en qué etapa está su solicitud abierta. */
function notaDeEtapa(solicitud: SolicitudDetalle): string | null {
  const quien = solicitud.publicador.nombre;

  switch (solicitud.estado.nombre) {
    case 'Pendiente':
      return `${quien} todavía no vio tu solicitud. Te avisamos apenas avance.`;
    case 'En_Revision':
      return `${quien} está mirando tu solicitud.`;
    case 'Revisada':
      return `${quien} ya revisó tu solicitud. Falta su decisión final.`;
    default:
      return null;
  }
}

function esReciente(solicitud: SolicitudDetalle): boolean {
  const respondida = parsearFecha(solicitud.fechaRespuesta);
  return respondida !== null && Date.now() - respondida.getTime() < DIAS_DE_CELEBRACION * MS_POR_DIA;
}

export default function DetalleSolicitudScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const solicitudId = Number(id);
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { usuario } = useSesion();

  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accion, setAccion] = useState<EstadoResolucion | null>(null);
  const [resolviendo, setResolviendo] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmandoRetiro, setConfirmandoRetiro] = useState(false);
  /** Lo que pasó al aceptar, para decírselo a quien aceptó. */
  const [aceptada, setAceptada] = useState<SolicitudDetalle | null>(null);
  /** La revisión se abre una sola vez por visita, sin importar cuántas veces se recargue. */
  const revisionAbierta = useRef(false);

  const usuarioId = usuario?.id;

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const detalle = await obtenerSolicitud(solicitudId);
      setSolicitud(detalle);

      // Quien publicó abre la revisión al entrar por primera vez: la solicitud pasa a "en
      // revisión" y la persona lo ve. Si falla no se nota: lo que importa es poder leerla.
      if (
        detalle.solicitante.id !== usuarioId &&
        detalle.estado.nombre === 'Pendiente' &&
        !revisionAbierta.current
      ) {
        revisionAbierta.current = true;
        try {
          setSolicitud(await iniciarRevision(solicitudId));
        } catch {
          // Se vuelve a intentar en la próxima visita.
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No pudimos cargar el detalle de la solicitud.',
      );
    } finally {
      setCargando(false);
    }
  }, [solicitudId, usuarioId]);

  useFocusEffect(
    useCallback(() => {
      setCargando(true);
      void cargar();
    }, [cargar]),
  );

  /** Maneja el 409 que dejan las carreras con otra acción (otro miembro, el cron, el retiro). */
  const alFallar = useCallback(
    async (err: unknown, mensajeBase: string): Promise<void> => {
      if (err instanceof ApiError && err.codigo === 'SOLICITUD_YA_RESUELTA') {
        toast.mostrarAdvertencia(err.mensaje);
        await cargar();
        return;
      }

      toast.mostrarError(err instanceof Error ? err.message : mensajeBase);
    },
    [cargar, toast],
  );

  const marcarComoRevisada = async (): Promise<void> => {
    if (!solicitud) return;

    setTrabajando(true);
    try {
      setSolicitud(await marcarRevisada(solicitud.id));
      toast.mostrarExito('Marcaste la solicitud como revisada.');
    } catch (err) {
      await alFallar(err, 'No pudimos actualizar la solicitud. Intentalo de nuevo.');
    } finally {
      setTrabajando(false);
    }
  };

  const confirmarResolucion = async (comentario: string, motivo?: MotivoRechazo): Promise<void> => {
    if (!solicitud || !accion) return;

    setResolviendo(true);
    try {
      const actualizada = await resolverSolicitud(solicitud.id, accion, comentario, motivo);
      setSolicitud(actualizada);
      setAccion(null);

      if (accion === 'Aprobada') {
        // Un hito para quien aceptó también: se cuenta lo que pasó solo y se celebra.
        vibrar.celebracion();
        setAceptada(actualizada);
      } else {
        toast.mostrarExito('Rechazaste la solicitud.');
      }
    } catch (err) {
      setAccion(null);
      await alFallar(err, 'No pudimos actualizar la solicitud. Intentalo de nuevo.');
    } finally {
      setResolviendo(false);
    }
  };

  const retirar = async (): Promise<void> => {
    if (!solicitud) return;

    setTrabajando(true);
    try {
      setSolicitud(await retirarSolicitud(solicitud.id));
      olvidarEnviada(solicitud.publicacionId);
      setConfirmandoRetiro(false);
      toast.mostrarExito('Retiraste tu solicitud.');
    } catch (err) {
      setConfirmandoRetiro(false);
      await alFallar(err, 'No pudimos retirar la solicitud. Intentalo de nuevo.');
    } finally {
      setTrabajando(false);
    }
  };

  const irAlChat = (): void => {
    if (solicitud?.chatId != null) {
      router.push({ pathname: '/chats/[chatId]', params: { chatId: solicitud.chatId } });
      return;
    }
    router.push('/(tabs)/chat' as Href);
  };

  const volver = (): void => (router.canGoBack() ? router.back() : router.replace('/solicitudes'));

  if (cargando || error || !solicitud) {
    return (
      <View className="flex-1 bg-organic-bg">
        <SafeAreaView className="flex-1" edges={['top']}>
          <EncabezadoPantalla titulo="Solicitud" onVolver={volver} />
          {cargando ? (
            <EstadoCargando />
          ) : (
            <EstadoError
              mensaje={error ?? 'No encontramos esta solicitud.'}
              onAccion={() => {
                setCargando(true);
                void cargar();
              }}
            />
          )}
        </SafeAreaView>
      </View>
    );
  }

  const esMia = solicitud.solicitante.id === usuarioId;
  const vista: VistaSolicitud = esMia ? 'adoptante' : 'refugio';
  const estado = solicitud.estado.nombre;
  const abierta = estado === 'Pendiente' || estado === 'En_Revision' || estado === 'Revisada';
  const nombreMascota = solicitud.mascota.nombre ?? 'la mascota';
  const foto = urlAbsoluta(solicitud.mascota.imagenUrl);
  const periodo = periodoEnTexto(solicitud);
  const aviso = avisoDeCambio(solicitud);
  const celebrando = esMia && estado === 'Aprobada';

  const tarjetaDeMascota = (
    <View className="flex-row items-center gap-4 rounded-3xl bg-organic-surface p-4 shadow-sm">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver a ${nombreMascota}`}
        onPress={() =>
          router.push({
            pathname: '/publicaciones/[id]',
            params: { id: solicitud.publicacionId },
          })
        }
        className="active:opacity-70"
      >
        {foto ? (
          <Image source={{ uri: foto }} className="h-24 w-24 rounded-2xl" />
        ) : (
          <View className="h-24 w-24 items-center justify-center rounded-2xl bg-organic-accent-100">
            <Ionicons name="paw-outline" size={36} color={PALETA.accent[600]} />
          </View>
        )}
      </Pressable>

      <View className="flex-1">
        <Text className="font-cuerpo-bold text-[20px] leading-[26px] text-organic-neutral-900">
          {solicitud.mascota.nombre ?? 'Sin nombre'}
        </Text>
        <View className="mt-1.5">
          <EtiquetaTipoSolicitud tipo={solicitud.tipoSolicitud} />
        </View>
      </View>

      <EstadoSolicitudBadge estado={estado} vista={vista} />
    </View>
  );

  const caminoDeEstados = (
    <View className="mt-4 rounded-2xl bg-organic-surface px-3 pb-4 pt-3 shadow-sm">
      <ProgresoSolicitud
        estado={estado}
        historial={solicitud.historial}
        vista={vista}
        tamanio="completo"
      />
    </View>
  );

  /** Lo que la persona envió: su hogar y lo que contestó a las preguntas del refugio. */
  const loEnviado = (
    <>
      {solicitud.hogar || periodo ? (
        <SeccionTitulada titulo={esMia ? 'Tu hogar' : 'Su hogar'} className="mt-5">
          <ResumenHogar hogar={solicitud.hogar} periodo={periodo} propio={esMia} />

          {/* Solo aparece si el hogar vigente hoy difiere del declarado: es la señal
              antifraude, no un dato de rutina. */}
          {aviso && !esMia ? (
            <View className="mt-2.5">
              <Nota texto={aviso} grande />
            </View>
          ) : null}
        </SeccionTitulada>
      ) : null}

      {solicitud.respuestas.length > 0 ? (
        <SeccionTitulada
          titulo={esMia ? `Preguntas de ${solicitud.publicador.nombre}` : 'Preguntas del refugio'}
          className="mt-5"
        >
          <TarjetaDatos>
            {solicitud.respuestas.map((fila, indice) => (
              <FilaDato
                key={`${fila.pregunta}-${indice}`}
                etiqueta={fila.pregunta}
                valor={fila.respuesta}
                disposicion="apilada"
                ultima={indice === solicitud.respuestas.length - 1}
              />
            ))}
          </TarjetaDatos>
        </SeccionTitulada>
      ) : null}
    </>
  );

  const saludo = solicitud.motivacion ? (
    <SeccionTitulada
      titulo={esMia ? 'Tu saludo' : `Saludo de ${solicitud.solicitante.nombre}`}
      className="mt-5"
    >
      <View className="rounded-2xl bg-organic-surface p-4 shadow-sm">
        <Text className="font-cuerpo text-[16px] leading-[23px] text-organic-neutral-700">
          {solicitud.motivacion}
        </Text>
      </View>
    </SeccionTitulada>
  ) : null;

  const respuestaDelRefugio = solicitud.comentario ? (
    <SeccionTitulada titulo={esMia ? 'Respuesta del refugio' : 'Tu respuesta'} className="mt-5">
      <View className="rounded-2xl bg-organic-surface p-4 shadow-sm">
        <Text className="font-cuerpo text-[16px] leading-[23px] text-organic-neutral-700">
          {solicitud.comentario}
        </Text>
      </View>
    </SeccionTitulada>
  ) : null;

  const historial = (
    <SeccionTitulada titulo="Historial" className="mt-5">
      <LineaTiempoEstados historial={solicitud.historial} vista={vista} />
    </SeccionTitulada>
  );

  // ─────────────── Quien publicó: la revisión guiada ───────────────
  if (!esMia) {
    return (
      <View className="flex-1 bg-organic-bg">
        <SafeAreaView className="flex-1" edges={['top']}>
          <EncabezadoPantalla
            titulo="Solicitud"
            subtitulo={solicitud.mascota.nombre ?? undefined}
            onVolver={volver}
          />

          <ScrollView contentContainerClassName="px-4 py-4 pb-10">
            {tarjetaDeMascota}
            {caminoDeEstados}

            {solicitud.mascota.requisitos.length > 0 ? (
              <View className="mt-5">
                <RequisitosMascota
                  nombreMascota={solicitud.mascota.nombre}
                  requisitos={solicitud.mascota.requisitos}
                />
              </View>
            ) : null}

            {saludo}
            {loEnviado}

            <SeccionTitulada titulo="Solicitante" className="mt-5">
              <PerfilSolicitante
                solicitante={solicitud.solicitante}
                fechaSolicitud={solicitud.fechaAlta}
              />
            </SeccionTitulada>

            {respuestaDelRefugio}

            <SeccionTitulada titulo="Nota privada" className="mt-5">
              <NotaRefugio
                solicitudId={solicitud.id}
                notaGuardada={solicitud.notaInterna ?? null}
                onGuardada={setSolicitud}
              />
            </SeccionTitulada>

            {historial}

            {abierta ? (
              <View className="mt-6 gap-2.5">
                {estado === 'Revisada' ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setAccion('Aprobada')}
                    style={{ backgroundColor: PALETA.estado.exito }}
                    className="flex-row items-center justify-center gap-1.5 rounded-2xl py-3.5 active:opacity-90"
                  >
                    <Ionicons name="checkmark" size={17} color={PALETA.blanco} />
                    <Text className="font-cuerpo-semi text-base text-white">Aceptar solicitud</Text>
                  </Pressable>
                ) : (
                  <CustomButton
                    title="Marcar como revisada"
                    variant="acento"
                    loading={trabajando}
                    onPress={() => void marcarComoRevisada()}
                  />
                )}

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAccion('Rechazada')}
                  className="items-center justify-center rounded-2xl bg-organic-neutral-200 py-3.5 active:opacity-80"
                >
                  <Text className="font-cuerpo-semi text-base text-organic-neutral-700">
                    Rechazar
                  </Text>
                </Pressable>

                <Text className="px-2 text-center font-cuerpo text-[12.5px] leading-[18px] text-organic-neutral-600">
                  {estado === 'Revisada'
                    ? 'Ya la revisaste: ahora podés aceptarla o rechazarla.'
                    : 'Marcala como revisada cuando termines de mirarla: la persona se entera de que avanzó.'}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>

        <ResolverSolicitudModal
          accion={accion}
          nombreSolicitante={solicitud.solicitante.nombre}
          nombreMascota={solicitud.mascota.nombre}
          esAdopcion={solicitud.tipoSolicitud === 'Adopcion'}
          cargando={resolviendo}
          onConfirmar={(comentario, motivo) => void confirmarResolucion(comentario, motivo)}
          onCerrar={() => setAccion(null)}
        />

        <ConfirmDialog
          visible={aceptada !== null}
          tono="exito"
          icono="sparkles-outline"
          titulo={
            aceptada?.tipoSolicitud === 'Adopcion' ? '¡Adopción aprobada!' : '¡Tránsito aprobado!'
          }
          mensaje={
            aceptada?.tipoSolicitud === 'Adopcion'
              ? `${nombreMascota} ahora es de ${solicitud.solicitante.nombre}.`
              : `${solicitud.solicitante.nombre} va a recibir a ${nombreMascota} en su hogar.`
          }
          detalle={
            aceptada?.tipoSolicitud === 'Adopcion'
              ? 'La publicación se finalizó, las demás solicitudes abiertas se cerraron con un aviso y arranca el seguimiento.'
              : 'Ya pueden coordinar la entrega por el chat.'
          }
          onCerrar={() => setAceptada(null)}
        />
      </View>
    );
  }

  // ─────────────── Quien pidió ───────────────
  const encabezadoDeAprobada = celebrando ? (
    <View>
      <HeroAprobada solicitud={solicitud} reciente={esReciente(solicitud)} ancho={width} />
      <BotonVolver
        sobreFoto
        onPress={volver}
        style={{ position: 'absolute', left: 16, top: insets.top + 8 }}
      />
    </View>
  ) : null;

  const compartir = (): void => {
    void Share.share({
      message:
        solicitud.tipoSolicitud === 'Transito'
          ? `¡Voy a ser hogar de tránsito de ${nombreMascota}! Lo organizamos a través de PetHood.`
          : `¡${nombreMascota} ya es parte de mi familia! La adopción salió a través de PetHood.`,
    });
  };

  return (
    <View className="flex-1 bg-organic-bg">
      {celebrando ? null : (
        <SafeAreaView edges={['top']}>
          <EncabezadoPantalla
            titulo="Solicitud"
            subtitulo={solicitud.mascota.nombre ?? undefined}
            onVolver={volver}
          />
        </SafeAreaView>
      )}

      <ScrollView
        contentContainerClassName={celebrando ? 'pb-10' : 'px-4 py-4 pb-10'}
        showsVerticalScrollIndicator={false}
      >
        {encabezadoDeAprobada}

        <View className={celebrando ? 'px-4 pt-5' : ''}>
          {celebrando ? null : (
            <>
              {tarjetaDeMascota}
              {caminoDeEstados}
            </>
          )}

          {abierta ? (
            <View className="mt-4">
              <Nota texto={notaDeEtapa(solicitud) ?? ''} grande />
            </View>
          ) : null}

          {!abierta && !celebrando ? (
            <View className="mt-4">
              <MensajeFinal
                estado={estado}
                motivo={solicitud.motivo}
                nombreMascota={nombreMascota}
              />
            </View>
          ) : null}

          {celebrando ? (
            <>
              <SeccionTitulada titulo={`Mensaje de ${solicitud.publicador.nombre}`}>
                <View className="flex-row items-start gap-3 rounded-2xl bg-organic-surface p-4 shadow-sm">
                  <Avatar
                    uri={urlAbsoluta(solicitud.publicador.imagenUrl)}
                    nombre={solicitud.publicador.nombre}
                    tamanio={44}
                    variante="organic"
                    tono={solicitud.publicador.esRefugio ? 'acento' : 'neutro'}
                  />
                  <Text className="flex-1 font-cuerpo text-[16px] leading-[23px] text-organic-neutral-800">
                    {solicitud.comentario ??
                      `¡${textoSegunGenero(
                        solicitud.mascota.genero === 'HEMBRA' ? 'HEMBRA' : 'MACHO',
                        'Bienvenido',
                        'Bienvenida',
                      )} a la familia, ${nombreMascota}! Cualquier duda, escribinos por el chat.`}
                  </Text>
                </View>
              </SeccionTitulada>

              <SeccionTitulada titulo="Tu camino hasta acá" className="mt-6">
                <View className="rounded-2xl bg-organic-surface px-3 pb-4 pt-3 shadow-sm">
                  <ProgresoSolicitud
                    estado={estado}
                    historial={solicitud.historial}
                    vista={vista}
                    tamanio="completo"
                  />
                </View>
              </SeccionTitulada>

              <ProximosPasos solicitud={solicitud} />

              <View className="mt-6 gap-2.5">
                <CustomButton
                  title="Abrir el chat"
                  variant="acento"
                  onPress={irAlChat}
                />
                {solicitud.mascotaAdoptadaId != null ? (
                  <CustomButton
                    title={`Ver a ${nombreMascota}`}
                    variant="neutro"
                    onPress={() =>
                      router.push({
                        pathname: '/mascotas/[id]',
                        params: { id: solicitud.mascotaAdoptadaId! },
                      })
                    }
                  />
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={compartir}
                  className="flex-row items-center justify-center gap-2 py-2 active:opacity-60"
                >
                  <Ionicons name="share-social-outline" size={18} color={PALETA.accent[700]} />
                  <Text className="font-cuerpo-semi text-[15px] text-organic-accent-700">
                    Compartir la noticia
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {saludo}
              {loEnviado}
              {respuestaDelRefugio}
            </>
          )}

          {/* El camino completo ya cuenta la historia de una aprobación. */}
          {celebrando ? null : historial}

          {abierta ? (
            <View className="mt-6 gap-2.5">
              <CustomButton
                title="Abrir el chat"
                variant="acento"
                onPress={irAlChat}
              />
              <CustomButton
                title="Retirar mi solicitud"
                variant="neutro"
                disabled={trabajando}
                onPress={() => setConfirmandoRetiro(true)}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmandoRetiro}
        tono="advertencia"
        titulo="¿Querés retirar tu solicitud?"
        mensaje={`Se la vamos a avisar a ${solicitud.publicador.nombre}. Vas a poder volver a solicitar a ${nombreMascota} si cambiás de idea.`}
        textoConfirmar="Retirar"
        textoCancelar="Volver"
        cargando={trabajando}
        onConfirmar={() => void retirar()}
        onCerrar={() => setConfirmandoRetiro(false)}
      />
    </View>
  );
}
