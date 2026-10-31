/**
 * ============================================================================
 * ARCHIVO: types/paseador.ts
 * ROL EN LA ARQUITECTURA: Contratos de Tipos e Interfaces TypeScript del Dominio.
 * ============================================================================
 * Descripción general:
 * Centraliza los tipos de datos utilizados en los stores de Pinia, componentes
 * de tarjetas, filtros y vistas del catálogo de paseadores y cuidadores,
 * garantizando autocompletado y seguridad de tipos en tiempo de compilación.
 */

// Tamaños de mascota admitidos por los paseadores y cuidadores
export type TamanoMascota = 'pequeño' | 'mediano' | 'grande'

// Franjas horarias posibles para la disponibilidad de servicios
export type BloqueHorario = 'mañana' | 'tarde' | 'noche'

// Roles de trabajadores prestadores de servicio dentro de la plataforma
export type RolTrabajador = 'walker' | 'caregiver'

/**
 * Interfaz principal que representa a un Paseador o Cuidador ya normalizado
 * para ser renderizado en el catálogo y en el modal de detalle del frontend.
 */
export interface Paseador {
  id: string                              // Identificador único del usuario en MongoDB (_id)
  nombre: string                          // Nombre completo del trabajador
  rol: RolTrabajador                      // Tipo de servicio principal: 'walker' (paseador) o 'caregiver' (cuidador)
  foto: string                            // URL completa de la imagen de perfil (o avatar por defecto)
  galeriaFotos: string[]                  // Lista de URLs de fotos subidas a su galería de trabajos
  certificaciones: string[]               // Títulos de permisos municipales, cursos o certificaciones
  documentosCertificacion: string[]       // URLs de imágenes de comprobantes/carnets de certificación
  calificacion: number                    // Promedio de calificación en estrellas (1 a 5)
  totalResenas: number                    // Cantidad total de reseñas recibidas por clientes
  tarifaHora: number                      // Precio cobrado por hora de servicio en pesos ($)
  aniosExperiencia: number                // Cantidad de años de experiencia declarados
  biografia: string                       // Descripción personal y presentación del trabajador
  zona: string                            // Ciudad de cobertura ('Cipolletti' o 'Neuquén')
  telefono: string                        // Número de contacto para llamadas y enlace directo a WhatsApp
  diasDisponibles: string[]               // Días de la semana en los que presta servicio
  horariosDisponibles: BloqueHorario[]    // Bloques horarios disponibles
  insignias: string[]                     // Etiquetas destacadas mostradas en su tarjeta (ej. 'Verificado' + certificaciones)
  especialidades: string[]                // Lista de servicios ofrecidos (ej. 'Paseo', 'Cuidado en casa')
  tamanosAceptados: TamanoMascota[]       // Tamaños de perro/mascota que acepta cuidar o pasear
  destacado?: boolean                     // Indicador opcional para resaltar perfiles en el listado
}

/**
 * Estructura del estado reactivo de filtros aplicados por el usuario
 * en la vista del catálogo de paseadores (`PaseadoresView` / `PaseadoresFilter`).
 */
export interface FiltrosPaseador {
  busqueda: string                        // Texto libre para buscar por nombre, zona o biografía
  zona: string                            // Ciudad seleccionada ('Cipolletti', 'Neuquén' o '' para todas)
  rol: RolTrabajador | ''                 // Filtro por tipo de trabajador ('walker', 'caregiver' o '' para ambos)
  tarifaMaxima: number                    // Tope máximo de tarifa por hora
  calificacionMinima: number              // Calificación mínima en estrellas
  tamanoMascota: TamanoMascota | ''       // Filtro por tamaño de mascota aceptado
}
