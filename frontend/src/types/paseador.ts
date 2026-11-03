export type TamanoMascota = 'pequeño' | 'mediano' | 'grande'

export type BloqueHorario = 'mañana' | 'tarde' | 'noche'

export type RolTrabajador = 'walker' | 'caregiver'

export interface Paseador {
  id: string
  nombre: string
  rol: RolTrabajador
  foto: string
  galeriaFotos: string[]
  certificaciones: string[]
  calificacion: number
  totalResenas: number
  tarifaHora: number
  aniosExperiencia: number
  biografia: string
  zona: string
  // Solo en la vista previa del propio prestador: el directorio público no lo trae
  telefono: string
  diasDisponibles: string[]
  horariosDisponibles: BloqueHorario[]
  insignias: string[]
  especialidades: string[]
  tamanosAceptados: TamanoMascota[]
  // El prestador acepta clientes nuevos (lo activa o desactiva desde su panel)
  disponible: boolean
  destacado?: boolean
}

export interface FiltrosPaseador {
  busqueda: string
  zona: string
  rol: RolTrabajador | ''
  tarifaMaxima: number
  calificacionMinima: number
  tamanoMascota: TamanoMascota | ''
  soloDisponibles: boolean
}
