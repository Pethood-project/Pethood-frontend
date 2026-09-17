/**
 * Actualizar contraseña desde el perfil (HU-1.6, misma capacidad que recuperar).
 * Si la cuenta ya tiene contraseña, pide la actual. Si es una cuenta de Google, permite
 * definir una por primera vez.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSesion } from '@/hooks/useSesion';
import { validarConfirmacionPassword, validarPassword } from '@/lib/validacionRegistro';
import { ApiError } from '@/services/api';
import { cambiarPassword, obtenerPerfil } from '@/services/usuarios';

export default function CambiarPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const { token } = useSesion();

  const [tienePassword, setTienePassword] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [errors, setErrors] = useState<{
    actual?: string;
    nueva?: string;
    confirmacion?: string;
  }>({});

  useEffect(() => {
    if (!token) return;
    void obtenerPerfil(token)
      .then((respuesta) => setTienePassword(respuesta.usuario.tienePassword))
      .catch(() => setTienePassword(true))
      .finally(() => setCargando(false));
  }, [token]);

  const guardar = async (): Promise<void> => {
    const next = {
      actual:
        tienePassword && !actual
          ? 'Ingresá tu contraseña actual'
          : undefined,
      nueva: validarPassword(nueva),
      confirmacion: validarConfirmacionPassword(nueva, confirmacion),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || !token) return;

    setGuardando(true);
    setFormError(undefined);
    try {
      await cambiarPassword(token, nueva, tienePassword ? actual : undefined);
      toast.mostrarExito('Tu contraseña se actualizó con éxito');
      router.back();
    } catch (error) {
      const mensaje =
        error instanceof ApiError
          ? error.mensaje
          : 'No pudimos actualizar la contraseña. Intentalo de nuevo.';
      setFormError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 pb-2 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white"
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={22} color={PALETA.gris[700]} />
          </Pressable>
          <Text className="text-2xl font-bold text-pethood-orange">Actualizar contraseña</Text>
        </View>

        {cargando ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={PALETA.pethood.naranja} />
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="px-5 pb-8 pt-4"
            >
              <Text className="mb-6 text-base text-gray-600">
                {tienePassword
                  ? 'Ingresá tu contraseña actual y elegí una nueva.'
                  : 'Definí una contraseña para tu cuenta.'}
              </Text>

              {tienePassword ? (
                <CustomInput
                  label="Contraseña actual"
                  placeholder="Tu contraseña actual"
                  value={actual}
                  onChangeText={setActual}
                  error={errors.actual}
                  secureTextEntry={!showActual}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  rightIcon={
                    <Ionicons
                      name={showActual ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={PALETA.gris[400]}
                    />
                  }
                  onRightIconPress={() => setShowActual((prev) => !prev)}
                  required
                />
              ) : null}

              <CustomInput
                label="Nueva contraseña"
                placeholder="Mínimo 8 caracteres"
                value={nueva}
                onChangeText={setNueva}
                error={errors.nueva}
                secureTextEntry={!showNueva}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                rightIcon={
                  <Ionicons
                    name={showNueva ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={PALETA.gris[400]}
                  />
                }
                onRightIconPress={() => setShowNueva((prev) => !prev)}
                required
              />

              <CustomInput
                label="Repetí la nueva contraseña"
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
                loading={guardando}
                onPress={() => void guardar()}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}
