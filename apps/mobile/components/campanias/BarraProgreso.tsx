/** Barra de progreso de una campaña. `porcentaje` ya viene topeado en 100 desde el backend. */
import { View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface BarraProgresoProps {
  porcentaje: number;
  /** Sobre fondo naranja (tarjetas de Inicio): pista más oscura y relleno claro. */
  clara?: boolean;
}

export function BarraProgreso({ porcentaje, clara = false }: BarraProgresoProps) {
  const ancho = Math.max(0, Math.min(100, porcentaje));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: ancho }}
      className="h-2.5 w-full overflow-hidden rounded-full"
      style={{ backgroundColor: clara ? PALETA.accent[700] : PALETA.neutral[200] }}
    >
      <View
        className="h-full rounded-full"
        style={{
          width: `${ancho}%`,
          backgroundColor: clara ? PALETA.accent[100] : PALETA.accent[600],
        }}
      />
    </View>
  );
}
