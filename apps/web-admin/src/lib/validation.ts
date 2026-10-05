/**
 * Validación de campos del panel — solo UX: la real es del backend.
 * Cada función devuelve el mensaje de error o `null`.
 *
 * ⚠️ LIMITES espeja a mano `backend/src/shared/validation/limits.ts` (repos separados).
 * Si cambia un número allá, cambialo acá. Mensajes en voseo (REQUISITOS.md §5).
 */
export const LIMITES = {
  refugio: {
    nombre: { min: 2, max: 100 },
    direccion: { min: 2, max: 150 },
    descripcion: { max: 1000 },
    // Registro público (POST /auth/registro-refugio): la dirección va estructurada.
    provincia: { min: 2, max: 80 },
    localidad: { min: 2, max: 80 },
    calleAltura: { min: 2, max: 120 },
  },
  persona: { nombre: { min: 1, max: 50 } },
  consultaSoporte: {
    nombreCompleto: { min: 2, max: 100 },
    email: { max: 100 },
    asunto: { min: 5, max: 100 },
    mensaje: { min: 10, max: 1000 },
  },
  faq: { pregunta: { min: 5, max: 200 }, respuesta: { min: 5, max: 2000 }, orden: { min: 1, max: 999 } },
  faqCategoria: { nombre: { min: 2, max: 50 }, descripcion: { max: 200 } },
  catalogo: { nombre: { min: 2, max: 50 }, descripcion: { max: 200 }, secuenciaDias: { min: 1, max: 365 } },
  motivo: { min: 1, max: 500 },
  /** Respuesta del admin al resolver un reporte (spec 008). Solo web-admin: no se espeja en mobile. */
  respuestaReporte: { min: 1, max: 500 },
  busqueda: { max: 100 },
  password: { min: 8 },
  imagen: { tamanioMaximoBytes: 5 * 1024 * 1024, formatos: ["image/jpeg", "image/png", "image/webp"] },
} as const;

const OBLIGATORIO = "Este campo es obligatorio. Completalo para poder continuar.";
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

interface OpcionesTexto {
  etiqueta: string;
  min?: number;
  max: number;
  obligatorio?: boolean;
}

export function validarTexto(valor: string, { etiqueta, min = 0, max, obligatorio = true }: OpcionesTexto): string | null {
  const v = valor.trim();
  if (!v) return obligatorio ? (min >= 2 ? `${etiqueta} debe tener entre ${min} y ${max} caracteres.` : OBLIGATORIO) : null;
  if (v.length < min || v.length > max) {
    return min <= 1 ? `${etiqueta} no puede superar los ${max} caracteres.` : `${etiqueta} debe tener entre ${min} y ${max} caracteres.`;
  }
  return null;
}

export function validarEmail(valor: string, obligatorio = true, max = 100): string | null {
  const v = valor.trim();
  if (!v) return obligatorio ? OBLIGATORIO : null;
  if (v.length > max || !REGEX_EMAIL.test(v)) {
    return 'El correo no es válido. Asegurate de incluir el "@" y un dominio correcto.';
  }
  return null;
}

/** Mismo criterio que el backend: 8 a 15 dígitos, `+` inicial opcional; se toleran espacios, guiones y paréntesis. */
export function validarTelefono(valor: string, obligatorio = true): string | null {
  const v = valor.trim();
  if (!v) return obligatorio ? OBLIGATORIO : null;
  const digitos = v.replace(/\D/g, "");
  if (!/^\+?[\d\s\-()]+$/.test(v) || digitos.length < 8 || digitos.length > 15) return "Ingresá un teléfono válido.";
  return null;
}

export function validarNombrePersona(valor: string, etiqueta: string): string | null {
  const error = validarTexto(valor, { etiqueta, ...LIMITES.persona.nombre });
  if (error) return error;
  return REGEX_LETRAS.test(valor.trim()) ? null : `${etiqueta} solo puede tener letras.`;
}

/** Login: solo obligatoria. La complejidad se exige al registrar, no al ingresar. */
export function validarPasswordIngreso(valor: string): string | null {
  return valor ? null : OBLIGATORIO;
}

/** Registro: mínimo 8, una mayúscula y un número (hint de la landing). */
export function validarPasswordNueva(valor: string): string | null {
  if (!valor) return OBLIGATORIO;
  if (valor.length < LIMITES.password.min || !/[A-ZÁÉÍÓÚÑ]/.test(valor) || !/\d/.test(valor)) {
    return "La contraseña debe tener al menos 8 caracteres, con una mayúscula y un número.";
  }
  return null;
}

export function validarConfirmacion(password: string, confirmacion: string): string | null {
  if (!confirmacion) return OBLIGATORIO;
  return password === confirmacion ? null : "Las contraseñas no coinciden.";
}

export function validarEntero(valor: string, { etiqueta, min, max }: { etiqueta: string; min: number; max: number }): string | null {
  if (!valor.trim()) return OBLIGATORIO;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) return `${etiqueta} debe ser un número entero entre ${min} y ${max}.`;
  return null;
}

export function validarImagen(archivo: File | null | undefined): string | null {
  if (!archivo) return null;
  if (!(LIMITES.imagen.formatos as readonly string[]).includes(archivo.type)) {
    return "El formato no es válido. Subí una imagen en JPG, PNG o WEBP.";
  }
  if (archivo.size > LIMITES.imagen.tamanioMaximoBytes) {
    return "La foto es muy pesada. Subí una imagen en JPG, PNG o WEBP que pese menos de 5 MB.";
  }
  return null;
}

export function validarRangoFechas(desde?: string, hasta?: string): string | null {
  return desde && hasta && desde > hasta ? "La fecha «desde» no puede ser posterior a «hasta»." : null;
}

/** ¿Alguno de los errores tiene mensaje? */
export const hayErrores = (errores: Record<string, string | null>): boolean => Object.values(errores).some(Boolean);
