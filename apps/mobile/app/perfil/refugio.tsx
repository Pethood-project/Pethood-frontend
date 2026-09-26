/**
 * Datos del refugio (spec 017, artboard 23) — el equivalente de "Datos personales" para la
 * organización. Se entra desde el ícono del encabezado de Mi Perfil, en la vista de refugio.
 *
 * Funciona igual que `/perfil/editar`: los campos se muestran ya cargados, con el lapicito
 * en los que se pueden editar, y recién cuando se toca alguno aparecen "Cancelar" y
 * "Guardar cambios". No tiene acciones de cuenta: cerrar sesión o dar de baja son de la
 * persona, no del refugio.
 *
 * Quién puede editar lo decide el backend (`puedeEditar`). Hoy es cualquier miembro; el
 * permiso por rol dentro del refugio está pendiente (DEUDA_TECNICA.md). Sin permiso, la
 * pantalla queda de solo lectura: sin lápices, sin cámara y sin botones.
 *
 * El horario del artboard no está: `Refugio` no tiene ese campo (MODELO_DATOS.md).
 */
import { Ionicons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import {
  CustomButton,
  FORMA_BOTON_ORGANIC,
  FORMA_BOTON_ORGANIC_PRINCIPAL,
} from '@/components/CustomButton';
import { useToast } from '@/components/feedback/Toast';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormCard, FormCardRow } from '@/components/ui/FormCard';
import { LogoRefugio } from '@/components/ui/LogoRefugio';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import {
  abrirSelectorImagen,
  assetAArchivoLocal,
  validarAssetImagen,
} from '@/lib/elegirImagen';
import type { ArchivoImagenLocal } from '@/lib/formDataImagen';
import { sanitizarTelefono, validarEmail, validarTelefono } from '@/lib/validacionRegistro';
import { ApiError, urlAbsoluta } from '@/services/api';
import { actualizarPerfilRefugio, obtenerPerfilRefugio } from '@/services/refugio';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';
import type { PerfilRefugio } from '@/types/refugio';

interface Formulario {
  nombre: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
}

type Errores = Partial<Record<keyof Formulario, string>>;

function vacio(): Formulario {
  return { nombre: '', descripcion: '', direccion: '', telefono: '', email: '' };
}

function aFormulario(refugio: PerfilRefugio): Formulario {
  return {
    nombre: refugio.nombre,
    descripcion: refugio.descripcion ?? '',
    direccion: refugio.direccion,
    telefono: refugio.telefono ?? '',
    email: refugio.email ?? '',
  };
}

/** Un error por campo, o `undefined`. Teléfono y correo son opcionales: vacíos no fallan. */
function validarCampo(campo: keyof Formulario, valor: string): string | undefined {
  switch (campo) {
    case 'nombre':
      return (
        validarTexto(valor, { ...LIMITES.refugio.nombre, etiqueta: 'El nombre del refugio' }) ??
        undefined
      );
    case 'direccion':
      return (
        validarTexto(valor, { ...LIMITES.refugio.direccion, etiqueta: 'La dirección' }) ??
        undefined
      );
    case 'descripcion':
      return (
        validarTexto(valor, {
          max: LIMITES.refugio.descripcion.max,
          etiqueta: 'La descripción',
          obligatorio: false,
        }) ?? undefined
      );
    case 'telefono':
      return valor.trim() ? validarTelefono(valor) : undefined;
    case 'email':
      return valor.trim() ? validarEmail(valor) : undefined;
  }
}

const CAMPOS: (keyof Formulario)[] = ['nombre', 'descripcion', 'direccion', 'telefono', 'email'];

export default function DatosRefugioScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const toast = useToast();
  const { token } = useSesion();

  const [form, setForm] = useState<Formulario>(vacio);
  const [inicial, setInicial] = useState<Formulario>(vacio);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoNueva, setFotoNueva] = useState<ArchivoImagenLocal | undefined>();
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [errors, setErrors] = useState<Errores>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const permitirSalir = useRef(false);

  const hayCambios = JSON.stringify(form) !== JSON.stringify(inicial) || Boolean(fotoNueva);

  const formularioValido = useMemo(
    () => CAMPOS.every((campo) => !validarCampo(campo, form[campo])),
    [form],
  );

  useEffect(() => {
    if (!token) return;
    void obtenerPerfilRefugio(token)
      .then(({ refugio }) => {
        const siguiente = aFormulario(refugio);
        setForm(siguiente);
        setInicial(siguiente);
        setFotoUrl(urlAbsoluta(refugio.imagenUrl));
        setPuedeEditar(refugio.puedeEditar);
      })
      .catch((error) => {
        const mensaje =
          error instanceof ApiError
            ? error.mensaje
            : 'No pudimos cargar los datos del refugio. Revisá tu conexión.';
        toast.mostrarError(mensaje);
      })
      .finally(() => setCargando(false));
  }, [token, toast]);

  // Mismo criterio que `/perfil/editar`: el diálogo propio cubre también el atrás del sistema.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (evento) => {
      if (permitirSalir.current || !hayCambios) return;
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

  const cancelarEdicion = (): void => {
    setForm(inicial);
    setFotoNueva(undefined);
    setErrors({});
    setFormError(undefined);
  };

  const cambiar = (campo: keyof Formulario, valor: string): void => {
    const formateado = campo === 'telefono' ? sanitizarTelefono(valor) : valor;
    setForm((prev) => ({ ...prev, [campo]: formateado }));
    // Mientras escribe solo se marca lo que ya está mal; un obligatorio vacío espera al blur.
    const error = formateado.trim() ? validarCampo(campo, formateado) : undefined;
    setErrors((prev) => (prev[campo] === error ? prev : { ...prev, [campo]: error }));
  };

  const alSalirDelCampo = (campo: keyof Formulario): void => {
    const error = validarCampo(campo, form[campo]);
    setErrors((prev) => (prev[campo] === error ? prev : { ...prev, [campo]: error }));
  };

  const validar = (): boolean => {
    const siguiente: Errores = {};
    for (const campo of CAMPOS) siguiente[campo] = validarCampo(campo, form[campo]);
    setErrors(siguiente);
    return !Object.values(siguiente).some(Boolean);
  };

  const explicarQueFalta = (): void => {
    validar();
    toast.mostrarAdvertencia('Revisá los campos marcados en rojo.');
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
      titulo: 'Foto del refugio',
      mensaje: '¿De dónde querés tomarla?',
      onElegida: aplicarAsset,
      onErrorPermisoGaleria: (mensaje) => Alert.alert('Necesitamos tus fotos', mensaje),
      onErrorPermisoCamara: (mensaje) => Alert.alert('Necesitamos la cámara', mensaje),
    });
  };

  const guardar = async (): Promise<void> => {
    if (!hayCambios || !validar() || !token) return;

    setGuardando(true);
    setFormError(undefined);
    try {
      // El nombre del refugio que guarda la sesión (encabezado de Chats) se refresca solo: Mi
      // Perfil vuelve a pedir `/usuarios/me` al recuperar el foco.
      await actualizarPerfilRefugio(
        token,
        {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          direccion: form.direccion.trim(),
          telefono: form.telefono.trim(),
          email: form.email.trim(),
        },
        fotoNueva,
      );
      permitirSalir.current = true;
      toast.mostrarExito('Los datos del refugio se guardaron con éxito');
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
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center gap-3 border-b border-organic-neutral-300 bg-organic-neutral-100 px-[19px] py-[13px]">
          <BotonCircular icono="arrow-back" etiqueta="Volver" variante="neutro" onPress={volver} />
          <Text className="font-titulo text-[22px] leading-[26px] text-organic-accent-600">
            Datos del refugio
          </Text>
        </View>

        {cargando ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={PALETA.accent[600]} />
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
                  onPress={puedeEditar ? abrirSelectorFoto : undefined}
                  disabled={!puedeEditar}
                  accessibilityRole={puedeEditar ? 'button' : 'image'}
                  accessibilityLabel={puedeEditar ? 'Cambiar foto del refugio' : 'Foto del refugio'}
                  className="relative"
                >
                  <LogoRefugio uri={fotoVisible} tamanio={100} />
                  {puedeEditar ? (
                    <View className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-organic-accent-600">
                      <Ionicons name="camera" size={16} color={PALETA.blanco} />
                    </View>
                  ) : null}
                </Pressable>
              </View>

              <FormCard organic>
                <FormCardRow>
                  <TextField
                    label="Nombre del refugio"
                    obligatorio
                    lapiz={puedeEditar}
                    editable={puedeEditar}
                    grande
                    value={form.nombre}
                    onChangeText={(valor) => cambiar('nombre', valor)}
                    onBlur={() => alSalirDelCampo('nombre')}
                    error={errors.nombre}
                    autoCapitalize="words"
                    maxLength={LIMITES.refugio.nombre.max}
                  />
                </FormCardRow>
                <FormCardRow>
                  <TextAreaField
                    label="Descripción"
                    lapiz={puedeEditar}
                    editable={puedeEditar}
                    grande
                    maximo={LIMITES.refugio.descripcion.max}
                    value={form.descripcion}
                    onChangeText={(valor) => cambiar('descripcion', valor)}
                    onBlur={() => alSalirDelCampo('descripcion')}
                    error={errors.descripcion}
                    placeholder="Contá quiénes son y a qué se dedican"
                  />
                </FormCardRow>
                <FormCardRow>
                  <TextField
                    label="Dirección"
                    obligatorio
                    lapiz={puedeEditar}
                    editable={puedeEditar}
                    grande
                    value={form.direccion}
                    onChangeText={(valor) => cambiar('direccion', valor)}
                    onBlur={() => alSalirDelCampo('direccion')}
                    error={errors.direccion}
                    autoCapitalize="words"
                    textContentType="fullStreetAddress"
                    maxLength={LIMITES.refugio.direccion.max}
                  />
                </FormCardRow>
                <FormCardRow>
                  <TextField
                    label="Teléfono"
                    lapiz={puedeEditar}
                    editable={puedeEditar}
                    grande
                    value={form.telefono}
                    onChangeText={(valor) => cambiar('telefono', valor)}
                    onBlur={() => alSalirDelCampo('telefono')}
                    error={errors.telefono}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    maxLength={16}
                  />
                </FormCardRow>
                <FormCardRow ultima>
                  <TextField
                    label="Correo"
                    lapiz={puedeEditar}
                    editable={puedeEditar}
                    grande
                    value={form.email}
                    onChangeText={(valor) => cambiar('email', valor)}
                    onBlur={() => alSalirDelCampo('email')}
                    error={errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                  />
                </FormCardRow>
              </FormCard>

              {formError ? (
                <Text className="mt-3 text-center text-sm text-red-500">{formError}</Text>
              ) : null}

              {hayCambios ? (
                <View className="mt-6 flex-row gap-3">
                  <View className="flex-1">
                    <CustomButton
                      title="Cancelar"
                      variant="acento-borde"
                      style={FORMA_BOTON_ORGANIC}
                      onPress={cancelarEdicion}
                    />
                  </View>
                  <View className="flex-1">
                    <CustomButton
                      title="Guardar cambios"
                      variant="acento"
                      style={FORMA_BOTON_ORGANIC_PRINCIPAL}
                      loading={guardando}
                      disabled={!formularioValido}
                      onPress={() => void guardar()}
                      onPressDeshabilitado={explicarQueFalta}
                    />
                  </View>
                </View>
              ) : null}
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
