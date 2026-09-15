/**
 * GUI-15 Editar Perfil — HU-1.4 y HU-1.5 (completar foto + datos).
 * Volver con cambios sin guardar pide confirmación.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useNavigation, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { useToast } from '@/components/feedback/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { TextField } from '@/components/ui/TextField';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import {
  abrirSelectorImagen,
  assetAArchivoLocal,
  validarAssetImagen,
} from '@/lib/elegirImagen';
import type { ArchivoImagenLocal } from '@/lib/formDataImagen';
import {
  sanitizarNombrePersona,
  sanitizarTelefono,
  validarEmail,
  validarNombrePersona,
  validarTelefono,
  validarUbicacion,
} from '@/lib/validacionRegistro';
import { ApiError, urlAbsoluta } from '@/services/api';
import { actualizarPerfil, obtenerPerfil } from '@/services/usuarios';

interface Formulario {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  ubicacion: string;
}

interface Errores {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  ubicacion?: string;
}

function vacio(): Formulario {
  return { nombre: '', apellido: '', email: '', telefono: '', ubicacion: '' };
}

export default function EditarPerfilScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const toast = useToast();
  const { token, actualizarUsuario } = useSesion();

  const [form, setForm] = useState<Formulario>(vacio);
  const [inicial, setInicial] = useState<Formulario>(vacio);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoNueva, setFotoNueva] = useState<ArchivoImagenLocal | undefined>();
  const [errors, setErrors] = useState<Errores>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const permitirSalir = useRef(false);

  const [confirmarSalida, setConfirmarSalida] = useState(false);

  const hayCambios =
    JSON.stringify(form) !== JSON.stringify(inicial) || Boolean(fotoNueva);

  const formularioValido = useMemo(
    () =>
      !validarNombrePersona(form.nombre, 'nombre') &&
      !validarNombrePersona(form.apellido, 'apellido') &&
      !validarEmail(form.email) &&
      !validarTelefono(form.telefono) &&
      !validarUbicacion(form.ubicacion),
    [form],
  );

  useEffect(() => {
    if (!token) return;
    void obtenerPerfil(token)
      .then((respuesta) => {
        const siguiente: Formulario = {
          nombre: respuesta.usuario.nombre,
          apellido: respuesta.usuario.apellido,
          email: respuesta.usuario.email,
          telefono: respuesta.usuario.telefono ?? '',
          ubicacion: respuesta.usuario.ubicacion ?? '',
        };
        setForm(siguiente);
        setInicial(siguiente);
        setFotoUrl(urlAbsoluta(respuesta.usuario.imagenUrl));
      })
      .catch((error) => {
        const mensaje =
          error instanceof ApiError
            ? error.mensaje
            : 'No pudimos cargar tu perfil. Revisá tu conexión.';
        toast.mostrarError(mensaje);
      })
      .finally(() => setCargando(false));
  }, [token, toast]);

  // En web `Alert.alert` no muestra los botones: el `preventDefault` dejaba el volver
  // colgado. El diálogo propio sí funciona, y cubre también el atrás del sistema.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (evento) => {
      if (permitirSalir.current || !hayCambios) return;
      // Ir a cambiar contraseña no descarta el formulario: solo se pide confirmación al volver.
      if (evento.data.action.type !== 'GO_BACK' && evento.data.action.type !== 'POP') return;

      evento.preventDefault();
      setConfirmarSalida(true);
    });

    return unsubscribe;
  }, [hayCambios, navigation]);

  const salirSinGuardar = (): void => {
    permitirSalir.current = true;
    setConfirmarSalida(false);
    router.back();
  };

  const volver = (): void => {
    if (hayCambios) {
      setConfirmarSalida(true);
      return;
    }
    router.back();
  };

  const setCampo = useCallback((campo: keyof Formulario, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const setFieldError = (campo: keyof Errores, mensaje?: string): void => {
    setErrors((prev) => {
      if (prev[campo] === mensaje) return prev;
      return { ...prev, [campo]: mensaje };
    });
  };

  const handleNombreChange = (value: string): void => {
    const formateado = sanitizarNombrePersona(value);
    setCampo('nombre', formateado);
    setFieldError('nombre', formateado.trim() ? validarNombrePersona(formateado, 'nombre') : undefined);
  };

  const handleApellidoChange = (value: string): void => {
    const formateado = sanitizarNombrePersona(value);
    setCampo('apellido', formateado);
    setFieldError(
      'apellido',
      formateado.trim() ? validarNombrePersona(formateado, 'apellido') : undefined,
    );
  };

  const handleEmailChange = (value: string): void => {
    setCampo('email', value);
    setFieldError('email', value.trim() ? validarEmail(value) : undefined);
  };

  const handleTelefonoChange = (value: string): void => {
    const formateado = sanitizarTelefono(value);
    setCampo('telefono', formateado);
    setFieldError('telefono', formateado ? validarTelefono(formateado) : undefined);
  };

  const handleUbicacionChange = (value: string): void => {
    setCampo('ubicacion', value);
    setFieldError('ubicacion', value.trim() ? validarUbicacion(value) : undefined);
  };

  const aplicarAsset = (asset: ImagePickerAsset): void => {
    const errorArchivo = validarAssetImagen(asset);
    if (errorArchivo) {
      toast.mostrarError(errorArchivo);
      return;
    }
    setFotoNueva(assetAArchivoLocal(asset));
  };

  const abrirSelectorFoto = (): void => {
    abrirSelectorImagen({
      titulo: 'Foto de perfil',
      mensaje: '¿De dónde querés tomarla?',
      onElegida: aplicarAsset,
      onErrorPermisoGaleria: (mensaje) => Alert.alert('Necesitamos tus fotos', mensaje),
      onErrorPermisoCamara: (mensaje) => Alert.alert('Necesitamos la cámara', mensaje),
    });
  };

  const validar = (): boolean => {
    const next: Errores = {
      nombre: validarNombrePersona(form.nombre, 'nombre'),
      apellido: validarNombrePersona(form.apellido, 'apellido'),
      email: validarEmail(form.email),
      telefono: validarTelefono(form.telefono),
      ubicacion: validarUbicacion(form.ubicacion),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const explicarQueFalta = (): void => {
    if (!hayCambios) {
      toast.mostrarAdvertencia('Todavía no cambiaste nada.');
      return;
    }

    validar();
    toast.mostrarAdvertencia('Revisá los campos marcados en rojo.');
  };

  const guardar = async (): Promise<void> => {
    if (!hayCambios || !validar() || !token) return;

    setGuardando(true);
    setFormError(undefined);
    try {
      const respuesta = await actualizarPerfil(
        token,
        {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          ubicacion: form.ubicacion.trim(),
        },
        fotoNueva,
      );
      await actualizarUsuario(respuesta.usuario);
      permitirSalir.current = true;
      toast.mostrarExito('Tus datos se guardaron con éxito');
      router.back();
    } catch (error) {
      const mensaje =
        error instanceof ApiError
          ? error.mensaje
          : 'No pudimos guardar los cambios. Revisá tu conexión e intentalo de nuevo.';
      setFormError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const fotoVisible = fotoNueva?.uri ?? fotoUrl;

  return (
    <View className="flex-1 bg-pethood-beige">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 pb-2 pt-2">
          <Pressable
            onPress={volver}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white"
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={22} color={PALETA.gris[700]} />
          </Pressable>
          <Text className="text-2xl font-bold text-pethood-orange">Editar Perfil</Text>
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
              <View className="mb-6 items-center">
                <Pressable
                  onPress={abrirSelectorFoto}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar foto de perfil"
                  className="relative"
                >
                  <Avatar
                    uri={fotoVisible}
                    nombre={form.nombre}
                    apellido={form.apellido}
                    tamanio={112}
                  />
                  <View className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full bg-pethood-orange">
                    <Ionicons name="camera" size={16} color={PALETA.blanco} />
                  </View>
                </Pressable>
              </View>

              <FormCard>
                <FormCardRow>
                  <TextField
                    label="Nombre"
                    obligatorio
                    value={form.nombre}
                    onChangeText={handleNombreChange}
                    onBlur={() =>
                      setFieldError('nombre', validarNombrePersona(form.nombre, 'nombre'))
                    }
                    error={errors.nombre}
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="given-name"
                    textContentType="givenName"
                    maxLength={50}
                  />
                </FormCardRow>
                <FormCardRow>
                  <TextField
                    label="Apellido"
                    obligatorio
                    value={form.apellido}
                    onChangeText={handleApellidoChange}
                    onBlur={() =>
                      setFieldError('apellido', validarNombrePersona(form.apellido, 'apellido'))
                    }
                    error={errors.apellido}
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="family-name"
                    textContentType="familyName"
                    maxLength={50}
                  />
                </FormCardRow>
                <FormCardRow>
                  <TextField
                    label="Correo"
                    obligatorio
                    value={form.email}
                    onChangeText={handleEmailChange}
                    onBlur={() => setFieldError('email', validarEmail(form.email))}
                    error={errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                </FormCardRow>
                <FormCardRow>
                  <TextField
                    label="Teléfono"
                    obligatorio
                    value={form.telefono}
                    onChangeText={handleTelefonoChange}
                    onBlur={() => setFieldError('telefono', validarTelefono(form.telefono))}
                    error={errors.telefono}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    maxLength={16}
                  />
                </FormCardRow>
                <FormCardRow ultima>
                  <TextField
                    label="Barrio / ciudad"
                    obligatorio
                    value={form.ubicacion}
                    onChangeText={handleUbicacionChange}
                    onBlur={() => setFieldError('ubicacion', validarUbicacion(form.ubicacion))}
                    error={errors.ubicacion}
                    autoCapitalize="words"
                    maxLength={80}
                  />
                </FormCardRow>
              </FormCard>

              <Pressable
                onPress={() => router.push('/perfil/password' as Href)}
                className="mt-5 items-center"
              >
                <Text className="text-sm font-semibold text-pethood-orange">
                  Cambiar contraseña
                </Text>
              </Pressable>

              {formError ? (
                <Text className="mt-3 text-center text-sm text-red-500">{formError}</Text>
              ) : null}

              <View className="mt-6">
                <CustomButton
                  title="Guardar cambios"
                  loading={guardando}
                  disabled={!formularioValido || !hayCambios}
                  onPress={() => void guardar()}
                  onPressDeshabilitado={explicarQueFalta}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmarSalida}
        tono="advertencia"
        titulo="¿Descartar los cambios?"
        mensaje="Si salís ahora vas a perder lo que editaste."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        onConfirmar={salirSinGuardar}
        onCerrar={() => setConfirmarSalida(false)}
      />
    </View>
  );
}
