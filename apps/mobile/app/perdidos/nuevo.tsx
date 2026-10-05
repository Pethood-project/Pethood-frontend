/**
 * GUI-25 Nueva publicación perdida/encontrada — HU-13.1: el alta de un aviso.
 *
 * El formulario vive en `FormularioAviso`, que comparte con la edición (HU-13.3). Acá sólo se
 * pide la ubicación del teléfono, que es lo único que el alta tiene y la edición no: la
 * precondición de la HU es tenerla habilitada, y sus coordenadas viajan con el aviso.
 */
import { FormularioAviso } from '@/components/perdidos/FormularioAviso';
import { useUbicacionDispositivo } from '@/hooks/useUbicacionDispositivo';

export default function NuevoAvisoPerdidoScreen() {
  const ubicacion = useUbicacionDispositivo();

  return <FormularioAviso ubicacion={ubicacion} />;
}
