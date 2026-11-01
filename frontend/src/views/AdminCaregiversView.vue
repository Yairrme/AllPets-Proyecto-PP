<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  useAdminCaregiversStore,
  type AdminCaregiver,
  type ProfileStatus,
  type StatusFilter,
} from "../stores/adminCaregivers";

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
}

const store = useAdminCaregiversStore();

const filters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobados" },
  { key: "rejected", label: "Rechazados" },
];
const cities = ["Cipolletti", "Neuquén"];
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
  "px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500";

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
});

const form = reactive<CaregiverForm>(emptyForm());
const originalPhone = ref("");
const editingId = ref<string | null>(null);
const isLoadingDetail = ref(false);
const formError = ref("");
const pendingDeleteId = ref<string | null>(null);
const feedback = ref<{ type: "ok" | "error"; text: string } | null>(null);

onMounted(() => {
  store.fetchCaregivers();
});

const roleLabel = (role: AdminCaregiver["role"]) =>
  role === "walker" ? "Paseador" : "Cuidador";

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
    return "La ciudad debe ser Cipolletti o Neuquén.";
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
    ? {
        type: "ok",
        text:
          status === "approved"
            ? `Perfil de "${item.name}" aprobado.`
            : `Perfil de "${item.name}" rechazado.`,
      }
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
        Revisá, aprobá, editá y eliminá los perfiles. Solo los perfiles
        aprobados aparecen en el listado público.
      </p>
    </div>

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
            ? 'bg-amber-500 text-white border-amber-500'
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
            step="1"
            :class="inputClass"
          />
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
            class="rounded-xl bg-amber-500 text-white font-bold px-5 py-2.5 hover:bg-amber-600 active:scale-95 transition disabled:bg-stone-300 disabled:cursor-not-allowed"
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
              <th class="px-4 py-3 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="item in store.items" :key="item._id">
              <td class="px-4 py-3">
                <p class="font-bold text-stone-900">{{ item.name }}</p>
                <p class="text-stone-500">{{ item.email }}</p>
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
                <template v-else>
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
                    @click="changeStatus(item, 'rejected')"
                  >
                    Rechazar
                  </button>
                  <button
                    class="font-bold text-indigo-600 hover:text-indigo-800 mr-3"
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
