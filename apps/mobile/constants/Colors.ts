import { PALETA } from './theme';

const tintColorLight = PALETA.legado.tintClaro;
const tintColorDark = PALETA.blanco;

export default {
  light: {
    text: PALETA.negro,
    background: PALETA.blanco,
    tint: tintColorLight,
    tabIconDefault: PALETA.legado.grisClaro,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: PALETA.blanco,
    background: PALETA.negro,
    tint: tintColorDark,
    tabIconDefault: PALETA.legado.grisClaro,
    tabIconSelected: tintColorDark,
  },
};
