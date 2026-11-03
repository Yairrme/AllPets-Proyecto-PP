<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useCertificationDocuments } from "../../composables/useCertificationDocuments";
import { toApiUrl } from "../../config";
import type {
  CaregiverDetail,
  ProfileStatus,
} from "../../stores/adminCaregivers";
import { formatARS } from "../../utils/currency";

/**
 * Vista previa completa de un paseador/cuidador para que el admin revise
 * fotos, comprobantes y datos ANTES de aprobar, rechazar o editar.
 */
const props = defineProps<{
  detail: CaregiverDetail;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "set-status", status: ProfileStatus): void;
  (e: "edit"): void;
  (e: "change-photo", file: File): void;
}>();

const statusLabel: Record<ProfileStatus, string> = {
  pending: "Pendiente de revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
};
const statusClass: Record<ProfileStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

const enlargedImage = ref<string | null>(null);

// Rechazar saca el perfil del listado público: pide un segundo clic para confirmar.
const confirmingReject = ref(false);
function reject() {
  if (!confirmingReject.value) {
    confirmingReject.value = true;
    return;
  }
  confirmingReject.value = false;
  emit("set-status", "rejected");
}

const user = computed(() => props.detail.user);
const profile = computed(() => props.detail.profile);
const status = computed<ProfileStatus>(() => profile.value.status ?? "approved");
const isAvailable = computed(() => profile.value.is_available !== false);
const photo = computed(() => {
  const path = profile.value.profile_image || user.value.profile_image;
  return path ? toApiUrl(path) : "";
});
const gallery = computed(() => (profile.value.gallery_images ?? []).map(toApiUrl));
const hasCertDocs = computed(
  () => (profile.value.certification_documents ?? []).length > 0,
);
const { documents: certDocuments } = useCertificationDocuments(
  () => user.value._id,
  () => profile.value.certification_documents ?? [],
);
const certDocs = computed(() => certDocuments.value.map((doc) => doc.url));
const registeredAt = computed(() => {
  const date = user.value.created_at ?? profile.value.created_at;
  return date ? new Date(date).toLocaleDateString("es-AR") : "";
});

/** Lo mínimo que conviene verificar antes de aprobar un perfil. */
const checklist = computed(() => [
  { label: "Foto de perfil", ok: Boolean(photo.value) },
  { label: "Biografía", ok: Boolean(profile.value.bio?.trim()) },
  { label: "Teléfono de contacto", ok: Boolean(user.value.phone) },
  { label: "Servicios cargados", ok: (profile.value.services ?? []).length > 0 },
  { label: "Comprobantes de certificación", ok: hasCertDocs.value },
]);

function handlePhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) emit("change-photo", file);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  if (enlargedImage.value) enlargedImage.value = null;
  else emit("close");
}
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-[2px]"
      @click.self="emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="`Perfil de ${user.name}`"
        class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <!-- Encabezado -->
        <div
          class="flex items-start justify-between gap-4 border-b border-stone-200 p-6"
        >
          <div class="flex items-center gap-5">
            <button
              type="button"
              class="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100"
              :disabled="!photo"
              :title="photo ? 'Ver foto ampliada' : undefined"
              @click="enlargedImage = photo"
            >
              <img
                v-if="photo"
                :src="photo"
                :alt="`Foto de ${user.name}`"
                class="h-full w-full object-cover"
              />
              <span v-else class="text-4xl text-stone-400" aria-hidden="true"
                >👤</span
              >
            </button>
            <div>
              <h3 class="text-2xl font-extrabold tracking-tight text-stone-900">
                {{ user.name }}
              </h3>
              <p class="text-sm text-stone-500">
                {{ user.role === "walker" ? "🦮 Paseador" : "🏠 Cuidador" }} ·
                {{ user.city }}
                <template v-if="registeredAt">
                  · registrado el {{ registeredAt }}</template
                >
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  :class="statusClass[status]"
                >
                  {{ statusLabel[status] }}
                </span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  :class="
                    isAvailable
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-200 text-stone-700'
                  "
                >
                  {{ isAvailable ? "Disponible" : "No disponible" }}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="h-9 w-9 shrink-0 rounded-lg border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-800"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <!-- Cuerpo -->
        <div class="flex-1 space-y-7 overflow-y-auto p-6">
          <!-- Revisión rápida -->
          <section class="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <h4 class="mb-3 text-sm font-bold text-stone-800">
              Revisión rápida
            </h4>
            <ul class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <li
                v-for="item in checklist"
                :key="item.label"
                class="flex items-center gap-2"
                :class="item.ok ? 'text-stone-700' : 'text-amber-800'"
              >
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                  :class="
                    item.ok
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  "
                  aria-hidden="true"
                  >{{ item.ok ? "✓" : "!" }}</span
                >
                {{ item.label }}{{ item.ok ? "" : " (falta)" }}
              </li>
            </ul>
          </section>

          <!-- Datos principales -->
          <section class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div class="rounded-xl border border-stone-200 p-3">
              <p class="text-xs text-stone-500">Tarifa por hora</p>
              <p class="text-lg font-extrabold text-amber-700">
                {{ formatARS(profile.hourly_rate) }}
              </p>
            </div>
            <div class="rounded-xl border border-stone-200 p-3">
              <p class="text-xs text-stone-500">Experiencia</p>
              <p class="text-lg font-extrabold text-stone-900">
                {{ profile.experience_years ?? 0 }}
                {{ profile.experience_years === 1 ? "año" : "años" }}
              </p>
            </div>
            <div class="rounded-xl border border-stone-200 p-3">
              <p class="text-xs text-stone-500">Calificación</p>
              <p class="text-lg font-extrabold text-stone-900">
                <template v-if="profile.total_reviews">
                  ★ {{ profile.rating_avg?.toFixed(1) }}
                  <span class="text-xs font-normal text-stone-500"
                    >({{ profile.total_reviews }})</span
                  >
                </template>
                <template v-else>Sin reseñas</template>
              </p>
            </div>
            <div class="rounded-xl border border-stone-200 p-3">
              <p class="text-xs text-stone-500">Contacto</p>
              <p class="truncate text-sm font-bold text-stone-900">
                {{ user.phone || "Sin teléfono" }}
              </p>
              <p class="truncate text-xs text-stone-500">{{ user.email }}</p>
            </div>
          </section>

          <section>
            <h4 class="mb-2 text-sm font-bold text-stone-800">Biografía</h4>
            <p class="whitespace-pre-line text-sm text-stone-700">
              {{ profile.bio || "No escribió una biografía." }}
            </p>
          </section>

          <section class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h4 class="mb-2 text-sm font-bold text-stone-800">Servicios</h4>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="service in profile.services"
                  :key="service"
                  class="rounded-lg bg-stone-100 px-2.5 py-1 text-xs text-stone-700"
                  >{{ service }}</span
                >
                <span
                  v-if="!profile.services?.length"
                  class="text-sm text-stone-400"
                  >Sin servicios cargados</span
                >
              </div>
            </div>
            <div>
              <h4 class="mb-2 text-sm font-bold text-stone-800">
                Días y horarios
              </h4>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="slot in profile.availability"
                  :key="slot"
                  class="rounded-lg bg-stone-100 px-2.5 py-1 text-xs text-stone-700"
                  >{{ slot }}</span
                >
                <span
                  v-if="!profile.availability?.length"
                  class="text-sm text-stone-400"
                  >Sin horarios cargados</span
                >
              </div>
            </div>
            <div>
              <h4 class="mb-2 text-sm font-bold text-stone-800">
                Tamaños aceptados
              </h4>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="size in profile.accepted_sizes"
                  :key="size"
                  class="rounded-lg bg-(--brand-cream) px-2.5 py-1 text-xs capitalize text-(--header-accent)"
                  >{{ size }}</span
                >
              </div>
            </div>
            <div>
              <h4 class="mb-2 text-sm font-bold text-stone-800">
                Certificaciones declaradas
              </h4>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="cert in profile.certifications"
                  :key="cert"
                  class="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-900"
                  >🏅 {{ cert }}</span
                >
                <span
                  v-if="!profile.certifications?.length"
                  class="text-sm text-stone-400"
                  >Ninguna</span
                >
              </div>
            </div>
          </section>

          <section>
            <h4 class="mb-2 text-sm font-bold text-stone-800">
              Comprobantes (permisos, certificados)
            </h4>
            <div
              v-if="certDocs.length"
              class="grid grid-cols-3 gap-3 sm:grid-cols-5"
            >
              <button
                v-for="(doc, idx) in certDocs"
                :key="doc"
                type="button"
                class="aspect-[4/3] overflow-hidden rounded-xl border border-stone-200 hover:border-amber-500"
                :title="`Ver comprobante ${idx + 1}`"
                @click="enlargedImage = doc"
              >
                <img
                  :src="doc"
                  :alt="`Comprobante ${idx + 1}`"
                  class="h-full w-full object-cover"
                />
              </button>
            </div>
            <p v-else-if="!hasCertDocs" class="text-sm text-amber-800">
              No subió comprobantes. Conviene pedirlos antes de aprobar.
            </p>
          </section>

          <section>
            <h4 class="mb-2 text-sm font-bold text-stone-800">Galería</h4>
            <div
              v-if="gallery.length"
              class="grid grid-cols-3 gap-3 sm:grid-cols-5"
            >
              <button
                v-for="(img, idx) in gallery"
                :key="img"
                type="button"
                class="aspect-square overflow-hidden rounded-xl border border-stone-200 hover:border-amber-500"
                :title="`Ver foto ${idx + 1}`"
                @click="enlargedImage = img"
              >
                <img
                  :src="img"
                  :alt="`Foto ${idx + 1}`"
                  class="h-full w-full object-cover"
                />
              </button>
            </div>
            <p v-else class="text-sm text-stone-400">Sin fotos en la galería.</p>
          </section>
        </div>

        <!-- Acciones -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 p-4"
        >
          <label
            class="cursor-pointer rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-100"
            :class="{ 'pointer-events-none opacity-50': isSaving }"
          >
            📷 Cambiar foto desde la PC
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="sr-only"
              :disabled="isSaving"
              @change="handlePhoto"
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-xl border border-(--search-border) bg-white px-4 py-2 text-sm font-bold text-(--header-accent) transition hover:bg-(--header-hover)"
              :disabled="isSaving"
              @click="emit('edit')"
            >
              Editar datos
            </button>
            <button
              v-if="status !== 'rejected'"
              type="button"
              class="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold transition disabled:opacity-50"
              :class="
                confirmingReject
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-white text-red-700 hover:bg-red-50'
              "
              :disabled="isSaving"
              @click="reject"
            >
              {{ confirmingReject ? '¿Seguro? Sí, rechazar' : 'Rechazar' }}
            </button>
            <button
              v-if="status !== 'pending'"
              type="button"
              class="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
              :disabled="isSaving"
              @click="emit('set-status', 'pending')"
            >
              Volver a pendiente
            </button>
            <button
              v-if="status !== 'approved'"
              type="button"
              class="rounded-xl bg-green-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-green-800 disabled:bg-stone-300"
              :disabled="isSaving"
              @click="emit('set-status', 'approved')"
            >
              ✓ Aprobar perfil
            </button>
          </div>
        </div>
      </div>

      <!-- Imagen ampliada -->
      <div
        v-if="enlargedImage"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
        @click.self="enlargedImage = null"
      >
        <img
          :src="enlargedImage"
          alt="Imagen ampliada"
          class="max-h-full max-w-full rounded-xl object-contain"
        />
        <button
          type="button"
          class="absolute right-5 top-5 h-10 w-10 rounded-full bg-white/90 font-bold text-stone-800 hover:bg-white"
          aria-label="Cerrar imagen"
          @click="enlargedImage = null"
        >
          ✕
        </button>
      </div>
    </div>
  </Teleport>
</template>
