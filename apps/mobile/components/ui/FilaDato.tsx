/**
 * Un dato con su etiqueta, dentro de una tarjeta de resumen. Dos disposiciones según el
 * largo de la etiqueta:
 *
 * - `columnas`: etiqueta chica a la izquierda y valor a la derecha. Para etiquetas de una
 *   o dos palabras (GUI-7.1.2, el resumen previo a confirmar).
 * - `apilada`: la etiqueta arriba y el valor abajo. Para cuando la etiqueta es la pregunta
 *   completa y no entra al lado del valor (detalle de la solicitud recibida).
 */
import { Text, View } from 'react-native';

export type DisposicionFila = 'columnas' | 'apilada';

interface FilaDatoProps {
  etiqueta: string;
  valor: string;
  disposicion?: DisposicionFila;
  /** La última fila de una tarjeta no lleva separador. */
  ultima?: boolean;
}

export function FilaDato({
  etiqueta,
  valor,
  disposicion = 'columnas',
  ultima = false,
}: FilaDatoProps) {
  const separador = ultima ? '' : 'border-b border-organic-neutral-200';

  if (disposicion === 'apilada') {
    return (
      <View className={`px-3.5 py-3 ${separador}`}>
        <Text className="font-cuerpo-semi text-[11px] text-organic-neutral-600">{etiqueta}</Text>
        <Text className="mt-1 font-cuerpo text-[14px] leading-5 text-organic-neutral-900">
          {valor}
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-row items-start gap-4 px-3.5 py-3 ${separador}`}>
      <Text className="w-[86px] font-cuerpo-semi text-[10.5px] uppercase tracking-[0.6px] text-organic-neutral-500">
        {etiqueta}
      </Text>
      <Text className="flex-1 text-right font-cuerpo text-[13px] leading-[19px] text-organic-neutral-900">
        {valor}
      </Text>
    </View>
  );
}

/** Tarjeta que agrupa filas de datos. Es la superficie sobre la que se apoya `FilaDato`. */
export function TarjetaDatos({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-2xl bg-organic-surface">{children}</View>
  );
}
