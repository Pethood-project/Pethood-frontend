import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface PetHoodLogoProps {
  size?: 'sm' | 'lg';
}

export function PetHoodLogo({ size = 'lg' }: PetHoodLogoProps) {
  const iconSize = size === 'lg' ? 40 : 28;
  const containerSize = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14';
  const titleSize = size === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <View className="items-center">
      <View
        className={`${containerSize} mb-3 items-center justify-center rounded-2xl bg-pethood-orange`}
      >
        <Ionicons name="paw" size={iconSize} color={PALETA.blanco} />
      </View>
      <Text className={`${titleSize} font-bold text-pethood-orange`}>PetHood</Text>
    </View>
  );
}
