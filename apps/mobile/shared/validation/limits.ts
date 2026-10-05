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
    /** «Sobre <nombre>» en la ficha: texto libre. Antes ≤50 (REQUISITOS.md), el equipo lo subió. */
    descripcion: { max: 200 },
    /** Cada requisito se muestra como medallita en la ficha: 20 para que entre en una línea. */
    requisito: { max: 20 },
    ubicacion: { max: 50 },
    personalidad: { max: 25 },
    imagenes: { max: 5 },
    /** Texto libre de la barra de búsqueda de Adoptar (Módulo 11, HU-11.4). */
    busqueda: { max: 100 },
    /** Radio del filtro por cercanía, en kilómetros (HU-11.3). */
    radioKm: { min: 1, max: 500 },
  },

  usuario: {
    nombre: { min: 1, max: 50 },
    apellido: { min: 1, max: 50 },
    /** Dirección estructurada para geocodificar (node-geocoder). Opcionales. */
    provincia: { max: 80 },
    localidad: { max: 80 },
    calleAltura: { max: 120 },
    /** Link de Google Maps que el usuario puede pegar/corregir a mano. */
    mapaUrl: { max: 500 },
  },

  /** Perfil del refugio (spec 017). */
  refugio: {
    nombre: { min: 2, max: 100 },
    descripcion: { max: 1000 },
    /** Dirección estructurada para geocodificar (node-geocoder). Opcionales. */
    provincia: { max: 80 },
    localidad: { max: 80 },
    calleAltura: { max: 120 },
    /** Link de Google Maps que el miembro del refugio puede pegar/corregir a mano. */
    mapaUrl: { max: 500 },
  },

  /** Reporte de moderación (spec 008, HU-3.1 a HU-3.3). Texto libre. Espejo del backend. */
  reporte: {
    motivo: { min: 5, max: 500 },
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

  /**
   * Video adjunto de un mensaje de chat. Es el único lugar de la app que acepta video.
   *
   * **⚠️ EXCEPCIÓN EXPLÍCITA a los 5 MB de REQUISITOS.md §4**, que sigue valiendo para
   * imágenes y documentos (incluidas las fotos de este mismo chat). Un teléfono graba 1080p
   * a unos 13 Mbps: en 5 MB entran **3 segundos**, que no sirven para nada. 15 s a 1080p
   * pesan ~25 MB, así que 30 deja margen sin habilitar un 4K de 15 s (~84 MB).
   *
   * ⚠️ `duracionMaximaSegundos` **sólo lo hace cumplir el cliente**: medir la duración en el
   * servidor necesitaría `ffmpeg`. Acá no es "validar por UX" como el resto — es la única
   * barrera que existe, así que no se saca.
   */
  video: {
    tamanioMaximoBytes: 30 * 1024 * 1024,
    duracionMaximaSegundos: 15,
    formatos: ["video/mp4", "video/quicktime", "video/webm"],
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
    /** Pregunta que el refugio le escribe a mano al adoptante (spec 011 §6.11). */
    pregunta: { min: 5, max: 200 },
  },

  /**
   * Reseña (Módulo 10, HU-10.1). La puntuación es obligatoria de 1 a 5; el comentario es
   * opcional. Espejo de `pethood-backend/src/shared/validation/limits.ts`.
   */
  resena: {
    puntuacion: { min: 1, max: 5 },
    comentario: { max: 500 },
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
    /**
     * Un video por mensaje y sin mezclar con fotos. El backend rechaza lo contrario con
     * `DEMASIADOS_ARCHIVOS` y `ADJUNTOS_MEZCLADOS`; acá se corta antes para no hacer subir
     * un archivo que va a volver rebotado.
     */
    videos: { maximo: 1, mezclaConFotos: false },
    /** Tamaño de página del historial. El backend acepta hasta 50. */
    pagina: { porDefecto: 30, maximo: 50 },
  },

  /**
   * Búsqueda de conversaciones por nombre de contacto (HU-5.3).
   *
   * **Sin contraparte en el backend, y no la necesita:** el listado no pagina, así que el
   * término nunca viaja — se filtra en memoria sobre la lista ya cargada. No es una
   * divergencia del espejo, es un límite que sólo existe del lado del cliente.
   *
   * Es un tope de **longitud**, no de juego de caracteres: la HU dice "alfanuméricos", pero
   * los nombres reales llevan espacios, tildes y puntos ("Refugio Patitas", "Ana Pérez"),
   * y un buscador que los rechaza no encuentra a nadie. Un carácter raro simplemente no
   * coincide con nada, que es el resultado correcto.
   */
  busquedaChat: { min: 1, max: 50 },

  /**
   * Aviso de mascota perdida o encontrada (spec 020, HU-13.1). El nombre es obligatorio sólo
   * en un aviso "Perdido"; eso lo decide el backend según el estado, no el largo.
   */
  animalPerdido: {
    nombre: { max: 30 },
    descripcion: { max: 300 },
    /**
     * Dónde se perdió o se encontró, como la dirección del perfil: provincia y localidad del
     * catálogo, y una referencia libre y opcional.
     */
    provincia: { max: 80 },
    localidad: { max: 80 },
    referencia: { max: 120 },
    /** Fotos por aviso: la primera es la portada de la tarjeta, el resto va en la galería. */
    imagenes: { max: 5 },
    /** Link de Google Maps que se pega a mano para corregir el lugar. */
    mapaUrl: { max: 500 },
    /** Cuántas provincias se pueden elegir a la vez en el filtro del portal: todas. */
    filtroProvincias: { maximo: 24 },
    /** Cuántas localidades se pueden elegir a la vez en el filtro del portal. */
    filtroLocalidades: { maximo: 20 },
    /** Radio del filtro por cercanía, en km. Mismo techo que el de publicaciones. */
    radioKm: { min: 1, max: 500 },
    /** Tamaño de página del portal (paginación por cursor). El backend acepta hasta 50. */
    pagina: { porDefecto: 20, maximo: 50 },
  },

  /** Bandeja de notificaciones (spec 004). */
  notificacion: {
    /** Tamaño de página de la bandeja (paginación por cursor). El backend acepta hasta 50. */
    pagina: { porDefecto: 20, maximo: 50 },
  },
} as const;
