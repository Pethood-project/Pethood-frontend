import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useToast } from '@/components/feedback/Toast';
import { PALETA } from '@/constants/theme';
import {
  validarCodigoRecuperacion,
  validarConfirmacionPassword,
  validarPassword,
} from '@/lib/validacionRegistro';
import { ApiError } from '@/services/api';
import { resetearPassword } from '@/services/auth';

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
      password: validarPassword(password),
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
              <Text className="text-2xl font-bold text-pethood-orange">Nueva contraseña</Text>
            </View>

            <Text className="mb-6 text-base text-gray-600">
              Ingresá el código de 6 dígitos y elegí una contraseña nueva.
            </Text>

            {params.codigo ? (
              <View className="mb-4 rounded-2xl bg-orange-50 px-4 py-3">
                <Text className="text-sm text-orange-800">
                  Código de prueba: <Text className="font-semibold">{params.codigo}</Text>
                </Text>
              </View>
            ) : null}

            <CustomInput
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
                  size={22}
                  color={PALETA.gris[400]}
                />
              }
              onRightIconPress={() => setShowPassword((prev) => !prev)}
              required
            />

            <CustomInput
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
                  size={22}
                  color={PALETA.gris[400]}
                />
              }
              onRightIconPress={() => setShowConfirmacion((prev) => !prev)}
              required
            />

            {formError ? <Text className="mb-3 text-sm text-red-500">{formError}</Text> : null}

            <CustomButton
              title="Guardar contraseña"
              loading={loading}
              onPress={() => void handleGuardar()}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
