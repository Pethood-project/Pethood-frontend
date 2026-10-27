/**
 * Alta y edición de una pregunta del refugio. La ruta `/preguntas-adopcion/nueva` crea; con un
 * id numérico edita la que corresponda. Cada pregunta se responde de una forma (texto libre,
 * sí o no, o una opción entre varias) y puede aplicar a todas las mascotas o solo a una
 * especie, porque lo que se le pregunta a quien quiere un perro no siempre sirve para un gato.
 */
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { EncabezadoPantalla } from '@/components/ui/EncabezadoPantalla';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import { SegmentedField } from '@/components/ui/SegmentedField';
import { TagInputField } from '@/components/ui/TagInputField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { ToggleField } from '@/components/ui/ToggleField';
import { OPCIONES_TIPO_PREGUNTA } from '@/constants/PreguntasAdopcion';
import { vibrar } from '@/lib/haptics';
import { listarEspecies, type OpcionCatalogo } from '@/services/catalogos';
import {
  actualizarPregunta,
  crearPregunta,
  listarPreguntas,
  type DatosPregunta,
} from '@/services/preguntasAdopcion';
import type { TipoPregunta } from '@/services/solicitudes';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';

/** Valor del selector de alcance que representa "todas las especies". */
const TODAS = 0;

interface Errores {
  texto?: string;
  opciones?: string;
}

export default function FormularioPreguntaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const preguntaId = id === 'nueva' ? null : Number(id);
  const router = useRouter();
  const toast = useToast();

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [especies, setEspecies] = useState<OpcionCatalogo[]>([]);
  const [guardando, setGuardando] = useState(false);

  const [texto, setTexto] = useState('');
  const [tipo, setTipo] = useState<TipoPregunta>('TEXTO');
  const [opciones, setOpciones] = useState<string[]>([]);
  const [obligatoria, setObligatoria] = useState(false);
  const [especieId, setEspecieId] = useState<number>(TODAS);
  const [errores, setErrores] = useState<Errores>({});

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setErrorCarga(null);
      const [catalogo, existentes] = await Promise.all([
        listarEspecies(),
        preguntaId === null ? Promise.resolve([]) : listarPreguntas(),
      ]);
      setEspecies(catalogo);

      if (preguntaId !== null) {
        const pregunta = existentes.find((actual) => actual.id === preguntaId);
        if (!pregunta) {
          setErrorCarga('No encontramos esta pregunta.');
          return;
        }

        setTexto(pregunta.texto);
        setTipo(pregunta.tipo);
        setOpciones(pregunta.opciones);
        setObligatoria(pregunta.obligatoria);
        setEspecieId(pregunta.especie?.id ?? TODAS);
      }
    } catch (err) {
      setErrorCarga(err instanceof Error ? err.message : 'No pudimos cargar la pregunta.');
    } finally {
      setCargando(false);
    }
  }, [preguntaId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const volver = (): void => (router.canGoBack() ? router.back() : router.replace('/preguntas-adopcion' as Href));

  const validar = (): Errores => {
    const problemas: Errores = {};

    const problemaTexto = validarTexto(texto, {
      ...LIMITES.preguntaAdopcion.texto,
      etiqueta: 'La pregunta',
    });
    if (problemaTexto) problemas.texto = problemaTexto;

    if (tipo === 'OPCIONES') {
      const { minimo, maximo } = LIMITES.preguntaAdopcion.opciones;
      if (opciones.length < minimo || opciones.length > maximo) {
        problemas.opciones = `Cargá entre ${minimo} y ${maximo} opciones`;
      }
    }

    return problemas;
  };

  const guardar = async (): Promise<void> => {
    const problemas = validar();
    setErrores(problemas);

    if (Object.keys(problemas).length > 0) {
      vibrar.error();
      return;
    }

    const datos: DatosPregunta = {
      texto: texto.trim(),
      tipo,
      opciones: tipo === 'OPCIONES' ? opciones : [],
      obligatoria,
      especieId: especieId === TODAS ? null : especieId,
    };

    setGuardando(true);
    try {
      if (preguntaId === null) {
        await crearPregunta(datos);
      } else {
        await actualizarPregunta(preguntaId, datos);
      }

      vibrar.exito();
      toast.mostrarExito(preguntaId === null ? 'Agregaste la pregunta.' : 'Guardamos los cambios.');
      volver();
    } catch (err) {
      toast.mostrarError(
        err instanceof Error ? err.message : 'No pudimos guardar la pregunta. Intentalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const titulo = preguntaId === null ? 'Nueva pregunta' : 'Editar pregunta';
  const opcionesAlcance = [
    { valor: TODAS, etiqueta: 'Todas' },
    ...especies.map((especie) => ({ valor: especie.id, etiqueta: especie.nombre })),
  ];

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <EncabezadoPantalla titulo={titulo} onVolver={volver} />

        {cargando ? (
          <EstadoCargando />
        ) : errorCarga ? (
          <EstadoError
            mensaje={errorCarga}
            onAccion={() => {
              setCargando(true);
              void cargar();
            }}
          />
        ) : (
          <FormularioConTeclado contentContainerClassName="gap-4 px-4 pb-10 pt-3">
            <TextAreaField
              label="Pregunta"
              placeholder="Por ejemplo: ¿Qué harías si el perro se escapa?"
              value={texto}
              onChangeText={(valor) => {
                setTexto(valor);
                setErrores((previos) => ({ ...previos, texto: undefined }));
              }}
              maximo={LIMITES.preguntaAdopcion.texto.max}
              obligatorio
              error={errores.texto}
              variante="pregunta"
              editable={!guardando}
            />

            <SegmentedField
              label="¿Cómo se responde?"
              opciones={OPCIONES_TIPO_PREGUNTA}
              valor={tipo}
              onChange={(valor) => {
                setTipo(valor);
                setErrores((previos) => ({ ...previos, opciones: undefined }));
              }}
              varianteCampo="pregunta"
            />

            {tipo === 'OPCIONES' ? (
              <TagInputField
                label="Opciones"
                placeholder="Escribí una opción"
                etiquetas={opciones}
                onChange={(valor) => {
                  setOpciones(valor);
                  setErrores((previos) => ({ ...previos, opciones: undefined }));
                }}
                maximoPorEtiqueta={LIMITES.preguntaAdopcion.opciones.largo}
                nombreEtiqueta="Cada opción"
                mensajeRepetida="Esa opción ya está en la lista"
                error={errores.opciones}
              />
            ) : null}

            <ToggleField
              label="Es obligatoria"
              valor={obligatoria}
              onChange={setObligatoria}
              variante="caja"
              grande
            />

            {especies.length > 0 ? (
              <SegmentedField
                label="¿Para qué mascotas?"
                opciones={opcionesAlcance}
                valor={especieId}
                onChange={setEspecieId}
                varianteCampo="pregunta"
              />
            ) : null}

            <CustomButton
              title={preguntaId === null ? 'Agregar pregunta' : 'Guardar cambios'}
              variant="acento"
              loading={guardando}
              onPress={() => void guardar()}
            />
          </FormularioConTeclado>
        )}
      </SafeAreaView>
    </View>
  );
}
