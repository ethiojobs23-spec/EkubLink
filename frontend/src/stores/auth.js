// stores/auth.js — Pinia auth store with role-based state
import { defineStore } from "pinia"
import { ref, computed } from "vue"
import api from "../services/api.js"

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("ekublink_token") || null)
  const user = ref(JSON.parse(localStorage.getItem("ekublink_user") || "null"))
  const loading = ref(false)
  const error = ref(null)

  // ── Computed ──────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isCollector = computed(() => user.value?.role === "COLLECTOR")
  const isGiver = computed(() => user.value?.role === "GIVER")
  const userRole = computed(() => user.value?.role || null)
  const dashboardPath = computed(() =>
    user.value?.role === "COLLECTOR" ? "/collector/dashboard" : "/giver/dashboard"
  )

  // ── Actions ───────────────────────────────────────────────────
  function _persist(data) {
    token.value = data.token
    user.value = data.user
    localStorage.setItem("ekublink_token", data.token)
    localStorage.setItem("ekublink_user", JSON.stringify(data.user))
    error.value = null
  }

  async function signup(payload) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post("/auth/signup", payload)
      _persist(data)
      return data
    } catch (err) {
      error.value = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Signup failed."
      throw err
    } finally {
      loading.value = false
    }
  }

  async function login(payload) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post("/auth/login", payload)
      _persist(data)
      return data
    } catch (err) {
      error.value = err.response?.data?.error || "Login failed."
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem("ekublink_token")
    localStorage.removeItem("ekublink_user")
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const { data } = await api.get("/auth/me")
      user.value = data.user
      localStorage.setItem("ekublink_user", JSON.stringify(data.user))
    } catch {
      logout()
    }
  }

  return {
    token, user, loading, error,
    isAuthenticated, isCollector, isGiver, userRole, dashboardPath,
    signup, login, logout, fetchMe,
  }
})
