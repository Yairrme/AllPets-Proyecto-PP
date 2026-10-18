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
  documentosCertificacion: string[]
  calificacion: number
  totalResenas: number
  tarifaHora: number
  aniosExperiencia: number
  biografia: string
  zona: string
  telefono: string
  diasDisponibles: string[]
  horariosDisponibles: BloqueHorario[]
  insignias: string[]
  especialidades: string[]
  tamanosAceptados: TamanoMascota[]
  destacado?: boolean
}

export interface FiltrosPaseador {
  busqueda: string
  zona: string
  rol: RolTrabajador | ''
  tarifaMaxima: number
  calificacionMinima: number
  tamanoMascota: TamanoMascota | ''
}
