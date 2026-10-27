/**
 * GUI-36 Campañas Refugio — «Mis Campañas» (spec 026, HU-12.1, HU-12.6, y spec 028).
 *
 * Listado de las campañas del refugio, de la más reciente a la más vieja, con filtros por
 * estado (selección múltiple) y por fecha de inicio (desde obligatoria, hasta opcional: el
 * «Hasta» aparece recién con un «Desde» elegido). Pausar, reactivar, finalizar y eliminar piden
 * confirmación (regla transversal 6). Al volver de otra pantalla la lista se refresca: aplicar
 * una donación o editar la campaña cambia lo que muestra la tarjeta. El «+» avisa del límite de 5
 * campañas antes de abrir el alta. Se entra desde la vista de refugio: el backend corta si el
 * perfil activo no es el de refugio.
 */
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TarjetaCampaniaRefugio } from '@/components/campanias/TarjetaCampaniaRefugio';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { BotonFlotante } from '@/components/ui/BotonFlotante';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DateField } from '@/components/ui/DateField';
import { FiltrosCampaniasModal, contarFiltrosCampanias } from '@/components/campanias/FiltrosCampaniasModal';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { type OpcionEstado } from '@/components/ui/FiltroEstados';
import { estiloDeEstadoCampania } from '@/constants/EstadosCampania';
import { PALETA } from '@/constants/theme';
import { usePaginacionCursor } from '@/hooks/usePaginacionCursor';
import { idsDeEstadosVigentes, type AccionCampania } from '@/lib/campanias';
import { tomarCampaniaCreada } from '@/lib/campaniaRecienCreada';
import { ApiError } from '@/services/api';
import {
  cambiarEstadoCampania,
  eliminarCampania,
  listarMisCampanias,
  SIN_FILTROS_CAMPANIAS,
  type CampaniaRefugio,
  type FiltrosMisCampanias,
} from '@/services/campanias';
import { listarEstadosCampania, type OpcionCatalogo } from '@/services/catalogos';
import { LIMITES } from '@/shared/validation/limits';

const SIN_CONEXION = 'No pudimos cargar tus campañas. Revisá tu conexión e intentalo de nuevo.';

/**
 * Fuera del componente a propósito: `usePaginacionCursor` arma `agregarAlPrincipio` con esta
 * función, y el efecto de foco depende de él. Inline, cambiaba en cada render, el efecto se
 * volvía a disparar y refrescaba la lista sin parar.
 */
const claveDeCampania = (campania: CampaniaRefugio): number => campania.id;

const CONFIRMACION: Record<
  AccionCampania,
  { titulo: string; mensaje: string; boton: string; exito: string; peligro: boolean }
> = {
  pausar: {
    titulo: '¿Pausar la campaña?',
    mensaje:
      'Deja de mostrarse y de recibir donaciones hasta que la reactives. Vas a poder seguir revisando las que ya te avisaron.',
    boton: 'Pausar',
    exito: 'Pausaste la campaña.',
    peligro: false,
  },
  reactivar: {
    titulo: '¿Reactivar la campaña?',
    mensaje: 'Vuelve a mostrarse y a recibir donaciones. Si ya venció, se finaliza.',
    boton: 'Reactivar',
    exito: 'Reactivaste la campaña.',
    peligro: false,
  },
  finalizar: {
    titulo: '¿Finalizar la campaña?',
    mensaje:
      'Deja de recibir donaciones y ya no se puede editar ni reactivar. Vas a poder seguir revisando las que ya te avisaron.',
    boton: 'Finalizar',
    exito: 'Finalizaste la campaña.',
    peligro: true,
  },
  eliminar: {
    titulo: '¿Eliminar la campaña?',
    mensaje: 'Se borra de tus campañas y nadie más la va a ver. No se puede deshacer.',
    boton: 'Eliminar',
    exito: 'Eliminaste la campaña.',
    peligro: true,
  },
};

/** Lo que pide al backend cada acción. */
function ejecutarAccion(campaniaId: number, accion: AccionCampania): Promise<unknown> {
  if (accion === 'eliminar') return eliminarCampania(campaniaId);
  if (accion === 'pausar') return cambiarEstadoCampania(campaniaId, 'Pausada');
  if (accion === 'reactivar') return cambiarEstadoCampania(campaniaId, 'Activa');
  return cambiarEstadoCampania(campaniaId, 'Finalizada');
}

/** Literal de HU-12.1. */
function ListaVacia() {
  return (
    <EstadoVacio
      icono="cash-outline"
      titulo="No tiene campañas creadas"
      descripcion="Tocá el botón + para crear la primera."
    />
  );
}

export default function MisCampaniasScreen() {
  const router = useRouter();
  const toast = useToast();

  const [catalogo, setCatalogo] = useState<OpcionCatalogo[]>([]);
  const [filtros, setFiltros] = useState<FiltrosMisCampanias>(SIN_FILTROS_CAMPANIAS);
  const [modalFiltros, setModalFiltros] = useState(false);
  const [confirmando, setConfirmando] = useState<{
    campania: CampaniaRefugio;
    accion: AccionCampania;
  } | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [verificandoLimite, setVerificandoLimite] = useState(false);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);

  useEffect(() => {
    listarEstadosCampania()
      .then(setCatalogo)
      // Sin catálogo el listado igual funciona; sólo falta el filtro por estado.
      .catch(() => setCatalogo([]));
  }, []);

  const estados: OpcionEstado[] = catalogo.map((estado) => ({
    id: estado.id,
    etiqueta: estiloDeEstadoCampania(estado.nombre).etiqueta,
  }));

  const cargarPagina = useCallback(
    async (cursor: number | null) => {
      const pagina = await listarMisCampanias(filtros, cursor);
      return {
        items: pagina.campanias,
        hayMas: pagina.hayMas,
        proximoCursor: pagina.proximoCursor,
      };
    },
    [filtros],
  );

  const lista = usePaginacionCursor({
    cargarPagina,
    claveDe: claveDeCampania,
    mensajeSinConexion: SIN_CONEXION,
  });

  const { agregarAlPrincipio, recargar } = lista;
  // `refrescar` cambia en cada render: por una ref, así el efecto de foco no se reinicia solo.
  const refrescarRef = useRef(lista.refrescar);
  refrescarRef.current = lista.refrescar;
  const yaTuvoFoco = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // La primera vez carga el hook; al volver, se refresca (salvo que venga del alta, que ya
      // trae la campaña nueva).
      if (!yaTuvoFoco.current) {
        yaTuvoFoco.current = true;
        return;
      }

      const creada = tomarCampaniaCreada();
      if (creada) {
        agregarAlPrincipio(creada);
        return;
      }
      refrescarRef.current();
    }, [agregarAlPrincipio]),
  );

  /**
   * El «+»: si el refugio ya tiene 5 campañas Programadas o Activas, avisa antes de abrir el
   * alta en vez de dejar completar todo el formulario. Si la consulta falla o no hay catálogo,
   * abre igual: el backend corta al confirmar.
   */
  const nuevaCampania = async (): Promise<void> => {
    if (verificandoLimite) return;

    const vigentes = idsDeEstadosVigentes(catalogo);
    if (vigentes.length > 0) {
      setVerificandoLimite(true);
      try {
        const pagina = await listarMisCampanias({ estados: vigentes }, null);
        if (pagina.campanias.length >= LIMITES.campania.vigentesPorRefugio) {
          setLimiteAlcanzado(true);
          return;
        }
      } catch {
        // Sigue al alta: la validación real es la del backend.
      } finally {
        setVerificandoLimite(false);
      }
    }

    router.push('/campanias/refugio/nueva' as Href);
  };

  const confirmar = async (): Promise<void> => {
    if (!confirmando) return;
    const { campania, accion } = confirmando;

    setProcesando(true);
    try {
      await ejecutarAccion(campania.id, accion);
      toast.mostrarExito(CONFIRMACION[accion].exito);
      setConfirmando(null);
      recargar();
    } catch (err) {
      toast.mostrarError(
        err instanceof ApiError
          ? err.message
          : 'No pudimos actualizar la campaña. Intentalo de nuevo.',
      );
    } finally {
      setProcesando(false);
    }
  };

  const volver = (): void => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla
          barra
          titulo="Mis Campañas"
          onVolver={volver}
          derecha={
            <BotonCircular
              icono="options-outline"
              etiqueta="Filtros"
              contador={contarFiltrosCampanias(filtros)}
              onPress={() => setModalFiltros(true)}
            />
          }
        />


        {lista.cargando ? (
          <EstadoCargando />
        ) : lista.error ? (
          <EstadoError mensaje={lista.error} onAccion={lista.recargar} />
        ) : (
          <FlatList
            data={lista.items}
            keyExtractor={(campania) => String(campania.id)}
            renderItem={({ item }) => (
              <TarjetaCampaniaRefugio
                campania={item}
                onAccion={(accion) => setConfirmando({ campania: item, accion })}
                onRevisar={() => router.push(`/campanias/refugio/${item.id}/donaciones` as Href)}
                onAbrir={() => router.push(`/campanias/refugio/${item.id}` as Href)}
              />
            )}
            ListEmptyComponent={ListaVacia}
            ListFooterComponent={
              lista.cargandoMas ? (
                <View className="items-center py-5">
                  <ActivityIndicator color={PALETA.accent[600]} />
                </View>
              ) : undefined
            }
            onEndReached={lista.cargarMas}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 14, paddingBottom: 112 }}
            refreshControl={
              <RefreshControl
                refreshing={lista.refrescando}
                onRefresh={lista.refrescar}
                tintColor={PALETA.accent[600]}
              />
            }
          />
        )}

        <BotonFlotante
          accessibilityLabel="Crear una campaña"
          onPress={() => void nuevaCampania()}
        />
      </SafeAreaView>

      <FiltrosCampaniasModal
        visible={modalFiltros}
        estados={estados}
        filtros={filtros}
        onAplicar={(nuevos) => {
          setFiltros(nuevos);
          setModalFiltros(false);
        }}
        onCerrar={() => setModalFiltros(false)}
      />

      <ConfirmDialog
        visible={confirmando !== null}
        tono={confirmando && !CONFIRMACION[confirmando.accion].peligro ? 'advertencia' : 'peligro'}
        titulo={confirmando ? CONFIRMACION[confirmando.accion].titulo : ''}
        mensaje={confirmando ? CONFIRMACION[confirmando.accion].mensaje : ''}
        textoConfirmar={confirmando ? CONFIRMACION[confirmando.accion].boton : undefined}
        textoCancelar="Volver"
        cargando={procesando}
        onConfirmar={() => void confirmar()}
        onCerrar={() => setConfirmando(null)}
      />

      <ConfirmDialog
        visible={limiteAlcanzado}
        tono="bloqueo"
        titulo="Llegaste al límite de campañas"
        mensaje={`Alcanzaste el límite de ${LIMITES.campania.vigentesPorRefugio} campañas activas. Finalizá o eliminá una para crear otra.`}
        onCerrar={() => setLimiteAlcanzado(false)}
      />
    </View>
  );
}
