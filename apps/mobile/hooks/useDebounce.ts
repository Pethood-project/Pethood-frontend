/**
 * Demora la propagación de un valor que cambia rápido, para que el trabajo caro se haga una
 * sola vez cuando el usuario frena y no en cada tecla.
 *
 * Genérico a propósito: hoy lo usa el buscador de conversaciones (HU-5.3), pero no sabe nada
 * de chats ni de texto.
 */
import { useEffect, useState } from 'react';

/**
 * Devuelve `valor` recién cuando pasaron `retrasoMs` sin que vuelva a cambiar. Mientras
 * tanto devuelve el último valor que sí se estabilizó.
 *
 * `sinEspera` es la vía rápida: si devuelve `true` para el valor actual, ese valor sale **en
 * el mismo render**, sin timer de por medio. Existe porque deshacer una acción no se debe
 * sentir tan lento como hacerla: esperar a que venza el retraso para que vuelva a aparecer
 * todo lo que ya estaba se lee como si la pantalla se hubiera colgado.
 *
 * El valor de la vía rápida se devuelve directo (no vía estado) para que no quede un frame
 * intermedio con el valor viejo: si no, al vaciar el campo se vería un parpadeo de la lista
 * todavía filtrada.
 *
 * `sinEspera` se puede pasar en línea sin memorizar: al efecto entra el booleano que
 * devuelve, no la función, así que una identidad nueva en cada render no reinicia el timer.
 */
export function useDebounce<T>(valor: T, retrasoMs: number, sinEspera?: (valor: T) => boolean): T {
  const inmediato = sinEspera?.(valor) ?? false;
  const [estabilizado, setEstabilizado] = useState(valor);

  useEffect(() => {
    if (inmediato) {
      setEstabilizado(valor);
      return;
    }

    const id = setTimeout(() => setEstabilizado(valor), retrasoMs);
    // Cada cambio de `valor` limpia el timer anterior: lo que se demora es la pausa en la
    // escritura, no cada tecla por separado.
    return () => clearTimeout(id);
  }, [valor, retrasoMs, inmediato]);

  return inmediato ? valor : estabilizado;
}
