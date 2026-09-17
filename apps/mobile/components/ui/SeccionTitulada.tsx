/** Bloque con encabezado chico en mayúsculas. Es el separador estándar fuera de formularios. */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface SeccionTituladaProps {
  titulo: string;
  children: ReactNode;
  /** Separación respecto de lo anterior; cada pantalla la define según su ritmo. */
  className?: string;
}

export function SeccionTitulada({ titulo, children, className = '' }: SeccionTituladaProps) {
  return (
    <View className={className}>
      <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
        {titulo}
      </Text>
      {children}
    </View>
  );
}
