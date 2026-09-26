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

import { CustomButton, FORMA_BOTON_ORGANIC_PRINCIPAL } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { PetHoodLogo } from '@/components/PetHoodLogo';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { validarEmail, validarPassword } from '@/lib/validacionRegistro';
import { ApiError } from '@/services/api';
import { login } from '@/services/auth';
import type { Usuario } from '@/types/auth';

/**
 * Sombra de la hoja de abajo (artboard 01: `0 -8px 24px rgba(150,120,80,.10)`). El tono
 * cálido más cercano de la paleta es `neutral-600`.
 */
const SOMBRA_HOJA = {
  shadowColor: PALETA.neutral[600],
  shadowOffset: { width: 0, height: -8 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 8,
};

/**
 * GUI-01 Iniciar sesión — HU-1.2. Diseño del artboard 01 (paleta Organic): logo arriba y
 * el formulario en una hoja crema, con letra y botones grandes.
 */
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
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-[35%] items-center justify-center">
          <PetHoodLogo />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View
            style={SOMBRA_HOJA}
            className="flex-1 rounded-t-[36px] bg-organic-neutral-100 px-6 pb-8 pt-8"
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="flex-grow"
            >
              <Text className="mb-1 font-titulo text-[28px] leading-[34px] text-organic-neutral-900">
                ¡Hola de nuevo!
              </Text>
              <Text className="mb-7 font-cuerpo text-[17px] text-organic-neutral-600">
                Iniciá sesión para continuar
              </Text>

              <CustomInput
                organic
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
                organic
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
                    size={24}
                    color={PALETA.neutral[500]}
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
                <Text className="font-cuerpo-semi text-[15px] text-organic-accent-700">
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>

              {formError ? (
                <Text className="mb-3 font-cuerpo text-[15px] text-red-500">{formError}</Text>
              ) : null}

              <View className="mt-2">
                <CustomButton
                  title="Iniciar sesión"
                  variant="acento"
                  grande
                  style={FORMA_BOTON_ORGANIC_PRINCIPAL}
                  loading={loading}
                  onPress={handleLogin}
                />
              </View>

              <View className="my-5 flex-row items-center">
                <View className="h-px flex-1 bg-organic-neutral-300" />
                <Text className="mx-3 font-cuerpo text-[15px] text-organic-neutral-500">o</Text>
                <View className="h-px flex-1 bg-organic-neutral-300" />
              </View>

              <GoogleLoginButton onSuccess={completarSesion} onError={setFormError} />
            </ScrollView>

            <View className="mt-5 items-center">
              <Text className="font-cuerpo text-[16px] text-organic-neutral-600">
                ¿No tenés cuenta?{' '}
                <Link href="/register" asChild>
                  <Pressable>
                    <Text className="font-cuerpo-semi text-[16px] text-organic-accent-700">
                      Registrate
                    </Text>
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
