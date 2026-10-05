/**
 * Botón "Reportar" que abre el `ReporteModal` del objeto indicado. Rojo suave (`red-50` con
 * borde y texto de `PALETA.estado.error`): llama la atención sin competir con el CTA naranja.
 *
 * Dos formas: botón con texto (fichas) o solo la bandera (`soloIcono`, para filas densas
 * como las reseñas).
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { ReporteModal } from '@/components/reportes/ReporteModal';
import { PALETA } from '@/constants/theme';
import type { TipoReporte } from '@/services/reportes';

interface BotonReportarProps {
  tipo: TipoReporte;
  objetoId: number;
  /** Texto del botón; con `soloIcono` queda como etiqueta de accesibilidad. */
  etiqueta?: string;
  soloIcono?: boolean;
  className?: string;
}

export function BotonReportar({
  tipo,
  objetoId,
  etiqueta = 'Reportar',
  soloIcono = false,
  className = '',
}: BotonReportarProps) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        onPress={() => setAbierto(true)}
        hitSlop={8}
        className={`flex-row items-center justify-center self-start border border-red-200 bg-red-50 active:opacity-70 ${
          soloIcono ? 'h-9 w-9 rounded-full' : 'h-11 gap-2 rounded-full px-4'
        } ${className}`}
      >
        <Ionicons name="flag-outline" size={soloIcono ? 17 : 18} color={PALETA.estado.error} />
        {soloIcono ? null : (
          <Text className="font-cuerpo-semi text-[14px]" style={{ color: PALETA.estado.error }}>
            {etiqueta}
          </Text>
        )}
      </Pressable>
      <ReporteModal objeto={abierto ? { tipo, objetoId } : null} onCerrar={() => setAbierto(false)} />
    </>
  );
}
