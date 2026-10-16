/**
 * GUI-13 Campañas Adoptante — HU-12.2 (spec 026): el portal de campañas de donación.
 *
 * Pantalla 13 del diseño («Campañas Solidarias»): las campañas Activa de todos los refugios, de
 * la más reciente a la más vieja, con su progreso y el botón «Donar ahora». Pagina por cursor
 * con scroll infinito (`usePaginacionCursor`).
 *
 * Es del perfil personal: desde el de refugio no se dona (el backend lo corta). Ruta del stack
 * y no una tab, como Mascotas perdidas: se entra desde Inicio y desde Perfil.
 */
import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TarjetaCampania } from '@/components/campanias/TarjetaCampania';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { PALETA } from '@/constants/theme';
import { usePaginacionCursor } from '@/hooks/usePaginacionCursor';
import { useSesion } from '@/hooks/useSesion';
import { listarCampanias, type Campania } from '@/services/campanias';

const SIN_CONEXION = 'No pudimos cargar las campañas. Revisá tu conexión e intentalo de nuevo.';

/** Estable, fuera del componente: ver el contrato de `usePaginacionCursor`. */
const claveDeCampania = (campania: Campania): number => campania.id;

function ListaVacia() {
  return (
    <EstadoVacio
      icono="gift-outline"
      titulo="No hay campañas activas por ahora"
      descripcion="Cuando un refugio lance una campaña, la vas a ver acá."
    />
  );
}

interface PieListaProps {
  cargandoMas: boolean;
  errorMas: string | null;
  onReintentar: () => void;
}

/** Lo que va debajo de la grilla mientras se trae otra página, o si esa página falló. */
function PieLista({ cargandoMas, errorMas, onReintentar }: PieListaProps) {
  if (cargandoMas) {
    return (
      <View className="items-center py-5">
        <ActivityIndicator color={PALETA.accent[600]} />
      </View>
    );
  }

  if (errorMas) {
    return (
      <View className="items-center gap-2 px-6 py-5">
        <Text className="text-center font-cuerpo text-[14px] text-organic-neutral-600">
          {errorMas}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onReintentar}
          hitSlop={8}
          className="active:opacity-60"
        >
          <Text className="font-cuerpo-bold text-[15px] text-organic-accent-600">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

export default function CampaniasAdoptanteScreen() {
  const router = useRouter();
  // Quien pertenece a un refugio dona a cualquier campaña menos a las del suyo.
  const refugioPropioId = useSesion().usuario?.refugio?.id ?? null;

  const cargarPagina = useCallback(async (cursor: number | null) => {
    const pagina = await listarCampanias(cursor);
    return { items: pagina.campanias, hayMas: pagina.hayMas, proximoCursor: pagina.proximoCursor };
  }, []);

  const lista = usePaginacionCursor({
    cargarPagina,
    claveDe: claveDeCampania,
    mensajeSinConexion: SIN_CONEXION,
  });

  const volver = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  }, [router]);

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla
          barra
          titulo="Campañas"
          subtitulo="Ayudá a los refugios"
          onVolver={volver}
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
              <TarjetaCampania
                campania={item}
                esPropia={refugioPropioId !== null && item.refugio.id === refugioPropioId}
                onDonar={() => router.push(`/campanias/${item.id}/donar` as Href)}
              />
            )}
            ListEmptyComponent={ListaVacia}
            ListFooterComponent={
              <PieLista
                cargandoMas={lista.cargandoMas}
                errorMas={lista.errorMas}
                onReintentar={lista.reintentarMas}
              />
            }
            onEndReached={lista.cargarMas}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16 }}
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
    </View>
  );
}
