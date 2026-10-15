export interface AssetFields {
  /** Percent as typed: 110 for 110% of CDI. */
  rate: number | null;
  amount: number | null;
  calendarDays: number | null;
}

export type FieldErrors = Partial<Record<keyof AssetFields, string>>;

export function validateAsset(f: AssetFields): FieldErrors {
  const errors: FieldErrors = {};
  if (f.rate === null) errors.rate = 'Informe a taxa';
  else if (f.rate <= -100) errors.rate = 'A taxa deve ser maior que -100%';
  if (f.amount === null || f.amount <= 0) errors.amount = 'O valor investido deve ser maior que zero';
  if (f.calendarDays === null || f.calendarDays <= 0) errors.calendarDays = 'O prazo deve ser maior que zero';
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
