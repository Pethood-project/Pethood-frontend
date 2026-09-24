/**
 * GUI-08 Chat Adoptante / GUI-31 Chat Refugio — HU-5.1 (listado de conversaciones activas)
 * y HU-5.3 (búsqueda por nombre de contacto).
 *
 * Una sola pantalla para los dos roles. Los artboards son idénticos salvo la cabecera
 * (título, subtítulo y placeholder del buscador), así que lo único condicionado por rol es
 * ese bloque; la lista, la fila y los estados son los mismos.
 *
 * Sólo lectura: abrir una conversación y enviar mensajes es HU-5.2.
 *
 * El estado de la lista (carga, refresco y tiempo real) vive en `useListaChats`; acá sólo se
 * pinta y se filtra. El filtro es una **vista**: `chats` sigue siendo la lista completa y
 * `visibles` es el recorte que se muestra, así que limpiar el término devuelve todo sin
 * pedirle nada al servidor.
 *
 * Estilo del artboard 07 (adoptante) / 18 (refugio) del diseño Organic, sobre una maqueta
 * de 262px con el factor ×1,33: cabecera en `neutral-100` con borde inferior `neutral-300`
 * y padding 10/16 → 13/21; título en Caprasimo 18 → 24 (17 → 23 en refugio) en `accent-600`;
 * subtítulo del refugio 9 → 12 en `neutral-600`; la lista con 4 → 5 de aire arriba y abajo y
 * un separador `neutral-300` entre filas.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilaConversacion } from '@/components/chat/FilaConversacion';
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/feedback/EstadosPantalla';
import { BarraBusqueda } from '@/components/ui/BarraBusqueda';
import { PALETA } from '@/constants/theme';
import { useDebounce } from '@/hooks/useDebounce';
import { useListaChats } from '@/hooks/useListaChats';
import { useSesion } from '@/hooks/useSesion';
import { filtrarPorContacto } from '@/lib/listaChats';
import { LIMITES } from '@/shared/validation/limits';

/** Separador entre filas: 1px `neutral-300`, a todo el ancho, como en el diseño. */
function SeparadorFilas() {
  return <View className="h-px bg-organic-neutral-300" />;
}

/**
 * Cada cuánto se recalculan los textos relativos ("Hace 5 min").
 *
 * Es un re-render local, sin pedirle nada al servidor: el minuto es la unidad más chica del
 * criterio 6, así que con este intervalo ningún texto queda viejo. El listado en sí se
 * recarga al enfocar la pantalla y se actualiza por socket cuando llega un mensaje.
 */
const REFRESCO_TEXTOS_MS = 60_000;

/**
 * Pausa en la escritura antes de aplicar el filtro (HU-5.3, criterio 4).
 *
 * La HU pide 2 segundos. Se bajó a 300 ms **por decisión de equipo**: el filtro corre en
 * memoria sobre una lista que ya está cargada —no hay red de por medio y el costo real es
 * cero—, así que dos segundos no protegen de nada y hacen sentir la pantalla colgada.
 * 300 ms es el tiempo que separa "sigo tecleando" de "frené", que es lo único que el retraso
 * necesita distinguir. Queda acá, con nombre, para poder volver al valor de la HU cambiando
 * un número.
 */
const RETRASO_FILTRO_MS = 300;

/**
 * Subtítulo de GUI-31: "Refugio Esperanza · 4 sin leer".
 *
 * El nombre del refugio viaja en la sesión desde que el backend lo sumó a la respuesta de
 * auth. Una sesión guardada antes de ese cambio no lo tiene: ahí se muestra sólo el
 * contador, que es lo que el diseño pone a la derecha del punto.
 */
function subtituloRefugio(sinLeer: number, refugio: string | null): string {
  const contador = sinLeer === 1 ? '1 sin leer' : `${sinLeer} sin leer`;
  return refugio ? `${refugio} · ${contador}` : contador;
}

/**
 * Bandeja vacía (HU-5.1, criterio 2): el usuario no tiene **ninguna** conversación.
 *
 * No confundir con `SinResultados`: son dos situaciones distintas y con salidas distintas.
 * Acá no hay nada que buscar, y por eso el buscador queda deshabilitado.
 */
function ListaVacia() {
  return (
    <EstadoVacio
      icono="chatbubbles-outline"
      // Textos literales del criterio 2 de la HU.
      titulo="¡Tu bandeja de entrada está vacía!"
      descripcion="Explora mascotas para empezar una conversación."
    />
  );
}

/**
 * Búsqueda sin coincidencias (HU-5.3, criterio 6): hay conversaciones, pero ninguna coincide
 * con el término. El buscador **sigue habilitado**, que es justamente la salida del estado:
 * corregir lo que se escribió.
 *
 * Mismo componente que la bandeja vacía, con otro contenido: el ícono es una lupa y no un
 * globo de chat porque lo que está vacío es el resultado de la búsqueda, no la bandeja.
 *
 * El título es el texto literal de la HU. La descripción no la define ni la HU ni el
 * artboard — se redactó siguiendo el tono resolutivo de `REQUISITOS.md` §5, en voseo.
 */
function SinResultados() {
  return (
    <EstadoVacio
      icono="search-outline"
      titulo="No hay chats con el nombre ingresado"
      descripcion="Probá con otro nombre o revisá cómo lo escribiste."
    />
  );
}

export default function ChatScreen() {
  const { vistaRefugio, usuario } = useSesion();
  const router = useRouter();

  const { chats, cargando, refrescando, error, recargar, refrescar } = useListaChats();

  /** Lo que se ve tipeado en la barra. La lista se filtra con el valor demorado, no con éste. */
  const [busqueda, setBusqueda] = useState('');

  /**
   * El término que efectivamente filtra. Se estabiliza 300 ms después de la última tecla,
   * salvo que el campo quede vacío: ahí vuelve toda la lista en el acto (`sinEspera`).
   * Deshacer una búsqueda no puede costar lo mismo que hacerla.
   *
   * Un término de puros espacios cuenta como vacío, igual que en `filtrarPorContacto`.
   */
  const termino = useDebounce(busqueda, RETRASO_FILTRO_MS, (texto) => texto.trim() === '');

  // El término no sobrevive a salir de la pestaña. Al volver a Mensajes la lista se recarga
  // entera (`useFocusEffect` de `useListaChats`), y encontrarla recortada por algo tipeado
  // hace rato se lee como "me faltan conversaciones", no como "hay una búsqueda activa".
  useFocusEffect(
    useCallback(() => {
      return () => setBusqueda('');
    }, []),
  );

  /**
   * Instante contra el que las filas calculan su texto relativo. Avanza solo cada minuto
   * para que "Hace 5 min" no se quede viejo con la pantalla abierta.
   */
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), REFRESCO_TEXTOS_MS);
    return () => clearInterval(id);
  }, []);

  // Cada vez que la lista cambia (recarga o mensaje por socket) el reloj también se pone al
  // día, para que un mensaje recién llegado no aparezca con la marca del tick anterior.
  useEffect(() => {
    setAhora(new Date());
  }, [chats]);

  const sinLeer = useMemo(
    () => chats.reduce((total, chat) => total + chat.noLeidos, 0),
    [chats],
  );

  /**
   * El recorte que se pinta. Se recalcula tanto al cambiar el término como al cambiar
   * `chats`, y ese segundo caso es el que hace que el tiempo real respete el filtro: cuando
   * llega un mensaje, `useListaChats` reordena la lista **completa** y acá se la vuelve a
   * recortar. Una conversación que no coincide no se cuela por haber recibido un mensaje, y
   * entre las que sí coinciden el orden por último mensaje sigue valiendo.
   */
  const visibles = useMemo(() => filtrarPorContacto(chats, termino), [chats, termino]);

  /** Sin ninguna conversación. Es lo que deshabilita el buscador (HU-5.1, criterio 1). */
  const bandejaVacia = chats.length === 0;

  /**
   * Con conversaciones pero ninguna coincidencia. Se mira `visibles` y **nunca** para
   * habilitar el buscador: si el filtro sin resultados lo deshabilitara, el usuario quedaría
   * encerrado sin poder corregir el término.
   */
  const buscandoSinResultados = !bandejaVacia && visibles.length === 0;

  /** Hay una tecla esperando a que venza el retraso: la lupa se vuelve spinner. */
  const filtroPendiente = termino !== busqueda;

  return (
    <View className="flex-1 bg-organic-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="border-b border-organic-neutral-300 bg-organic-neutral-100 px-[21px] py-[13px]">
          {vistaRefugio ? (
            <>
              <Text className="font-titulo text-[23px] leading-[28px] text-organic-accent-600">
                Mensajes del Refugio
              </Text>
              <Text
                numberOfLines={1}
                className="mt-[4px] font-cuerpo text-[12px] text-organic-neutral-600"
              >
                {subtituloRefugio(sinLeer, usuario?.refugio?.nombre ?? null)}
              </Text>
            </>
          ) : (
            <Text className="font-titulo text-[24px] leading-[29px] text-organic-accent-600">
              Mensajes
            </Text>
          )}

          {/* Criterio 1: sin conversaciones el buscador SE MUESTRA, deshabilitado. El
              placeholder sale del artboard y difiere por rol: la HU pide "Buscar
              conversaciones..." para las dos pantallas, pero GUI-31 dice "Buscar...". */}
          <View className="mt-[12px]">
            <BarraBusqueda
              placeholder={vistaRefugio ? 'Buscar...' : 'Buscar conversaciones...'}
              deshabilitada={bandejaVacia}
              accessibilityLabel="Buscar conversaciones"
              valor={busqueda}
              onCambiar={setBusqueda}
              // Criterio 3: el tope lo pone el input, no un recorte a mano sobre el texto.
              maxLength={LIMITES.busquedaChat.max}
              onLimpiar={() => setBusqueda('')}
              cargando={filtroPendiente}
            />
          </View>
        </View>

        {cargando ? (
          <EstadoCargando />
        ) : error ? (
          <EstadoError mensaje={error} onAccion={recargar} />
        ) : (
          <FlatList
            data={visibles}
            keyExtractor={(chat) => String(chat.chatId)}
            renderItem={({ item }) => (
              <FilaConversacion
                conversacion={item}
                ahora={ahora}
                // HU-5.2: sólo viaja el chatId. El nombre y la foto los resuelve la
                // cabecera de la sala, para que abrirla desde una notificación o un deep
                // link no dependa de haber pasado por acá.
                onPress={() => router.push(`/chats/${item.chatId}`)}
              />
            )}
            ItemSeparatorComponent={SeparadorFilas}
            // Criterio 6: con una búsqueda activa y sin coincidencias se oculta la lista y
            // va el estado vacío de la búsqueda, no el de la bandeja.
            ListEmptyComponent={buscandoSinResultados ? SinResultados : ListaVacia}
            contentContainerStyle={visibles.length === 0 ? { flexGrow: 1 } : { paddingVertical: 5 }}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={refrescar}
                tintColor={PALETA.accent[600]}
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
