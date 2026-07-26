export type TamanoMascota = 'pequeño' | 'mediano' | 'grande'

export type EstadoReserva = 'confirmada' | 'pendiente' | 'completada' | 'cancelada'

export type BloqueHorario = 'mañana' | 'tarde' | 'noche'

export interface Paseador {
  id: string
  nombre: string
  foto: string
  calificacion: number
  totalResenas: number
  tarifaHora: number
  aniosExperiencia: number
  biografia: string
  zona: string
  diasDisponibles: string[]
  horariosDisponibles: BloqueHorario[]
  insignias: string[]
  especialidades: string[]
  tamanosAceptados: TamanoMascota[]
  destacado?: boolean
}

export interface Reserva {
  id: string
  paseadorId: string
  paseadorNombre: string
  paseadorFoto: string
  fecha: string
  bloqueHorario: BloqueHorario
  horaInicio: string
  duracionHoras: number
  nombreMascota: string
  razaMascota: string
  tamanoMascota: TamanoMascota
  costoTotal: number
  estado: EstadoReserva
  notas?: string
  fechaCreacion: string
}

export interface FiltrosPaseador {
  busqueda: string
  zona: string
  tarifaMaxima: number
  calificacionMinima: number
  tamanoMascota: TamanoMascota | ''
}
