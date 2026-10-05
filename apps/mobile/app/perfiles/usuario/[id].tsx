/** Perfil público de una persona (spec 023, GUI-26). */
import { useLocalSearchParams } from 'expo-router';

import { PerfilPublico } from '@/components/perfiles/PerfilPublico';

export default function PerfilUsuarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PerfilPublico tipo="usuario" id={Number(Array.isArray(id) ? id[0] : id)} />;
}
