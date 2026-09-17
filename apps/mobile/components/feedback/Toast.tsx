/**
 * Toasts reutilizables de éxito, advertencia y error. Todos los textos que se les pasan
 * van en voseo rioplatense.
 *
 * Se usan vía el hook `useToast()`; el provider vive en el layout raíz para que un toast
 * disparado antes de navegar siga visible en la pantalla siguiente.
 */
import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Platform, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PALETA } from '@/constants/theme';

export type TipoToast = 'exito' | 'advertencia' | 'error';

/**
 * Acción opcional del toast, para deshacer algo que ya se aplicó (ej. quitar un favorito
 * en GUI-12). Es la alternativa al modal de confirmación cuando la acción es de baja
 * gravedad y alta frecuencia: no le cobra fricción al tap intencional y protege igual al
 * accidental.
 */
export interface AccionToast {
  etiqueta: string;
  onPress: () => void;
}

interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
  accion?: AccionToast;
}

interface ContextoToast {
  mostrarExito: (mensaje: string, accion?: AccionToast) => void;
  mostrarAdvertencia: (mensaje: string, accion?: AccionToast) => void;
  mostrarError: (mensaje: string, accion?: AccionToast) => void;
}

const DURACION_MS = 4000;

/** Un toast con acción dura más: hay que notarlo y llegar a tocarlo antes de que se vaya. */
const DURACION_CON_ACCION_MS = 7000;

const ESTILOS: Record<TipoToast, { fondo: string; icono: keyof typeof Ionicons.glyphMap }> = {
  exito: { fondo: 'bg-emerald-600', icono: 'checkmark-circle' },
  advertencia: { fondo: 'bg-amber-500', icono: 'alert-circle' },
  error: { fondo: 'bg-red-600', icono: 'close-circle' },
};

const Contexto = createContext<ContextoToast | null>(null);

export function useToast(): ContextoToast {
  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error('useToast necesita estar dentro de <ToastProvider>');
  }

  return contexto;
}

function ToastVisible({ toast, onCerrar }: { toast: Toast; onCerrar: () => void }) {
  const opacidad = useRef(new Animated.Value(0)).current;
  const estilo = ESTILOS[toast.tipo];
  const { accion } = toast;

  useEffect(() => {
    Animated.timing(opacidad, {
      toValue: 1,
      duration: 200,
      // En web no existe el módulo nativo de animación; en iOS/Android sí.
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [opacidad]);

  return (
    <Animated.View style={{ opacity: opacidad }} className="mb-2">
      <Pressable
        onPress={onCerrar}
        accessibilityRole="alert"
        className={`flex-row items-center rounded-2xl px-4 py-3.5 shadow-lg ${estilo.fondo}`}
      >
        <Ionicons name={estilo.icono} size={22} color={PALETA.blanco} />
        <Text className="ml-3 flex-1 text-base font-medium text-white">{toast.mensaje}</Text>

        {/* Pressable anidado: en RN el hijo captura el toque y no burbujea al padre, así
            que tocar la acción no dispara el cierre por tap del toast entero. */}
        {accion ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              accion.onPress();
              onCerrar();
            }}
            hitSlop={8}
            className="ml-3 rounded-full bg-white/25 px-3 py-1.5 active:opacity-70"
          >
            <Text className="text-sm font-bold text-white">{accion.etiqueta}</Text>
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const siguienteId = useRef(0);

  const cerrar = useCallback((id: number) => {
    setToasts((actuales) => actuales.filter((toast) => toast.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo: TipoToast, mensaje: string, accion?: AccionToast) => {
      const id = siguienteId.current++;

      setToasts((actuales) => [...actuales, { id, tipo, mensaje, accion }]);
      setTimeout(() => cerrar(id), accion ? DURACION_CON_ACCION_MS : DURACION_MS);
    },
    [cerrar],
  );

  const valor = useMemo<ContextoToast>(
    () => ({
      mostrarExito: (mensaje, accion) => mostrar('exito', mensaje, accion),
      mostrarAdvertencia: (mensaje, accion) => mostrar('advertencia', mensaje, accion),
      mostrarError: (mensaje, accion) => mostrar('error', mensaje, accion),
    }),
    [mostrar],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}

      {toasts.length > 0 ? (
        <SafeAreaView
          edges={['top']}
          className="absolute left-0 right-0 top-0 px-4"
          style={{ pointerEvents: 'box-none' }}
        >
          {toasts.map((toast) => (
            <ToastVisible key={toast.id} toast={toast} onCerrar={() => cerrar(toast.id)} />
          ))}
        </SafeAreaView>
      ) : null}
    </Contexto.Provider>
  );
}
