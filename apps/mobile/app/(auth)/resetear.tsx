import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton, FORMA_BOTON_ORGANIC_PRINCIPAL } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { useToast } from '@/components/feedback/Toast';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import { PALETA } from '@/constants/theme';
import {
  validarCodigoRecuperacion,
  validarConfirmacionPassword,
} from '@/lib/validacionRegistro';
import { ApiError } from '@/services/api';
import { resetearPassword } from '@/services/auth';
import { validarPasswordNueva } from '@/shared/validation/password';

/**
 * Recuperar contraseña, paso 2: código de 6 dígitos + contraseña nueva. Mismo estilo que
 * `recuperar.tsx` (paleta Organic de las pantallas de acceso).
 */
export default function ResetearScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ email?: string; codigo?: string }>();

  const [codigo, setCodigo] = useState(params.codigo ?? '');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [errors, setErrors] = useState<{
    codigo?: string;
    password?: string;
    confirmacion?: string;
  }>({});

  const email = typeof params.email === 'string' ? params.email : '';

  const handleGuardar = async (): Promise<void> => {
    const nextErrors = {
      codigo: validarCodigoRecuperacion(codigo),
      password: validarPasswordNueva(password) ?? undefined,
      confirmacion: validarConfirmacionPassword(password, confirmacion),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || !email) return;

    setLoading(true);
    setFormError(undefined);
    try {
      await resetearPassword(email, codigo.trim(), password);
      toast.mostrarExito('Tu contraseña se actualizó. Iniciá sesión con la nueva.');
      router.replace('/login');
    } catch (err) {
      const mensaje =
        err instanceof ApiError
          ? err.mensaje
          : 'No pudimos actualizar la contraseña. Intentalo de nuevo.';
      setFormError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <EncabezadoPantalla barra titulo="Nueva contraseña" onVolver={() => router.back()} />

        <FormularioConTeclado
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow px-6 pb-8 pt-8"
        >
          <View className="mb-5 h-20 w-20 items-center justify-center self-center rounded-full bg-organic-accent-100">
            <Ionicons name="key-outline" size={36} color={PALETA.accent[600]} />
          </View>

          <Text className="mb-1 text-center font-titulo text-[26px] leading-[32px] text-organic-neutral-900">
            Elegí tu nueva contraseña
          </Text>
          <Text className="mb-7 text-center font-cuerpo text-[17px] leading-[24px] text-organic-neutral-600">
            Ingresá el código de 6 dígitos que te enviamos
            {email ? (
              <>
                {' a '}
                <Text className="font-cuerpo-semi text-organic-neutral-800">{email}</Text>
              </>
            ) : null}{' '}
            y elegí una contraseña nueva.
          </Text>

          {params.codigo ? (
            <View className="mb-5 rounded-2xl border border-organic-accent-200 bg-organic-accent-100 px-4 py-3">
              <Text className="font-cuerpo text-[15px] text-organic-accent-800">
                Código de prueba:{' '}
                <Text className="font-cuerpo-bold tracking-widest">{params.codigo}</Text>
              </Text>
            </View>
          ) : null}

          <CustomInput
            organic
            label="Código"
            placeholder="000000"
            value={codigo}
            onChangeText={(value) => {
              setCodigo(value.replace(/\D/g, '').slice(0, 6));
              setErrors((prev) => ({ ...prev, codigo: undefined }));
            }}
            error={errors.codigo}
            keyboardType="number-pad"
            maxLength={6}
            required
          />

          <CustomInput
            organic
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
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

          <CustomInput
            organic
            label="Repetí tu contraseña"
            placeholder="Volvé a escribirla"
            value={confirmacion}
            onChangeText={setConfirmacion}
            error={errors.confirmacion}
            secureTextEntry={!showConfirmacion}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            rightIcon={
              <Ionicons
                name={showConfirmacion ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={PALETA.neutral[500]}
              />
            }
            onRightIconPress={() => setShowConfirmacion((prev) => !prev)}
            required
          />

          {formError ? (
            <Text className="mb-3 font-cuerpo text-[15px] text-red-500">{formError}</Text>
          ) : null}

          <View className="mt-2">
            <CustomButton
              title="Guardar contraseña"
              variant="acento"
              grande
              style={FORMA_BOTON_ORGANIC_PRINCIPAL}
              loading={loading}
              onPress={() => void handleGuardar()}
            />
          </View>
        </FormularioConTeclado>
      </SafeAreaView>
    </View>
  );
}
