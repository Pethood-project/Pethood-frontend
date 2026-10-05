/** Perfil público de un refugio (spec 023, GUI-26 «Perfil Público Refugio»). */
import { useLocalSearchParams } from 'expo-router';

import { PerfilPublico } from '@/components/perfiles/PerfilPublico';

export default function PerfilRefugioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PerfilPublico tipo="refugio" id={Number(Array.isArray(id) ? id[0] : id)} />;
}
