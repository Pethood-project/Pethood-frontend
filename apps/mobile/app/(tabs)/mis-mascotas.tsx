/**
 * GUI-04 Mascotas Adoptante — listado de las mascotas del perfil activo (las personales, o
 * las del refugio desde la vista de refugio; ver `services/sesion.ts`), acceso a la creación y
 * punto de entrada a editar (HU-6.2). Eliminar (HU-6.3) no vive acá: se hace desde adentro
 * de la ficha de cada mascota (`mascotas/[id]/index.tsx`) para que la baja no quede a un
 * toque de distancia mientras se navega la lista.
 *
 * Solo en la vista de refugio, que suele tener muchas, hay un filtro por estado de la
 * mascota con selección múltiple ("Todos", o uno o varios estados). Filtra el backend
 * (`?estados=`).
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { BotonFlotante } from '@/components/ui/BotonFlotante';
import { Chip } from '@/components/ui/Chip';
import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { FiltroEstados, type OpcionEstado } from '@/components/ui/FiltroEstados';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { estiloDeEstado } from '@/constants/EstadosMascota';
import { etiquetaEdad, etiquetaGenero, etiquetaTamanio } from '@/constants/Mascotas';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { conRellenoDeFila, RELLENO } from '@/lib/grilla';
import { urlAbsoluta } from '@/services/api';
import { listarEstadosMascota } from '@/services/catalogos';
import { listarMisMascotas, type Mascota } from '@/services/mascotas';

/** Referencia estable para "sin filtro": un `[]` nuevo en cada render recrearía `cargar`. */
const SIN_FILTRO: number[] = [];

interface AccionTarjetaProps {
  etiqueta: string;
  accessibilityLabel: string;
  icono: ReactNode;
  claseFondo: string;
  claseTexto: string;
  onPress: () => void;
}

/** Cuadradito de acción al pie de la tarjeta: ícono arriba y una palabra abajo. */
function AccionTarjeta({
  etiqueta,
  accessibilityLabel,
  icono,
  claseFondo,
  claseTexto,
  onPress,
}: AccionTarjetaProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={`flex-1 items-center justify-center gap-1 rounded-2xl py-2.5 active:opacity-70 ${claseFondo}`}
    >
      {icono}
      <Text numberOfLines={1} className={`font-cuerpo-semi text-[12.5px] ${claseTexto}`}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

interface TarjetaMascotaProps {
  mascota: Mascota;
  /** Solo el creador del registro ve editar (misma regla que en publicaciones). */
  esPropia: boolean;
  onVer: () => void;
  onEditar: () => void;
  onVerHistoriaClinica: () => void;
}

function TarjetaMascota({
  mascota,
  esPropia,
  onVer,
  onEditar,
  onVerHistoriaClinica,
}: TarjetaMascotaProps) {
  const foto = urlAbsoluta(mascota.imagenUrl);
  const nombre = mascota.nombre ?? 'esta mascota';
  const edadTexto = etiquetaEdad(mascota.fechaNacimiento);
  const tamanio = etiquetaTamanio(mascota.tamanio);

  // Misma tarjeta que Favoritos (GUI-12), sin lo que allá dice de quién es la mascota, el
  // corazón ni el botón de solicitar: acá todas son del perfil activo.
  return (
    <View className="flex-1">
      {/* Foto, datos y acciones son Pressables hermanos, no uno dentro de otro: anidados,
          en web (React 19) disparan onPress apenas se montan, como documenta favoritos.tsx. */}
      <View className="rounded-[22px] bg-organic-surface p-2 shadow-sm">
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

          <View className="mt-2 flex-row flex-wrap gap-1.5">
            <Chip
              variante="dato"
              icono={mascota.genero === 'MACHO' ? 'male' : 'female'}
              etiqueta={etiquetaGenero(mascota.genero)}
            />
            {tamanio ? <Chip variante="dato" etiqueta={tamanio} /> : null}
          </View>

          <View className="mt-2 flex-row items-center gap-1">
            <Ionicons name="paw-outline" size={13} color={PALETA.accent[600]} />
            <Text numberOfLines={1} className="flex-1 font-cuerpo text-[12px] text-organic-neutral-600">
              {mascota.especie.nombre} · {mascota.raza.nombre}
            </Text>
          </View>
        </Pressable>

        <View className="flex-row gap-2 px-1 pb-1 pt-3">
          <AccionTarjeta
            etiqueta="Historia"
            accessibilityLabel={`Historia clínica de ${nombre}`}
            icono={
              <MaterialCommunityIcons
                name="clipboard-pulse-outline"
                size={20}
                color={PALETA.accent[600]}
              />
            }
            claseFondo="bg-organic-calido-amarilloClaro"
            claseTexto="text-organic-accent-700"
            onPress={onVerHistoriaClinica}
          />

          {/* Solo el creador del registro edita: si lo cargó otro miembro del refugio, la
              historia clínica ocupa todo el ancho. */}
          {esPropia ? (
            <AccionTarjeta
              etiqueta="Editar"
              accessibilityLabel={`Editar a ${nombre}`}
              icono={<Ionicons name="pencil" size={18} color={PALETA.neutral[700]} />}
              claseFondo="bg-organic-neutral-200"
              claseTexto="text-organic-neutral-700"
              onPress={onEditar}
            />
          ) : null}
        </View>
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
        Probá con otros estados o tocá «Todos» para ver todas.
      </Text>
    </View>
  );
}

export default function MisMascotasScreen() {
  const { vistaRefugio, usuario } = useSesion();
  const router = useRouter();

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Se recarga al volver de crear, editar o eliminar una mascota, para reflejar los cambios, y
  // al cambiar el filtro (`cargar` cambia con él).
  useFocusEffect(
    useCallback(() => {
      void cargar();
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
        />

        {vistaRefugio && opcionesEstado.length > 0 ? (
          <View className="bg-organic-bg pt-3">
            <FiltroEstados
              opciones={opcionesEstado}
              seleccionados={estadosElegidos}
              onChange={setEstadosElegidos}
            />
          </View>
        ) : null}

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
                  esPropia={item.usuarioId === usuario?.id}
                  onVer={() =>
                    router.push({ pathname: '/mascotas/[id]', params: { id: item.id } })
                  }
                  onEditar={() =>
                    router.push({ pathname: '/mascotas/[id]/editar', params: { id: item.id } })
                  }
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
