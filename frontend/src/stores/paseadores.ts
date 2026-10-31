/**
 * ============================================================================
 * ARCHIVO: stores/paseadores.ts
 * ROL EN LA ARQUITECTURA: Store de Pinia (Composition API) del Catálogo de Paseadores.
 * ============================================================================
 * Descripción general:
 * Administra la carga pública de paseadores y cuidadores desde el API Gateway,
 * combina los datos básicos de usuario con su perfil profesional extendido
 * (`CaregiverProfile`), formatea las URLs de imágenes y aplica el filtrado
 * reactivo en tiempo real por ciudad, rol, búsqueda, tarifa, calificación y tamaño.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import type { Paseador, FiltrosPaseador, TamanoMascota } from '../types/paseador'

// Ciudades de cobertura oficial del servicio en el Alto Valle
const COVERAGE_ZONES = ['Cipolletti', 'Neuquén']

export const usePaseadoresStore = defineStore('paseadores', () => {
  // ESTADO REACTIVO (Refs):
  // Lista completa de paseadores/cuidadores obtenidos del backend
  const paseadores = ref<Paseador[]>([])
  // Indicador de carga para mostrar skeletons/spinners mientras responde la API
  const isLoading = ref(false)

  // Imagen de respaldo cuando un trabajador aún no ha subido su foto de perfil
  const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'

  /**
   * Normaliza una ruta de imagen devuelta por el backend:
   * - Si no hay ruta, devuelve el avatar por defecto.
   * - Si ya es una URL absoluta (`http...`), la devuelve tal cual.
   * - Si es una ruta relativa (`/uploads/...`), le antepone la URL del API Gateway (`http://localhost:3000`).
   */
  function formatImageUrl(path?: string): string {
    if (!path) return DEFAULT_AVATAR
    if (path.startsWith('http')) return path
    return `http://localhost:3000${path.startsWith('/') ? '' : '/'}${path}`
  }

  /**
   * Consulta al API Gateway (`GET /caregivers`) para obtener todos los trabajadores
   * y luego enriquece cada uno consultando su perfil detallado (`GET /caregivers/:id/profile`),
   * mapeando la respuesta del backend hacia la interfaz `Paseador` usada por la vista.
   */
  async function fetchPaseadores() {
    isLoading.value = true
    try {
      // 1. Llamada Axios al API Gateway para listar los usuarios con rol de trabajador
      const response = await axios.get('http://localhost:3000/caregivers')
      const users = response.data?.data || []
      
      const paseadoresDisponibles: Paseador[] = []

      // 2. Iteramos cada trabajador para obtener su perfil extendido (tarifa, bio, galería, certificaciones)
      for (const user of users) {
        if (user.role === 'walker' || user.role === 'caregiver') {
          let profile: any = null
          try {
            // Endpoint público para obtener detalles del cuidador/paseador sin requerir token
            const profileRes = await axios.get(`http://localhost:3000/caregivers/${user._id}/profile`)
            profile = profileRes.data
          } catch {
            // Perfil aún sin datos adicionales o en proceso de carga
          }

          // Normalización de ciudad, fotos, galería, certificaciones y tamaños aceptados
          const rawCity = user.city || profile?.city || profile?.zona || 'Cipolletti'
          const zoneName = COVERAGE_ZONES.includes(rawCity) ? rawCity : 'Cipolletti'
          const fotoUrl = formatImageUrl(profile?.profile_image || user.profile_image)
          const galeriaUrls = Array.isArray(profile?.gallery_images)
            ? profile.gallery_images.filter(Boolean).map((img: string) => formatImageUrl(img))
            : []
          const certificaciones = Array.isArray(profile?.certifications)
            ? profile.certifications.filter(Boolean)
            : []
          const documentosCertificacion = Array.isArray(profile?.certification_documents)
            ? profile.certification_documents.filter(Boolean).map((doc: string) => formatImageUrl(doc))
            : []
          const tamanos: TamanoMascota[] =
            Array.isArray(profile?.accepted_sizes) && profile.accepted_sizes.length > 0
              ? profile.accepted_sizes
              : ['pequeño', 'mediano', 'grande']

          // Construimos el objeto tipado `Paseador` con valores por defecto seguros si faltan campos opcionales
          paseadoresDisponibles.push({
            id: user._id,
            nombre: user.name,
            rol: user.role === 'caregiver' ? 'caregiver' : 'walker',
            foto: fotoUrl,
            galeriaFotos: galeriaUrls,
            certificaciones,
            documentosCertificacion,
            calificacion: Number(profile?.rating_avg) || 5.0,
            totalResenas: Number(profile?.total_reviews) || 0,
            tarifaHora: Number(profile?.hourly_rate ?? profile?.tarifaHora) || 4000,
            aniosExperiencia: Number(profile?.experience_years) || 1,
            biografia: profile?.bio || 'Paseador y cuidador comprometido con el cuidado y felicidad de tu mascota.',
            zona: zoneName,
            telefono: user.phone || '',
            diasDisponibles: profile?.availability && profile.availability.length ? profile.availability : ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
            horariosDisponibles: ['mañana', 'tarde'],
            insignias: ['Verificado', ...certificaciones],
            especialidades: profile?.services && profile.services.length ? profile.services : ['Paseo', 'Cuidado'],
            tamanosAceptados: tamanos,
            destacado: false,
          })
        }
      }

      paseadores.value = paseadoresDisponibles
    } catch (error) {
      console.error('Error al obtener lista de paseadores:', error)
      paseadores.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Filtros reactivos: almacenan los criterios seleccionados por el usuario en la interfaz
  const filtros = ref<FiltrosPaseador>({
    busqueda: '',
    zona: '',
    rol: '',
    tarifaMaxima: 100000,
    calificacionMinima: 0,
    tamanoMascota: '',
  })

  // Getters (Propiedades Computadas):
  // Filtra automáticamente la lista `paseadores` cada vez que cambia algún criterio en `filtros`
  const paseadoresFiltrados = computed(() => {
    return paseadores.value.filter((p) => {
      // Filtro de búsqueda por nombre o biografía o zona
      if (filtros.value.busqueda.trim() !== '') {
        const query = filtros.value.busqueda.toLowerCase().trim()
        const matchNombre = p.nombre.toLowerCase().includes(query)
        const matchZona = p.zona.toLowerCase().includes(query)
        const matchBio = p.biografia.toLowerCase().includes(query)
        if (!matchNombre && !matchZona && !matchBio) return false
      }

      // Filtro por zona (select)
      if (filtros.value.zona !== '' && p.zona !== filtros.value.zona) {
        return false
      }

      // Filtro por rol (paseador / cuidador)
      if (filtros.value.rol !== '' && p.rol !== filtros.value.rol) {
        return false
      }

      // Filtro por tarifa máxima
      if (p.tarifaHora > filtros.value.tarifaMaxima) {
        return false
      }

      // Filtro por calificación mínima
      if (p.calificacion < filtros.value.calificacionMinima) {
        return false
      }

      // Filtro por tamaño de mascota
      if (filtros.value.tamanoMascota !== '' && !p.tamanosAceptados.includes(filtros.value.tamanoMascota)) {
        return false
      }

      return true
    })
  })

  // Devuelve las ciudades habilitadas para poblar los botones de filtro de ubicación
  const zonasDisponibles = computed(() => {
    return COVERAGE_ZONES
  })

  // Acciones para modificar o restablecer los filtros
  function setFiltros(nuevosFiltros: Partial<FiltrosPaseador>) {
    filtros.value = { ...filtros.value, ...nuevosFiltros }
  }

  // Restablece todos los filtros a sus valores iniciales para volver a mostrar todos los resultados
  function resetFiltros() {
    filtros.value = {
      busqueda: '',
      zona: '',
      rol: '',
      tarifaMaxima: 100000,
      calificacionMinima: 0,
      tamanoMascota: '',
    }
  }

  // Busca un paseador puntual en memoria por su ID (útil para refrescar el modal tras crear una reseña)
  function getPaseadorById(id: string): Paseador | undefined {
    return paseadores.value.find((p) => p.id === id)
  }

  return {
    paseadores,
    isLoading,
    filtros,
    paseadoresFiltrados,
    zonasDisponibles,
    fetchPaseadores,
    setFiltros,
    resetFiltros,
    getPaseadorById,
  }
})
