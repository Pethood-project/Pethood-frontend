import { Redirect } from 'expo-router';

import { useSesion } from '@/hooks/useSesion';

export default function Index() {
  const { autenticado, cargando } = useSesion();

  if (cargando) return null;
  return <Redirect href={autenticado ? '/(tabs)' : '/login'} />;
}
