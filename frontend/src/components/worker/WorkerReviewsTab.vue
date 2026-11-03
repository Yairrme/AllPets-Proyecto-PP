<script setup lang="ts">
import { useProfileStore } from '../../stores/profile'

const profileStore = useProfileStore()

const getReviewerLabel = (review: any) => {
  if (review.reviewer_id?.name) return review.reviewer_id.name
  const reviewerId = review.reviewer_id?._id || review.reviewer_id
  return `Cliente #${String(reviewerId).substring(0, 6)}`
}
</script>

<template>
  <div>
    <h4 class="text-xl font-bold text-gray-900 mb-6">Reseñas de clientes</h4>
    
    <div v-if="profileStore.reviews.length > 0" class="space-y-6">
      <div v-for="review in profileStore.reviews" :key="review._id" class="bg-gray-50 p-6 rounded-xl border border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-gray-900">{{ getReviewerLabel(review) }}</span>
            <span class="text-xs text-gray-500">• {{ new Date(review.created_at).toLocaleDateString() }}</span>
          </div>
          <div class="text-amber-500 font-bold tracking-widest">
            {{ '★'.repeat(review.score) }}{{ '☆'.repeat(5 - review.score) }}
          </div>
        </div>
        <p class="text-gray-700">{{ review.comment }}</p>
      </div>
    </div>
    
    <div v-else class="text-center py-12 text-gray-500 border border-dashed rounded-xl">
      Todavía no tenés reseñas. ¡Empezá a hacer paseos para recibirlas!
    </div>
  </div>
</template>
