/**
 * Tarjeta que agrupa campos, con separadores finos entre ellos.
 *
 * Dos paletas: la clásica (tarjeta blanca, grises de Tailwind) que usan los formularios de
 * siempre, y la `organic` del artboard 23 (tarjeta crema `neutral-100`, etiquetas y valores
 * en la rampa `neutral`). La paleta se elige una sola vez en la tarjeta y la leen por
 * contexto sus filas y los campos que tiene adentro (`usePaletaFormulario`), para no tener
 * que repetirla en cada `TextField`.
 */
import { Children, createContext, useContext, type ReactNode } from 'react';
import { View } from 'react-native';

import { PALETA } from '@/constants/theme';

export type PaletaFormulario = 'clasica' | 'organic';

const PaletaContext = createContext<PaletaFormulario>('clasica');

/** Paleta de la tarjeta que envuelve al campo. Fuera de una tarjeta, la clásica. */
export function usePaletaFormulario(): PaletaFormulario {
  return useContext(PaletaContext);
}

/**
 * Sombra del artboard 23 (`0 4px 12px rgba(150,120,80,.1)`). El tono cálido más cercano
 * de la paleta es `neutral-600`.
 */
const SOMBRA_ORGANIC = {
  shadowColor: PALETA.neutral[600],
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 3,
};

export function FormCard({ children, organic }: { children: ReactNode; organic?: boolean }) {
  const paleta: PaletaFormulario = organic ? 'organic' : 'clasica';

  return (
    <PaletaContext.Provider value={paleta}>
      {organic ? (
        // La sombra va afuera y el recorte adentro: en iOS `overflow: hidden` se come la sombra.
        <View style={SOMBRA_ORGANIC} className="rounded-3xl bg-organic-neutral-100">
          <View className="overflow-hidden rounded-3xl">{children}</View>
        </View>
      ) : (
        <View className="overflow-hidden rounded-3xl bg-white shadow-sm">{children}</View>
      )}
    </PaletaContext.Provider>
  );
}

/** Una fila de la tarjeta. La última no lleva separador. */
export function FormCardRow({ children, ultima }: { children: ReactNode; ultima?: boolean }) {
  const organic = usePaletaFormulario() === 'organic';
  const separador = organic ? 'border-b border-organic-neutral-200' : 'border-b border-gray-100';

  return (
    <View className={`${organic ? 'px-[17px]' : 'px-4'} py-3 ${ultima ? '' : separador}`}>
      {children}
    </View>
  );
}

/** Dos campos lado a lado, repartiendo el ancho en partes iguales. */
export function FormCardColumns({ children }: { children: ReactNode }) {
  return (
    <View className="flex-row gap-3">
      {Children.map(children, (hijo) => (
        <View className="flex-1">{hijo}</View>
      ))}
    </View>
  );
}
