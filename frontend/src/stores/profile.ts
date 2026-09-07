import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'

const API_URL = 'http://localhost:3000'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    caregiverProfile: null as any | null,
    reviews: [] as any[],
  }),
  actions: {
    async fetchCaregiverProfile(userId: string) {
      try {
        const response = await axios.get(`${API_URL}/users/${userId}/caregiver-profile`)
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error fetching profile', error)
        throw error
      }
    },
    
    async updateCaregiverProfile(userId: string, updateData: any) {
      try {
        const response = await axios.put(`${API_URL}/users/${userId}/caregiver-profile`, updateData)
        this.caregiverProfile = response.data
        return this.caregiverProfile
      } catch (error: any) {
        console.error('Error updating profile', error)
        throw error
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
        throw error
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
        throw error
      }
    },
    
    async fetchReviews(caregiverId: string) {
      try {
        const response = await axios.get(`${API_URL}/reviews/caregiver/${caregiverId}`)
        this.reviews = response.data
        return this.reviews
      } catch (error: any) {
        console.error('Error fetching reviews', error)
        throw error
      }
    },

    async createReview(review: { reviewer_id: string; caregiver_id: string; score: number; comment?: string }) {
      try {
        const response = await axios.post(`${API_URL}/reviews`, review)
        this.reviews.unshift(response.data)
        return response.data
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al guardar la reseña')
      }
    }
  }
})
