/** Saludo por franja horaria del encabezado de Inicio. */

export function saludoSegunHora(fecha: Date = new Date()): string {
  const hora = fecha.getHours();
  if (hora < 13) return 'Buenos días';
  if (hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Agrega el nombre de quien está logueado; sin nombre, devuelve solo el saludo. */
export function saludoPara(nombre?: string | null, fecha?: Date): string {
  const saludo = saludoSegunHora(fecha);
  const limpio = nombre?.trim();
  return limpio ? `${saludo}, ${limpio}` : saludo;
}
