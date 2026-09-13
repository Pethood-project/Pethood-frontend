/**
 * Las tarjetas de la pantalla de Inicio, un juego por vista: la del adoptante y la del
 * refugio. Misma estética, distintas secciones.
 *
 * Acá se enchufan las fotos: cada `imagen` apunta a un archivo de `assets/images/home/`.
 * Para cambiar una foto se pisa el archivo con el mismo nombre, sin tocar este código.
 * Los que están ahora son placeholders de color plano.
 */
import type { Href } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';

import { PALETA } from '@/constants/theme';

export interface AccesoHome {
  titulo: string;
  /** Renglón de abajo, el que lleva la flecha. */
  cta: string;
  imagen: ImageSourcePropType;
  /** Color de la tarjeta. */
  fondo: string;
  /** Color del título, del CTA y de la flecha: tiene que contrastar con `fondo`. */
  texto: string;
  /** Fondo del hueco de la foto, visible mientras carga y si la imagen no cubre. */
  marco: string;
  /** Pastilla sobre la foto, arriba a la derecha. Un contador corto, no una frase. */
  aviso?: string;
  /** Sin destino la tarjeta queda inerte, hasta que exista la pantalla. */
  destino?: Href;
}

const TEXTO_CLARO = PALETA.accent[100];
const TEXTO_OSCURO = PALETA.accent[900];

export const ACCESOS_ADOPTANTE: AccesoHome[] = [
  {
    titulo: 'Adoptar una mascota',
    cta: 'Ver disponibles',
    imagen: require('@/assets/images/home/adopter/adopt.jpg'),
    fondo: PALETA.accent[600],
    texto: TEXTO_CLARO,
    marco: PALETA.accent[300],
    destino: '/(tabs)/adoptar',
  },
  {
    titulo: 'Mascotas perdidas',
    cta: 'Ver reportes',
    imagen: require('@/assets/images/home/adopter/lost.jpg'),
    fondo: PALETA.calido.naranja,
    texto: TEXTO_OSCURO,
    marco: PALETA.accent[300],
  },
  {
    titulo: 'Mis solicitudes',
    cta: 'Ver solicitudes',
    imagen: require('@/assets/images/home/adopter/requests.jpg'),
    fondo: PALETA.calido.amarillo,
    texto: TEXTO_OSCURO,
    marco: PALETA.calido.amarilloClaro,
    // Misma pantalla que la del refugio, abierta del otro lado: el adoptante entra a lo
    // que pidió (HU-7.3) y el refugio a lo que le llegó (HU-7.5).
    destino: { pathname: '/solicitudes', params: { vista: 'enviadas' } },
  },
  {
    titulo: 'Campañas activas',
    cta: 'Ayudar',
    imagen: require('@/assets/images/home/adopter/campaigns.jpg'),
    fondo: PALETA.accent[800],
    texto: TEXTO_CLARO,
    marco: PALETA.accent[300],
  },
];

export const ACCESOS_REFUGIO: AccesoHome[] = [
  {
    titulo: 'Solicitudes de adopción',
    cta: 'Revisar',
    imagen: require('@/assets/images/home/shelter/requests.jpg'),
    fondo: PALETA.accent[600],
    texto: TEXTO_CLARO,
    marco: PALETA.accent[300],
    destino: { pathname: '/solicitudes', params: { vista: 'recibidas' } },
  },
  {
    titulo: 'Gestionar mis mascotas',
    cta: 'Ver todas',
    imagen: require('@/assets/images/home/shelter/pets.jpg'),
    fondo: PALETA.calido.naranja,
    texto: TEXTO_OSCURO,
    marco: PALETA.accent[300],
    destino: '/(tabs)/mis-mascotas',
  },
  {
    titulo: 'Mascotas perdidas',
    cta: 'Ver reportes',
    imagen: require('@/assets/images/home/shelter/lost.jpg'),
    fondo: PALETA.calido.amarillo,
    texto: TEXTO_OSCURO,
    marco: PALETA.calido.amarilloClaro,
  },
  {
    titulo: 'Mis campañas activas',
    cta: 'Ver campañas',
    imagen: require('@/assets/images/home/shelter/campaigns.jpg'),
    fondo: PALETA.accent[800],
    texto: TEXTO_CLARO,
    marco: PALETA.accent[300],
  },
];
