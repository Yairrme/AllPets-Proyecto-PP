import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Paseador, Reserva, FiltrosPaseador, TamanoMascota, EstadoReserva } from '../types/paseador'

export const usePaseadoresStore = defineStore('paseadores', () => {
  // Estado inicial de paseadores (Mock Data Premium)
  const paseadores = ref<Paseador[]>([
    {
      id: '1',
      nombre: 'Sofía Rodríguez',
      foto: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdpjxw6ceJAzmSHd8eHnwrCmZDhx4bswUFZQqzD-nZ1ky0nocf77ovVH0&s=10',
      calificacion: 4.9,
      totalResenas: 124,
      tarifaHora: 4500,
      aniosExperiencia: 5,
      biografia: 'Amante de los animales y estudiante de Veterinaria. Paseos dinámicos en parques con hidratación y juegos de estimulación mental incluidos. Especial paciencia con perros tímidos o cachorros.',
      zona: 'Cipolletti',
      diasDisponibles: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
      horariosDisponibles: ['mañana', 'tarde'],
      insignias: ['Verificado', 'Primeros Auxilios', 'Estudiante Vet', 'Top Rated'],
      especialidades: ['Cachorros', 'Socialización', 'Paseos Individuales'],
      tamanosAceptados: ['pequeño', 'mediano', 'grande'],
      destacado: true,
    }
  ])

  // Filtros reactivos
  const filtros = ref<FiltrosPaseador>({
    busqueda: '',
    zona: '',
    tarifaMaxima: 8000,
    calificacionMinima: 0,
    tamanoMascota: '',
  })

  // Lista de reservas (Inicializada con 2 reservas de demostración)
  const reservas = ref<Reserva[]>([
    {
      id: 'res-101',
      paseadorId: '1',
      paseadorNombre: 'Sofía Rodríguez',
      paseadorFoto: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdpjxw6ceJAzmSHd8eHnwrCmZDhx4bswUFZQqzD-nZ1ky0nocf77ovVH0&s=10',
      fecha: '2026-07-28',
      bloqueHorario: 'tarde',
      horaInicio: '16:00',
      duracionHoras: 2,
      nombreMascota: 'Bruno',
      razaMascota: 'Labrador',
      tamanoMascota: 'grande',
      costoTotal: 9000,
      estado: 'confirmada',
      notas: 'Le encanta jugar con la pelota en el parque.',
      fechaCreacion: '2026-07-25',
    },

  ])

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
    const zonasSet = new Set(paseadores.value.map((p) => p.zona))
    return Array.from(zonasSet).sort()
  })

  const totalReservasActivas = computed(() => {
    return reservas.value.filter((r) => r.estado === 'confirmada' || r.estado === 'pendiente').length
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

  function crearReserva(nuevaReserva: Omit<Reserva, 'id' | 'fechaCreacion' | 'estado'>): Reserva {
    const id = `res-${Date.now().toString().slice(-4)}`
    const reservaCompleta: Reserva = {
      ...nuevaReserva,
      id,
      estado: 'confirmada',
      fechaCreacion: (new Date().toISOString().split('T')[0]) || '',
    }
    reservas.value.unshift(reservaCompleta)
    return reservaCompleta
  }

  function cancelarReserva(reservaId: string) {
    const index = reservas.value.findIndex((r) => r.id === reservaId)
    if (index !== -1) {
      const res = reservas.value[index]
      if (res) res.estado = 'cancelada'
    }
  }

  function getPaseadorById(id: string): Paseador | undefined {
    return paseadores.value.find((p) => p.id === id)
  }

  return {
    paseadores,
    filtros,
    reservas,
    paseadoresFiltrados,
    zonasDisponibles,
    totalReservasActivas,
    setFiltros,
    resetFiltros,
    crearReserva,
    cancelarReserva,
    getPaseadorById,
  }
})
