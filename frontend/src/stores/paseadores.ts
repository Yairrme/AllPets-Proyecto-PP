import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import type { Paseador, FiltrosPaseador, TamanoMascota } from '../types/paseador'

const COVERAGE_ZONES = ['Cipolletti', 'Neuquén']

export const usePaseadoresStore = defineStore('paseadores', () => {
  // Estado inicial de paseadores (Mock Data Premium de respaldo)
  const paseadoresMock: Paseador[] = [
    {
      id: 'mock-1',
      nombre: 'Sofía Rodríguez',
      foto: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdpjxw6ceJAzmSHd8eHnwrCmZDhx4bswUFZQqzD-nZ1ky0nocf77ovVH0&s=10',
      calificacion: 4.9,
      totalResenas: 124,
      tarifaHora: 4500,
      aniosExperiencia: 5,
      biografia: 'Amante de los animales y estudiante de Veterinaria. Paseos dinámicos en parques con hidratación y juegos de estimulación mental incluidos. Especial paciencia con perros tímidos o cachorros.',
      zona: 'Cipolletti',
      telefono: '+54 299 456-7890',
      diasDisponibles: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
      horariosDisponibles: ['mañana', 'tarde'],
      insignias: ['Verificado', 'Primeros Auxilios', 'Estudiante Vet', 'Top Rated'],
      especialidades: ['Cachorros', 'Socialización', 'Paseos Individuales'],
      tamanosAceptados: ['pequeño', 'mediano', 'grande'],
      destacado: true,
    },
    {
      id: 'mock-2',
      nombre: 'Martín Gómez',
      foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      calificacion: 4.8,
      totalResenas: 98,
      tarifaHora: 4200,
      aniosExperiencia: 4,
      biografia: 'Cuidador de perros grandes y gatos. Atención personalizada con paseos, visitas y cuidado en casa.',
      zona: 'Neuquén',
      telefono: '+54 299 321-3344',
      diasDisponibles: ['Lunes', 'Miércoles', 'Viernes', 'Sábado'],
      horariosDisponibles: ['mañana', 'tarde'],
      insignias: ['Verificado', 'Cuidador Senior', 'Respetuoso'],
      especialidades: ['Paseos', 'Cuidado en casa', 'Perros grandes'],
      tamanosAceptados: ['mediano', 'grande'],
      destacado: false,
    }
  ]

  const paseadores = ref<Paseador[]>(paseadoresMock)

  async function fetchPaseadores() {
    try {
      const response = await axios.get('http://localhost:3000/users');
      const users = response.data;
      
      const paseadoresDisponibles: Paseador[] = [];

      for (const user of users) {
        if (user.role === 'walker' || user.role === 'caregiver') {
          try {
            const profileRes = await axios.get(`http://localhost:3000/users/${user._id}/caregiver-profile`);
            const profile = profileRes.data;
            const rawCity = user.city || profile?.city || profile?.zona || 'Cipolletti';
            const zoneName = COVERAGE_ZONES.includes(rawCity) ? rawCity : 'Cipolletti';

            paseadoresDisponibles.push({
              id: user._id,
              nombre: user.name,
              foto: 'https://via.placeholder.com/150',
              calificacion: profile.rating_avg || 0,
              totalResenas: 0,
              tarifaHora: profile.tarifaHora || 3500,
              aniosExperiencia: 1,
              biografia: profile.bio || 'Sin biografía.',
              zona: zoneName,
              telefono: user.phone || '',
              diasDisponibles: profile.availability && profile.availability.length ? profile.availability : ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
              horariosDisponibles: ['mañana', 'tarde'],
              insignias: ['Verificado'],
              especialidades: profile.services && profile.services.length ? profile.services : ['Paseos'],
              tamanosAceptados: ['pequeño', 'mediano', 'grande'],
              destacado: false,
            });
          } catch (e) {
            console.error('Error al obtener perfil para', user.name, e);
          }
        }
      }

      // Reemplaza los datos mock si encontramos paseadores reales en la base de datos
      if (paseadoresDisponibles.length > 0) {
        paseadores.value = paseadoresDisponibles;
      }
    } catch (error) {
      console.error('No se pudo conectar con el backend, usando datos mock:', error);
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
    filtros,
    paseadoresFiltrados,
    zonasDisponibles,
    fetchPaseadores,
    setFiltros,
    resetFiltros,
    getPaseadorById,
  }
})
