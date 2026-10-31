/**
 * ============================================================================
 * ARCHIVO: stores/profile.ts
 * ROL EN LA ARQUITECTURA: Store de Pinia para Gestión de Perfiles, Archivos y Reseñas.
 * ============================================================================
 * Descripción general:
 * Conecta las vistas de cliente (`ClientProfileView`), onboarding (`WorkerOnboardingView`),
 * panel de trabajador (`WorkerDashboardView`) y catálogo (`PaseadoresView`) con el API Gateway.
 * Gestiona la lectura y actualización de perfiles, subida de imágenes/documentos mediante
 * `multipart/form-data`, y la consulta y publicación de reseñas calificadas.
 */

import { defineStore } from 'pinia'
import axios from 'axios'

// URL base del API Gateway donde se reciben las peticiones HTTP y los archivos estáticos
const API_URL = 'http://localhost:3000'

/**
 * Función utilitaria que extrae el mensaje de error enviado por el backend
 * o retorna un mensaje alternativo (`fallback`) comprensible para el usuario.
 */
function getApiErrorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}

export const useProfileStore = defineStore('profile', {
  // ESTADO REACTIVO (State):
  // - caregiverProfile: datos profesionales del paseador/cuidador actual
  // - reviews: lista de reseñas del trabajador consultado
  state: () => ({
    caregiverProfile: null as any | null,
    reviews: [] as any[],
  }),

  // ACCIONES (Actions): Operaciones asíncronas con Axios hacia el API Gateway
  actions: {
    /**
     * Obtiene el perfil profesional extendido de un paseador/cuidador (`GET /caregivers/:userId/profile`).
     */
    async fetchCaregiverProfile(userId: string) {
      try {
        const response = await axios.get(`${API_URL}/caregivers/${userId}/profile`)
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error fetching profile', error)
        throw new Error(getApiErrorMessage(error, 'No se pudo cargar el perfil'))
      }
    },
    
    /**
     * Actualiza los datos profesionales del trabajador (`PUT /users/:userId/caregiver-profile`),
     * tales como biografía, tarifa por hora, años de experiencia, servicios, disponibilidad y certificaciones.
     */
    async updateCaregiverProfile(userId: string, updateData: any) {
      try {
        const response = await axios.put(`${API_URL}/users/${userId}/caregiver-profile`, updateData)
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error updating profile', error)
        throw new Error(getApiErrorMessage(error, 'No se pudo guardar el perfil'))
      }
    },
    
    /**
     * Sube la foto de perfil de un trabajador mediante `FormData` (`POST /users/:userId/caregiver-profile/image`).
     */
    async uploadProfileImage(userId: string, file: File) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await axios.post(`${API_URL}/users/${userId}/caregiver-profile/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error uploading image', error)
        throw new Error(getApiErrorMessage(error, 'No se pudo subir la imagen'))
      }
    },
    
    /**
     * Sube la foto de perfil de un usuario cliente mediante `FormData` (`POST /users/:userId/image`).
     */
    async uploadClientProfileImage(userId: string, file: File) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await axios.post(`${API_URL}/users/${userId}/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data
      } catch (error: any) {
        console.error('Error uploading image', error)
        throw new Error(getApiErrorMessage(error, 'No se pudo subir la foto de perfil'))
      }
    },

    /**
     * Obtiene los datos básicos de cuenta de un usuario por su ID (`GET /users/:userId`).
     */
    async fetchUserById(userId: string) {
      try {
        const response = await axios.get(`${API_URL}/users/${userId}`)
        return response.data
      } catch (error: any) {
        console.error('Error fetching user data', error)
        throw new Error(getApiErrorMessage(error, 'No se pudieron cargar los datos del usuario'))
      }
    },

    /**
     * Actualiza los datos personales básicos (nombre, email, ciudad, teléfono) de un usuario (`PUT /users/:userId`).
     */
    async updateClientProfile(userId: string, updateData: { name?: string; email?: string; city?: string; phone?: string }) {
      try {
        const response = await axios.put(`${API_URL}/users/${userId}`, updateData)
        return response.data
      } catch (error: any) {
        console.error('Error updating client profile', error)
        throw new Error(getApiErrorMessage(error, 'No se pudieron guardar los cambios del perfil'))
      }
    },
    
    /**
     * Sube múltiples imágenes a la galería de trabajos del paseador/cuidador (`POST /users/:userId/caregiver-profile/gallery`).
     */
    async uploadGalleryImages(userId: string, files: File[]) {
      try {
        const formData = new FormData()
        for (const file of files) {
          formData.append('files', file)
        }
        
        const response = await axios.post(`${API_URL}/users/${userId}/caregiver-profile/gallery`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error uploading gallery', error)
        throw new Error(getApiErrorMessage(error, 'No se pudo subir la galería'))
      }
    },

    /**
     * Sube imágenes de comprobantes de certificaciones o permisos municipales (`POST /users/:userId/caregiver-profile/certifications`).
     */
    async uploadCertificationDocuments(userId: string, files: File[]) {
      try {
        const formData = new FormData()
        for (const file of files) {
          formData.append('files', file)
        }

        const response = await axios.post(`${API_URL}/users/${userId}/caregiver-profile/certifications`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error uploading certification documents', error)
        throw new Error(getApiErrorMessage(error, 'No se pudieron subir los comprobantes de certificación'))
      }
    },
    
    /**
     * Obtiene todas las reseñas asociadas a un paseador/cuidador (`GET /caregivers/:caregiverId/reviews`).
     */
    async fetchReviews(caregiverId: string) {
      try {
        const response = await axios.get(`${API_URL}/caregivers/${caregiverId}/reviews`)
        this.reviews = Array.isArray(response.data)
          ? response.data
          : response.data?.data || []
        return this.reviews
      } catch (error: any) {
        console.error('Error fetching reviews', error)
        throw new Error(getApiErrorMessage(error, 'No se pudieron cargar las reseñas'))
      }
    },

    /**
     * Publica una nueva reseña escrita por un cliente hacia un trabajador (`POST /reviews`)
     * y la agrega al principio de la lista local `this.reviews`.
     */
    async createReview(review: { reviewer_id: string; caregiver_id: string; score: number; comment?: string }) {
      try {
        const response = await axios.post(`${API_URL}/reviews`, review)
        this.reviews.unshift(response.data)
        return response.data
      } catch (error: any) {
        throw new Error(getApiErrorMessage(error, 'Error al guardar la reseña'))
      }
    }
  }
})
