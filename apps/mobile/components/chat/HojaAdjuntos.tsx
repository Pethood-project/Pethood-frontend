/**
 * "Enviar en el chat" (GUI-14, artboard 38): la hoja que sale del botón `+` de la barra de
 * escritura, con las cinco cosas que se pueden mandar en una conversación.
 *
 * **Sólo "Foto" está implementada.** Las otras cuatro se pintan idénticas pero no responden:
 * dejar el hueco o esconderlas sería peor, porque la lista del diseño se lee como un
 * conjunto. Ninguna tiene HU en REQUISITOS.md todavía (ver `docs/api-chat-sala.md`), así
 * que no se inventa su comportamiento.
 *
 * Tocar "Foto" no cierra la hoja: la misma tarjeta pasa a preguntar de dónde sacarla
 * (cámara o galería), con el mismo estilo, en vez del diálogo del sistema. En web no hay
 * cámara y el selector de archivos se abre directo.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { HojaOpciones, type OpcionHoja } from '@/components/ui/HojaOpciones';

/** De dónde sale una foto. */
export type OrigenFoto = 'camara' | 'galeria';

interface HojaAdjuntosProps {
  visible: boolean;
  onCerrar: () => void;
  /** Abre el selector de fotos del origen elegido. Es la única opción con acción. */
  onElegirFoto: (origen: OrigenFoto) => void;
}

export function HojaAdjuntos({ visible, onCerrar, onElegirFoto }: HojaAdjuntosProps) {
  /** Primero qué mandar; si es una foto, de dónde. */
  const [paso, setPaso] = useState<'que' | 'origen'>('que');

  // Cada apertura arranca desde el principio.
  useEffect(() => {
    if (visible) setPaso('que');
  }, [visible]);

  const elegirFoto = (): void => {
    // En web no hay cámara: no hay nada que preguntar.
    if (Platform.OS === 'web') {
      onElegirFoto('galeria');
      return;
    }
    setPaso('origen');
  };

  /**
   * En el orden del artboard. El diseño dice "Foto o video", pero **el backend sólo acepta
   * jpg, png y webp**: la etiqueta promete algo que el selector ni siquiera ofrece. Se
   * nombra por lo que hace.
   */
  const queMandar: OpcionHoja[] = [
    { icono: 'camera-outline', etiqueta: 'Foto', onPress: elegirFoto },
    { icono: 'paw-outline', etiqueta: 'Compartir una mascota' },
    { icono: 'document-text-outline', etiqueta: 'Enviar solicitud' },
    { icono: 'calendar-outline', etiqueta: 'Coordinar visita' },
    { icono: 'location-outline', etiqueta: 'Ubicación del refugio' },
  ];

  const deDonde: OpcionHoja[] = [
    { icono: 'camera-outline', etiqueta: 'Cámara', onPress: () => onElegirFoto('camara') },
    { icono: 'images-outline', etiqueta: 'Galería', onPress: () => onElegirFoto('galeria') },
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
      titulo="Adjuntar fotos"
      subtitulo="¿De dónde las sacamos?"
      opciones={deDonde}
      onCerrar={onCerrar}
    />
  );
}
