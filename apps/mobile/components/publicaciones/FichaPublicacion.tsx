/**
 * Piezas de la ficha de la publicación (rediseño 9c/9d del deck de pantallas). Todo va dentro
 * de una tarjeta montada sobre la foto, y cada sección usa el mismo encabezado (`SeccionFicha`)
 * para que la pantalla no mezcle estilos: textos sueltos, etiquetas sueltas, secciones con y
 * sin caja.
 *
 * Son solo presentación: la pantalla decide qué mostrar. Las usan la ficha de la publicación
 * (`app/publicaciones/[id]/index.tsx`) y la de la mascota (`app/mascotas/[id]/index.tsx`).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { estiloDeBannerPublicacion } from '@/constants/EstadosPublicacion';
import { etiquetaEdad, etiquetaGenero, etiquetaTamanio } from '@/constants/Mascotas';
import { PALETA } from '@/constants/theme';
import type { Genero, Tamanio } from '@/services/mascotas';
import { textoSegunGenero } from '@/shared/genero';

export type NombreIcono = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Tarjeta que contiene toda la ficha, montada sobre la parte de abajo de la galería. */
export const SOLAPE_TARJETA = 28;

export function TarjetaFicha({ children }: { children: ReactNode }) {
  return (
    <View
      className="mx-3 rounded-[28px] border border-organic-neutral-300 bg-organic-neutral-100 px-4 pb-6 pt-5"
      style={{
        marginTop: -SOLAPE_TARJETA,
        shadowColor: PALETA.accent[800],
        shadowOpacity: 0.14,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
      }}
    >
      {children}
    </View>
  );
}

/** Sección de la tarjeta: línea divisoria arriba y el encabezado de siempre (ícono + título). */
export function SeccionFicha({
  icono,
  titulo,
  children,
}: {
  icono: NombreIcono;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <View>
      <View className="my-5 h-px bg-organic-neutral-200" />
      <View className="mb-3 flex-row items-center gap-2.5">
        <View className="h-8 w-8 items-center justify-center rounded-[10px] bg-organic-accent-200">
          <MaterialCommunityIcons name={icono} size={18} color={PALETA.accent[700]} />
        </View>
        <Text className="flex-1 font-titulo text-[19px] leading-6 text-organic-neutral-900">
          {titulo}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** Rótulo chico en mayúsculas, para una subsección (ej. «Vacunas» dentro de Salud). */
export function Subtitulo({ texto }: { texto: string }) {
  return (
    <Text className="mb-2 mt-4 font-cuerpo-bold text-[11px] uppercase tracking-wider text-organic-neutral-500">
      {texto}
    </Text>
  );
}

function Rotulo({ texto, className = 'text-organic-neutral-500' }: { texto: string; className?: string }) {
  return (
    <Text className={`font-cuerpo-bold text-[10.5px] uppercase tracking-wider ${className}`}>
      {texto}
    </Text>
  );
}

/**
 * Quién publicó: el refugio (con su ícono) o la persona (con sus iniciales), y la zona que
 * cargó en la publicación. Si hay coordenadas del usuario se muestra la distancia, el enlace
 * a Google Maps del refugio y la fecha de publicación (Módulo 11).
 */
export function PublicadoPor({
  refugio,
  persona,
  ubicacion,
  distanciaTexto,
  mapaUrl,
  fechaTexto,
  onVerPerfil,
}: {
  refugio: { nombre: string; mapaUrl?: string | null } | null;
  persona: { nombre: string; apellido: string } | null;
  ubicacion: string | null;
  distanciaTexto?: string | null;
  mapaUrl?: string | null;
  fechaTexto?: string | null;
  /** Abre el perfil público de quien publicó (spec 023). */
  onVerPerfil?: () => void;
}) {
  const nombre = refugio?.nombre ?? (persona ? `${persona.nombre} ${persona.apellido}` : null);
  if (!nombre) return null;

  const iniciales = persona
    ? `${persona.nombre.charAt(0)}${persona.apellido.charAt(0)}`.toUpperCase()
    : '';

  const enlaceMapa = mapaUrl ?? refugio?.mapaUrl ?? null;
  const zona = [ubicacion, distanciaTexto].filter(Boolean).join(' · ');

  return (
    <View className="mt-4 flex-row items-center gap-3 rounded-2xl border border-organic-neutral-300 p-3">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-organic-accent-600">
        {refugio ? (
          <MaterialCommunityIcons name="domain" size={22} color={PALETA.blanco} />
        ) : (
          <Text className="font-titulo text-lg text-white">{iniciales}</Text>
        )}
      </View>

      <View className="flex-1">
        <Rotulo texto="Publicado por" />
        <View className="flex-row items-center gap-2">
          <Text
            className="shrink font-cuerpo-bold text-base text-organic-neutral-900"
            numberOfLines={1}
          >
            {nombre}
          </Text>
          {enlaceMapa ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Ver la ubicación de ${nombre} en Google Maps`}
              onPress={() => {
                if (enlaceMapa) void Linking.openURL(enlaceMapa);
              }}
              hitSlop={8}
              className="flex-row items-center gap-1 self-start rounded-full bg-organic-accent-100 px-2.5 py-1 active:opacity-70"
            >
              <MaterialCommunityIcons name="map-marker" size={14} color={PALETA.accent[600]} />
              <Text className="font-cuerpo-semi text-[12px] text-organic-accent-700">Mapa</Text>
            </Pressable>
          ) : null}
        </View>
        {zona ? (
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={13}
              color={PALETA.neutral[500]}
            />
            <Text className="flex-1 font-cuerpo text-[13px] text-organic-neutral-600" numberOfLines={1}>
              {zona}
            </Text>
          </View>
        ) : null}
        {fechaTexto ? (
          <View className="mt-1 flex-row items-center gap-1">
            <MaterialCommunityIcons
              name="calendar-outline"
              size={13}
              color={PALETA.neutral[500]}
            />
            <Text className="font-cuerpo text-[13px] text-organic-neutral-600">
              Publicado el {fechaTexto}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Hermano de los enlaces de adentro y no un contenedor: un Pressable dentro de otro
          dispara onPress al renderizar en web (React 19). */}
      {onVerPerfil ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver el perfil de ${nombre}`}
          onPress={onVerPerfil}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full bg-organic-accent-100 active:opacity-70"
        >
          <MaterialCommunityIcons name="chevron-right" size={22} color={PALETA.accent[600]} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Estado de la publicación como banner de color: se ve de un vistazo si está activa. */
export function BannerEstadoPublicacion({ estado }: { estado: string }) {
  const estilo = estiloDeBannerPublicacion(estado);

  return (
    <View
      className={`mt-2.5 flex-row items-center gap-3 rounded-2xl border-[1.5px] p-3.5 ${estilo.contenedor}`}
    >
      <View className={`h-10 w-10 items-center justify-center rounded-full ${estilo.circulo}`}>
        <MaterialCommunityIcons name={estilo.icono} size={20} color={PALETA.blanco} />
      </View>
      <View className="flex-1">
        <Rotulo texto="Estado de la publicación" className={estilo.detalle} />
        <Text className={`font-titulo text-[19px] leading-6 ${estilo.titulo}`}>
          {estado.replace(/_/g, ' ')}
        </Text>
        {estilo.explicacion ? (
          <Text className={`font-cuerpo text-[13px] ${estilo.detalle}`}>{estilo.explicacion}</Text>
        ) : null}
      </View>
    </View>
  );
}

/** Rasgo de personalidad: chip relleno y grande, para que no pase desapercibido. */
export function ChipRasgo({ texto }: { texto: string }) {
  return (
    <View className="rounded-full bg-organic-accent-500 px-4 py-2">
      <Text className="font-cuerpo-bold text-[15px] text-white">{texto}</Text>
    </View>
  );
}

export interface DatoFicha {
  icono: NombreIcono;
  etiqueta: string;
  valor: string;
}

/** Ícono del cuadrante de especie: las dos que tienen dibujo propio, y la pata para el resto. */
const ICONO_ESPECIE: Record<string, NombreIcono> = { perro: 'dog', gato: 'cat' };

/**
 * Los seis cuadrantes de «Características». Un dato opcional sin cargar dice «Sin dato». Lo
 * usan la ficha de la publicación y la de la mascota, así las dos muestran lo mismo.
 */
export function datosDeMascota(mascota: {
  especie: { nombre: string };
  raza: { nombre: string };
  fechaNacimiento: string | null;
  tamanio: Tamanio | null;
  peso: number | null;
  genero: Genero;
}): DatoFicha[] {
  return [
    {
      icono: ICONO_ESPECIE[mascota.especie.nombre.trim().toLowerCase()] ?? 'paw',
      etiqueta: 'Especie',
      valor: mascota.especie.nombre,
    },
    { icono: 'tag', etiqueta: 'Raza', valor: mascota.raza.nombre },
    {
      icono: 'cake-variant',
      etiqueta: 'Edad',
      valor: etiquetaEdad(mascota.fechaNacimiento) ?? 'Sin dato',
    },
    { icono: 'ruler', etiqueta: 'Tamaño', valor: etiquetaTamanio(mascota.tamanio) ?? 'Sin dato' },
    {
      icono: 'weight-kilogram',
      etiqueta: 'Peso',
      valor: mascota.peso === null ? 'Sin dato' : `${String(mascota.peso).replace('.', ',')} kg`,
    },
    {
      icono: mascota.genero === 'HEMBRA' ? 'gender-female' : 'gender-male',
      etiqueta: 'Sexo',
      valor: etiquetaGenero(mascota.genero),
    },
  ];
}

/** Grilla de características: cuadrantes de a dos por fila. */
export function GrillaDatos({ datos }: { datos: DatoFicha[] }) {
  const filas: DatoFicha[][] = [];
  for (let i = 0; i < datos.length; i += 2) filas.push(datos.slice(i, i + 2));

  return (
    <View className="gap-2.5">
      {filas.map((fila) => (
        <View key={fila[0]!.etiqueta} className="flex-row gap-2.5">
          {fila.map((dato) => (
            <CuadranteDato key={dato.etiqueta} {...dato} />
          ))}
        </View>
      ))}
    </View>
  );
}

function CuadranteDato({ icono, etiqueta, valor }: DatoFicha) {
  return (
    <View className="flex-1 gap-2.5 rounded-[18px] border border-organic-accent-200 bg-organic-accent-100 p-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-organic-accent-500">
        <MaterialCommunityIcons name={icono} size={21} color={PALETA.blanco} />
      </View>
      <View>
        <Rotulo texto={etiqueta} className="text-organic-accent-700" />
        <Text className="font-cuerpo-bold text-[17px] text-organic-neutral-900" numberOfLines={1}>
          {valor}
        </Text>
      </View>
    </View>
  );
}

export type TipoCuadranteSalud = 'CASTRADO' | 'DESPARASITADO';

const SALUD: Record<
  TipoCuadranteSalud,
  {
    icono: NombreIcono;
    masculino: string;
    femenino: string;
    estilo: { fondo: string; borde: string; tinta: string };
  }
> = {
  CASTRADO: {
    icono: 'shield-check',
    masculino: 'Castrado',
    femenino: 'Castrada',
    estilo: PALETA.salud.castrado,
  },
  DESPARASITADO: {
    icono: 'pill',
    masculino: 'Desparasitado',
    femenino: 'Desparasitada',
    estilo: PALETA.salud.desparasitado,
  },
};

/**
 * Castrado o desparasitado. Activo, con su color (naranja de marca o marrón claro) y sin
 * decir «Sí»; inactivo, apagado en gris y con «No» abajo. Concuerda en género con la mascota.
 */
export function CuadranteSalud({
  tipo,
  activo,
  genero,
}: {
  tipo: TipoCuadranteSalud;
  activo: boolean;
  genero: Genero;
}) {
  const { icono, masculino, femenino, estilo } = SALUD[tipo];
  const texto = textoSegunGenero(genero, masculino, femenino);

  if (!activo) {
    return (
      <View
        className="min-h-[104px] flex-1 items-center justify-center gap-1 rounded-[18px] border-[1.5px] border-organic-neutral-300 bg-organic-neutral-200 p-3"
        accessibilityLabel={`${texto}: no`}
      >
        <MaterialCommunityIcons name={icono} size={28} color={PALETA.neutral[400]} />
        <Text className="font-cuerpo-bold text-[15px] text-organic-neutral-500">{texto}</Text>
        <Text className="font-cuerpo-bold text-sm text-organic-neutral-600">No</Text>
      </View>
    );
  }

  return (
    <View
      className="min-h-[104px] flex-1 items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] p-3"
      style={{ backgroundColor: estilo.fondo, borderColor: estilo.borde }}
      accessibilityLabel={texto}
    >
      <MaterialCommunityIcons name={icono} size={30} color={estilo.tinta} />
      <Text className="font-cuerpo-bold text-base" style={{ color: estilo.tinta }} numberOfLines={1}>
        {texto}
      </Text>
    </View>
  );
}

/**
 * La descripción de la publicación, en una caja de color. Es texto libre, así que va en letra
 * de cuerpo y al tamaño de lectura (15px): lo que la destaca es la caja, no la tipografía.
 */
export function CajaDescripcion({ texto }: { texto: string }) {
  return (
    <View className="rounded-[20px] border border-organic-accent-200 bg-organic-accent-100 px-5 py-4">
      <Text className="font-cuerpo-semi text-[15px] leading-[22px] text-organic-accent-900">
        {texto}
      </Text>
    </View>
  );
}

/**
 * Un requisito para adoptar como medalla, sin ícono: es texto libre que escribe quien publica
 * (≤20 caracteres, entra en una línea).
 */
export function MedallaRequisito({ texto }: { texto: string }) {
  return (
    <View className="rounded-full border border-organic-neutral-300 bg-organic-neutral-200 px-4 py-2">
      <Text className="font-cuerpo-semi text-[15px] text-organic-neutral-800" numberOfLines={1}>
        {texto}
      </Text>
    </View>
  );
}
