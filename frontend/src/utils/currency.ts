const formatters = {
  entero: new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),
  conCentavos: new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
}

/**
 * Formatea un importe en pesos argentinos: punto para miles y coma para
 * decimales. Los montos enteros se muestran sin centavos.
 *   formatARS(4000)   -> "$ 4.000"
 *   formatARS(2550.5) -> "$ 2.550,50"
 */
export function formatARS(value: number | null | undefined): string {
  const amount = Number(value) || 0
  return Number.isInteger(amount)
    ? formatters.entero.format(amount)
    : formatters.conCentavos.format(amount)
}
