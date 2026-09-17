export type FechaNacimientoPickerProps = {
  visible: boolean;
  value: Date;
  minimumDate: Date;
  maximumDate: Date;
  onSelect: (fecha: Date) => void;
  onCancel: () => void;
};
