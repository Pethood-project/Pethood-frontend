/**
 * Las preguntas propias del refugio para el formulario de solicitud: se suman al final de las
 * comunes y las ve quien pide adoptar, en el orden de esta lista. Hay un tope de activas para
 * que el formulario no espante a nadie; las que se apagan se conservan para volver a usarlas.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { Nota } from '@/components/ui/Nota';
import { ETIQUETA_TIPO_PREGUNTA } from '@/constants/PreguntasAdopcion';
import { PALETA } from '@/constants/theme';
import { vibrar } from '@/lib/haptics';
import {
  actualizarPregunta,
  eliminarPregunta,
  listarPreguntas,
  reordenarPreguntas,
  type PreguntaAdopcion,
} from '@/services/preguntasAdopcion';
import { LIMITES } from '@/shared/validation/limits';

const MAXIMO = LIMITES.preguntaAdopcion.maximoActivas;

interface TarjetaPreguntaProps {
  pregunta: PreguntaAdopcion;
  primera: boolean;
  ultima: boolean;
  ocupada: boolean;
  onEditar: () => void;
  onAlternar: (activa: boolean) => void;
  onMover: (direccion: -1 | 1) => void;
  onEliminar: () => void;
}

function TarjetaPregunta({
  pregunta,
  primera,
  ultima,
  ocupada,
  onEditar,
  onAlternar,
  onMover,
  onEliminar,
}: TarjetaPreguntaProps) {
  return (
    <View
      className={`rounded-3xl bg-organic-surface p-4 shadow-sm ${pregunta.activa ? '' : 'opacity-60'}`}
    >
      <Pressable accessibilityRole="button" onPress={onEditar} className="active:opacity-70">
        <Text className="font-cuerpo-semi text-[16px] leading-[22px] text-organic-neutral-900">
          {pregunta.texto}
        </Text>

        <View className="mt-2.5 flex-row flex-wrap gap-1.5">
          <Chip etiqueta={ETIQUETA_TIPO_PREGUNTA[pregunta.tipo]} variante="dato" />
          <Chip etiqueta={pregunta.obligatoria ? 'Obligatoria' : 'Opcional'} variante="dato" />
          <Chip etiqueta={pregunta.especie?.nombre ?? 'Todas las mascotas'} variante="dato" />
        </View>

        {pregunta.tipo === 'OPCIONES' ? (
          <Text className="mt-2 font-cuerpo text-[13px] text-organic-neutral-600">
            {pregunta.opciones.join(' · ')}
          </Text>
        ) : null}
      </Pressable>

      <View className="mt-3 flex-row items-center border-t border-organic-neutral-200 pt-3">
        <Switch
          value={pregunta.activa}
          disabled={ocupada}
          onValueChange={onAlternar}
          accessibilityLabel={pregunta.activa ? 'Desactivar la pregunta' : 'Activar la pregunta'}
          trackColor={{ false: PALETA.gris[200], true: PALETA.accent[600] }}
          thumbColor={PALETA.blanco}
          ios_backgroundColor={PALETA.gris[200]}
        />
        <Text className="ml-2 flex-1 font-cuerpo text-[13px] text-organic-neutral-600">
          {pregunta.activa ? 'Activa' : 'Apagada'}
        </Text>

        <BotonIcono
          icono="arrow-up"
          etiqueta="Subir"
          deshabilitado={primera || ocupada}
          onPress={() => onMover(-1)}
        />
        <BotonIcono
          icono="arrow-down"
          etiqueta="Bajar"
          deshabilitado={ultima || ocupada}
          onPress={() => onMover(1)}
        />
        <BotonIcono icono="trash-outline" etiqueta="Eliminar" deshabilitado={ocupada} onPress={onEliminar} />
      </View>
    </View>
  );
}

function BotonIcono({
  icono,
  etiqueta,
  deshabilitado,
  onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  etiqueta: string;
  deshabilitado: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      disabled={deshabilitado}
      onPress={onPress}
      hitSlop={6}
      className={`h-10 w-10 items-center justify-center rounded-full active:bg-organic-neutral-100 ${
        deshabilitado ? 'opacity-30' : ''
      }`}
    >
      <Ionicons name={icono} size={20} color={PALETA.neutral[700]} />
    </Pressable>
  );
}

export default function PreguntasAdopcionScreen() {
  const router = useRouter();
  const toast = useToast();

  const [preguntas, setPreguntas] = useState<PreguntaAdopcion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState(false);
  const [porEliminar, setPorEliminar] = useState<PreguntaAdopcion | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setPreguntas(await listarPreguntas());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar las preguntas.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const volver = (): void => (router.canGoBack() ? router.back() : router.replace('/(tabs)/perfil'));
  const irAlFormulario = (id: number | 'nueva'): void =>
    router.push(`/preguntas-adopcion/${id}` as Href);

  /** Ejecuta un cambio y refresca la lista; si falla, lo dice sin tirar abajo la pantalla. */
  const aplicar = async (cambio: () => Promise<unknown>, falla: string): Promise<boolean> => {
    setOcupada(true);
    try {
      await cambio();
      await cargar();
      return true;
    } catch (err) {
      toast.mostrarError(err instanceof Error ? err.message : falla);
      return false;
    } finally {
      setOcupada(false);
    }
  };

  const alternar = async (pregunta: PreguntaAdopcion, activa: boolean): Promise<void> => {
    vibrar.seleccion();
    await aplicar(
      () => actualizarPregunta(pregunta.id, { activa }),
      'No pudimos actualizar la pregunta. Intentalo de nuevo.',
    );
  };

  const mover = async (indice: number, direccion: -1 | 1): Promise<void> => {
    if (!preguntas) return;

    const siguiente = [...preguntas];
    const destino = indice + direccion;
    [siguiente[indice], siguiente[destino]] = [siguiente[destino]!, siguiente[indice]!];

    vibrar.seleccion();
    // Se muestra ya el nuevo orden; si el servidor lo rechaza, `aplicar` recarga el real.
    setPreguntas(siguiente);
    await aplicar(
      () => reordenarPreguntas(siguiente.map((pregunta) => pregunta.id)),
      'No pudimos cambiar el orden. Intentalo de nuevo.',
    );
  };

  const eliminar = async (): Promise<void> => {
    if (!porEliminar) return;

    const salio = await aplicar(
      () => eliminarPregunta(porEliminar.id),
      'No pudimos eliminar la pregunta. Intentalo de nuevo.',
    );
    setPorEliminar(null);
    if (salio) toast.mostrarExito('Eliminaste la pregunta.');
  };

  const activas = preguntas?.filter((pregunta) => pregunta.activa).length ?? 0;
  const completas = activas >= MAXIMO;

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla titulo="Preguntas" subtitulo="Para quienes quieren adoptar" onVolver={volver} />

        {error && !preguntas ? (
          <EstadoError mensaje={error} onAccion={() => void cargar()} />
        ) : !preguntas ? (
          <EstadoCargando />
        ) : preguntas.length === 0 ? (
          <EstadoVacio
            icono="chatbubbles-outline"
            titulo="Todavía no hiciste ninguna pregunta"
            descripcion="Sumá lo que te ayude a conocer a quien quiere adoptar. Aparecen al final del formulario de solicitud."
          >
            <CustomButton title="Agregar pregunta" variant="acento" onPress={() => irAlFormulario('nueva')} />
          </EstadoVacio>
        ) : (
          <ScrollView contentContainerClassName="px-4 pb-10 pt-3" showsVerticalScrollIndicator={false}>
            <Nota
              tono="consejo"
              grande
              texto={`Tenés ${activas} de ${MAXIMO} preguntas activas. Un formulario corto se completa más seguido.`}
            />

            <View className="mt-4 gap-3">
              {preguntas.map((pregunta, indice) => (
                <TarjetaPregunta
                  key={pregunta.id}
                  pregunta={pregunta}
                  primera={indice === 0}
                  ultima={indice === preguntas.length - 1}
                  ocupada={ocupada}
                  onEditar={() => irAlFormulario(pregunta.id)}
                  onAlternar={(activa) => void alternar(pregunta, activa)}
                  onMover={(direccion) => void mover(indice, direccion)}
                  onEliminar={() => setPorEliminar(pregunta)}
                />
              ))}
            </View>

            <View className="mt-5">
              <CustomButton
                title={completas ? 'Ya tenés el máximo de preguntas activas' : 'Agregar pregunta'}
                variant="acento"
                disabled={completas}
                onPress={() => irAlFormulario('nueva')}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <ConfirmDialog
        visible={porEliminar !== null}
        tono="peligro"
        titulo="¿Eliminar esta pregunta?"
        mensaje="Dejará de aparecer en el formulario. Las respuestas que ya recibiste se conservan."
        detalle="Si solo querés dejar de usarla por un tiempo, mejor apagala."
        textoConfirmar="Eliminar"
        cargando={ocupada}
        onConfirmar={() => void eliminar()}
        onCerrar={() => setPorEliminar(null)}
      />
    </View>
  );
}
