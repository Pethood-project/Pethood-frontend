import { Ionicons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
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
import { FechaNacimientoPicker } from '@/components/FechaNacimientoPicker';
import { useToast } from '@/components/feedback/Toast';
import { PALETA } from '@/constants/theme';
import {
  enmascararFechaNacimiento,
  fechaADdMmAaaa,
  fechaNacimientoMaxima,
  fechaNacimientoMinima,
  parsearDdMmAaaa,
  validarFechaNacimiento,
} from '@/lib/fechaNacimiento';
import {
  abrirSelectorImagen,
  assetAArchivoLocal,
  validarAssetImagen,
} from '@/lib/elegirImagen';
import type { ArchivoImagenLocal } from '@/lib/formDataImagen';
import {
  sanitizarNombrePersona,
  sanitizarTelefono,
  validarConfirmacionPassword,
  validarEmail,
  validarNombrePersona,
  validarPassword,
  validarTelefono,
} from '@/lib/validacionRegistro';
import { ApiError } from '@/services/api';
import { registro } from '@/services/auth';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
}

interface RegisterErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  password?: string;
  confirmPassword?: string;
  foto?: string;
}

export default function RegisterScreen() {
  const toast = useToast();
  const [form, setForm] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });
  const [foto, setFoto] = useState<ArchivoImagenLocal | undefined>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fechaPicker, setFechaPicker] = useState(fechaNacimientoMaxima);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [errors, setErrors] = useState<RegisterErrors>({});

  const fechaMinima = useMemo(() => fechaNacimientoMinima(), []);
  const fechaMaxima = useMemo(() => fechaNacimientoMaxima(), []);

  const formularioListo = useMemo(
    () =>
      !validarNombrePersona(form.firstName, 'nombre') &&
      !validarNombrePersona(form.lastName, 'apellido') &&
      !validarEmail(form.email) &&
      !validarTelefono(form.phone) &&
      !validarFechaNacimiento(form.birthDate) &&
      !validarPassword(form.password) &&
      !validarConfirmacionPassword(form.password, form.confirmPassword),
    [form],
  );

  const setFieldError = (field: keyof RegisterErrors, message?: string): void => {
    setErrors((prev) => {
      if (prev[field] === message) return prev;
      return { ...prev, [field]: message };
    });
  };

  const handleNombreChange = (value: string): void => {
    const formateado = sanitizarNombrePersona(value);
    setForm((prev) => ({ ...prev, firstName: formateado }));
    setFieldError('firstName', formateado.trim() ? validarNombrePersona(formateado, 'nombre') : undefined);
  };

  const handleApellidoChange = (value: string): void => {
    const formateado = sanitizarNombrePersona(value);
    setForm((prev) => ({ ...prev, lastName: formateado }));
    setFieldError('lastName', formateado.trim() ? validarNombrePersona(formateado, 'apellido') : undefined);
  };

  const handleEmailChange = (value: string): void => {
    setForm((prev) => ({ ...prev, email: value }));
    setFieldError('email', value.trim() ? validarEmail(value) : undefined);
  };

  const handlePhoneChange = (value: string): void => {
    const formateado = sanitizarTelefono(value);
    setForm((prev) => ({ ...prev, phone: formateado }));
    setFieldError('phone', formateado ? validarTelefono(formateado) : undefined);
  };

  const handleBirthDateChange = (value: string): void => {
    const birthDate = enmascararFechaNacimiento(value, form.birthDate);
    setForm((prev) => ({ ...prev, birthDate }));
    setFieldError('birthDate', birthDate ? validarFechaNacimiento(birthDate) : undefined);
  };

  const handlePasswordChange = (value: string): void => {
    setForm((prev) => ({ ...prev, password: value }));
    setErrors((prev) => ({
      ...prev,
      password: value ? validarPassword(value) : undefined,
      confirmPassword: form.confirmPassword
        ? validarConfirmacionPassword(value, form.confirmPassword)
        : prev.confirmPassword,
    }));
  };

  const handleConfirmPasswordChange = (value: string): void => {
    setForm((prev) => ({ ...prev, confirmPassword: value }));
    setFieldError(
      'confirmPassword',
      value ? validarConfirmacionPassword(form.password, value) : undefined,
    );
  };

  const aplicarFecha = (fecha: Date): void => {
    const limitada = fecha > fechaMaxima ? fechaMaxima : fecha < fechaMinima ? fechaMinima : fecha;
    setFechaPicker(limitada);
    setForm((prev) => ({ ...prev, birthDate: fechaADdMmAaaa(limitada) }));
    setFieldError('birthDate', undefined);
  };

  const abrirCalendario = (): void => {
    setFechaPicker(parsearDdMmAaaa(form.birthDate) ?? fechaMaxima);
    setShowDatePicker(true);
  };

  const seleccionarFecha = (fecha: Date): void => {
    aplicarFecha(fecha);
    setShowDatePicker(false);
  };

  const aplicarAsset = (asset: ImagePickerAsset): void => {
    const errorArchivo = validarAssetImagen(asset);
    if (errorArchivo) {
      setErrors((prev) => ({ ...prev, foto: errorArchivo }));
      return;
    }

    setFoto(assetAArchivoLocal(asset));
    setErrors((prev) => ({ ...prev, foto: undefined }));
  };

  const setErrorFoto = (mensaje: string): void => {
    setErrors((prev) => ({ ...prev, foto: mensaje }));
  };

  const abrirSelectorFoto = (): void => {
    abrirSelectorImagen({
      titulo: 'Foto de perfil',
      mensaje: '¿De dónde querés tomarla?',
      onElegida: aplicarAsset,
      onQuitar: foto ? () => setFoto(undefined) : undefined,
      onErrorPermisoGaleria: setErrorFoto,
      onErrorPermisoCamara: setErrorFoto,
    });
  };

  const validateForm = (): boolean => {
    const nextErrors: RegisterErrors = {
      firstName: validarNombrePersona(form.firstName, 'nombre'),
      lastName: validarNombrePersona(form.lastName, 'apellido'),
      email: validarEmail(form.email),
      phone: validarTelefono(form.phone),
      birthDate: validarFechaNacimiento(form.birthDate),
      password: validarPassword(form.password),
      confirmPassword: validarConfirmacionPassword(form.password, form.confirmPassword),
    };

    setErrors((prev) => ({ ...nextErrors, foto: prev.foto }));
    return !Object.values(nextErrors).some(Boolean);
  };

  const explicarQueFalta = (): void => {
    validateForm();
    toast.mostrarAdvertencia('Completá todos los campos obligatorios.');
  };

  const handleRegister = async (): Promise<void> => {
    if (!validateForm()) return;

    setLoading(true);
    setFormError(undefined);
    try {
      await registro(
        {
          nombre: form.firstName.trim(),
          apellido: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          fechaNacimiento: form.birthDate.trim(),
          telefono: form.phone.trim(),
        },
        foto,
      );
      toast.mostrarExito('Tu cuenta fue creada con éxito');
      router.replace('/login');
    } catch (error) {
      const mensaje =
        error instanceof ApiError
          ? error.mensaje
          : 'No pudimos crear tu cuenta. Revisá tu conexión e intentalo de nuevo.';
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
              <Text className="text-2xl font-bold text-pethood-orange">Crear cuenta</Text>
            </View>

            <Text className="mb-2 text-base text-gray-600">
              Completá tus datos para unirte a PetHood
            </Text>
            <Text className="mb-6 text-sm text-gray-500">
              Los campos con <Text className="font-semibold text-pethood-orange">*</Text> son
              obligatorios
            </Text>

            <View className="mb-6 items-center">
              <Pressable
                onPress={abrirSelectorFoto}
                accessibilityRole="button"
                accessibilityLabel="Elegir foto de perfil"
                className="relative"
              >
                {foto ? (
                  <View className="h-28 w-28 overflow-hidden rounded-full">
                    <Image source={{ uri: foto.uri }} className="h-28 w-28" />
                  </View>
                ) : (
                  <View className="h-28 w-28 items-center justify-center rounded-full border border-gray-200 bg-white">
                    <Ionicons name="camera-outline" size={36} color={PALETA.pethood.naranja} />
                  </View>
                )}
                <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-pethood-orange">
                  <Ionicons name={foto ? 'pencil' : 'add'} size={16} color={PALETA.blanco} />
                </View>
              </Pressable>
              <Text className="mt-2 text-sm text-gray-500">Foto de perfil (opcional)</Text>
              {foto && Platform.OS === 'web' ? (
                <Pressable
                  onPress={() => setFoto(undefined)}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar foto de perfil"
                  className="mt-1"
                >
                  <Text className="text-sm font-semibold text-red-500">Quitar foto</Text>
                </Pressable>
              ) : null}
              {errors.foto ? (
                <Text className="mt-1.5 text-sm text-red-500">{errors.foto}</Text>
              ) : null}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <CustomInput
                  label="Nombre"
                  placeholder="Tu nombre"
                  value={form.firstName}
                  onChangeText={handleNombreChange}
                  onBlur={() =>
                    setFieldError('firstName', validarNombrePersona(form.firstName, 'nombre'))
                  }
                  error={errors.firstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="given-name"
                  textContentType="givenName"
                  maxLength={50}
                  required
                />
              </View>
              <View className="flex-1">
                <CustomInput
                  label="Apellido"
                  placeholder="Tu apellido"
                  value={form.lastName}
                  onChangeText={handleApellidoChange}
                  onBlur={() =>
                    setFieldError('lastName', validarNombrePersona(form.lastName, 'apellido'))
                  }
                  error={errors.lastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="family-name"
                  textContentType="familyName"
                  maxLength={50}
                  required
                />
              </View>
            </View>

            <CustomInput
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={form.email}
              onChangeText={handleEmailChange}
              onBlur={() => setFieldError('email', validarEmail(form.email))}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              required
            />

            <CustomInput
              label="Teléfono"
              placeholder="Ej. 2615123456"
              value={form.phone}
              onChangeText={handlePhoneChange}
              onBlur={() => setFieldError('phone', validarTelefono(form.phone))}
              error={errors.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={16}
              required
            />

            <CustomInput
              label="Fecha de nacimiento"
              placeholder="DD/MM/AAAA"
              value={form.birthDate}
              onChangeText={handleBirthDateChange}
              onBlur={() => setFieldError('birthDate', validarFechaNacimiento(form.birthDate))}
              error={errors.birthDate}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={10}
              autoCorrect={false}
              rightIcon={<Ionicons name="calendar-outline" size={22} color={PALETA.pethood.naranja} />}
              onRightIconPress={abrirCalendario}
              required
            />

            <CustomInput
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChangeText={handlePasswordChange}
              onBlur={() => setFieldError('password', validarPassword(form.password))}
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
              value={form.confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              onBlur={() =>
                setFieldError(
                  'confirmPassword',
                  validarConfirmacionPassword(form.password, form.confirmPassword),
                )
              }
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              rightIcon={
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={PALETA.gris[400]}
                />
              }
              onRightIconPress={() => setShowConfirmPassword((prev) => !prev)}
              required
            />

            {formError ? <Text className="mb-3 text-sm text-red-500">{formError}</Text> : null}

            <View className="mt-4">
              <CustomButton
                title="Registrarme"
                loading={loading}
                disabled={!formularioListo}
                onPress={handleRegister}
                onPressDeshabilitado={explicarQueFalta}
              />
            </View>

            <View className="mt-6 items-center">
              <Text className="text-base text-gray-600">
                ¿Ya tenés cuenta?{' '}
                <Link href="/login" asChild>
                  <Pressable>
                    <Text className="font-semibold text-pethood-orange">Iniciá sesión</Text>
                  </Pressable>
                </Link>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <FechaNacimientoPicker
        visible={showDatePicker}
        value={fechaPicker}
        minimumDate={fechaMinima}
        maximumDate={fechaMaxima}
        onSelect={seleccionarFecha}
        onCancel={() => setShowDatePicker(false)}
      />
    </View>
  );
}
