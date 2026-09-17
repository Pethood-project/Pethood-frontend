/** Tarjeta blanca que agrupa campos, con separadores finos entre ellos. */
import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

export function FormCard({ children }: { children: ReactNode }) {
  return <View className="overflow-hidden rounded-3xl bg-white shadow-sm">{children}</View>;
}

/** Una fila de la tarjeta. La última no lleva separador. */
export function FormCardRow({ children, ultima }: { children: ReactNode; ultima?: boolean }) {
  return (
    <View className={`px-4 py-3 ${ultima ? '' : 'border-b border-gray-100'}`}>{children}</View>
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
