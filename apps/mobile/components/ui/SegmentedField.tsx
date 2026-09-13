/** El control segmentado con etiqueta, marca de obligatorio y mensaje de error. */
import { View } from 'react-native';
import { FormField, type VarianteCampo } from './FormField';
import { Segmentado, type OpcionSegmento, type VarianteSegmentado } from './Segmentado';

export type { OpcionSegmento } from './Segmentado';

interface SegmentedFieldProps<T> {
  label: string;
  opciones: OpcionSegmento<T>[];
  valor: T | null;
  onChange: (valor: T) => void;
  obligatorio?: boolean;
  error?: string;
  variante?: VarianteSegmentado;
  varianteCampo?: VarianteCampo;
}

export function SegmentedField<T extends string | number>({
  label,
  opciones,
  valor,
  onChange,
  obligatorio,
  error,
  variante,
  varianteCampo,
}: SegmentedFieldProps<T>) {
  return (
    // El riel dibuja su propio contorno alrededor del grupo y las tarjetas el suyo: ninguno
    // de los dos quiere además la caja de la variante "pregunta".
    <FormField
      label={label}
      obligatorio={obligatorio}
      error={error}
      variante={varianteCampo}
      conCaja={false}
    >
      <View className="mt-1">
        <Segmentado
          opciones={opciones}
          valor={valor}
          onChange={onChange}
          variante={variante}
          conError={Boolean(error)}
        />
      </View>
    </FormField>
  );
}
