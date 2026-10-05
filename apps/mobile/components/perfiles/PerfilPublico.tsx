/**
 * Perfil público de otra persona o de un refugio (spec 023, GUI-26). Una sola pantalla para
 * los dos: cambian la cabecera, el bloque de datos y de dónde salen las publicaciones y la
 * reputación.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { ResumenReputacion } from '@/components/resenas/ResumenReputacion';
import { Avatar } from '@/components/ui/Avatar';
import { PALETA } from '@/constants/theme';
import { resumenMascota } from '@/constants/Mascotas';
import { useSesion } from '@/hooks/useSesion';
import { urlAbsoluta } from '@/services/api';
import {
  listarPublicacionesDe,
  obtenerPerfilPersona,
  obtenerPerfilRefugio,
  type PerfilPersona,
  type PerfilRefugio,
} from '@/services/perfiles';
import type { PublicacionFeed } from '@/services/publicaciones';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

type Perfil =
  | { tipo: 'usuario'; datos: PerfilPersona }
  | { tipo: 'refugio'; datos: PerfilRefugio };

function desde(iso: string): string {
  const fecha = parsearFecha(iso);
  return fecha ? `En PetHood desde el ${aFechaVisible(fecha)}` : '';
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View className="mx-4 mt-5">
      <Text className="mb-2 font-cuerpo-semi text-[11px] uppercase tracking-[0.6px] text-organic-neutral-500">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function FilaPublicacion({ publicacion }: { publicacion: PublicacionFeed }) {
  const router = useRouter();
  const { mascota } = publicacion;
  const foto = urlAbsoluta(publicacion.imagenes[0] ?? mascota.imagenUrl);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver a ${mascota.nombre ?? 'la mascota'}`}
      onPress={() =>
        router.push({ pathname: '/publicaciones/[id]', params: { id: publicacion.id } })
      }
      className="flex-row items-center gap-3 rounded-2xl bg-organic-surface p-2.5 shadow-sm active:opacity-80"
    >
      <View className="h-16 w-16 overflow-hidden rounded-xl bg-organic-neutral-200">
        {foto ? (
          <Image source={{ uri: foto }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="paw-outline" size={24} color={PALETA.neutral[400]} />
          </View>
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-cuerpo-bold text-[16px] text-organic-neutral-900">
          {mascota.nombre ?? 'Sin nombre'}
        </Text>
        <Text numberOfLines={1} className="font-cuerpo text-[13px] text-organic-neutral-600">
          {mascota.especie.nombre} · {mascota.raza.nombre}
        </Text>
        <Text numberOfLines={1} className="font-cuerpo text-[12px] text-organic-neutral-500">
          {resumenMascota(mascota)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={PALETA.neutral[400]} />
    </Pressable>
  );
}

/** Publicaciones activas del perfil, de a páginas. Solo las ve quien está en perfil personal. */
function Publicaciones({ publicador }: { publicador: { refugioId: number } | { usuarioId: number } }) {
  const [items, setItems] = useState<PublicacionFeed[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargar = useCallback(
    async (desplazamiento: number) => {
      setCargando(true);
      setError(false);
      try {
        const feed = await listarPublicacionesDe(publicador, desplazamiento);
        setItems((previos) => (desplazamiento === 0 ? feed.publicaciones : [...previos, ...feed.publicaciones]));
        setTotal(feed.total);
      } catch {
        setError(true);
      } finally {
        setCargando(false);
      }
    },
    // El publicador es un literal nuevo por render: se compara por su contenido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(publicador)],
  );

  useEffect(() => {
    void cargar(0);
  }, [cargar]);

  if (error && items.length === 0) {
    return (
      <Pressable onPress={() => void cargar(0)} className="rounded-2xl bg-organic-surface p-4">
        <Text className="text-center font-cuerpo text-[14px] text-organic-neutral-500">
          No pudimos cargar las publicaciones. Tocá para reintentar.
        </Text>
      </Pressable>
    );
  }

  if (!cargando && items.length === 0) {
    return (
      <View className="rounded-2xl bg-organic-surface p-4">
        <Text className="text-center font-cuerpo text-[14px] text-organic-neutral-500">
          No tiene mascotas en adopción por ahora.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2.5">
      {items.map((p) => (
        <FilaPublicacion key={p.id} publicacion={p} />
      ))}
      {items.length < total ? (
        <Pressable
          accessibilityRole="button"
          disabled={cargando}
          onPress={() => void cargar(items.length)}
          className="items-center rounded-2xl border border-organic-neutral-300 py-3 active:opacity-70"
        >
          <Text className="font-cuerpo-semi text-[14px] text-organic-accent-600">
            {cargando ? 'Cargando…' : `Ver más (${total - items.length})`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface PerfilPublicoProps {
  tipo: 'usuario' | 'refugio';
  id: number;
}

export function PerfilPublico({ tipo, id }: PerfilPublicoProps) {
  const router = useRouter();
  const { vistaRefugio } = useSesion();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setError('El perfil no es válido.');
      return;
    }
    try {
      setError(null);
      setPerfil(
        tipo === 'refugio'
          ? { tipo, datos: await obtenerPerfilRefugio(id) }
          : { tipo, datos: await obtenerPerfilPersona(id) },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar el perfil.');
    }
  }, [tipo, id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const barra = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={volver}
      hitSlop={12}
      className="mx-4 mt-2 h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-70"
    >
      <Ionicons name="arrow-back" size={20} color={PALETA.grisCalido[900]} />
    </Pressable>
  );

  if (error || !perfil) {
    return (
      <View className="flex-1 bg-pethood-beige">
        <SafeAreaView className="flex-1" edges={['top']}>
          {barra}
          {error ? (
            <EstadoError mensaje={error} onAccion={() => void cargar()} />
          ) : (
            <EstadoCargando />
          )}
        </SafeAreaView>
      </View>
    );
  }

  const esRefugio = perfil.tipo === 'refugio';
  const d = perfil.datos;
  const nombre = perfil.tipo === 'refugio' ? perfil.datos.nombre : `${perfil.datos.nombre} ${perfil.datos.apellido}`;
  const zona = [d.localidad, d.provincia].filter(Boolean).join(', ');
  const mapaUrl = perfil.tipo === 'refugio' ? perfil.datos.mapaUrl : null;

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top']}>
        {barra}
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="items-center px-4 pt-4">
            <Avatar
              uri={urlAbsoluta(d.imagenUrl)}
              nombre={nombre}
              tamanio={96}
              tamanioTexto={32}
              variante="organic"
              tono={esRefugio ? 'acento' : 'neutro'}
              accessibilityLabel={`Foto de ${nombre}`}
            />
            <Text className="mt-3 text-center font-titulo text-[26px] leading-[30px] text-organic-neutral-900">
              {nombre}
            </Text>
            <View className="mt-1.5 flex-row flex-wrap items-center justify-center gap-2">
              {d.verificado ? (
                <View className="flex-row items-center gap-1 rounded-full bg-green-50 px-2.5 py-1">
                  <Ionicons name="shield-checkmark" size={14} color={PALETA.estado.exito} />
                  <Text className="font-cuerpo-semi text-[12px] text-green-700">Verificado</Text>
                </View>
              ) : null}
              {esRefugio ? (
                <View className="rounded-full bg-organic-accent-100 px-2.5 py-1">
                  <Text className="font-cuerpo-semi text-[12px] text-organic-accent-700">Refugio</Text>
                </View>
              ) : null}
            </View>
            {zona ? (
              <Text className="mt-2 font-cuerpo text-[14px] text-organic-neutral-600">{zona}</Text>
            ) : null}
            <Text className="mt-0.5 font-cuerpo text-[12px] text-organic-neutral-500">
              {desde(d.fechaAlta)}
            </Text>
          </View>

          {perfil.tipo === 'refugio' ? (
            <Seccion titulo="Sobre el refugio">
              <View className="gap-2.5 rounded-2xl bg-organic-surface p-4 shadow-sm">
                {perfil.datos.descripcion ? (
                  <Text className="font-cuerpo text-[14px] leading-5 text-organic-neutral-700">
                    {perfil.datos.descripcion}
                  </Text>
                ) : null}
                {perfil.datos.calleAltura ? (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="location-outline" size={16} color={PALETA.neutral[600]} />
                    <Text className="flex-1 font-cuerpo text-[14px] text-organic-neutral-700">
                      {perfil.datos.calleAltura}
                    </Text>
                  </View>
                ) : null}
                {mapaUrl ? (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Ver el refugio en Google Maps"
                    onPress={() => void Linking.openURL(mapaUrl).catch(() => undefined)}
                    className="h-11 flex-row items-center justify-center gap-2 rounded-full border border-organic-accent-600 active:opacity-70"
                  >
                    <Ionicons name="map-outline" size={17} color={PALETA.accent[600]} />
                    <Text className="font-cuerpo-bold text-[14px] text-organic-accent-600">
                      Ver en Google Maps
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </Seccion>
          ) : null}

          <ResumenReputacion
            tipo={tipo}
            id={id}
            titulo="Reputación"
            mostrarLista
            className="mx-4 mt-5"
          />

          {/* El feed de adopción solo responde en el perfil personal: desde la vista de
              refugio no se adopta, y el backend lo rechaza. */}
          {vistaRefugio ? null : (
            <Seccion
              titulo={
                perfil.tipo === 'refugio'
                  ? `Mascotas en adopción (${perfil.datos.resumen.publicacionesActivas})`
                  : 'Mascotas en adopción'
              }
            >
              <Publicaciones
                publicador={perfil.tipo === 'refugio' ? { refugioId: id } : { usuarioId: id }}
              />
            </Seccion>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
