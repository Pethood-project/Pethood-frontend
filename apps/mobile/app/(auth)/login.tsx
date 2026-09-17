import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { PetHoodLogo } from '@/components/PetHoodLogo';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { validarEmail, validarPassword } from '@/lib/validacionRegistro';
import { ApiError } from '@/services/api';
import { login } from '@/services/auth';
import type { Usuario } from '@/types/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { establecerSesion } = useSesion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const setFieldError = (field: 'email' | 'password', message?: string): void => {
    setErrors((prev) => {
      if (prev[field] === message) return prev;
      return { ...prev, [field]: message };
    });
  };

  const handleEmailChange = (value: string): void => {
    setEmail(value);
    setFieldError('email', value.trim() ? validarEmail(value) : undefined);
  };

  const validateForm = (): boolean => {
    const nextErrors = {
      email: validarEmail(email),
      password: validarPassword(password),
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const completarSesion = useCallback(
    async (token: string, usuario: Usuario): Promise<void> => {
      await establecerSesion(token, usuario);
      router.replace('/(tabs)');
    },
    [establecerSesion, router],
  );

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return;

    setLoading(true);
    setFormError(undefined);
    try {
      const respuesta = await login(email.trim(), password);
      await completarSesion(respuesta.token, respuesta.usuario);
    } catch (error) {
      const mensaje =
        error instanceof ApiError
          ? error.mensaje
          : 'No pudimos iniciar sesión. Revisá tu conexión e intentalo de nuevo.';
      setFormError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="relative h-[35%] items-center justify-center">
          <View className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-pethood-orange/10" />
          <PetHoodLogo />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 rounded-t-3xl bg-white px-6 pb-8 pt-8">
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="flex-grow"
            >
              <Text className="mb-1 text-2xl font-bold text-gray-900">¡Hola de nuevo!</Text>
              <Text className="mb-8 text-base text-gray-500">Iniciá sesión para continuar</Text>

              <CustomInput
                label="Correo electrónico"
                placeholder="tu@correo.com"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={() => setFieldError('email', validarEmail(email))}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                required
              />

              <CustomInput
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                rightIcon={
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={PALETA.gris[400]}
                  />
                }
                onRightIconPress={() => setShowPassword((prev) => !prev)}
                required
              />

              <Pressable
                onPress={() => router.push('/recuperar' as Href)}
                accessibilityRole="button"
                className="mb-4 self-end"
              >
                <Text className="text-sm font-semibold text-pethood-orange">
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>

              {formError ? <Text className="mb-3 text-sm text-red-500">{formError}</Text> : null}

              <View className="mt-2">
                <CustomButton title="Iniciar sesión" loading={loading} onPress={handleLogin} />
              </View>

              <View className="my-4 flex-row items-center">
                <View className="h-px flex-1 bg-gray-200" />
                <Text className="mx-3 text-sm text-gray-400">o</Text>
                <View className="h-px flex-1 bg-gray-200" />
              </View>

              <GoogleLoginButton onSuccess={completarSesion} onError={setFormError} />
            </ScrollView>

            <View className="mt-4 items-center">
              <Text className="text-base text-gray-600">
                ¿No tenés cuenta?{' '}
                <Link href="/register" asChild>
                  <Pressable>
                    <Text className="font-semibold text-pethood-orange">Registrate</Text>
                  </Pressable>
                </Link>
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
