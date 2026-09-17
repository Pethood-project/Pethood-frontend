/**
 * Único archivo de colores de la app. Todo hex vive acá, con nombre; nada se tipea suelto
 * en una pantalla o componente.
 *
 * Es CommonJS y no TypeScript a propósito: `tailwind.config.js` lo carga con `require`
 * (lo lee Node, sin pasar por Babel) y las pantallas lo importan como módulo normal. Así
 * las clases (`bg-organic-accent-600`) y los valores que hay que pasar en JS (color de un
 * ícono, fondo de un `Switch`) salen del mismo lugar y no pueden divergir.
 */

/** Sistema Organic: el rediseño de Inicio y la barra inferior. Rampas tonales — el paso N de cada una tiene el mismo valor visual. */
const ORGANIC = {
  /** Fondo de pantalla. Es el fondo de toda la app, no solo el de Inicio. */
  bg: '#f5ead8',
  /** Superficie clara: barra inferior, tarjetas sobre el fondo. */
  surface: '#f9f4ed',

  accent: {
    100: '#fff2eb',
    200: '#ffe1d0',
    300: '#ffc6a5',
    400: '#f6a06b',
    500: '#d67f48',
    600: '#b2622d',
    700: '#8c491a',
    800: '#643312',
    900: '#402310',
  },

  /**
   * Dos tintes cálidos que no salen de la rampa `accent`: los usa la grilla de Inicio para
   * que las tarjetas se distingan entre sí sin repetir tono.
   */
  calido: {
    naranja: '#de955b',
    amarillo: '#f3cc6a',
    /** Hueco de la foto en la tarjeta amarilla, que necesita un fondo más claro. */
    amarilloClaro: '#fbe6af',
  },

  neutral: {
    100: '#f9f4ed',
    200: '#eee7db',
    300: '#dcd3c4',
    400: '#c0b6a5',
    500: '#a19786',
    600: '#82796a',
    700: '#645c50',
    800: '#474238',
    900: '#2e2b25',
  },
};

/** Paleta "clásica": el naranja de marca, ya en uso en el resto de la app (login, formularios, listados). */
const PETHOOD = {
  naranja: '#FF9D5C',
  naranjaOscuro: '#FF8A3D', // estado presionado
  /** Checkmark de un chip de selección múltiple activo: un naranja más intenso que el de marca. */
  naranjaIntensa: '#E0742E',
  /** Fondo de los campos de formulario. */
  input: '#FAFAFA',
  /** Fondo de galerías de fotos mientras cargan (distinto del fondo de pantalla). */
  beigeOscuro: '#F5F1E8',
};

/** Escala de grises neutros — coincide con gray-100..700 de Tailwind — para íconos y texto secundario fuera del rediseño Organic. */
const GRIS = {
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
};

/**
 * Grises con tinte cálido, en unos pocos íconos de Adoptar, Favoritos y Publicaciones. No
 * son una rampa pareja: son los cuatro tonos puntuales que ya estaban en uso, solo que
 * ahora con nombre.
 */
const GRIS_CALIDO = {
  400: '#9a9286',
  500: '#8a8170',
  700: '#6b6456',
  900: '#3f3a31',
};

const ESTADO = {
  error: '#DC2626',
  advertencia: '#D97706',
  exito: '#059669',
  /**
   * Verde de "En línea" en la cabecera de la conversación (GUI-14). Es el único verde del
   * diseño y no sale de ninguna rampa: viene tal cual del artboard. No se reusa `exito`
   * porque no comunica lo mismo: uno es el resultado de una acción, el otro un estado de
   * presencia, y el día que cambie el verde de los toasts no tiene por qué cambiar éste.
   */
  enLinea: '#5BA45B',
};

const BLANCO = '#FFFFFF';
const NEGRO = '#000000';

/** Botón redondo central de la barra inferior. */
const TAB_CENTRAL = {
  amarillo: '#E8C04A',
  amarilloPresionado: '#C9A233',
};

/**
 * Plantilla de Expo sin migrar. Solo la usa `app/+not-found.tsx` (la 404 nativa) a través
 * de `components/Themed.tsx` — no es parte del diseño de PetHood.
 */
const LEGADO = {
  tintClaro: '#2f95dc',
  tintOscuro: '#2e78b7',
  grisClaro: '#cccccc',
};

const PALETA = {
  ...ORGANIC,
  pethood: PETHOOD,
  gris: GRIS,
  grisCalido: GRIS_CALIDO,
  estado: ESTADO,
  blanco: BLANCO,
  negro: NEGRO,
  tabCentral: TAB_CENTRAL,
  legado: LEGADO,
};

/**
 * Familias tipográficas ya cargadas por `useFonts` en el layout raíz.
 *
 * Hay una familia por peso porque en Android `fontWeight` no combina con una fuente
 * custom: pedir negrita sobre `Figtree_400Regular` no engorda nada. Sobre estas clases no
 * usar `font-bold` ni `font-semibold`, elegir la familia del peso que se quiere.
 */
const FUENTES = {
  titulo: 'Caprasimo_400Regular',
  cuerpo: 'Figtree_400Regular',
  cuerpoSemi: 'Figtree_600SemiBold',
  cuerpoBold: 'Figtree_700Bold',
};

module.exports = { PALETA, FUENTES };
