/**
 * Donar a una campaña (spec 026, HU-12.2 y HU-12.3). No está en el prototipo.
 *
 * Muestra alias y/o CBU para transferir desde el homebanking o la billetera, y un campo con el
 * monto transferido. «Terminar donación» avisa al refugio: la donación queda Pendiente y suma
 * a la campaña recién cuando el refugio confirma que recibió la plata (regla transversal 11).
 */
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CustomButton } from '@/components/CustomButton';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { useToast } from '@/components/feedback/Toast';
import { BotonCircular } from '@/components/ui/BotonCircular';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Segmentado, type OpcionSegmento } from '@/components/ui/Segmentado';
import { FormularioConTeclado } from '@/components/ui/FormularioConTeclado';
import { Nota } from '@/components/ui/Nota';
import { TextField } from '@/components/ui/TextField';
import { PALETA } from '@/constants/theme';
import { useSesion } from '@/hooks/useSesion';
import { formatearPesos, motivoParaNoDonar, notaDonar, type OrigenDonacion } from '@/lib/campanias';
import { ApiError } from '@/services/api';
import { donar, obtenerCampania, type Campania } from '@/services/campanias';
import { cargarDni, obtenerPerfil } from '@/services/usuarios';
import { validarDni } from '@/shared/validation/documento';
import { LIMITES } from '@/shared/validation/limits';
import { normalizarMonto, validarDecimal } from '@/shared/validation/numbers';

const { monto: LIMITE_MONTO } = LIMITES.donacion;

const OPCIONES_ORIGEN: OpcionSegmento<OrigenDonacion>[] = [
  { valor: 'MERCADO_PAGO', etiqueta: 'Mercado Pago' },
  { valor: 'OTRO_BANCO', etiqueta: 'Otro banco o billetera' },
];

function DatoParaCopiar({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const toast = useToast();

  const copiar = async (): Promise<void> => {
    await Clipboard.setStringAsync(valor);
    toast.mostrarExito(`Copiaste el ${etiqueta.toLowerCase()}.`);
  };

  return (
    <View className="flex-row items-center justify-between gap-3 rounded-[16px] bg-organic-bg px-4 py-3">
      <View className="min-w-0 flex-1">
        <Text className="font-cuerpo-bold text-[11px] uppercase tracking-[1px] text-organic-neutral-600">
          {etiqueta}
        </Text>
        <Text selectable className="font-cuerpo-bold text-[16px] text-organic-neutral-900">
          {valor}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Copiar ${etiqueta}`}
        onPress={() => void copiar()}
        hitSlop={8}
        className="active:opacity-60"
      >
        <Ionicons name="copy-outline" size={22} color={PALETA.accent[600]} />
      </Pressable>
    </View>
  );
}

export default function DonarCampaniaScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaniaId = Number(id);

  const [campania, setCampania] = useState<Campania | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [monto, setMonto] = useState('');
  /** Se pregunta antes de transferir: sólo las de Mercado Pago se confirman solas (spec 027). */
  const [origen, setOrigen] = useState<OrigenDonacion | null>(null);
  const [tocado, setTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const { token } = useSesion();
  /** `null` mientras no se sabe: en ese caso decide el backend (DNI_REQUERIDO). */
  const [tieneDni, setTieneDni] = useState<boolean | null>(null);
  const [pidiendoDni, setPidiendoDni] = useState(false);
  const [dni, setDni] = useState('');
  const [errorDni, setErrorDni] = useState<string | undefined>();
  const [guardandoDni, setGuardandoDni] = useState(false);

  // Spec 027: sin DNI no se puede donar. Se pide acá, justo antes de donar, y no al entrar.
  useEffect(() => {
    if (!token) return;
    obtenerPerfil(token)
      .then((respuesta) => setTieneDni(Boolean(respuesta.usuario.dni)))
      .catch(() => setTieneDni(null));
  }, [token]);

  useEffect(() => {
    setError(null);
    obtenerCampania(campaniaId)
      .then(setCampania)
      .catch((err: unknown) =>
        setError(
          err instanceof ApiError
            ? err.message
            : 'No pudimos cargar la campaña. Revisá tu conexión e intentalo de nuevo.',
        ),
      );
  }, [campaniaId, intento]);

  // «5.000» son cinco mil: se normaliza antes de validar y de mandar (el backend no acepta
  // separador de miles).
  const montoNormalizado = normalizarMonto(monto);
  const errorMonto = validarDecimal(montoNormalizado, { ...LIMITE_MONTO, etiqueta: 'El monto' });

  const enviar = async (): Promise<void> => {
    setEnviando(true);
    try {
      const donacion = await donar(campaniaId, montoNormalizado, origen!);
      toast.mostrarExito(
        donacion.estado.nombre === 'Realizada'
          ? '¡Listo! Tu donación ya se sumó a la campaña.'
          : '¡Gracias! El refugio va a confirmar tu donación.',
      );
      router.back();
    } catch (err) {
      // Una sesión vieja puede no saber que falta el DNI: el backend lo avisa y se pide acá.
      if (err instanceof ApiError && err.codigo === 'DNI_REQUERIDO') {
        setTieneDni(false);
        setPidiendoDni(true);
        return;
      }
      toast.mostrarError(
        err instanceof ApiError
          ? err.message
          : 'No pudimos registrar tu donación. Intentalo de nuevo.',
      );
    } finally {
      setEnviando(false);
    }
  };

  const terminar = async (): Promise<void> => {
    setTocado(true);
    if (errorMonto) return;

    if (tieneDni === false) {
      setPidiendoDni(true);
      return;
    }
    await enviar();
  };

  const guardarDniYDonar = async (): Promise<void> => {
    const error = validarDni(dni);
    if (error) {
      setErrorDni(error);
      return;
    }
    if (!token) return;

    setGuardandoDni(true);
    try {
      await cargarDni(token, dni);
      setTieneDni(true);
      setPidiendoDni(false);
      await enviar();
    } catch (err) {
      // DNI de otra cuenta, ya cargado, etc.: el cartel queda abierto para corregirlo.
      setErrorDni(
        err instanceof ApiError ? err.message : 'No pudimos guardar tu DNI. Intentalo de nuevo.',
      );
    } finally {
      setGuardandoDni(false);
    }
  };

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 border-b border-organic-neutral-300 bg-organic-surface px-[22px] pb-4 pt-2">
          <BotonCircular
            icono="arrow-back"
            etiqueta="Volver"
            onPress={() => router.back()}
            grande
          />
          <Text className="font-titulo text-[28px] leading-[32px] text-organic-accent-600">
            Donar
          </Text>
        </View>

        {error ? (
          <EstadoError mensaje={error} onAccion={() => setIntento((n) => n + 1)} />
        ) : !campania ? (
          <EstadoCargando />
        ) : motivoParaNoDonar(campania) ? (
          <EstadoVacio
            icono="gift-outline"
            titulo={campania.titulo}
            descripcion={motivoParaNoDonar(campania)!}
          />
        ) : (
          <FormularioConTeclado
            className="flex-1"
            contentContainerClassName="gap-4 px-4 pb-10 pt-4"
          >
            <View className="gap-1">
              <Text className="font-cuerpo-bold text-[12px] uppercase tracking-[1px] text-organic-accent-600">
                {campania.refugio.nombre}
              </Text>
              <Text className="font-titulo text-[22px] leading-[26px] text-organic-neutral-900">
                {campania.titulo}
              </Text>
              <Text className="font-cuerpo text-[14px] text-organic-neutral-600">
                Recaudado {formatearPesos(campania.recaudado)} de{' '}
                {formatearPesos(campania.objetivo)}
              </Text>
            </View>

            <View className="gap-2 rounded-[22px] bg-organic-surface p-4">
              <Text className="font-cuerpo-bold text-[15px] text-organic-neutral-900">
                1. ¿Desde dónde vas a transferir?
              </Text>
              <Segmentado
                opciones={OPCIONES_ORIGEN}
                valor={origen}
                onChange={setOrigen}
                variante="organica"
              />
            </View>

            <View className="gap-2 rounded-[22px] bg-organic-surface p-4">
              <Text className="font-cuerpo-bold text-[15px] text-organic-neutral-900">
                {origen === 'MERCADO_PAGO'
                  ? '2. Transferí desde tu cuenta de Mercado Pago'
                  : '2. Transferí desde tu banco o billetera'}
              </Text>
              {campania.alias ? <DatoParaCopiar etiqueta="Alias" valor={campania.alias} /> : null}
              {campania.cbu ? <DatoParaCopiar etiqueta="CBU / CVU" valor={campania.cbu} /> : null}
            </View>

            <View className="gap-2 rounded-[22px] bg-organic-surface p-4">
              <Text className="font-cuerpo-bold text-[15px] text-organic-neutral-900">
                3. Contanos cuánto transferiste
              </Text>
              <TextField
                label="Monto que transferiste ($)"
                obligatorio
                placeholder="Ej. 5000"
                keyboardType="decimal-pad"
                value={monto}
                onChangeText={(texto) => setMonto(texto.replace(/[^\d.,]/g, ''))}
                onBlur={() => setTocado(true)}
                error={tocado && errorMonto ? errorMonto : undefined}
                grande
              />
            </View>

            <Nota texto={notaDonar(origen, campania.confirmacionAutomatica)} />

            <CustomButton
              title="Terminar donación"
              variant="acento"
              loading={enviando}
              disabled={!!errorMonto || !origen}
              onPress={() => void terminar()}
              onPressDeshabilitado={() => {
                setTocado(true);
                if (!origen) toast.mostrarAdvertencia('Elegí desde dónde vas a transferir.');
              }}
            />
          </FormularioConTeclado>
        )}
      </SafeAreaView>

      <ConfirmDialog
        visible={pidiendoDni}
        tono="advertencia"
        titulo="Falta tu DNI"
        mensaje="Para registrar tu donación necesitamos tu DNI."
        detalle="Se carga una sola vez. Con él, si transferís desde tu cuenta de Mercado Pago, la donación se confirma sola."
        textoConfirmar="Guardar y donar"
        textoCancelar="Volver"
        cargando={guardandoDni}
        onConfirmar={() => void guardarDniYDonar()}
        onCerrar={() => setPidiendoDni(false)}
      >
        <TextField
          label="DNI"
          obligatorio
          placeholder="Sin puntos, ej. 30123456"
          keyboardType="number-pad"
          maxLength={8}
          value={dni}
          onChangeText={(texto) => {
            setDni(texto.replace(/\D/g, ''));
            setErrorDni(undefined);
          }}
          error={errorDni}
        />
      </ConfirmDialog>
    </View>
  );
}
