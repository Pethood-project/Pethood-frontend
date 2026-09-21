/**
 * Límites de longitud y rango de los campos del dominio, en un solo lugar.
 *
 * ⚠️ ESPEJO MANUAL de `pethood-backend/src/shared/validation/limits.ts`.
 * Son repos separados: si cambiás un número acá, cambialo allá. Si divergen, el input
 * corta a una longitud y el server valida otra.
 */
export const LIMITES = {
  mascota: {
    nombre: { min: 2, max: 25 },
    peso: { min: 0.1, max: 999.9, decimales: 1 },
    /** Opcional. No confundir con la descripción de la publicación, que va aparte y es ≤50. */
    descripcion: { max: 2000 },
  },

  publicacion: {
    descripcion: { max: 50 },
    requisito: { max: 25 },
    ubicacion: { max: 50 },
    personalidad: { max: 25 },
    vacunas: { max: 200 },
    imagenes: { max: 5 },
  },

  usuario: {
    nombre: { min: 1, max: 50 },
    apellido: { min: 1, max: 50 },
    ubicacion: { max: 80 },
  },

  consultaSoporte: {
    nombreCompleto: { min: 2, max: 100 },
    email: { max: 100 },
    asunto: { min: 5, max: 100 },
    mensaje: { min: 10, max: 1000 },
  },

  fecha: { anioMinimo: 1900 },

  imagen: {
    tamanioMaximoBytes: 5 * 1024 * 1024,
    formatos: ["image/jpeg", "image/png", "image/webp"],
  },

  /** Comprobante de historia clínica: además de imagen, admite pdf (REQUISITOS.md §4). */
  documento: {
    tamanioMaximoBytes: 5 * 1024 * 1024,
    formatos: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },

  /** Sin spec de diseño que fije el número exacto todavía — valores conservadores. */
  historiaClinica: {
    titulo: { min: 1, max: 100 },
    descripcion: { min: 1, max: 1000 },
  },

  solicitud: {
    /** El comentario del refugio al aceptar/rechazar (HU-7.4). */
    comentario: { max: 500 },
    /**
     * Paso 3 de GUI-7.1.1. El mínimo de 20 es de esta HU: la columna es NOT NULL y un
     * "quiero adoptarlo" de tres palabras no le sirve al refugio para decidir.
     */
    motivacion: { min: 20, max: 500 },
  },

  /** Paso 2 de GUI-7.1.1: las respuestas sobre el hogar del solicitante. */
  hogar: {
    direccion: { min: 5, max: 150 },
    /** Solo se pide cuando respondió que sí tiene otras mascotas. */
    detalleMascotas: { max: 200 },
    descripcion: { max: 300 },
  },
  /**
   * Seguimiento post-adopción (spec 011). La HU-9.1 pide "descripción larga" sin fijar el
   * número; 1000 es el mismo techo que la descripción de historia clínica, que es el campo
   * largo más parecido del dominio. Pasado el límite el server responde
   * "Limite de caracteres superado" (texto literal de la HU).
   */
  seguimiento: {
    descripcion: { min: 1, max: 1000 },
  },

  /**
   * Mensaje de chat (HU-5.2). El techo lo fijó el backend, que rechaza con `VALIDACION`
   * pasado ese largo; acá corta el input antes para que el usuario no escriba de más.
   *
   * `min: 0` a propósito: un mensaje puede ser SÓLO foto. Que venga texto o imagen es una
   * regla del par de campos y la valida el backend, no el largo de uno solo.
   */
  mensaje: {
    contenido: { min: 0, max: 1000 },
    /** Cuántas fotos admite un mensaje. El backend rechaza a partir de la sexta. */
    fotos: { maximo: 5 },
    /** Tamaño de página del historial. El backend acepta hasta 50. */
    pagina: { porDefecto: 30, maximo: 50 },
  },
} as const;
