import { toApiUrl } from '../config'
import type { Paseador, TamanoMascota } from '../types/paseador'

export const COVERAGE_ZONES = ['Cipolletti', 'Neuquén']

/**
 * Imagen para prestadores sin foto: una huellita en los colores de la marca.
 * (Antes era la foto de stock de una persona, que podía confundirse con el prestador.)
 */
export const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
      '<rect width="400" height="400" fill="#f6f1ec"/>' +
      '<g fill="#634a39" opacity="0.55" transform="translate(200 205)">' +
      '<ellipse cx="-62" cy="-38" rx="24" ry="30"/><ellipse cx="-22" cy="-78" rx="24" ry="30"/>' +
      '<ellipse cx="22" cy="-78" rx="24" ry="30"/><ellipse cx="62" cy="-38" rx="24" ry="30"/>' +
      '<path d="M0 -22c-34 0-70 40-70 70 0 22 17 34 36 34 14 0 23-7 34-7s20 7 34 7c19 0 36-12 36-34 0-30-36-70-70-70z"/>' +
      '</g></svg>',
  )

/** Para `@error` de una <img>: si la foto no carga, muestra la imagen por defecto. */
export function onAvatarError(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.src !== DEFAULT_AVATAR) img.src = DEFAULT_AVATAR
}

function formatImageUrl(path?: string): string {
  if (!path) return DEFAULT_AVATAR
  return toApiUrl(path)
}

/**
 * Convierte un usuario prestador y su perfil profesional (como los devuelve la
 * API) en la tarjeta que ven los clientes. La usan el directorio público y la
 * vista previa del panel del prestador, así ambos se ven exactamente igual.
 */
export function toPaseador(user: any, profile: any): Paseador {
  const rawCity = user.city || profile?.city || profile?.zona || 'Cipolletti'
  const certificaciones: string[] = Array.isArray(profile?.certifications)
    ? profile.certifications.filter(Boolean)
    : []
  const tamanos: TamanoMascota[] =
    Array.isArray(profile?.accepted_sizes) && profile.accepted_sizes.length > 0
      ? profile.accepted_sizes
      : ['pequeño', 'mediano', 'grande']

  return {
    id: user._id ?? user.id,
    nombre: user.name,
    rol: user.role === 'caregiver' ? 'caregiver' : 'walker',
    foto: formatImageUrl(profile?.profile_image || user.profile_image),
    galeriaFotos: Array.isArray(profile?.gallery_images)
      ? profile.gallery_images.filter(Boolean).map((img: string) => formatImageUrl(img))
      : [],
    certificaciones,
    calificacion: Number(profile?.rating_avg) || 0,
    totalResenas: Number(profile?.total_reviews) || 0,
    tarifaHora: Number(profile?.hourly_rate ?? profile?.tarifaHora) || 4000,
    aniosExperiencia: Number(profile?.experience_years) || 1,
    biografia:
      profile?.bio || 'Paseador y cuidador comprometido con el cuidado y la felicidad de tu mascota.',
    zona: COVERAGE_ZONES.includes(rawCity) ? rawCity : 'Cipolletti',
    telefono: user.phone || '',
    diasDisponibles:
      profile?.availability && profile.availability.length
        ? profile.availability
        : ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    horariosDisponibles: ['mañana', 'tarde'],
    insignias: ['Verificado', ...certificaciones],
    especialidades:
      profile?.services && profile.services.length ? profile.services : ['Paseo', 'Cuidado'],
    tamanosAceptados: tamanos,
    // Perfiles anteriores a este campo no lo tienen: se consideran disponibles.
    disponible: profile?.is_available !== false,
    destacado: false,
  }
}
