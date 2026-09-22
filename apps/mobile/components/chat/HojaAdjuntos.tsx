/**
 * "Enviar en el chat" (GUI-14, artboard 38): la hoja que sale del botón `+` de la barra de
 * escritura, con las cinco cosas que se pueden mandar en una conversación.
 *
 * **Sólo "Foto o video" está implementada.** Las otras cuatro se pintan idénticas pero no
 * responden: dejar el hueco o esconderlas sería peor, porque la lista del diseño se lee como
 * un conjunto. Ninguna tiene HU en REQUISITOS.md todavía (ver `docs/api-chat-sala.md`), así
 * que no se inventa su comportamiento.
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
  /** Abre el selector del origen elegido. Es la única opción con acción. */
  onElegirAdjunto: (origen: OrigenAdjunto) => void;
}

export function HojaAdjuntos({ visible, onCerrar, onElegirAdjunto }: HojaAdjuntosProps) {
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

  /** En el orden del artboard, y con su texto literal. */
  const queMandar: OpcionHoja[] = [
    { icono: 'camera-outline', etiqueta: 'Foto o video', onPress: elegirAdjunto },
    { icono: 'paw-outline', etiqueta: 'Compartir una mascota' },
    { icono: 'document-text-outline', etiqueta: 'Enviar solicitud' },
    { icono: 'calendar-outline', etiqueta: 'Coordinar visita' },
    { icono: 'location-outline', etiqueta: 'Ubicación del refugio' },
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
