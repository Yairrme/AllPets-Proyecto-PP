import { defineStore } from 'pinia'
import axios from 'axios'
const API_URL = 'http://localhost:3000'

function getApiErrorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}

export const useProfileStore = defineStore('profile', {
  state: () => ({
    caregiverProfile: null as any | null,
    reviews: [] as any[],
  }),
  actions: {
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
