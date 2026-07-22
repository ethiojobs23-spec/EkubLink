// router/index.js — Vue Router with strict role-based navigation guards
import { createRouter, createWebHistory } from "vue-router"

// ─── Lazy-loaded Views ────────────────────────────────────────────
// Auth
const AuthPage = () => import("../views/auth/AuthPage.vue")

// Collector Views
const CollectorLayout = () => import("../layouts/CollectorLayout.vue")
const CollectorDashboard = () => import("../views/collector/CollectorDashboard.vue")
const CreateGroup = () => import("../views/collector/CreateGroup.vue")
const ReviewPayments = () => import("../views/collector/ReviewPayments.vue")
const RunDraw = () => import("../views/collector/RunDraw.vue")

// Giver Views
const GiverLayout = () => import("../layouts/GiverLayout.vue")
const GiverDashboard = () => import("../views/giver/GiverDashboard.vue")
const JoinGroup = () => import("../views/giver/JoinGroup.vue")
const SubmitPayment = () => import("../views/giver/SubmitPayment.vue")

// ─── Routes ───────────────────────────────────────────────────────
const routes = [
  // Public routes
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "Login",
    component: AuthPage,
    props: { mode: "login" },
    meta: { guestOnly: true },
  },
  {
    path: "/signup",
    name: "Signup",
    component: AuthPage,
    props: { mode: "signup" },
    meta: { guestOnly: true },
  },

  // ── COLLECTOR routes ─────────────────────────────────────────
  {
    path: "/collector",
    component: CollectorLayout,
    meta: { requiresAuth: true, role: "COLLECTOR" },
    children: [
      { path: "", redirect: "/collector/dashboard" },
      {
        path: "dashboard",
        name: "CollectorDashboard",
        component: CollectorDashboard,
        meta: { requiresAuth: true, role: "COLLECTOR", title: "My Ekub Groups" },
      },
      {
        path: "groups/create",
        name: "CreateGroup",
        component: CreateGroup,
        meta: { requiresAuth: true, role: "COLLECTOR", title: "Create New Ekub" },
      },
      {
        path: "groups/:groupId/payments",
        name: "ReviewPayments",
        component: ReviewPayments,
        meta: { requiresAuth: true, role: "COLLECTOR", title: "Review Payments" },
      },
      {
        path: "groups/:groupId/draw",
        name: "RunDraw",
        component: RunDraw,
        meta: { requiresAuth: true, role: "COLLECTOR", title: "Run The Draw" },
      },
    ],
  },

  // ── GIVER routes ─────────────────────────────────────────────
  {
    path: "/giver",
    component: GiverLayout,
    meta: { requiresAuth: true, role: "GIVER" },
    children: [
      { path: "", redirect: "/giver/dashboard" },
      {
        path: "dashboard",
        name: "GiverDashboard",
        component: GiverDashboard,
        meta: { requiresAuth: true, role: "GIVER", title: "My Ekub Groups" },
      },
      {
        path: "groups/join",
        name: "JoinGroup",
        component: JoinGroup,
        meta: { requiresAuth: true, role: "GIVER", title: "Join an Ekub" },
      },
      {
        path: "groups/:groupId/pay",
        name: "SubmitPayment",
        component: SubmitPayment,
        meta: { requiresAuth: true, role: "GIVER", title: "Submit Payment" },
      },
    ],
  },

  // ── Catch-all 404 ──────────────────────────────────────────────
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: { template: "<div style=\"min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a1a;color:#fff;font-family:Inter,sans-serif\"><div style=\"text-align:center\"><h1 style=\"font-size:6rem;margin:0;color:#a78bfa\">404</h1><p style=\"font-size:1.25rem;color:#94a3b8\">Page not found</p><a href=\"/login\" style=\"color:#a78bfa;text-decoration:none\">Go Home</a></div></div>" },
  },
]

// ─── Router Instance ──────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ─── Navigation Guard ─────────────────────────────────────────────
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("ekublink_token")
  const userData = localStorage.getItem("ekublink_user")
  const user = userData ? JSON.parse(userData) : null

  const isAuthenticated = !!token && !!user
  const userRole = user?.role || null

  // 1. Guest-only pages (login/signup) — redirect if already logged in
  if (to.meta.guestOnly && isAuthenticated) {
    const redirect = userRole === "COLLECTOR" ? "/collector/dashboard" : "/giver/dashboard"
    return next(redirect)
  }

  // 2. Protected routes — redirect to login if not authenticated
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: "Login", query: { redirect: to.fullPath } })
  }

  // 3. Role guard — prevent cross-role navigation
  if (to.meta.role && isAuthenticated && userRole !== to.meta.role) {
    console.warn(`[Router Guard] Role mismatch: User is ${userRole}, tried to access ${to.meta.role} route.`)
    const redirect = userRole === "COLLECTOR" ? "/collector/dashboard" : "/giver/dashboard"
    return next(redirect)
  }

  // Update document title
  document.title = to.meta.title ? `${to.meta.title} — EkubLink` : "EkubLink"

  next()
})

export default router
