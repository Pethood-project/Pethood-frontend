/**
 * Verificación de identidad, HU-2.3, spec 002.1.
 *
 * La persona sube una foto de su DNI y una selfie; un administrador las revisa a mano y
 * decide. Subir no verifica nada: solo deja la evidencia lista.
 *
 * - El DNI y la selfie van **solo con cámara nativa** (la selfie, la frontal): sin galería.
 *   Es el mismo criterio anti-fraude que la prueba de vida del seguimiento. El backend no
 *   puede comprobar el origen de la imagen, así que esta pantalla es la única garantía.
 * - Ya verificada, no se pueden reemplazar los documentos (409 USUARIO_YA_VERIFICADO): si
 *   hay que cambiarlos, lo hace un administrador.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { useToast } from '@/components/feedback/Toast';
import {
  CapturaPruebaDeVida,
  type FotoCapturada,
} from '@/components/seguimiento/CapturaPruebaDeVida';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { ApiError, urlAbsoluta } from '@/services/api';
import { obtenerPerfil, subirDocumentos } from '@/services/usuarios';
import type { Perfil } from '@/types/auth';

const MENSAJE_WEB =
  'Las fotos tienen que sacarse con la cámara en el momento. Abrí PetHood en tu teléfono para completar la verificación.';

/** Lo ya subido se muestra como una foto más, para que se vea qué quedó cargado. */
function fotoExistente(url: string | null): FotoCapturada | null {
  const uri = urlAbsoluta(url);
  return uri ? { uri, nombre: '', tipo: '' } : null;
}

export default function VerificacionIdentidadScreen() {
  const router = useRouter();
  const toast = useToast();
  const { token } = useSesion();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [dni, setDni] = useState<FotoCapturada | null>(null);
  const [selfie, setSelfie] = useState<FotoCapturada | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  // Las URLs firmadas de los documentos duran minutos: se vuelve a pedir el perfil cada vez
  // que la pantalla toma foco, no solo al montarse.
  const cargar = useCallback(async (): Promise<void> => {
    if (!token) return;
    try {
      const respuesta = await obtenerPerfil(token);
      setPerfil(respuesta.usuario);
      setErrorCarga(false);
    } catch {
      setErrorCarga(true);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const verificado = perfil?.verificado ?? false;
  const dniSubido = Boolean(perfil?.documentos.dniImagenUrl);
  const selfieSubida = Boolean(perfil?.documentos.selfieUrl);
  const enRevision = !verificado && dniSubido && selfieSubida;

  const hayCambios = dni !== null || selfie !== null;
  const completo = (dni !== null || dniSubido) && (selfie !== null || selfieSubida);
  const puedeEnviar = hayCambios && completo;

  const enviar = async (): Promise<void> => {
    if (!token || !puedeEnviar) return;

    setEnviando(true);
    setFormError(undefined);
    try {
      await subirDocumentos(token, {
        dni: dni ? { uri: dni.uri, mimeType: dni.tipo, fileName: dni.nombre } : undefined,
        selfie: selfie
          ? { uri: selfie.uri, mimeType: selfie.tipo, fileName: selfie.nombre }
          : undefined,
      });
      toast.mostrarExito('Recibimos tu documentación. La revisamos a la brevedad.');
      setDni(null);
      setSelfie(null);
      await cargar();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.mensaje);
        // Se verificó mientras tenía la pantalla abierta: que vea su estado real.
        if (error.codigo === 'USUARIO_YA_VERIFICADO') await cargar();
      } else {
        setFormError('No pudimos subir tu documentación. Intentalo de nuevo.');
      }
    } finally {
      setEnviando(false);
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
          <Text className="text-2xl font-bold text-pethood-orange">Verificación</Text>
        </View>

        {cargando ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={PALETA.pethood.naranja} />
          </View>
        ) : errorCarga || !perfil ? (
          <View className="flex-1 items-center justify-center gap-4 px-8">
            <Text className="text-center text-base text-organic-neutral-700">
              No pudimos cargar tu estado de verificación.
            </Text>
            <CustomButton
              title="Reintentar"
              variant="secondary"
              onPress={() => {
                setCargando(true);
                void cargar();
              }}
            />
          </View>
        ) : verificado ? (
          <View className="mx-5 mt-4 items-center gap-3 rounded-3xl bg-white p-6">
            <Ionicons name="shield-checkmark" size={44} color={PALETA.accent[600]} />
            <Text className="text-center text-lg font-bold text-organic-neutral-700">
              Tu identidad está verificada
            </Text>
            <Text className="text-center text-sm leading-5 text-organic-neutral-700">
              Ya podés solicitar adopciones. Si tenés que cambiar tu DNI o tu selfie, escribinos a
              soporte y lo resolvemos con un administrador.
            </Text>
          </View>
        ) : (
          <FormularioConTeclado
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-8 pt-4"
          >
            {enRevision ? (
              <View className="mb-5 flex-row items-start gap-3 rounded-2xl bg-white p-4">
                <Ionicons name="time-outline" size={22} color={PALETA.accent[600]} />
                <Text className="flex-1 text-sm leading-5 text-organic-neutral-700">
                  Estamos revisando tu documentación. Un administrador la mira en un máximo de 24
                  horas y te avisamos apenas tu cuenta quede verificada. Si querés, podés
                  reemplazarla mientras tanto.
                </Text>
              </View>
            ) : (
              <Text className="mb-5 text-base text-organic-neutral-700">
                Antes de tu primera solicitud confirmamos que del otro lado hay una persona real.
                Es un trámite único: subí una foto de tu DNI y una selfie. Tus fotos se usan solo
                para esto y no se muestran en tu perfil público.
              </Text>
            )}

            <CapturaPruebaDeVida
              foto={dni ?? fotoExistente(perfil.documentos.dniImagenUrl)}
              onChange={setDni}
              deshabilitado={enviando}
              etiqueta="Foto de tu DNI"
              ayuda="Sacala en el momento con la cámara, donde se lea bien el número y tu nombre, sin reflejos. No se puede elegir una de la galería."
              textoBoton="Sacar foto del DNI"
              prefijoArchivo="dni"
              objeto="la foto de tu DNI"
              mensajeWeb={MENSAJE_WEB}
            />

            <CapturaPruebaDeVida
              foto={selfie ?? fotoExistente(perfil.documentos.selfieUrl)}
              onChange={setSelfie}
              deshabilitado={enviando}
              etiqueta="Selfie"
              ayuda="Tiene que ser una selfie sacada en el momento, con buena luz y sin anteojos de sol. No se puede elegir una de la galería."
              textoBoton="Sacarme una selfie"
              prefijoArchivo="selfie"
              objeto="tu selfie"
              mensajeWeb={MENSAJE_WEB}
              camaraFrontal
            />

            {formError ? <Text className="mb-3 text-sm text-red-500">{formError}</Text> : null}

            <CustomButton
              title={enRevision ? 'Reemplazar documentación' : 'Enviar para revisión'}
              loading={enviando}
              disabled={!puedeEnviar}
              onPress={() => void enviar()}
              onPressDeshabilitado={() =>
                toast.mostrarAdvertencia(
                  hayCambios
                    ? 'Te falta la foto del DNI o la selfie.'
                    : 'Cargá la foto de tu DNI y tu selfie para enviarlas.',
                )
              }
            />
          </FormularioConTeclado>
        )}
      </SafeAreaView>
    </View>
  );
}
