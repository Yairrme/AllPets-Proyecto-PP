import type { Paseador } from '../types/paseador'

/**
 * Link de WhatsApp para contactar a un paseador/cuidador, o null si el teléfono
 * está vacío o no está tomando clientes nuevos.
 */
export function whatsappLink(paseador: Paseador, telefono: string): string | null {
  const phone = telefono.replace(/[^\d]/g, '')
  if (!phone || !paseador.disponible) return null
  const nombreCorto = paseador.nombre.split(' ')[0] || paseador.nombre
  const texto = `Hola ${nombreCorto}, te encontré en AllPets y me gustaría contactarte por un ${
    paseador.rol === 'walker' ? 'paseo' : 'cuidado'
  }.`
  return `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`
}
