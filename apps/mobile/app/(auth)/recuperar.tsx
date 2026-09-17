import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { PALETA } from '@/constants/theme';
import { validarEmail } from '@/lib/validacionRegistro';
import { ApiError } from '@/services/api';
import { solicitarRecuperacion } from '@/services/auth';

export default function RecuperarScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleEnviar = async (): Promise<void> => {
    const emailError = validarEmail(email);
    setError(emailError);
    if (emailError) return;

    setLoading(true);
    setFormError(undefined);
    try {
      const respuesta = await solicitarRecuperacion(email.trim());
      router.push({
        pathname: '/resetear',
        params: {
          email: email.trim().toLowerCase(),
          ...(respuesta.codigo ? { codigo: respuesta.codigo } : {}),
        },
      } as unknown as Href);
    } catch (err) {
      const mensaje =
        err instanceof ApiError
          ? err.mensaje
          : 'No pudimos enviar el código. Revisá tu conexión e intentalo de nuevo.';
      setFormError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="flex-grow px-6 pb-8 pt-4"
          >
            <View className="mb-6 flex-row items-center">
              <Pressable
                onPress={() => router.back()}
                className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-white"
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <Ionicons name="arrow-back" size={22} color={PALETA.gris[700]} />
              </Pressable>
              <Text className="text-2xl font-bold text-pethood-orange">Recuperar contraseña</Text>
            </View>

            <Text className="mb-6 text-base text-gray-600">
              Ingresá el correo de tu cuenta y te enviamos un código de 6 dígitos para crear una
              nueva contraseña.
            </Text>

            <CustomInput
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError(value.trim() ? validarEmail(value) : undefined);
              }}
              onBlur={() => setError(validarEmail(email))}
              error={error}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              required
            />

            {formError ? <Text className="mb-3 text-sm text-red-500">{formError}</Text> : null}

            <CustomButton title="Enviar código" loading={loading} onPress={() => void handleEnviar()} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
