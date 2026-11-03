import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

import { API_URL } from "../config";
import { getApiErrorMessage } from "../utils/apiError";
const PAGE_SIZE = 20;

export type ProfileStatus = "pending" | "approved" | "rejected";
export type StatusFilter = ProfileStatus | "all";

export interface AdminCaregiver {
  _id: string;
  name: string;
  email: string;
  city: string;
  phone?: string | null;
  role: "walker" | "caregiver";
  profile_status: ProfileStatus;
  /** El prestador acepta clientes nuevos. */
  is_available: boolean;
  /** Foto del perfil profesional (/uploads/...). */
  caregiver_image: string | null;
  /** Foto de la cuenta de usuario. */
  profile_image?: string | null;
}

export interface CaregiverProfile {
  bio: string;
  services: string[];
  availability: string[];
  hourly_rate: number;
  experience_years: number;
  accepted_sizes: string[];
  certifications: string[];
  certification_documents: string[];
  profile_image: string;
  gallery_images: string[];
  rating_avg: number;
  total_reviews: number;
  is_available?: boolean;
  status: ProfileStatus;
  created_at?: string;
}

export interface CaregiverDetail {
  user: Omit<
    AdminCaregiver,
    "profile_status" | "is_available" | "caregiver_image"
  > & { created_at?: string };
  profile: CaregiverProfile;
}

/** Campos de UpdateUserDto (PUT /users/:id). */
export interface CaregiverUserInput {
  name: string;
  email: string;
  city: string;
  phone?: string;
}

/** Campos editables de UpdateCaregiverProfileDto (PUT /users/:userId/caregiver-profile). */
export interface CaregiverProfileInput {
  bio: string;
  services: string[];
  availability: string[];
  hourly_rate: number;
  experience_years: number;
  accepted_sizes: string[];
  certifications: string[];
  is_available: boolean;
}

interface ListResponse {
  data: AdminCaregiver[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const MENSAJES: Record<number, string> = {
  401: "Tu sesión venció. Volvé a iniciar sesión.",
  403: "No tenés permisos de administrador para esta acción.",
  404: "El perfil ya no existe.",
  503: "El servicio no está disponible ahora. Intentá en unos minutos.",
};
const getErrorMessage = (error: unknown, fallback: string) =>
  getApiErrorMessage(error, fallback, MENSAJES);

// El token JWT lo agrega el interceptor global de axios que configura el
// store de auth (axios.defaults.headers.common.Authorization).
export const useAdminCaregiversStore = defineStore("adminCaregivers", () => {
  const items = ref<AdminCaregiver[]>([]);
  const statusFilter = ref<StatusFilter>("all");
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);
  const isLoading = ref(false);
  const error = ref("");
  const isSaving = ref(false);
  const actionError = ref("");

  async function fetchCaregivers() {
    isLoading.value = true;
    error.value = "";
    try {
      const response = await axios.get<ListResponse>(
        `${API_URL}/admin/caregivers`,
        {
          params: {
            page: page.value,
            limit: PAGE_SIZE,
            ...(statusFilter.value !== "all"
              ? { status: statusFilter.value }
              : {}),
          },
        },
      );
      items.value = response.data.data;
      total.value = response.data.pagination.total;
      totalPages.value = Math.max(1, response.data.pagination.totalPages);
    } catch (e) {
      items.value = [];
      total.value = 0;
      totalPages.value = 1;
      error.value = getErrorMessage(
        e,
        "No pudimos cargar los paseadores y cuidadores.",
      );
    } finally {
      isLoading.value = false;
    }
  }

  function setFilter(filter: StatusFilter) {
    statusFilter.value = filter;
    page.value = 1;
    return fetchCaregivers();
  }

  function goToPage(next: number) {
    if (next < 1 || next > totalPages.value) return Promise.resolve();
    page.value = next;
    return fetchCaregivers();
  }

  async function runAction(
    action: () => Promise<void>,
    fallback: string,
  ): Promise<boolean> {
    isSaving.value = true;
    actionError.value = "";
    try {
      await action();
      return true;
    } catch (e) {
      actionError.value = getErrorMessage(e, fallback);
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  /** Quita un perfil de la lista actual; si la página queda vacía, vuelve a la anterior. */
  function removeLocal(userId: string) {
    items.value = items.value.filter((i) => i._id !== userId);
    total.value = Math.max(0, total.value - 1);
    if (items.value.length === 0 && page.value > 1) {
      page.value -= 1;
      fetchCaregivers();
    }
  }

  async function fetchDetail(userId: string): Promise<CaregiverDetail | null> {
    let detail: CaregiverDetail | null = null;
    await runAction(async () => {
      const response = await axios.get<CaregiverDetail>(
        `${API_URL}/admin/caregivers/${userId}`,
      );
      detail = response.data;
    }, "No pudimos cargar el perfil.");
    return detail;
  }

  const setStatus = (userId: string, status: ProfileStatus) =>
    runAction(async () => {
      await axios.patch(`${API_URL}/admin/caregivers/${userId}/status`, {
        status,
      });
      // Si hay un filtro activo y el perfil ya no coincide, sale de la lista.
      if (statusFilter.value !== "all" && statusFilter.value !== status) {
        removeLocal(userId);
      } else {
        items.value = items.value.map((i) =>
          i._id === userId ? { ...i, profile_status: status } : i,
        );
      }
    }, "No pudimos actualizar el estado del perfil.");

  const saveCaregiver = (
    userId: string,
    userData: CaregiverUserInput,
    profileData: CaregiverProfileInput,
  ) =>
    runAction(async () => {
      const userResponse = await axios.put<Partial<AdminCaregiver>>(
        `${API_URL}/users/${userId}`,
        userData,
      );
      await axios.put(
        `${API_URL}/users/${userId}/caregiver-profile`,
        profileData,
      );
      const { name, email, city, phone } = userResponse.data;
      items.value = items.value.map((i) =>
        i._id === userId
          ? {
              ...i,
              name: name ?? i.name,
              email: email ?? i.email,
              city: city ?? i.city,
              phone: phone ?? i.phone,
              is_available: profileData.is_available,
            }
          : i,
      );
    }, "No pudimos guardar los cambios.");

  /**
   * Reemplaza la foto del perfil profesional con un archivo de la PC del admin.
   * Devuelve la nueva ruta (/uploads/...) o null si falla.
   */
  async function uploadCaregiverPhoto(
    userId: string,
    file: File,
  ): Promise<string | null> {
    let imagePath: string | null = null;
    await runAction(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post<CaregiverProfile>(
        `${API_URL}/users/${userId}/caregiver-profile/image`,
        formData,
      );
      imagePath = response.data.profile_image;
      items.value = items.value.map((i) =>
        i._id === userId ? { ...i, caregiver_image: imagePath } : i,
      );
    }, "No pudimos subir la foto.");
    return imagePath;
  }

  const deleteCaregiver = (userId: string) =>
    runAction(async () => {
      await axios.delete(`${API_URL}/users/${userId}`);
      removeLocal(userId);
    }, "No pudimos eliminar el perfil.");

  return {
    items,
    statusFilter,
    page,
    totalPages,
    total,
    isLoading,
    error,
    isSaving,
    actionError,
    fetchCaregivers,
    setFilter,
    goToPage,
    fetchDetail,
    setStatus,
    saveCaregiver,
    uploadCaregiverPhoto,
    deleteCaregiver,
  };
});
