/**
 * Convierte un error de axios en un mensaje para mostrarle al usuario.
 * `byStatus` permite textos propios de cada pantalla para ciertos códigos HTTP.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  byStatus: Record<number, string> = {},
): string {
  const response = (error as { response?: { status?: number; data?: { message?: unknown } } })
    ?.response
  const custom = response?.status ? byStatus[response.status] : undefined
  if (custom) return custom

  const message = response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}
