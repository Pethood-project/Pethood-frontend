/**
 * Logo de PetHood con el nombre debajo (artboard 01): la imagen del logo y "PetHood" en
 * Caprasimo, color `accent-600`.
 */
import { Image, Text, View } from 'react-native';

interface PetHoodLogoProps {
  size?: 'sm' | 'lg';
}

const LOGO = require('@/assets/images/logo.png');

export function PetHoodLogo({ size = 'lg' }: PetHoodLogoProps) {
  // 118px del artboard, ×1,33.
  const lado = size === 'lg' ? 150 : 96;
  const titulo = size === 'lg' ? 'text-[32px] leading-[38px]' : 'text-2xl';

  return (
    <View className="items-center">
      <Image
        source={LOGO}
        style={{ width: lado, height: lado }}
        resizeMode="contain"
        accessibilityLabel="Logo de PetHood"
      />
      <Text className={`mt-3 font-titulo tracking-wide text-organic-accent-600 ${titulo}`}>
        PetHood
      </Text>
    </View>
  );
}
