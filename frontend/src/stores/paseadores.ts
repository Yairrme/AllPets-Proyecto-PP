import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import type { Paseador, FiltrosPaseador } from '../types/paseador'
import { API_URL } from '../config'
import { COVERAGE_ZONES, toPaseador } from '../utils/paseador'

const PAGE_SIZE = 12
const DESTACADOS = 6
const TARIFA_SIN_LIMITE = 100000

const FILTROS_INICIALES: FiltrosPaseador = {
  busqueda: '',
  zona: '',
  rol: '',
  tarifaMaxima: TARIFA_SIN_LIMITE,
  calificacionMinima: 0,
  tamanoMascota: '',
  soloDisponibles: false,
}

const ERROR_LISTADO =
  'No pudimos cargar los paseadores y cuidadores. Verificá que el servidor esté encendido e intentá de nuevo.'

interface DirectorioResponse {
  data: any[]
  pagination: { page: number; total: number; totalPages: number }
}

const aPaseadores = (users: any[]): Paseador[] =>
  users.map((user) => toPaseador(user, user.profile ?? null))

/** Los filtros se resuelven en la API: en el navegador solo está la página cargada. */
function aParametros(filtros: FiltrosPaseador): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {}
  const busqueda = filtros.busqueda.trim()
  if (busqueda) params.q = busqueda
  if (filtros.zona) params.city = filtros.zona
  if (filtros.rol) params.role = filtros.rol
  if (filtros.tarifaMaxima < TARIFA_SIN_LIMITE) params.max_rate = filtros.tarifaMaxima
  if (filtros.calificacionMinima > 0) params.min_rating = filtros.calificacionMinima
  if (filtros.tamanoMascota) params.pet_size = filtros.tamanoMascota
  if (filtros.soloDisponibles) params.available = true
  return params
}

export const usePaseadoresStore = defineStore('paseadores', () => {
  const paseadores = ref<Paseador[]>([])
  const total = ref(0)
  const page = ref(1)
  const totalPages = ref(1)
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const error = ref('')
  const filtros = ref<FiltrosPaseador>({ ...FILTROS_INICIALES })

  const destacados = ref<Paseador[]>([])
  const disponiblesCount = ref(0)

  // Si cambian los filtros mientras hay una petición en curso, gana la última.
  let ultimaPeticion = 0

  async function pedirDirectorio(pagina: number) {
    const response = await axios.get<DirectorioResponse>(`${API_URL}/caregivers`, {
      params: { ...aParametros(filtros.value), page: pagina, limit: PAGE_SIZE },
    })
    if (!Array.isArray(response.data?.data)) {
      throw new Error('Respuesta inesperada del servidor')
    }
    return response.data
  }

  async function fetchPaseadores() {
    const peticion = ++ultimaPeticion
    isLoading.value = true
    error.value = ''
    try {
      const { data, pagination } = await pedirDirectorio(1)
      if (peticion !== ultimaPeticion) return
      paseadores.value = aPaseadores(data)
      total.value = pagination.total
      page.value = 1
      totalPages.value = pagination.totalPages
    } catch (e) {
      if (peticion !== ultimaPeticion) return
      console.error('Error al obtener lista de paseadores:', e)
      paseadores.value = []
      total.value = 0
      error.value = ERROR_LISTADO
    } finally {
      if (peticion === ultimaPeticion) isLoading.value = false
    }
  }

  async function fetchMas() {
    if (isLoadingMore.value || page.value >= totalPages.value) return
    const peticion = ultimaPeticion
    isLoadingMore.value = true
    try {
      const { data, pagination } = await pedirDirectorio(page.value + 1)
      if (peticion !== ultimaPeticion) return
      paseadores.value = [...paseadores.value, ...aPaseadores(data)]
      total.value = pagination.total
      page.value = pagination.page
      totalPages.value = pagination.totalPages
    } catch (e) {
      console.error('Error al obtener más paseadores:', e)
      error.value = ERROR_LISTADO
    } finally {
      isLoadingMore.value = false
    }
  }

  /** Lo que muestra la página de inicio: no depende de los filtros del directorio. */
  async function fetchDestacados() {
    isLoading.value = true
    error.value = ''
    try {
      const [lista, disponibles] = await Promise.all([
        axios.get<DirectorioResponse>(`${API_URL}/caregivers`, { params: { limit: DESTACADOS } }),
        axios.get<DirectorioResponse>(`${API_URL}/caregivers`, {
          params: { limit: 1, available: true },
        }),
      ])
      destacados.value = aPaseadores(lista.data.data)
      disponiblesCount.value = disponibles.data.pagination.total
    } catch (e) {
      console.error('Error al obtener paseadores destacados:', e)
      destacados.value = []
      error.value = ERROR_LISTADO
    } finally {
      isLoading.value = false
    }
  }

  /** Un prestador puntual; también actualiza su tarjeta si está en la lista. */
  async function fetchPaseador(id: string): Promise<Paseador | null> {
    try {
      const { data } = await axios.get(`${API_URL}/caregivers/${id}`)
      const paseador = toPaseador(data, data.profile ?? null)
      paseadores.value = paseadores.value.map((p) => (p.id === id ? paseador : p))
      return paseador
    } catch (e) {
      console.error('Error al obtener el paseador:', e)
      return null
    }
  }

  const zonasDisponibles = computed(() => COVERAGE_ZONES)
  const hayMas = computed(() => page.value < totalPages.value)

  function setFiltros(nuevosFiltros: Partial<FiltrosPaseador>) {
    filtros.value = { ...filtros.value, ...nuevosFiltros }
  }

  function resetFiltros() {
    filtros.value = { ...FILTROS_INICIALES }
  }

  return {
    paseadores,
    total,
    hayMas,
    isLoading,
    isLoadingMore,
    error,
    filtros,
    destacados,
    disponiblesCount,
    zonasDisponibles,
    fetchPaseadores,
    fetchMas,
    fetchDestacados,
    fetchPaseador,
    setFiltros,
    resetFiltros,
  }
})
