const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

export function sanitizarNombrePersona(valor: string): string {
  const soloLetras = valor.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, '');
  return soloLetras.replace(/\S+/g, (palabra) => {
    const primera = palabra.charAt(0).toLocaleUpperCase('es-AR');
    const resto = palabra.slice(1).toLocaleLowerCase('es-AR');
    return `${primera}${resto}`;
  });
}

export function validarNombrePersona(
  valor: string,
  etiqueta: 'nombre' | 'apellido',
): string | undefined {
  const recortado = valor.trim();
  if (!recortado) {
    return `El ${etiqueta} es obligatorio`;
  }
  if (!REGEX_LETRAS.test(recortado)) {
    return `El ${etiqueta} solo puede tener letras`;
  }
  return undefined;
}

export function validarEmail(valor: string): string | undefined {
  const recortado = valor.trim();
  if (!recortado) {
    return 'El correo electrónico es obligatorio';
  }
  if (!REGEX_EMAIL.test(recortado)) {
    return 'Ingresá un correo electrónico válido';
  }
  return undefined;
}

export function validarPassword(valor: string): string | undefined {
  if (!valor) {
    return 'La contraseña es obligatoria';
  }
  if (valor.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  return undefined;
}

export function validarTelefono(valor: string): string | undefined {
  const recortado = valor.trim();
  if (!recortado) {
    return 'El teléfono es obligatorio';
  }

  const digitos = recortado.replace(/\D/g, '');
  if (digitos.length < 8 || digitos.length > 15 || !/^\+?\d+$/.test(recortado)) {
    return 'Ingresá un teléfono válido';
  }

  return undefined;
}

export function sanitizarTelefono(valor: string): string {
  const conMas = valor.trimStart().startsWith('+');
  const digitos = valor.replace(/\D/g, '').slice(0, 15);
  return conMas ? `+${digitos}` : digitos;
}

export function validarConfirmacionPassword(
  password: string,
  confirmacion: string,
): string | undefined {
  if (!confirmacion) {
    return 'Repetí tu contraseña para confirmarla';
  }
  if (confirmacion !== password) {
    return 'Las contraseñas no coinciden';
  }
  return undefined;
}

export function validarUbicacion(valor: string): string | undefined {
  const recortado = valor.trim();
  if (!recortado) {
    return 'El barrio / ciudad es obligatorio';
  }
  if (recortado.length > 80) {
    return 'El barrio / ciudad no puede superar los 80 caracteres';
  }
  return undefined;
}

export function validarCodigoRecuperacion(valor: string): string | undefined {
  const recortado = valor.trim();
  if (!recortado) {
    return 'El código es obligatorio';
  }
  if (!/^\d{6}$/.test(recortado)) {
    return 'El código debe tener 6 dígitos';
  }
  return undefined;
}
