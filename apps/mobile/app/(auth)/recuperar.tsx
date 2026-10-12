import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton, FORMA_BOTON_ORGANIC_PRINCIPAL } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import { PALETA } from '@/constants/theme';
import { validarEmail } from '@/lib/validacionRegistro';
import { ApiError } from '@/services/api';
import { solicitarRecuperacion } from '@/services/auth';

/**
 * Recuperar contraseña, paso 1: pide el correo y manda el código de 6 dígitos. Sigue la
 * paleta Organic del resto de las pantallas de acceso (misma barra superior que el registro,
 * inputs y botón principal del login). El paso 2 es `resetear.tsx`.
 */
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
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <EncabezadoPantalla barra titulo="Recuperar acceso" onVolver={() => router.back()} />

        <FormularioConTeclado
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow px-6 pb-8 pt-8"
        >
          <View className="mb-5 h-20 w-20 items-center justify-center self-center rounded-full bg-organic-accent-100">
            <Ionicons name="lock-closed-outline" size={36} color={PALETA.accent[600]} />
          </View>

          <Text className="mb-1 text-center font-titulo text-[26px] leading-[32px] text-organic-neutral-900">
            ¿Olvidaste tu contraseña?
          </Text>
          <Text className="mb-7 text-center font-cuerpo text-[17px] leading-[24px] text-organic-neutral-600">
            Ingresá el correo de tu cuenta y te enviamos un código de 6 dígitos para crear una
            nueva contraseña.
          </Text>

          <CustomInput
            organic
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

          {formError ? (
            <Text className="mb-3 font-cuerpo text-[15px] text-red-500">{formError}</Text>
          ) : null}

          <View className="mt-2">
            <CustomButton
              title="Enviar código"
              variant="acento"
              grande
              style={FORMA_BOTON_ORGANIC_PRINCIPAL}
              loading={loading}
              onPress={() => void handleEnviar()}
            />
          </View>

          <View className="mt-6 items-center">
            <Text className="font-cuerpo text-[16px] text-organic-neutral-600">
              ¿Te acordaste?{' '}
              <Pressable onPress={() => router.back()} accessibilityRole="button">
                <Text className="font-cuerpo-semi text-[16px] text-organic-accent-700">
                  Iniciá sesión
                </Text>
              </Pressable>
            </Text>
          </View>
        </FormularioConTeclado>
      </SafeAreaView>
    </View>
  );
}
