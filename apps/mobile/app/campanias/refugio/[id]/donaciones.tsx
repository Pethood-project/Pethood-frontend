/**
 * Revisar donaciones de una campaña (spec 026, HU-12.3). No está en el prototipo.
 *
 * Abre en «Pendientes»: lo que el refugio tiene que hacer. «Aplicar» suma el monto a la
 * campaña (después de verificar el ingreso en su cuenta) y «Rechazar» pide el motivo. Las dos
 * con confirmación (regla transversal 6).
 *
 * Cada donación muestra desde dónde dijo el donante que transfirió: con Mercado Pago vinculado,
 * las de Mercado Pago se confirman solas; las de otro banco las aplica el refugio (spec 027).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Segmentado, type OpcionSegmento } from '@/components/ui/Segmentado';
import { PALETA } from '@/constants/theme';
import { usePaginacionCursor } from '@/hooks/usePaginacionCursor';
import {
  ETIQUETA_MOTIVO,
  formatearPesos,
  origenDeDonacion,
  type MotivoRechazo,
} from '@/lib/campanias';
import { ApiError } from '@/services/api';
import {
  listarDonaciones,
  obtenerCampania,
  resolverDonacion,
  type Donacion,
  type EstadoDonacionFiltro,
} from '@/services/campanias';
import { tiempoRelativo } from '@/shared/validation/dates';

type Vista = EstadoDonacionFiltro | 'Todas';

/** Estable, fuera del componente: ver el contrato de `usePaginacionCursor`. */
const claveDeDonacion = (donacion: Donacion): number => donacion.id;

const VISTAS: OpcionSegmento<Vista>[] = [
  { valor: 'Pendiente', etiqueta: 'Pendientes' },
  { valor: 'Realizada', etiqueta: 'Aplicadas' },
  { valor: 'Cancelada', etiqueta: 'Rechazadas' },
  { valor: 'Todas', etiqueta: 'Todas' },
];

const VACIO: Record<Vista, string> = {
  Pendiente: 'No tenés donaciones para revisar',
  Realizada: 'Todavía no aplicaste donaciones',
  Cancelada: 'No rechazaste ninguna donación',
  Todas: 'Todavía nadie avisó que donó',
};

type Revision = { donacion: Donacion; accion: 'aplicar' | 'rechazar' };

function FilaDonacion({
  donacion,
  confirmacionAutomatica,
  onRevisar,
}: {
  donacion: Donacion;
  confirmacionAutomatica: boolean;
  onRevisar: (accion: Revision['accion']) => void;
}) {
  const pendiente = donacion.estado.nombre === 'Pendiente';
  const origen = origenDeDonacion(donacion.origen, pendiente, confirmacionAutomatica);

  return (
    <View className="gap-2 rounded-[20px] bg-organic-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-cuerpo-bold text-[16px] text-organic-neutral-900">
          {donacion.donante.nombre} {donacion.donante.apellido}
        </Text>
        <Text className="font-cuerpo-bold text-[16px] text-organic-accent-600">
          {formatearPesos(donacion.monto)}
        </Text>
      </View>
      <Text className="font-cuerpo text-[13px] text-organic-neutral-600">
        {tiempoRelativo(new Date(donacion.fechaAlta))}
        {donacion.motivoRechazo ? ` · ${ETIQUETA_MOTIVO[donacion.motivoRechazo]}` : ''}
      </Text>
      {origen ? (
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="rounded-full border border-organic-neutral-300 bg-organic-bg px-2.5 py-1">
            <Text className="text-xs font-medium text-organic-neutral-900">{origen.etiqueta}</Text>
          </View>
          {origen.ayuda ? (
            <Text className="font-cuerpo text-[13px] text-organic-neutral-600">{origen.ayuda}</Text>
          ) : null}
        </View>
      ) : null}
      {donacion.confirmadaPorMercadoPago ? (
        <View className="self-start rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1">
          <Text className="text-xs font-medium text-sky-700">Confirmada por Mercado Pago</Text>
        </View>
      ) : null}
      {pendiente ? (
        <View className="mt-1 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => onRevisar('rechazar')}
            className="flex-1 items-center rounded-full border border-red-300 py-2 active:opacity-70"
          >
            <Text className="font-cuerpo-bold text-[14px] text-red-700">Rechazar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onRevisar('aplicar')}
            className="flex-1 items-center rounded-full bg-emerald-600 py-2 active:opacity-90"
          >
            <Text className="font-cuerpo-bold text-[14px] text-white">Aplicar</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function RevisarDonacionesScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaniaId = Number(id);

  const [vista, setVista] = useState<Vista>('Pendiente');
  const [revision, setRevision] = useState<Revision | null>(null);
  const [motivo, setMotivo] = useState<MotivoRechazo | null>(null);
  const [procesando, setProcesando] = useState(false);
  /** Si el refugio tiene Mercado Pago vinculado. Mientras carga (o si falla), se asume que no. */
  const [confirmacionAutomatica, setConfirmacionAutomatica] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerCampania(campaniaId)
      .then((campania) => {
        if (vigente) setConfirmacionAutomatica(campania.confirmacionAutomatica);
      })
      .catch(() => {
        // Sólo cambia el texto de ayuda: sin el dato, la fila pide revisar a mano.
      });
    return () => {
      vigente = false;
    };
  }, [campaniaId]);

  const cargarPagina = useCallback(
    async (cursor: number | null) => {
      const pagina = await listarDonaciones(campaniaId, vista === 'Todas' ? null : vista, cursor);
      return {
        items: pagina.donaciones,
        hayMas: pagina.hayMas,
        proximoCursor: pagina.proximoCursor,
      };
    },
    [campaniaId, vista],
  );

  const lista = usePaginacionCursor({
    cargarPagina,
    claveDe: claveDeDonacion,
    mensajeSinConexion:
      'No pudimos cargar las donaciones. Revisá tu conexión e intentalo de nuevo.',
  });

  const cerrar = (): void => {
    setRevision(null);
    setMotivo(null);
  };

  const confirmar = async (): Promise<void> => {
    if (!revision) return;
    if (revision.accion === 'rechazar' && !motivo) {
      toast.mostrarAdvertencia('Elegí por qué rechazás la donación.');
      return;
    }

    setProcesando(true);
    try {
      await resolverDonacion(
        revision.donacion.id,
        revision.accion === 'aplicar'
          ? { estado: 'Realizada' }
          : { estado: 'Cancelada', motivo: motivo! },
      );
      toast.mostrarExito(
        revision.accion === 'aplicar' ? 'Aplicaste la donación.' : 'Rechazaste la donación.',
      );
      cerrar();
      lista.recargar();
    } catch (err) {
      toast.mostrarError(
        err instanceof ApiError
          ? err.message
          : 'No pudimos actualizar la donación. Intentalo de nuevo.',
      );
    } finally {
      setProcesando(false);
    }
  };

  const aplicar = revision?.accion === 'aplicar';

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 border-b border-organic-neutral-300 bg-organic-surface px-[22px] pb-4 pt-2">
          <BotonCircular
            icono="arrow-back"
            etiqueta="Volver"
            onPress={() => router.back()}
            grande
          />
          <Text className="font-titulo text-[28px] leading-[32px] text-organic-accent-600">
            Donaciones
          </Text>
        </View>

        <View className="px-4 pt-3">
          <Segmentado opciones={VISTAS} valor={vista} onChange={setVista} variante="organica" />
        </View>

        {lista.cargando ? (
          <EstadoCargando />
        ) : lista.error ? (
          <EstadoError mensaje={lista.error} onAccion={lista.recargar} />
        ) : (
          <FlatList
            data={lista.items}
            keyExtractor={(donacion) => String(donacion.id)}
            renderItem={({ item }) => (
              <FilaDonacion
                donacion={item}
                confirmacionAutomatica={confirmacionAutomatica}
                onRevisar={(accion) => setRevision({ donacion: item, accion })}
              />
            )}
            ListEmptyComponent={
              <EstadoVacio
                icono="cash-outline"
                titulo={VACIO[vista]}
                descripcion="Cuando alguien avise que donó a esta campaña, lo vas a ver acá."
              />
            }
            onEndReached={lista.cargarMas}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 12 }}
            refreshControl={
              <RefreshControl
                refreshing={lista.refrescando}
                onRefresh={lista.refrescar}
                tintColor={PALETA.accent[600]}
              />
            }
          />
        )}
      </SafeAreaView>

      <ConfirmDialog
        visible={revision !== null}
        tono={aplicar ? 'exito' : 'peligro'}
        titulo={aplicar ? '¿Aplicar la donación?' : '¿Rechazar la donación?'}
        mensaje={
          revision
            ? aplicar
              ? `Verificá que recibiste ${formatearPesos(revision.donacion.monto)} en tu cuenta. El monto se suma a la campaña.`
              : 'La donación no se va a sumar a la campaña.'
            : ''
        }
        textoConfirmar={aplicar ? 'Aplicar' : 'Rechazar'}
        textoCancelar="Volver"
        cargando={procesando}
        onConfirmar={() => void confirmar()}
        onCerrar={cerrar}
      >
        {revision && !aplicar ? (
          <View className="gap-2">
            {(Object.keys(ETIQUETA_MOTIVO) as MotivoRechazo[]).map((clave) => (
              <Chip
                key={clave}
                etiqueta={ETIQUETA_MOTIVO[clave]}
                variante="seleccion"
                rol="radio"
                activa={motivo === clave}
                onPress={() => setMotivo(clave)}
              />
            ))}
          </View>
        ) : null}
      </ConfirmDialog>
    </View>
  );
}
