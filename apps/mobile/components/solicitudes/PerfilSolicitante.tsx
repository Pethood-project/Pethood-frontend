/**
 * Quién es la persona que solicita, para quien revisa: lo que PetHood sabe de ella sin
 * mostrar nada que no haga falta. Nunca documento, correo ni teléfono: el contacto es por el
 * chat. Reputación y reseñas salen del módulo de reputación; el resto, de su perfil.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ResumenReputacion } from '@/components/resenas/ResumenReputacion';
import { Avatar } from '@/components/ui/Avatar';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { SolicitudDetalle } from '@/services/solicitudes';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';
import { etiquetaUbicacion } from '@/shared/ubicacion';

/** Las más recientes alcanzan para tener una idea; el resto está en el perfil completo. */
const RESENAS_VISIBLES = 3;

interface PerfilSolicitanteProps {
  solicitante: SolicitudDetalle['solicitante'];
  /** Cuándo envió esta solicitud. */
  fechaSolicitud: string;
}

export function PerfilSolicitante({ solicitante, fechaSolicitud }: PerfilSolicitanteProps) {
  const router = useRouter();
  const irAlPerfil = (): void =>
    router.push({ pathname: '/perfiles/usuario/[id]', params: { id: solicitante.id } });
  const miembroDesde = parsearFecha(solicitante.miembroDesde);
  const solicito = parsearFecha(fechaSolicitud);
  const ubicacion = etiquetaUbicacion({
    localidad: solicitante.localidad,
    provincia: solicitante.provincia,
  });

  return (
    <View>
      <View className="rounded-2xl bg-organic-surface p-4 shadow-sm">
        <View className="flex-row items-center gap-4">
          <Avatar
            uri={urlAbsoluta(solicitante.imagenUrl)}
            nombre={solicitante.nombre}
            apellido={solicitante.apellido}
            tamanio={56}
            variante="organic"
            tono="neutro"
          />
          <View className="flex-1">
            <Text className="font-cuerpo-semi text-[17px] text-organic-neutral-900">
              {solicitante.nombre} {solicitante.apellido}
            </Text>
            {solicito ? (
              <Text className="mt-0.5 font-cuerpo text-[14px] text-organic-neutral-600">
                Solicitó el {aFechaVisible(solicito)}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="mt-3.5 gap-2">
          {ubicacion ? (
            <Dato icono="location-outline" texto={ubicacion} />
          ) : (
            <Dato icono="location-outline" texto="Sin ubicación cargada" atenuado />
          )}
          <Dato
            icono={solicitante.verificado ? 'shield-checkmark-outline' : 'shield-outline'}
            texto={solicitante.verificado ? 'Identidad verificada' : 'Identidad sin verificar'}
            atenuado={!solicitante.verificado}
          />
          {miembroDesde ? (
            <Dato icono="calendar-outline" texto={`Miembro desde el ${aFechaVisible(miembroDesde)}`} />
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={irAlPerfil}
          className="mt-3.5 flex-row items-center gap-1 self-start active:opacity-60"
        >
          <Text className="font-cuerpo-semi text-[14px] text-organic-accent-700">
            Ver perfil completo
          </Text>
          <Ionicons name="chevron-forward" size={15} color={PALETA.accent[700]} />
        </Pressable>
      </View>

      {/* Reputación (Módulo 10): cómo lo valoraron otras personas que adoptaron o hicieron tránsito. */}
      <ResumenReputacion
        tipo="usuario"
        id={solicitante.id}
        mostrarLista
        limiteInicial={RESENAS_VISIBLES}
        onVerMas={irAlPerfil}
        className="mt-2.5"
      />
    </View>
  );
}

function Dato({
  icono,
  texto,
  atenuado = false,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  atenuado?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons
        name={icono}
        size={17}
        color={atenuado ? PALETA.neutral[500] : PALETA.accent[600]}
      />
      <Text
        className={`flex-1 font-cuerpo text-[14px] ${
          atenuado ? 'text-organic-neutral-500' : 'text-organic-neutral-800'
        }`}
      >
        {texto}
      </Text>
    </View>
  );
}
