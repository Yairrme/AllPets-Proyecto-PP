import { createRouter, createWebHistory } from "vue-router";
import { scrollToSection } from "../utils/scroll";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from) {
    // Cambiar solo los filtros (?categoria=..., ?rol=...) no mueve la página.
    if (to.path === from.path && !to.hash) return false;
    // Misma página, otra sección (#servicios → #quienes-somos): se desplaza ya.
    const delay = to.path === from.path ? 0 : 300;
    return new Promise((resolve) => {
      setTimeout(() => {
        if (to.hash) {
          // Descuenta el header fijo y anima la sección al llegar. Si la
          // sección todavía no cargó, la vista vuelve a llamar a scrollToSection.
          scrollToSection(to.hash);
          resolve(false);
        } else {
          resolve({ top: 0, behavior: "smooth" });
        }
      }, delay);
    });
  },
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/paseadores",
      name: "paseadores",
      component: () => import("../views/PaseadoresView.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
    },
    {
      path: "/trabaja-con-nosotros",
      name: "register-worker",
      component: () => import("../views/RegisterWorkerView.vue"),
    },
    {
      path: "/onboarding-trabajador",
      name: "onboarding-worker",
      component: () => import("../views/WorkerOnboardingView.vue"),
    },
    {
      path: "/mi-panel",
      name: "worker-dashboard",
      component: () => import("../views/WorkerDashboardView.vue"),
    },
    {
      path: "/mi-perfil",
      name: "client-profile",
      component: () => import("../views/ClientProfileView.vue"),
    },
    {
      path: "/tienda",
      name: "shop",
      component: () => import("../views/ShopView.vue"),
    },
    {
      path: "/carrito",
      name: "cart",
      component: () => import("../views/CartView.vue"),
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
    },
    {
      // Ruta anterior del CRUD de productos: ahora es una pestaña de Administración.
      path: "/admin/productos",
      redirect: { path: "/admin", query: { seccion: "productos" } },
    },
  ],
});

/** Rol del usuario con sesión iniciada, o null si no hay sesión. */
function currentRole(): string | null {
  if (!localStorage.getItem("token")) return null;
  try {
    return JSON.parse(localStorage.getItem("user") ?? "null")?.role ?? null;
  } catch {
    return null;
  }
}

/** Pantallas de cada área. Prestadores y admin solo pueden usar la suya. */
const WORKER_AREA = new Set(["worker-dashboard", "onboarding-worker"]);
const ADMIN_AREA = new Set(["admin"]);
const NEEDS_LOGIN = new Set(["client-profile", "cart"]);

// La protección es de experiencia de usuario: el backend vuelve a validar
// el JWT y el rol en cada endpoint.
router.beforeEach((to) => {
  const role = currentRole();
  const name = String(to.name ?? "");

  // Paseadores y cuidadores: solo su panel (con la vista previa de su perfil).
  if (role === "walker" || role === "caregiver") {
    return WORKER_AREA.has(name) ? true : { name: "worker-dashboard" };
  }

  // Administrador: solo Administración.
  if (role === "admin") {
    return ADMIN_AREA.has(name) ? true : { name: "admin" };
  }

  // Clientes y visitantes no entran a las áreas de prestadores ni de admin.
  if (WORKER_AREA.has(name)) {
    if (role) return { name: "home" };
    return name === "onboarding-worker" ? { name: "register-worker" } : { name: "login" };
  }
  if (ADMIN_AREA.has(name)) return role ? { name: "home" } : { name: "login" };

  // Un cliente con sesión no necesita volver a ingresar ni registrarse.
  if (role && (name === "login" || name === "register")) return { name: "home" };

  // Mi perfil y el carrito requieren sesión.
  if (!role && NEEDS_LOGIN.has(name)) return { name: "login" };

  return true;
});

export default router;
