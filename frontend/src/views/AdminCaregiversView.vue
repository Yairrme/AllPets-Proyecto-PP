<script setup lang="ts">
import { COVERAGE_ZONES } from "../utils/paseador";
import { onMounted, reactive, ref } from "vue";
import CaregiverProfilePreview from "../components/admin/CaregiverProfilePreview.vue";
import { toApiUrl } from "../config";
import {
  useAdminCaregiversStore,
  type AdminCaregiver,
  type CaregiverDetail,
  type ProfileStatus,
  type StatusFilter,
} from "../stores/adminCaregivers";
import { formatARS } from "../utils/currency";

interface CaregiverForm {
  name: string;
  email: string;
  city: string;
  phone: string;
  bio: string;
  servicesText: string;
  availabilityText: string;
  certificationsText: string;
  hourly_rate: number | "";
  experience_years: number | "";
  accepted_sizes: string[];
  is_available: boolean;
}

const store = useAdminCaregiversStore();

const filters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobados" },
  { key: "rejected", label: "Rechazados" },
];
const cities = COVERAGE_ZONES;
const sizes = ["pequeño", "mediano", "grande"];

const statusLabel: Record<ProfileStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};
const statusClass: Record<ProfileStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

const inputClass =
  "px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-(--brand)/30 focus:border-(--brand)";

const emptyForm = (): CaregiverForm => ({
  name: "",
  email: "",
  city: "Cipolletti",
  phone: "",
  bio: "",
  servicesText: "",
  availabilityText: "",
  certificationsText: "",
  hourly_rate: "",
  experience_years: "",
  accepted_sizes: [],
  is_available: true,
});

const form = reactive<CaregiverForm>(emptyForm());
const originalPhone = ref("");
const editingId = ref<string | null>(null);
const editingPhoto = ref("");
const isLoadingDetail = ref(false);
const formError = ref("");
const pendingDeleteId = ref<string | null>(null);
// Rechazar saca el perfil del listado público: se confirma antes, igual que eliminar.
const pendingRejectId = ref<string | null>(null);
const feedback = ref<{ type: "ok" | "error"; text: string } | null>(null);

async function confirmReject(item: AdminCaregiver) {
  pendingRejectId.value = null;
  await changeStatus(item, "rejected");
}

// Vista previa del perfil (antes de aprobar / editar)
const preview = ref<CaregiverDetail | null>(null);
const loadingPreviewId = ref<string | null>(null);

onMounted(() => {
  store.fetchCaregivers();
});

const roleLabel = (role: AdminCaregiver["role"]) =>
  role === "walker" ? "Paseador" : "Cuidador";

/** Foto profesional o, si no tiene, la foto de usuario. */
const avatarOf = (item: AdminCaregiver): string => {
  const path = item.caregiver_image || item.profile_image;
  return path ? toApiUrl(path) : "";
};

const statusMessage: Record<ProfileStatus, string> = {
  approved: "aprobado: ya aparece en el listado público",
  rejected: "rechazado",
  pending: "vuelto a pendiente",
};

async function openPreview(item: AdminCaregiver) {
  feedback.value = null;
  loadingPreviewId.value = item._id;
  const detail = await store.fetchDetail(item._id);
  loadingPreviewId.value = null;
  if (detail) {
    preview.value = detail;
  } else {
    feedback.value = { type: "error", text: store.actionError };
  }
}

async function setStatusFromPreview(status: ProfileStatus) {
  if (!preview.value) return;
  const { _id, name } = preview.value.user;
  const ok = await store.setStatus(_id, status);
  if (ok) {
    preview.value = {
      ...preview.value,
      profile: { ...preview.value.profile, status },
    };
    feedback.value = { type: "ok", text: `Perfil de "${name}" ${statusMessage[status]}.` };
  } else {
    feedback.value = { type: "error", text: store.actionError };
  }
}

async function changePhotoFromPreview(file: File) {
  if (!preview.value) return;
  const path = await store.uploadCaregiverPhoto(preview.value.user._id, file);
  if (path) {
    preview.value = {
      ...preview.value,
      profile: { ...preview.value.profile, profile_image: path },
    };
    feedback.value = {
      type: "ok",
      text: `Foto de "${preview.value.user.name}" actualizada.`,
    };
  } else {
    feedback.value = { type: "error", text: store.actionError };
  }
}

function editFromPreview() {
  if (!preview.value) return;
  const item = store.items.find((i) => i._id === preview.value?.user._id);
  preview.value = null;
  if (item) openEdit(item);
}

async function handleEditPhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !editingId.value) return;
  const path = await store.uploadCaregiverPhoto(editingId.value, file);
  if (path) editingPhoto.value = path;
  else formError.value = store.actionError;
}

const toLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

async function openEdit(item: AdminCaregiver) {
  feedback.value = null;
  formError.value = "";
  pendingDeleteId.value = null;
  editingId.value = item._id;
  isLoadingDetail.value = true;
  Object.assign(form, emptyForm());

  const detail = await store.fetchDetail(item._id);
  isLoadingDetail.value = false;

  if (!detail) {
    feedback.value = { type: "error", text: store.actionError };
    editingId.value = null;
    return;
  }

  const { user, profile } = detail;
  originalPhone.value = user.phone ?? "";
  editingPhoto.value = profile.profile_image || user.profile_image || "";
  Object.assign(form, {
    name: user.name,
    email: user.email,
    city: user.city,
    phone: user.phone ?? "",
    bio: profile.bio ?? "",
    servicesText: (profile.services ?? []).join("\n"),
    availabilityText: (profile.availability ?? []).join("\n"),
    certificationsText: (profile.certifications ?? []).join("\n"),
    hourly_rate: profile.hourly_rate ?? "",
    experience_years: profile.experience_years ?? "",
    accepted_sizes: [...(profile.accepted_sizes ?? [])],
    is_available: profile.is_available !== false,
  });
}

function closeForm() {
  editingId.value = null;
  formError.value = "";
}

/** Mismas reglas que UpdateUserDto y UpdateCaregiverProfileDto (el backend vuelve a validar). */
function validate(): string {
  const name = form.name.trim();
  if (name.length < 2 || name.length > 100)
    return "El nombre debe tener entre 2 y 100 caracteres.";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
    return "El formato del email no es válido.";
  if (!cities.includes(form.city))
    return `La ciudad debe ser ${COVERAGE_ZONES.join(" o ")}.`;
  if (form.phone.trim().length > 50)
    return "El teléfono no puede superar 50 caracteres.";
  if (form.bio.length > 500)
    return "La biografía no puede superar 500 caracteres.";
  if (toLines(form.servicesText).length > 20) return "Máximo 20 servicios.";
  if (toLines(form.availabilityText).length > 50)
    return "Máximo 50 franjas de disponibilidad.";
  if (toLines(form.certificationsText).length > 30)
    return "Máximo 30 certificaciones.";
  if (
    form.hourly_rate === "" ||
    !Number.isFinite(Number(form.hourly_rate)) ||
    Number(form.hourly_rate) < 0
  )
    return "La tarifa por hora debe ser un número mayor o igual a 0.";
  if (
    form.experience_years === "" ||
    !Number.isFinite(Number(form.experience_years)) ||
    Number(form.experience_years) < 0
  )
    return "Los años de experiencia deben ser un número mayor o igual a 0.";
  return "";
}

async function submit() {
  if (!editingId.value) return;
  formError.value = validate();
  if (formError.value) return;

  const phone = form.phone.trim();
  const userData = {
    name: form.name.trim(),
    email: form.email.trim(),
    city: form.city,
    // El teléfono solo se envía si cambió (se guarda cifrado en el backend).
    ...(phone !== originalPhone.value ? { phone } : {}),
  };
  const profileData = {
    bio: form.bio.trim(),
    services: toLines(form.servicesText),
    availability: toLines(form.availabilityText),
    hourly_rate: Number(form.hourly_rate),
    experience_years: Number(form.experience_years),
    accepted_sizes: form.accepted_sizes,
    certifications: toLines(form.certificationsText),
    is_available: form.is_available,
  };

  const ok = await store.saveCaregiver(editingId.value, userData, profileData);
  if (ok) {
    feedback.value = {
      type: "ok",
      text: `Perfil de "${userData.name}" actualizado.`,
    };
    closeForm();
  } else {
    formError.value = store.actionError;
  }
}

async function changeStatus(item: AdminCaregiver, status: ProfileStatus) {
  feedback.value = null;
  const ok = await store.setStatus(item._id, status);
  feedback.value = ok
    ? { type: "ok", text: `Perfil de "${item.name}" ${statusMessage[status]}.` }
    : { type: "error", text: store.actionError };
}

async function confirmDelete(item: AdminCaregiver) {
  const ok = await store.deleteCaregiver(item._id);
  pendingDeleteId.value = null;
  if (editingId.value === item._id) closeForm();
  feedback.value = ok
    ? { type: "ok", text: `Perfil de "${item.name}" eliminado.` }
    : { type: "error", text: store.actionError };
}
</script>

<template>
  <section>
    <div class="mb-6">
      <h2 class="text-2xl font-extrabold tracking-tight text-stone-900">
        Paseadores y cuidadores
      </h2>
      <p class="text-stone-500 mt-1">
        Abrí <strong>Ver perfil</strong> para revisar fotos, comprobantes y
        datos antes de aprobar. Solo los perfiles aprobados aparecen en el
        listado público.
      </p>
    </div>

    <CaregiverProfilePreview
      v-if="preview"
      :detail="preview"
      :is-saving="store.isSaving"
      @close="preview = null"
      @set-status="setStatusFromPreview"
      @edit="editFromPreview"
      @change-photo="changePhotoFromPreview"
    />

    <div
      class="flex flex-wrap gap-2 mb-6"
      role="group"
      aria-label="Filtrar por estado"
    >
      <button
        v-for="filter in filters"
        :key="filter.key"
        type="button"
        class="px-4 py-2 rounded-xl text-sm font-bold border transition"
        :class="
          store.statusFilter === filter.key
            ? 'bg-(--brand) text-white border-(--brand)'
            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
        "
        :aria-pressed="store.statusFilter === filter.key"
        @click="store.setFilter(filter.key)"
      >
        {{ filter.label }}
      </button>
    </div>

    <p
      v-if="feedback"
      role="status"
      class="mb-6 px-4 py-3 rounded-xl text-sm font-medium border"
      :class="
        feedback.type === 'ok'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-red-50 text-red-700 border-red-200'
      "
    >
      {{ feedback.text }}
    </p>

    <!-- Formulario de edición -->
    <form
      v-if="editingId"
      class="mb-8 bg-white rounded-2xl border border-stone-200 shadow-xs p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
      @submit.prevent="submit"
    >
      <h3 class="sm:col-span-2 text-lg font-bold text-stone-900">
        Editar perfil
      </h3>

      <p v-if="isLoadingDetail" class="sm:col-span-2 text-stone-500">
        Cargando perfil...
      </p>

      <template v-else>
        <div class="sm:col-span-2 flex flex-wrap items-center gap-4">
          <div
            class="w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center"
          >
            <img
              v-if="editingPhoto"
              :src="toApiUrl(editingPhoto)"
              alt="Foto de perfil"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-3xl text-stone-400" aria-hidden="true"
              >👤</span
            >
          </div>
          <label
            class="cursor-pointer rounded-xl border border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-100 transition"
            :class="{ 'opacity-50 pointer-events-none': store.isSaving }"
          >
            📷 {{ editingPhoto ? "Cambiar foto" : "Subir foto" }} desde la PC
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="sr-only"
              :disabled="store.isSaving"
              @change="handleEditPhoto"
            />
          </label>
          <label
            class="ml-auto flex items-center gap-2 text-sm font-semibold text-stone-700"
          >
            <input v-model="form.is_available" type="checkbox" />
            Disponible para clientes nuevos
          </label>
        </div>

        <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
          Nombre
          <input
            v-model="form.name"
            type="text"
            maxlength="100"
            :class="inputClass"
          />
        </label>

        <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
          Email
          <input v-model="form.email" type="email" :class="inputClass" />
        </label>

        <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
          Ciudad
          <select v-model="form.city" :class="inputClass">
            <option v-for="city in cities" :key="city" :value="city">
              {{ city }}
            </option>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
          Teléfono
          <input
            v-model="form.phone"
            type="text"
            maxlength="50"
            :class="inputClass"
          />
        </label>

        <label
          class="flex flex-col gap-1 text-sm font-semibold text-stone-700 sm:col-span-2"
        >
          Biografía
          <textarea
            v-model="form.bio"
            rows="3"
            maxlength="500"
            :class="inputClass"
          />
        </label>

        <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
          Tarifa por hora (ARS)
          <input
            v-model.number="form.hourly_rate"
            type="number"
            min="0"
            step="100"
            :class="inputClass"
          />
          <span
            v-if="form.hourly_rate !== ''"
            class="text-xs font-normal text-stone-500"
            >Se muestra como {{ formatARS(Number(form.hourly_rate)) }} por
            hora</span
          >
        </label>

        <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
          Años de experiencia
          <input
            v-model.number="form.experience_years"
            type="number"
            min="0"
            step="1"
            :class="inputClass"
          />
        </label>

        <fieldset class="sm:col-span-2">
          <legend class="text-sm font-semibold text-stone-700 mb-1">
            Tamaños de mascota aceptados
          </legend>
          <div class="flex flex-wrap gap-4">
            <label
              v-for="size in sizes"
              :key="size"
              class="flex items-center gap-2 text-sm text-stone-700 capitalize"
            >
              <input
                v-model="form.accepted_sizes"
                type="checkbox"
                :value="size"
              />
              {{ size }}
            </label>
          </div>
        </fieldset>

        <label
          class="flex flex-col gap-1 text-sm font-semibold text-stone-700 sm:col-span-2"
        >
          Servicios (uno por línea)
          <textarea v-model="form.servicesText" rows="3" :class="inputClass" />
        </label>

        <label
          class="flex flex-col gap-1 text-sm font-semibold text-stone-700 sm:col-span-2"
        >
          Disponibilidad (una franja por línea)
          <textarea
            v-model="form.availabilityText"
            rows="3"
            :class="inputClass"
          />
        </label>

        <label
          class="flex flex-col gap-1 text-sm font-semibold text-stone-700 sm:col-span-2"
        >
          Certificaciones (una por línea)
          <textarea
            v-model="form.certificationsText"
            rows="3"
            :class="inputClass"
          />
        </label>

        <p
          v-if="formError"
          role="alert"
          class="sm:col-span-2 px-4 py-3 rounded-xl text-sm font-medium border bg-red-50 text-red-700 border-red-200"
        >
          {{ formError }}
        </p>

        <div class="sm:col-span-2 flex gap-3 justify-end">
          <button
            type="button"
            class="rounded-xl border border-stone-300 text-stone-700 font-bold px-5 py-2.5 hover:bg-stone-100 transition"
            :disabled="store.isSaving"
            @click="closeForm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="rounded-xl bg-(--brand) text-white font-bold px-5 py-2.5 hover:bg-(--brand-dark) active:scale-95 transition disabled:bg-stone-300 disabled:cursor-not-allowed"
            :disabled="store.isSaving"
          >
            {{ store.isSaving ? "Guardando..." : "Guardar cambios" }}
          </button>
        </div>
      </template>
    </form>

    <!-- Listado -->
    <p v-if="store.isLoading" class="text-stone-500">Cargando perfiles...</p>

    <div
      v-else-if="store.error"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"
    >
      <p>{{ store.error }}</p>
      <button
        class="mt-3 text-sm font-bold underline"
        @click="store.fetchCaregivers()"
      >
        Reintentar
      </button>
    </div>

    <p v-else-if="store.items.length === 0" class="text-stone-500">
      {{
        store.statusFilter === "all"
          ? "Todavía no hay paseadores ni cuidadores registrados."
          : "No hay perfiles con ese estado."
      }}
    </p>

    <template v-else>
      <div
        class="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-x-auto"
      >
        <table class="min-w-full text-sm">
          <thead class="bg-stone-50 text-stone-600 text-left">
            <tr>
              <th class="px-4 py-3 font-bold">Nombre</th>
              <th class="px-4 py-3 font-bold">Rol</th>
              <th class="px-4 py-3 font-bold">Ciudad</th>
              <th class="px-4 py-3 font-bold">Estado</th>
              <th class="px-4 py-3 font-bold">Disponibilidad</th>
              <th class="px-4 py-3 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="item in store.items" :key="item._id">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center"
                  >
                    <img
                      v-if="avatarOf(item)"
                      :src="avatarOf(item)"
                      :alt="`Foto de ${item.name}`"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="text-stone-400" aria-hidden="true"
                      >👤</span
                    >
                  </div>
                  <div>
                    <p class="font-bold text-stone-900">{{ item.name }}</p>
                    <p class="text-stone-500">{{ item.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-stone-700">
                {{ roleLabel(item.role) }}
              </td>
              <td class="px-4 py-3 text-stone-700">{{ item.city }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="statusClass[item.profile_status]"
                >
                  {{ statusLabel[item.profile_status] }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center gap-1.5 text-xs font-bold"
                  :class="
                    item.is_available ? 'text-emerald-700' : 'text-stone-500'
                  "
                >
                  <span
                    class="h-2 w-2 rounded-full"
                    :class="
                      item.is_available ? 'bg-emerald-500' : 'bg-stone-400'
                    "
                    aria-hidden="true"
                  />
                  {{ item.is_available ? "Disponible" : "No disponible" }}
                </span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <template v-if="pendingDeleteId === item._id">
                  <span class="mr-2 text-stone-600"
                    >¿Eliminar? Se borran también sus reseñas.</span
                  >
                  <button
                    class="font-bold text-red-600 hover:text-red-800 mr-3 disabled:text-stone-400"
                    :disabled="store.isSaving"
                    @click="confirmDelete(item)"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    class="font-bold text-stone-600 hover:text-stone-800"
                    @click="pendingDeleteId = null"
                  >
                    Cancelar
                  </button>
                </template>
                <template v-else-if="pendingRejectId === item._id">
                  <span class="mr-2 text-stone-600"
                    >¿Rechazar? Deja de verse en el listado público.</span
                  >
                  <button
                    class="font-bold text-red-600 hover:text-red-800 mr-3 disabled:text-stone-400"
                    :disabled="store.isSaving"
                    @click="confirmReject(item)"
                  >
                    Sí, rechazar
                  </button>
                  <button
                    class="font-bold text-stone-600 hover:text-stone-800"
                    @click="pendingRejectId = null"
                  >
                    Cancelar
                  </button>
                </template>
                <template v-else>
                  <button
                    class="font-bold text-stone-800 hover:text-(--header-accent) mr-3 disabled:text-stone-400"
                    :disabled="loadingPreviewId === item._id"
                    @click="openPreview(item)"
                  >
                    {{
                      loadingPreviewId === item._id
                        ? "Abriendo..."
                        : "Ver perfil"
                    }}
                  </button>
                  <button
                    v-if="item.profile_status !== 'approved'"
                    class="font-bold text-green-800 hover:text-green-900 mr-3 disabled:text-stone-400"
                    :disabled="store.isSaving"
                    @click="changeStatus(item, 'approved')"
                  >
                    Aprobar
                  </button>
                  <button
                    v-if="item.profile_status !== 'rejected'"
                    class="font-bold text-amber-700 hover:text-amber-800 mr-3 disabled:text-stone-400"
                    :disabled="store.isSaving"
                    @click="
                      pendingRejectId = item._id;
                      pendingDeleteId = null;
                    "
                  >
                    Rechazar
                  </button>
                  <button
                    class="font-bold text-(--header-accent) hover:text-(--header-text) mr-3"
                    @click="openEdit(item)"
                  >
                    Editar
                  </button>
                  <button
                    class="font-bold text-red-600 hover:text-red-800"
                    @click="pendingDeleteId = item._id"
                  >
                    Eliminar
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="store.totalPages > 1"
        class="mt-4 flex items-center justify-between text-sm text-stone-600"
      >
        <span
          >Página {{ store.page }} de {{ store.totalPages }} ·
          {{ store.total }} perfiles</span
        >
        <div class="flex gap-2">
          <button
            class="rounded-xl border border-stone-300 px-4 py-2 font-bold hover:bg-stone-100 disabled:opacity-40"
            :disabled="store.page <= 1 || store.isLoading"
            @click="store.goToPage(store.page - 1)"
          >
            Anterior
          </button>
          <button
            class="rounded-xl border border-stone-300 px-4 py-2 font-bold hover:bg-stone-100 disabled:opacity-40"
            :disabled="store.page >= store.totalPages || store.isLoading"
            @click="store.goToPage(store.page + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
