/**
 * "Enviar en el chat" (GUI-14, artboard 38): la hoja que sale del botón `+` de la barra de
 * escritura, con lo que se puede mandar en una conversación.
 *
 * - **Foto o video**: abre la cámara o la galería (ver más abajo).
 * - **Compartir una mascota**: abre la lista de lo que se puede compartir; la monta la
 *   pantalla. Como persona, las favoritas que son del contacto; como refugio, las mascotas
 *   publicadas del refugio.
 * - **Ubicación del refugio**: sólo en la vista de refugio. La pantalla pregunta antes de
 *   mandarla.
 *
 * Las dos últimas las pidió el equipo el 2026-10-12, sin HU en REQUISITOS.md (ver la nota del
 * Módulo 5 y `docs/api-chat-sala.md`).
 *
 * "Enviar solicitud" y "Coordinar visita", que estaban en el artboard, **se sacaron** por
 * decisión del equipo (2026-10-12): la solicitud ya se manda desde la ficha de la mascota y
 * deja su tarjeta en la conversación, y la visita se coordina escribiendo.
 *
 * Tocarla no cierra la hoja: la misma tarjeta pasa a preguntar de dónde sale el adjunto, con
 * el mismo estilo, en vez del diálogo del sistema. En web no hay cámara y el selector de
 * archivos se abre directo.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { HojaOpciones, type OpcionHoja } from '@/components/ui/HojaOpciones';

/**
 * De dónde sale el adjunto.
 *
 * La cámara se abre en modo foto o en modo video: son dos flujos distintos del selector
 * nativo y hay que elegir antes de abrirlo, no se puede cambiar una vez adentro. La galería,
 * en cambio, ofrece las dos cosas mezcladas.
 */
export type OrigenAdjunto = 'camara-foto' | 'camara-video' | 'galeria';

interface HojaAdjuntosProps {
  visible: boolean;
  onCerrar: () => void;
  /** Abre el selector del origen elegido. */
  onElegirAdjunto: (origen: OrigenAdjunto) => void;
  /** El perfil activo es el del refugio: cambia qué opciones aparecen. */
  vistaRefugio: boolean;
  /** "Compartir una mascota". */
  onCompartirMascota: () => void;
  /** "Ubicación del refugio" (sólo vista de refugio). */
  onUbicacionRefugio: () => void;
}

export function HojaAdjuntos({
  visible,
  onCerrar,
  onElegirAdjunto,
  vistaRefugio,
  onCompartirMascota,
  onUbicacionRefugio,
}: HojaAdjuntosProps) {
  /** Primero qué mandar; si es un adjunto, de dónde sale. */
  const [paso, setPaso] = useState<'que' | 'origen'>('que');

  // Cada apertura arranca desde el principio.
  useEffect(() => {
    if (visible) setPaso('que');
  }, [visible]);

  const elegirAdjunto = (): void => {
    // En web no hay cámara: el `<input type="file">` ya ofrece foto y video juntos, no hay
    // nada que preguntar.
    if (Platform.OS === 'web') {
      onElegirAdjunto('galeria');
      return;
    }
    setPaso('origen');
  };

  /** En el orden del artboard, y con su texto literal (menos las dos que se sacaron). */
  const queMandar: OpcionHoja[] = [
    { icono: 'camera-outline', etiqueta: 'Foto o video', onPress: elegirAdjunto },
    { icono: 'paw-outline', etiqueta: 'Compartir una mascota', onPress: onCompartirMascota },
    // La ubicación es la del refugio: sólo la manda alguien que esté hablando como refugio.
    ...(vistaRefugio
      ? [
          {
            icono: 'location-outline' as const,
            etiqueta: 'Ubicación del refugio',
            onPress: onUbicacionRefugio,
          },
        ]
      : []),
  ];

  /**
   * Este segundo paso no sale del artboard —el diseño sólo define la lista de arriba— así
   * que se armó con los mismos componentes y tokens. La cámara aparece dos veces porque el
   * selector nativo no deja elegir entre foto y video una vez abierto.
   */
  const deDonde: OpcionHoja[] = [
    { icono: 'camera-outline', etiqueta: 'Sacar una foto', onPress: () => onElegirAdjunto('camara-foto') },
    { icono: 'videocam-outline', etiqueta: 'Grabar un video', onPress: () => onElegirAdjunto('camara-video') },
    { icono: 'images-outline', etiqueta: 'Elegir de la galería', onPress: () => onElegirAdjunto('galeria') },
  ];

  return paso === 'que' ? (
    <HojaOpciones
      visible={visible}
      titulo="Enviar en el chat"
      opciones={queMandar}
      onCerrar={onCerrar}
    />
  ) : (
    <HojaOpciones
      visible={visible}
      titulo="Foto o video"
      subtitulo="¿De dónde lo sacamos?"
      opciones={deDonde}
      onCerrar={onCerrar}
    />
  );
}
