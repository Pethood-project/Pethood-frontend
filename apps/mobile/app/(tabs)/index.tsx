/**
 * Home autenticada — pestaña Inicio.
 *
 * Tiene dos vistas con la misma estética y distintas secciones: la del adoptante (adoptar,
 * favoritos, solicitudes, seguimiento, perdidas, campañas) y la del refugio (solicitudes
 * recibidas, publicaciones, campañas, seguimientos, perdidas). Cuál se muestra sale del
 * interruptor de Perfil (`vistaRefugio`), no de esta pantalla.
 *
 * Cada sección trae sus propios datos y falla por separado (ver `useDatosInicio`).
 * Campañas lleva al portal (GUI-13) o a «Mis Campañas» (GUI-36) desde `CampaniasInicio.tsx`, y
 * Mascotas perdidas al portal (GUI-06) desde `PerdidasInicio.tsx`.
 */
import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FavoritosInicio } from '@/components/home/FavoritosInicio';
import {
  PanelSolicitudesRefugio,
  type ResumenSolicitudesRefugio,
} from '@/components/home/PanelSolicitudesRefugio';
import { PublicacionesInicio } from '@/components/home/PublicacionesInicio';
import { PerdidasAdoptante, PerdidasRefugio } from '@/components/home/PerdidasInicio';
import { CampaniasAdoptante } from '@/components/home/CampaniasInicio';
import { TarjetaAdoptar } from '@/components/home/TarjetaAdoptar';
import { TarjetasAdoptante } from '@/components/home/TarjetasAdoptante';
import { TarjetasRefugio } from '@/components/home/TarjetasRefugio';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { TituloPantalla } from '@/components/ui/EncabezadoPantalla';
import { PALETA } from '@/constants/theme';
import { useDatosInicio } from '@/hooks/useDatosInicio';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { useSesion } from '@/hooks/useSesion';
import { saludoPara } from '@/lib/saludo';
import { listarFavoritos } from '@/services/favoritos';
import { listarFeed, listarMisPublicaciones, SIN_FILTROS } from '@/services/publicaciones';
import { listarMisSeguimientos } from '@/services/seguimiento';
import { listarMias, listarRecibidas } from '@/services/solicitudes';

/** Fotos del abanico de la tarjeta de Adoptar. El `total` del feed viene igual. */
const FOTOS_ADOPTAR = 3;

const CARGADORES_ADOPTANTE = {
  feed: () => listarFeed(SIN_FILTROS, 0, FOTOS_ADOPTAR),
  favoritos: listarFavoritos,
  solicitudes: () => listarMias({ estados: ['Pendiente', 'En_Revision'] }),
  seguimientos: listarMisSeguimientos,
};

/**
 * Los contadores salen del `total` de cada filtro (no hay endpoint de resumen): cuatro
 * pedidos chicos en paralelo, y de las pendientes se aprovechan además las dos filas.
 */
async function resumenSolicitudesRefugio(): Promise<ResumenSolicitudesRefugio> {
  const hoy = new Date();
  const inicioDeMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [pendientes, enRevision, aprobadas, deHoy] = await Promise.all([
    listarRecibidas({ estados: ['Pendiente'] }),
    listarRecibidas({ estados: ['En_Revision'] }),
    listarRecibidas({ estados: ['Aprobada'], fechaDesde: inicioDeMes, fechaHasta: hoy }),
    listarRecibidas({ fechaDesde: hoy, fechaHasta: hoy }),
  ]);

  return {
    pendientes,
    enRevision: enRevision.total,
    aprobadasDelMes: aprobadas.total,
    llegadasHoy: deHoy.total,
  };
}

const CARGADORES_REFUGIO = {
  solicitudes: resumenSolicitudesRefugio,
  publicaciones: () => listarMisPublicaciones(),
  seguimientos: listarMisSeguimientos,
};

export default function InicioScreen() {
  const { usuario, vistaRefugio } = useSesion();

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Una vista por perfil, con su propio estado: al cambiar el switch se desmonta la
            otra y no queda aplicando respuestas del perfil anterior. */}
        {vistaRefugio ? (
          <InicioRefugio
            subtitulo={usuario?.refugio?.nombre ?? nombreVisible(usuario?.nombre, usuario?.apellido)}
          />
        ) : (
          <InicioAdoptante subtitulo={saludoPara(usuario?.nombre)} />
        )}
      </SafeAreaView>
    </View>
  );
}

function InicioAdoptante({ subtitulo }: { subtitulo: string }) {
  const router = useRouter();
  const { secciones, cargando, refrescando, refrescar, recargar } =
    useDatosInicio(CARGADORES_ADOPTANTE);

  return (
    <PantallaInicio
      encabezado={<Encabezado subtitulo={subtitulo} />}
      cargando={cargando}
      refrescando={refrescando}
      onRefrescar={refrescar}
    >
      <TarjetaAdoptar
        feed={secciones.feed.datos}
        error={secciones.feed.error}
        onSwipear={() => router.push('/(tabs)/adoptar')}
        onFiltros={() =>
          router.push({ pathname: '/(tabs)/adoptar', params: { filtros: 'abrir' } })
        }
      />
      <FavoritosInicio
        favoritos={secciones.favoritos.datos}
        error={secciones.favoritos.error}
        onSolicitada={() => void recargar()}
      />
      <TarjetasAdoptante
        solicitudes={secciones.solicitudes.datos}
        errorSolicitudes={secciones.solicitudes.error}
        seguimientos={secciones.seguimientos.datos}
        errorSeguimientos={secciones.seguimientos.error}
      />
      <PerdidasAdoptante onPress={() => router.push('/perdidos')} />
      <CampaniasAdoptante onPress={() => router.push('/campanias' as Href)} />
    </PantallaInicio>
  );
}

function InicioRefugio({ subtitulo }: { subtitulo: string }) {
  const router = useRouter();
  const { secciones, cargando, refrescando, refrescar } = useDatosInicio(CARGADORES_REFUGIO);

  return (
    <PantallaInicio
      encabezado={<Encabezado subtitulo={subtitulo} destacado />}
      cargando={cargando}
      refrescando={refrescando}
      onRefrescar={refrescar}
    >
      <PanelSolicitudesRefugio
        resumen={secciones.solicitudes.datos}
        error={secciones.solicitudes.error}
      />
      <PublicacionesInicio
        publicaciones={secciones.publicaciones.datos}
        error={secciones.publicaciones.error}
      />
      <TarjetasRefugio
        seguimientos={secciones.seguimientos.datos}
        errorSeguimientos={secciones.seguimientos.error}
      />
      <PerdidasRefugio onPress={() => router.push('/perdidos')} />
    </PantallaInicio>
  );
}

interface PantallaInicioProps {
  encabezado: ReactNode;
  cargando: boolean;
  refrescando: boolean;
  onRefrescar: () => void;
  children: ReactNode;
}

/**
 * El scroll completo: encabezado y secciones se desplazan juntos, como en el diseño.
 *
 * El margen de abajo deja libre el botón redondo amarillo de la barra, que sobresale por
 * encima de ella: sin él, la última tarjeta queda tapada al final del scroll.
 */
function PantallaInicio({
  encabezado,
  cargando,
  refrescando,
  onRefrescar,
  children,
}: PantallaInicioProps) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={onRefrescar}
          tintColor={PALETA.accent[600]}
          colors={[PALETA.accent[600]]}
        />
      }
    >
      {encabezado}
      {cargando ? (
        <View className="items-center py-16">
          <ActivityIndicator size="large" color={PALETA.accent[600]} />
        </View>
      ) : (
        <View className="gap-[14px] px-[22px] pt-2.5">{children}</View>
      )}
    </ScrollView>
  );
}

/**
 * "PetHood" y, debajo, el saludo (adoptante) o el nombre del refugio. El de refugio va más
 * grande y en semi: identifica la cuenta en vez de saludar.
 */
function Encabezado({ subtitulo, destacado = false }: { subtitulo: string; destacado?: boolean }) {
  const router = useRouter();
  const { noLeidas } = useNotificaciones();

  return (
    <View className="flex-row items-start justify-between gap-3 px-[22px] pb-2 pt-2">
      <View className="min-w-0 flex-1">
        <TituloPantalla>PetHood</TituloPantalla>
        <Text
          numberOfLines={1}
          className={`mt-[5px] text-organic-neutral-700 ${
            destacado ? 'font-cuerpo-semi text-[15px]' : 'font-cuerpo text-[13.5px]'
          }`}
        >
          {subtitulo}
        </Text>
      </View>

      <BotonCircular
        icono="notifications-outline"
        etiqueta="Notificaciones"
        contador={noLeidas}
        onPress={() => router.push('/notificaciones')}
      />
    </View>
  );
}

/** Si la sesión guardada no trae el refugio (es de antes de que se mandara), el nombre de la cuenta. */
function nombreVisible(nombre?: string, apellido?: string): string {
  return [nombre, apellido].filter(Boolean).join(' ').trim() || 'Mi refugio';
}
