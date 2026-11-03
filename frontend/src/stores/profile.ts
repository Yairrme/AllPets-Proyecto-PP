import { defineStore } from 'pinia'
import axios from 'axios'
import { API_URL } from '../config'
import { getApiErrorMessage } from '../utils/apiError'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    caregiverProfile: null as any | null,
    reviews: [] as any[],
  }),
  actions: {
    // El panel del prestador: su perfil completo, aunque todavía no esté aprobado.
    async fetchCaregiverProfile(userId: string) {
      try {
        const response = await axios.get(`${API_URL}/users/${userId}/caregiver-profile`)
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error fetching profile', error)
        throw new Error(getApiErrorMessage(error, 'No se pudo cargar el perfil'), { cause: error })
      }
    },
    
    /** Teléfono de un prestador: requiere sesión, no viene en el directorio público. */
    async fetchCaregiverContact(caregiverId: string): Promise<string | null> {
      try {
        const response = await axios.get(`${API_URL}/caregivers/${caregiverId}/contact`)
        return response.data?.phone ?? null
      } catch (error: any) {
        throw new Error(getApiErrorMessage(error, 'No pudimos obtener el teléfono'), { cause: error })
      }
    },

    async updateCaregiverProfile(userId: string, updateData: any) {
      try {
        const response = await axios.put(`${API_URL}/users/${userId}/caregiver-profile`, updateData)
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error updating profile', error)
        throw new Error(getApiErrorMessage(error, 'No se pudo guardar el perfil'), { cause: error })
      }
    },
    
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
        throw new Error(getApiErrorMessage(error, 'No se pudo subir la imagen'), { cause: error })
      }
    },
    
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
        throw new Error(getApiErrorMessage(error, 'No se pudo subir la foto de perfil'), { cause: error })
      }
    },

    async fetchUserById(userId: string) {
      try {
        const response = await axios.get(`${API_URL}/users/${userId}`)
        return response.data
      } catch (error: any) {
        console.error('Error fetching user data', error)
        throw new Error(getApiErrorMessage(error, 'No se pudieron cargar los datos del usuario'), { cause: error })
      }
    },

    async updateClientProfile(userId: string, updateData: { name?: string; email?: string; city?: string; phone?: string }) {
      try {
        const response = await axios.put(`${API_URL}/users/${userId}`, updateData)
        return response.data
      } catch (error: any) {
        console.error('Error updating client profile', error)
        throw new Error(getApiErrorMessage(error, 'No se pudieron guardar los cambios del perfil'), { cause: error })
      }
    },
    
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
        throw new Error(getApiErrorMessage(error, 'No se pudo subir la galería'), { cause: error })
      }
    },

    async removeGalleryImage(userId: string, imagePath: string) {
      try {
        const filename = encodeURIComponent(imagePath.split('/').pop() ?? '')
        const response = await axios.delete(`${API_URL}/users/${userId}/caregiver-profile/gallery/${filename}`)
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error removing gallery image', error)
        throw new Error(getApiErrorMessage(error, 'No pudimos eliminar la foto'), { cause: error })
      }
    },

    async fetchCertificationDocument(userId: string, filename: string): Promise<Blob> {
      const response = await axios.get(
        `${API_URL}/users/${userId}/caregiver-profile/certifications/${encodeURIComponent(filename)}`,
        { responseType: 'blob' },
      )
      return response.data
    },

    async removeCertificationDocument(userId: string, filename: string) {
      try {
        const response = await axios.delete(
          `${API_URL}/users/${userId}/caregiver-profile/certifications/${encodeURIComponent(filename)}`,
        )
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error removing certification document', error)
        throw new Error(getApiErrorMessage(error, 'No pudimos eliminar el comprobante'), { cause: error })
      }
    },

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
        throw new Error(getApiErrorMessage(error, 'No se pudieron subir los comprobantes de certificación'), { cause: error })
      }
    },
    
    async fetchReviews(caregiverId: string) {
      try {
        const response = await axios.get(`${API_URL}/caregivers/${caregiverId}/reviews`)
        this.reviews = Array.isArray(response.data)
          ? response.data
          : response.data?.data || []
        return this.reviews
      } catch (error: any) {
        console.error('Error fetching reviews', error)
        throw new Error(getApiErrorMessage(error, 'No se pudieron cargar las reseñas'), { cause: error })
      }
    },

    async createReview(review: { reviewer_id: string; caregiver_id: string; score: number; comment?: string }) {
      try {
        const response = await axios.post(`${API_URL}/reviews`, review)
        this.reviews.unshift(response.data)
        return response.data
      } catch (error: any) {
        throw new Error(getApiErrorMessage(error, 'Error al guardar la reseña'), { cause: error })
      }
    }
  }
})
