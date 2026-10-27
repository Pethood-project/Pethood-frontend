/**
 * Lo que declaró la persona sobre su hogar, todo junto en una tarjeta y sin repetir la
 * pregunta: si se sabe que la opción es "Casa", se muestra "Casa". Cada dato lleva su ícono
 * para leerse de un vistazo. Lo usan quien revisa y quien envió, con el mismo contenido.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import {
  etiquetaEspacioExterior,
  etiquetaHorasSolo,
  etiquetaTipoVivienda,
  respuestaSiNo,
} from '@/constants/Solicitudes';
import { PALETA } from '@/constants/theme';
import type { HogarSolicitante } from '@/services/solicitudes';

interface Dato {
  icono: keyof typeof Ionicons.glyphMap;
  etiqueta: string;
  valor: string;
}

/** "Casa con jardín" o "Departamento sin espacio al aire libre". */
function viviendaEnTexto(hogar: HogarSolicitante): string {
  const vivienda = etiquetaTipoVivienda(hogar.tipoVivienda) ?? 'Vivienda';
  const espacio = etiquetaEspacioExterior(hogar.espacioExterior);

  return espacio && hogar.espacioExterior !== 'Ninguno'
    ? `${vivienda} con ${espacio.toLowerCase()}`
    : `${vivienda} sin espacio al aire libre`;
}

function datosDelHogar(hogar: HogarSolicitante, descripcion: string): Dato[] {
  const datos: Dato[] = [
    { icono: 'home-outline', etiqueta: 'Vivienda', valor: viviendaEnTexto(hogar) },
    { icono: 'location-outline', etiqueta: 'Dirección', valor: hogar.direccion },
    { icono: 'happy-outline', etiqueta: 'Niños en casa', valor: respuestaSiNo(hogar.tieneNinios) },
    {
      icono: 'paw-outline',
      etiqueta: 'Otras mascotas',
      // El detalle va pegado al "Sí": solo, no dice con qué se va a convivir.
      valor: hogar.tieneMascotas
        ? `Sí${hogar.detalleMascotas ? ` — ${hogar.detalleMascotas}` : ''}`
        : 'No',
    },
    {
      icono: 'ribbon-outline',
      etiqueta: 'Experiencia con mascotas',
      valor: respuestaSiNo(hogar.experienciaPrevia),
    },
    {
      icono: 'time-outline',
      etiqueta: 'Horas sin compañía por día',
      valor: etiquetaHorasSolo(hogar.horasSolo) ?? '—',
    },
  ];

  if (hogar.descripcion) {
    datos.push({ icono: 'chatbubble-ellipses-outline', etiqueta: descripcion, valor: hogar.descripcion });
  }

  return datos;
}

interface ResumenHogarProps {
  hogar: HogarSolicitante | null;
  /** "15/09/2026 → 15/12/2026 (3 meses)": solo en un tránsito. */
  periodo?: string | null;
  /** La mira quien lo envió: cambia "Sobre su casa" por "Sobre tu casa". */
  propio?: boolean;
}

export function ResumenHogar({ hogar, periodo = null, propio = false }: ResumenHogarProps) {
  const datos: Dato[] = [];

  if (periodo) {
    datos.push({ icono: 'calendar-outline', etiqueta: 'Período de tránsito', valor: periodo });
  }

  if (hogar) datos.push(...datosDelHogar(hogar, propio ? 'Sobre tu casa' : 'Sobre su casa'));

  if (datos.length === 0) {
    return (
      <View className="rounded-2xl bg-organic-surface p-4 shadow-sm">
        <Text className="font-cuerpo text-[14px] italic text-organic-neutral-600">
          Sin datos del hogar.
        </Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl bg-organic-surface shadow-sm">
      {datos.map((dato, indice) => (
        <View
          key={dato.etiqueta}
          className={`flex-row items-start gap-3 px-4 py-3 ${
            indice < datos.length - 1 ? 'border-b border-organic-neutral-200' : ''
          }`}
        >
          <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-organic-accent-100">
            <Ionicons name={dato.icono} size={17} color={PALETA.accent[600]} />
          </View>

          <View className="flex-1">
            <Text className="font-cuerpo text-[12px] text-organic-neutral-600">{dato.etiqueta}</Text>
            <Text className="mt-0.5 font-cuerpo-semi text-[15.5px] leading-[21px] text-organic-neutral-900">
              {dato.valor}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
