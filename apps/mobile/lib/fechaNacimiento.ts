const REGEX_DMY = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function enmascararFechaNacimiento(valor: string, valorAnterior: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 8);
  const borrando = valor.length < valorAnterior.length;
  const dia = digits.slice(0, 2);
  const mes = digits.slice(2, 4);
  const anio = digits.slice(4, 8);

  if (digits.length === 0) return '';
  if (digits.length < 2) return dia;

  if (digits.length === 2) {
    if (borrando && !valor.includes('/')) return dia;
    return `${dia}/`;
  }

  if (digits.length < 4) return `${dia}/${mes}`;

  if (digits.length === 4) {
    const tieneBarraAnio = valor.endsWith('/') || valor.split('/').length >= 3;
    if (borrando && !tieneBarraAnio) return `${dia}/${mes}`;
    return `${dia}/${mes}/`;
  }

  return `${dia}/${mes}/${anio}`;
}

export function fechaADdMmAaaa(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const aaaa = String(fecha.getFullYear());
  return `${dd}/${mm}/${aaaa}`;
}

export function parsearDdMmAaaa(valor: string): Date | undefined {
  const match = REGEX_DMY.exec(valor.trim());
  if (!match) return undefined;

  return fechaLocalValida(Number(match[3]), Number(match[2]), Number(match[1]));
}

export function fechaAIsoLocal(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const aaaa = String(fecha.getFullYear());
  return `${aaaa}-${mm}-${dd}`;
}

export function parsearIsoLocal(valor: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
  if (!match) return undefined;

  return fechaLocalValida(Number(match[1]), Number(match[2]), Number(match[3]));
}

function fechaLocalValida(anio: number, mes: number, dia: number): Date | undefined {
  const fecha = new Date(anio, mes - 1, dia);

  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return undefined;
  }

  return fecha;
}

export function fechaNacimientoMinima(): Date {
  return new Date(1900, 0, 1);
}

export function fechaNacimientoMaxima(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  return d;
}

export function validarFechaNacimiento(valor: string): string | undefined {
  const recortado = valor.trim();
  if (!recortado) {
    return 'La fecha de nacimiento es obligatoria';
  }

  if (!REGEX_DMY.test(recortado)) {
    return 'Usá el formato DD/MM/AAAA';
  }

  const fecha = parsearDdMmAaaa(recortado);
  if (!fecha) {
    return 'La fecha de nacimiento no es válida';
  }

  if (fecha.getFullYear() < 1900) {
    return 'La fecha de nacimiento no puede ser anterior a 1900';
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fecha.getTime() >= hoy.getTime()) {
    return 'La fecha de nacimiento debe ser anterior a hoy';
  }

  return undefined;
}
