/**
 * GUI-36 Campañas Refugio — «Mis Campañas» (spec 026, HU-12.1, HU-12.5, HU-12.6).
 *
 * Listado de las campañas del refugio, de la más reciente a la más vieja, con filtros por
 * estado (selección múltiple) y por fecha de inicio (desde obligatoria, hasta opcional: el
 * «Hasta» aparece recién con un «Desde» elegido). Finalizar y cancelar piden confirmación
 * (regla transversal 6). Al volver de otra pantalla la lista se refresca: aplicar una donación
 * cambia el recaudado y puede haber finalizado la campaña. El «+» avisa del límite de 5
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
import { BotonCircular } from '@/components/ui/BotonCircular';
import { BotonFlotante } from '@/components/ui/BotonFlotante';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DateField } from '@/components/ui/DateField';
import { FiltroEstados, type OpcionEstado } from '@/components/ui/FiltroEstados';
import { estiloDeEstadoCampania } from '@/constants/EstadosCampania';
import { PALETA } from '@/constants/theme';
import { usePaginacionCursor } from '@/hooks/usePaginacionCursor';
import { idsDeEstadosVigentes, type AccionCampania } from '@/lib/campanias';
import { tomarCampaniaCreada } from '@/lib/campaniaRecienCreada';
import { ApiError } from '@/services/api';
import {
  cambiarEstadoCampania,
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
  { titulo: string; mensaje: string; boton: string; estado: 'Finalizada' | 'Cancelada' }
> = {
  finalizar: {
    titulo: '¿Finalizar la campaña?',
    mensaje: 'Deja de recibir donaciones. Vas a poder seguir revisando las que ya te avisaron.',
    boton: 'Finalizar',
    estado: 'Finalizada',
  },
  cancelar: {
    titulo: '¿Cancelar la campaña?',
    mensaje: 'La campaña se da de baja y deja de recibir donaciones. No se puede deshacer.',
    boton: 'Cancelar campaña',
    estado: 'Cancelada',
  },
};

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
      await cambiarEstadoCampania(campania.id, CONFIRMACION[accion].estado);
      toast.mostrarExito(
        accion === 'finalizar' ? 'Finalizaste la campaña.' : 'Cancelaste la campaña.',
      );
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
        <View className="flex-row items-center gap-3 border-b border-organic-neutral-300 bg-organic-surface px-[22px] pb-4 pt-2">
          <BotonCircular icono="arrow-back" etiqueta="Volver" onPress={volver} grande />
          <Text className="font-titulo text-[28px] leading-[32px] text-organic-accent-600">
            Mis Campañas
          </Text>
        </View>

        <View className="gap-2 pt-3">
          <FiltroEstados
            opciones={estados}
            seleccionados={filtros.estados}
            onChange={(seleccionados) => setFiltros((f) => ({ ...f, estados: seleccionados }))}
          />
          <View className="flex-row items-end gap-2 px-[22px] pb-2">
            <View className="flex-1">
              <DateField
                label="Inicio desde"
                placeholder="Elegí"
                valor={filtros.fechaDesde ?? null}
                onChange={(fecha) => setFiltros((f) => ({ ...f, fechaDesde: fecha }))}
                fechaMaxima={new Date(2100, 0, 1)}
                mostrarEdad={false}
              />
            </View>
            {/* La HU pide «desde» obligatorio: sin él, un «hasta» suelto no filtraría nada. */}
            {filtros.fechaDesde ? (
              <View className="flex-1">
                <DateField
                  label="Hasta (opcional)"
                  placeholder="Elegí"
                  valor={filtros.fechaHasta ?? null}
                  onChange={(fecha) => setFiltros((f) => ({ ...f, fechaHasta: fecha }))}
                  fechaMinima={filtros.fechaDesde}
                  fechaMaxima={new Date(2100, 0, 1)}
                  mostrarEdad={false}
                />
              </View>
            ) : null}
            {filtros.fechaDesde ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setFiltros((f) => ({ estados: f.estados }))}
                hitSlop={8}
                className="pb-3 active:opacity-60"
              >
                <Text className="font-cuerpo-bold text-[13px] text-organic-accent-600">
                  Limpiar
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

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
              />
            )}
            ListEmptyComponent={ListaVacia}
            ListFooterComponent={
              lista.cargandoMas ? (
                <View className="items-center py-5">
                  <ActivityIndicator color={PALETA.accent[600]} />
                </View>
              ) : null
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

      <ConfirmDialog
        visible={confirmando !== null}
        tono="peligro"
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
        mensaje={`Alcanzaste el límite de ${LIMITES.campania.vigentesPorRefugio} campañas activas. Finalizá o cancelá una para crear otra.`}
        onCerrar={() => setLimiteAlcanzado(false)}
      />
    </View>
  );
}
