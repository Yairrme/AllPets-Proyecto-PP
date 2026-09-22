import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import type { Paseador, FiltrosPaseador, TamanoMascota } from '../types/paseador'

const COVERAGE_ZONES = ['Cipolletti', 'Neuquén']

export const usePaseadoresStore = defineStore('paseadores', () => {
  const paseadores = ref<Paseador[]>([])
  const isLoading = ref(false)

  const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'

  function formatImageUrl(path?: string): string {
    if (!path) return DEFAULT_AVATAR
    if (path.startsWith('http')) return path
    return `http://localhost:3000${path.startsWith('/') ? '' : '/'}${path}`
  }

  async function fetchPaseadores() {
    isLoading.value = true
    try {
      const response = await axios.get('http://localhost:3000/caregivers')
      const users = response.data?.data || []
      
      const paseadoresDisponibles: Paseador[] = []

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

          const rawCity = user.city || profile?.city || profile?.zona || 'Cipolletti'
          const zoneName = COVERAGE_ZONES.includes(rawCity) ? rawCity : 'Cipolletti'
          const fotoUrl = formatImageUrl(profile?.profile_image || user.profile_image)

          paseadoresDisponibles.push({
            id: user._id,
            nombre: user.name,
            foto: fotoUrl,
            calificacion: Number(profile?.rating_avg) || 5.0,
            totalResenas: Number(profile?.total_reviews) || 0,
            tarifaHora: Number(profile?.tarifaHora) || 4000,
            aniosExperiencia: Number(profile?.experience_years) || 1,
            biografia: profile?.bio || 'Paseador y cuidador comprometido con el cuidado y felicidad de tu mascota.',
            zona: zoneName,
            telefono: user.phone || '',
            diasDisponibles: profile?.availability && profile.availability.length ? profile.availability : ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
            horariosDisponibles: ['mañana', 'tarde'],
            insignias: ['Verificado'],
            especialidades: profile?.services && profile.services.length ? profile.services : ['Paseo', 'Cuidado'],
            tamanosAceptados: ['pequeño', 'mediano', 'grande'],
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

  // Filtros reactivos
  const filtros = ref<FiltrosPaseador>({
    busqueda: '',
    zona: '',
    tarifaMaxima: 8000,
    calificacionMinima: 0,
    tamanoMascota: '',
  })

  // Getters
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

  const zonasDisponibles = computed(() => {
    return COVERAGE_ZONES
  })

  // Acciones
  function setFiltros(nuevosFiltros: Partial<FiltrosPaseador>) {
    filtros.value = { ...filtros.value, ...nuevosFiltros }
  }

  function resetFiltros() {
    filtros.value = {
      busqueda: '',
      zona: '',
      tarifaMaxima: 8000,
      calificacionMinima: 0,
      tamanoMascota: '',
    }
  }

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
