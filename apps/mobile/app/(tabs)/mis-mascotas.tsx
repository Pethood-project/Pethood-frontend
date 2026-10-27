/**
 * GUI-04 Mascotas Adoptante — listado de las mascotas del perfil activo (las personales, o
 * las del refugio desde la vista de refugio; ver `services/sesion.ts`) y acceso a la creación.
 * Cada tarjeta lleva accesos directos como botones cuadrados, solo ícono: publicación, historia
 * clínica y seguimiento. Publicación y seguimiento son excluyentes: una mascota adoptada
 * siempre lleva el seguimiento (haya o no algo para subir hoy) y no se ofrece de nuevo, y una
 * que no lo es se puede publicar si su estado lo permite. Editar y eliminar no viven acá: se hacen desde adentro de la ficha
 * (`mascotas/[id]/index.tsx`), para que la baja no esté a un toque mientras se navega la lista.
 *
 * Solo en la vista de refugio, que suele tener muchas, hay un filtro por estado de la
 * mascota con selección múltiple ("Todos", o uno o varios estados). Vive detrás del ícono de
 * filtros del encabezado y filtra el backend (`?estados=`).
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { BotonFlotante } from '@/components/ui/BotonFlotante';
import { useToast } from '@/components/feedback/Toast';
import { Chip } from '@/components/ui/Chip';
import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { FiltroEstadosBoton, type OpcionEstado } from '@/components/ui/FiltroEstados';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { estiloDeEstado } from '@/constants/EstadosMascota';
import { etiquetaEdad, etiquetaGenero, etiquetaTamanio } from '@/constants/Mascotas';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { conRellenoDeFila, RELLENO } from '@/lib/grilla';
import { urlAbsoluta } from '@/services/api';
import { listarEstadosMascota } from '@/services/catalogos';
import { listarMisMascotas, obtenerMascota, type Mascota } from '@/services/mascotas';
import { listarMisSeguimientos, type SolicitudEnSeguimiento } from '@/services/seguimiento';

/** Referencia estable para "sin filtro": un `[]` nuevo en cada render recrearía `cargar`. */
const SIN_FILTRO: number[] = [];

/** Los botones se miden contra tres columnas, aunque haya menos: así son siempre del mismo tamaño. */
const ACCIONES_POR_FILA = 3;
const SEPARACION_ACCIONES = 8;

interface AccionDeTarjeta {
  clave: string;
  accesibilidad: string;
  icono: ReactNode;
  onPress: () => void;
}

/** Botón cuadrado de la tarjeta: solo ícono y borde marcado. */
function AccionTarjeta({ accion, lado }: { accion: AccionDeTarjeta; lado: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accion.accesibilidad}
      onPress={accion.onPress}
      className="items-center justify-center rounded-2xl border-[1.5px] border-organic-accent-600 bg-organic-calido-amarilloClaro active:opacity-70"
      style={{ width: lado, height: lado }}
    >
      {accion.icono}
    </Pressable>
  );
}

/** Las acciones en cuadrados parejos, alineados al pie de la tarjeta. */
function AccionesTarjeta({ acciones }: { acciones: AccionDeTarjeta[] }) {
  const [ancho, setAncho] = useState(0);
  // La tarjeta es media pantalla y varía con el teléfono: se mide en vez de fijar un tamaño.
  const lado = Math.floor(
    (ancho - SEPARACION_ACCIONES * (ACCIONES_POR_FILA - 1)) / ACCIONES_POR_FILA,
  );

  return (
    <View className="mt-auto px-1 pb-1 pt-3">
      <View
        onLayout={(evento) => setAncho(evento.nativeEvent.layout.width)}
        className="flex-row"
        style={{ gap: SEPARACION_ACCIONES }}
      >
        {ancho > 0
          ? acciones.map((accion) => (
              <AccionTarjeta key={accion.clave} accion={accion} lado={lado} />
            ))
          : null}
      </View>
    </View>
  );
}

interface TarjetaMascotaProps {
  mascota: Mascota;
  /** Solo en una mascota adoptada (o en tránsito) con seguimiento. */
  onVerSeguimiento?: () => void;
  onVer: () => void;
  onVerHistoriaClinica: () => void;
  onVerPublicacion: () => void;
}

function TarjetaMascota({
  mascota,
  onVerSeguimiento,
  onVer,
  onVerHistoriaClinica,
  onVerPublicacion,
}: TarjetaMascotaProps) {
  const foto = urlAbsoluta(mascota.imagenUrl);
  const nombre = mascota.nombre ?? 'esta mascota';
  const edadTexto = etiquetaEdad(mascota.fechaNacimiento);
  const tamanio = etiquetaTamanio(mascota.tamanio);

  // Publicación y seguimiento no van juntos: con seguimiento la mascota ya fue adoptada.
  const acciones: AccionDeTarjeta[] = [
    ...(mascota.habilitaPublicacion && !onVerSeguimiento
      ? [
          {
            clave: 'publicacion',
            accesibilidad: `Publicación de ${nombre}`,
            icono: <Ionicons name="megaphone-outline" size={21} color={PALETA.accent[700]} />,
            onPress: onVerPublicacion,
          },
        ]
      : []),
    {
      clave: 'historia',
      accesibilidad: `Historia clínica de ${nombre}`,
      icono: (
        <MaterialCommunityIcons
          name="clipboard-pulse-outline"
          size={22}
          color={PALETA.accent[700]}
        />
      ),
      onPress: onVerHistoriaClinica,
    },
    ...(onVerSeguimiento
      ? [
          {
            clave: 'seguimiento',
            accesibilidad: `Seguimiento de ${nombre}`,
            icono: <Ionicons name="footsteps-outline" size={21} color={PALETA.accent[700]} />,
            onPress: onVerSeguimiento,
          },
        ]
      : []),
  ];

  // Misma tarjeta que Favoritos (GUI-12), sin lo que allá dice de quién es la mascota, el
  // corazón ni el botón de solicitar: acá todas son del perfil activo.
  return (
    <View className="flex-1">
      {/* Foto, datos y acciones son Pressables hermanos, no uno dentro de otro: anidados,
          en web (React 19) disparan onPress apenas se montan, como documenta favoritos.tsx. */}
      <View className="flex-1 rounded-[22px] bg-organic-surface p-2 shadow-sm">
        <View
          className="w-full overflow-hidden rounded-2xl bg-organic-neutral-200"
          style={{ aspectRatio: 1 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver a ${nombre}`}
            onPress={onVer}
            className="h-full w-full active:opacity-90"
          >
            {foto ? (
              <Image source={{ uri: foto }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Ionicons name="paw-outline" size={36} color={PALETA.neutral[400]} />
              </View>
            )}
          </Pressable>

          <View className="absolute left-2 top-2" style={{ pointerEvents: 'none' }}>
            <EstadoMascotaBadge estado={mascota.estado.nombre} sobreFoto />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver a ${nombre}`}
          onPress={onVer}
          className="px-1 pt-3 active:opacity-90"
        >
          <View className="flex-row items-baseline justify-between gap-2">
            <Text
              numberOfLines={1}
              className="flex-1 font-titulo text-[20px] leading-[24px] text-organic-neutral-900"
            >
              {mascota.nombre ?? 'Sin nombre'}
            </Text>
            {edadTexto ? (
              <Text className="font-cuerpo-bold text-[13px] text-organic-accent-600">
                {edadTexto}
              </Text>
            ) : null}
          </View>

          <View className="mt-2 flex-row">
            <Chip
              variante="dato"
              icono={mascota.genero === 'MACHO' ? 'male' : 'female'}
              etiqueta={
                tamanio
                  ? `${etiquetaGenero(mascota.genero)} · ${tamanio}`
                  : etiquetaGenero(mascota.genero)
              }
            />
          </View>

          <View className="mt-2 flex-row items-center gap-1">
            <Ionicons name="paw-outline" size={13} color={PALETA.accent[600]} />
            <Text
              numberOfLines={1}
              className="flex-1 font-cuerpo text-[12px] text-organic-neutral-600"
            >
              {mascota.especie.nombre} · {mascota.raza.nombre}
            </Text>
          </View>
        </Pressable>

        <AccionesTarjeta acciones={acciones} />
      </View>
    </View>
  );
}

function ListaVacia() {
  return (
    <View className="items-center px-8 py-16">
      <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-organic-surface">
        <Ionicons name="paw-outline" size={52} color={PALETA.accent[600]} />
      </View>

      <Text className="text-center font-titulo text-[20px] leading-[24px] text-organic-neutral-900">
        Todavía no tenés ninguna mascota
      </Text>
      <Text className="mt-2 text-center font-cuerpo text-[15px] leading-6 text-organic-neutral-600">
        Registrá la primera para tenerla en tu perfil o para publicarla en adopción.
      </Text>

      <View className="mt-5 flex-row items-center gap-2.5 rounded-full bg-organic-surface px-4 py-3">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-organic-accent-600">
          <Ionicons name="add" size={20} color={PALETA.blanco} />
        </View>
        <Text className="font-cuerpo-semi text-[15px] text-organic-neutral-700">
          Tocá el botón para empezar
        </Text>
      </View>
    </View>
  );
}

function ListaVaciaFiltrada() {
  return (
    <View className="items-center px-8 py-16">
      <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-organic-surface">
        <Ionicons name="filter-outline" size={48} color={PALETA.accent[600]} />
      </View>

      <Text className="text-center font-titulo text-[20px] leading-[24px] text-organic-neutral-900">
        No hay mascotas con esos estados
      </Text>
      <Text className="mt-2 text-center font-cuerpo text-[15px] leading-6 text-organic-neutral-600">
        Probá con otros estados desde el ícono de filtros de arriba.
      </Text>
    </View>
  );
}

export default function MisMascotasScreen() {
  const { vistaRefugio } = useSesion();
  const router = useRouter();
  const toast = useToast();

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Los seguimientos del perfil activo: de ahí sale a cuál llevar el acceso de cada tarjeta. */
  const [seguimientos, setSeguimientos] = useState<SolicitudEnSeguimiento[]>([]);

  const [opcionesEstado, setOpcionesEstado] = useState<OpcionEstado[]>([]);
  const [estadosElegidos, setEstadosElegidos] = useState<number[]>([]);
  /** El filtro es solo del refugio: desde el perfil personal siempre se ve todo. */
  const filtro = vistaRefugio ? estadosElegidos : SIN_FILTRO;

  /**
   * Número del último pedido. Tocar chips seguido dispara varios GET, y uno viejo que
   * responda tarde pisaría la lista con un filtro que ya no está elegido.
   */
  const ultimoPedido = useRef(0);

  const cargar = useCallback(async (): Promise<void> => {
    const pedido = ++ultimoPedido.current;

    try {
      setError(null);
      const lista = await listarMisMascotas(filtro);
      if (pedido === ultimoPedido.current) setMascotas(lista);
    } catch (err) {
      if (pedido !== ultimoPedido.current) return;
      setError(err instanceof Error ? err.message : 'No pudimos cargar tus mascotas.');
    } finally {
      if (pedido === ultimoPedido.current) {
        setCargando(false);
        setRefrescando(false);
      }
    }
  }, [filtro]);

  /**
   * Mascota → solicitud cuyo seguimiento abrir. El refugio las tiene bajo su propia mascota; el
   * adoptante, bajo la que quedó en su perfil al aprobarse la adopción (no es la misma). Si hay
   * más de una, la que sigue en curso.
   */
  const seguimientoDe = useMemo(() => {
    const porMascota = new Map<number, SolicitudEnSeguimiento>();

    for (const item of seguimientos) {
      const mascotaId = item.rol === 'ADOPTANTE' ? item.mascotaAdoptadaId : item.mascota.id;
      if (mascotaId == null) continue;

      const actual = porMascota.get(mascotaId);
      const mejora =
        !actual ||
        (actual.finalizado && !item.finalizado) ||
        (actual.finalizado === item.finalizado && item.solicitudId > actual.solicitudId);
      if (mejora) porMascota.set(mascotaId, item);
    }

    return porMascota;
  }, [seguimientos]);

  /**
   * El acceso está siempre en una mascota adoptada, haya o no algo para subir hoy. Si no se
   * encuentra a qué adopción pertenece (se está cargando, o es una adoptada fuera de la app),
   * se avisa en vez de dejar el toque sin respuesta.
   */
  const abrirSeguimiento = useCallback(
    (mascota: Mascota): void => {
      const seguimiento = seguimientoDe.get(mascota.id);

      if (!seguimiento) {
        toast.mostrarAdvertencia('Todavía no encontramos el seguimiento de esta adopción.');
        return;
      }

      router.push({
        pathname: '/seguimientos/[solicitudId]',
        params: { solicitudId: seguimiento.solicitudId },
      });
    },
    [router, seguimientoDe, toast],
  );

  // Esta tab sigue montada al cambiar de vista: al volver al refugio arranca sin filtro, y el
  // catálogo se pide recién la primera vez que hace falta. Si falla, el filtro no se muestra
  // y la lista sigue funcionando con todas.
  useEffect(() => {
    setEstadosElegidos([]);
    if (!vistaRefugio) return;

    listarEstadosMascota()
      .then((estados) =>
        setOpcionesEstado(
          estados.map((estado) => ({
            id: estado.id,
            etiqueta: estiloDeEstado(estado.nombre).etiqueta,
          })),
        ),
      )
      .catch(() => undefined);
  }, [vistaRefugio]);

  /**
   * Si la mascota ya tiene un aviso activo se abre; si no, se arranca uno nuevo para ella. La
   * lista no trae el aviso de cada mascota (serían tantas consultas como tarjetas), así que se
   * resuelve al tocar.
   */
  const abrirPublicacion = useCallback(
    async (mascota: Mascota): Promise<void> => {
      try {
        const ficha = await obtenerMascota(mascota.id);

        if (ficha.publicacionActivaId !== null) {
          router.push({
            pathname: '/publicaciones/[id]',
            params: { id: ficha.publicacionActivaId },
          });
          return;
        }

        router.push({
          pathname: '/publicaciones/crear',
          params: { mascotaId: String(mascota.id), origen: 'publicaciones' },
        });
      } catch (err) {
        toast.mostrarError(
          err instanceof Error
            ? err.message
            : 'No pudimos abrir la publicación. Intentalo de nuevo.',
        );
      }
    },
    [router, toast],
  );

  // Se recarga al volver de crear, editar o eliminar una mascota, para reflejar los cambios, y
  // al cambiar el filtro (`cargar` cambia con él).
  useFocusEffect(
    useCallback(() => {
      void cargar();
      // Aparte y sin frenar la lista: si falla, las tarjetas solo quedan sin ese acceso.
      listarMisSeguimientos()
        .then(setSeguimientos)
        .catch(() => setSeguimientos([]));
    }, [cargar]),
  );

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla
          barra
          titulo={vistaRefugio ? 'Mascotas' : 'Mis mascotas'}
          subtitulo={
            cargando
              ? 'Cargando…'
              : `${mascotas.length} ${mascotas.length === 1 ? 'mascota' : 'mascotas'}`
          }
          derecha={
            vistaRefugio && opcionesEstado.length > 0 ? (
              <FiltroEstadosBoton
                titulo="Estado de la mascota"
                opciones={opcionesEstado}
                seleccionados={estadosElegidos}
                onChange={setEstadosElegidos}
              />
            ) : undefined
          }
        />

        {cargando ? (
          <EstadoCargando />
        ) : error ? (
          <EstadoError
            mensaje={error}
            onAccion={() => {
              setCargando(true);
              void cargar();
            }}
          />
        ) : (
          <FlatList
            data={conRellenoDeFila(mascotas)}
            keyExtractor={(item, indice) =>
              item === RELLENO ? `relleno-${indice}` : String(item.id)
            }
            numColumns={2}
            renderItem={({ item }) =>
              item === RELLENO ? (
                <View className="flex-1" />
              ) : (
                <TarjetaMascota
                  mascota={item}
                  onVerSeguimiento={
                    item.estado.nombre === 'Adoptado' || seguimientoDe.has(item.id)
                      ? () => abrirSeguimiento(item)
                      : undefined
                  }
                  onVer={() => router.push({ pathname: '/mascotas/[id]', params: { id: item.id } })}
                  onVerPublicacion={() => void abrirPublicacion(item)}
                  onVerHistoriaClinica={() =>
                    router.push({
                      pathname: '/mascotas/[id]/historia-clinica',
                      params: { id: item.id },
                    })
                  }
                />
              )
            }
            ListEmptyComponent={filtro.length > 0 ? ListaVaciaFiltrada : ListaVacia}
            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            // Abajo deja lugar para que el botón flotante no tape la última fila.
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 112 }}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => {
                  setRefrescando(true);
                  void cargar();
                }}
                tintColor={PALETA.accent[600]}
              />
            }
          />
        )}

        {/* Burbuja de creación: lleva al formulario de alta. */}
        <Link href="/mascotas/crear" asChild>
          <BotonFlotante
            accessibilityLabel={vistaRefugio ? 'Crear mascota del refugio' : 'Crear mascota'}
          />
        </Link>
      </SafeAreaView>
    </View>
  );
}
