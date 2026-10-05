/**
 * Geocodifica la dirección estructurada a medida que el usuario la completa, sin guardarla,
 * para mostrar el link de Google Maps y que lo verifique antes de guardar. Debounce para no
 * golpear el geocoder en cada tecla.
 *
 * Lo usan la dirección del perfil (Datos personales, Datos del refugio) y el lugar de un aviso
 * de mascota perdida, donde el tercer campo es una referencia opcional: ahí va
 * `calleAlturaOpcional`.
 */
import { useEffect, useState } from 'react';

import { ApiError } from '@/services/api';
import type { UbicacionPreview } from '@/types/auth';

export interface DireccionEstructurada {
  provincia: string;
  localidad: string;
  calleAltura: string;
}

export function usePreviewUbicacion(
  direccion: DireccionEstructurada,
  preview: (direccion: DireccionEstructurada) => Promise<UbicacionPreview>,
  opciones: { calleAlturaOpcional?: boolean } = {},
): { ubicacion: UbicacionPreview | null; cargando: boolean; error: string | null } {
  const { provincia, localidad, calleAltura } = direccion;
  const completa = Boolean(
    provincia.trim() && localidad.trim() && (opciones.calleAlturaOpcional || calleAltura.trim()),
  );

  const [ubicacion, setUbicacion] = useState<UbicacionPreview | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!completa) {
      setUbicacion(null);
      setError(null);
      setCargando(false);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);

    const timer = setTimeout(() => {
      void preview({ provincia, localidad, calleAltura })
        .then((resultado) => {
          if (!cancelado) setUbicacion(resultado);
        })
        .catch((e) => {
          if (cancelado) return;
          setUbicacion(null);
          setError(
            e instanceof ApiError
              ? e.mensaje
              : 'No pudimos ubicar esa dirección. Revisá los datos.',
          );
        })
        .finally(() => {
          if (!cancelado) setCargando(false);
        });
    }, 600);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [completa, provincia, localidad, calleAltura, preview]);

  return { ubicacion, cargando, error };
}