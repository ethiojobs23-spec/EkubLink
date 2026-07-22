<template>
  <div class="auth-page">
    <div class="eth-strip" />

    <!-- Left Panel: Brand -->
    <div class="auth-brand">
      <div class="brand-inner">
        <div class="brand-logo">
          <span class="logo-icon">🪙</span>
          <span class="logo-text">EkubLink</span>
        </div>
        <h1 class="brand-headline">The Future of<br /><span class="text-gold">Ethiopian Ekub</span></h1>
        <p class="brand-sub">A trusted digital platform for rotating savings groups. Transparent, secure, and beautifully simple.</p>
        <div class="brand-features">
          <div class="feature-item"><span>🔐</span> Secure CBE Integration</div>
          <div class="feature-item"><span>🎯</span> Fair & Transparent Draws</div>
          <div class="feature-item"><span>📊</span> Real-time Tracking</div>
          <div class="feature-item"><span>🤝</span> Trusted by Communities</div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Form -->
    <div class="auth-form-panel">
      <div class="auth-card">
        <!-- Tab Toggle -->
        <div class="auth-tabs">
          <RouterLink to="/login" class="auth-tab" :class="{ active: currentMode === 'login' }">Sign In</RouterLink>
          <RouterLink to="/signup" class="auth-tab" :class="{ active: currentMode === 'signup' }">Create Account</RouterLink>
        </div>

        <!-- Alert -->
        <Transition name="fade">
          <div v-if="authStore.error" class="alert alert-error mb-4">
            <span>⚠️</span> {{ authStore.error }}
          </div>
        </Transition>

        <!-- LOGIN FORM -->
        <form v-if="currentMode === 'login'" @submit.prevent="handleLogin" class="auth-form" novalidate>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input v-model="loginForm.phone_number" class="form-control" type="tel"
              placeholder="+251912345678" autocomplete="tel" required />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-pw-wrap">
              <input v-model="loginForm.password" :type="showPw ? 'text' : 'password'"
                class="form-control" placeholder="••••••••" required />
              <button type="button" class="pw-toggle" @click="showPw = !showPw">{{ showPw ? "🙈" : "👁️" }}</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg mt-4" :disabled="authStore.loading">
            <span v-if="authStore.loading" class="spinner" />
            <span v-else>Sign In →</span>
          </button>
        </form>

        <!-- SIGNUP FORM -->
        <form v-else @submit.prevent="handleSignup" class="auth-form" novalidate>
          <!-- Role Selector -->
          <div class="role-selector">
            <button type="button" class="role-option" :class="{ selected: signupForm.role === 'COLLECTOR' }"
              @click="signupForm.role = 'COLLECTOR'">
              <span class="role-icon">👑</span>
              <div>
                <div class="role-name">Collector</div>
                <div class="role-desc">Create & manage an Ekub</div>
              </div>
            </button>
            <button type="button" class="role-option" :class="{ selected: signupForm.role === 'GIVER' }"
              @click="signupForm.role = 'GIVER'">
              <span class="role-icon">🤝</span>
              <div>
                <div class="role-name">Giver</div>
                <div class="role-desc">Join & contribute to an Ekub</div>
              </div>
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input v-model="signupForm.full_name" class="form-control" type="text"
              placeholder="Abebe Kebede" required />
            <span v-if="formErrors.full_name" class="form-error">{{ formErrors.full_name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input v-model="signupForm.phone_number" class="form-control" type="tel"
              placeholder="+251912345678" required />
            <span v-if="formErrors.phone_number" class="form-error">{{ formErrors.phone_number }}</span>
          </div>
          <div v-if="signupForm.role === 'COLLECTOR'" class="form-group">
            <label class="form-label">Your CBE Account Number <span class="text-gold">*</span></label>
            <input v-model="signupForm.cbe_account" class="form-control" type="text"
              placeholder="1000123456789" />
            <span class="form-error" style="color:var(--c-text-3)">Members will send contributions to this account</span>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-pw-wrap">
              <input v-model="signupForm.password" :type="showPw ? 'text' : 'password'"
                class="form-control" placeholder="Min. 6 characters" required />
              <button type="button" class="pw-toggle" @click="showPw = !showPw">{{ showPw ? "🙈" : "👁️" }}</button>
            </div>
            <span v-if="formErrors.password" class="form-error">{{ formErrors.password }}</span>
          </div>

          <button type="submit" class="btn btn-gold btn-full btn-lg mt-4" :disabled="authStore.loading || !signupForm.role">
            <span v-if="authStore.loading" class="spinner" style="border-top-color:#000" />
            <span v-else>Create Account →</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import { useRouter, useRoute, RouterLink } from "vue-router"
import { useAuthStore } from "../../stores/auth.js"

const props = defineProps({ mode: { type: String, default: "login" } })
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const currentMode = computed(() => route.path.includes("signup") ? "signup" : "login")
const showPw = ref(false)
const formErrors = ref({})

const loginForm = ref({ phone_number: "", password: "" })
const signupForm = ref({ full_name: "", phone_number: "", password: "", role: "", cbe_account: "" })

// Clear error when switching tabs
watch(currentMode, () => {
  authStore.error = null
  formErrors.value = {}
})

const validateSignup = () => {
  formErrors.value = {}
  if (!signupForm.value.full_name || signupForm.value.full_name.length < 2)
    formErrors.value.full_name = "Name must be at least 2 characters."
  if (!signupForm.value.phone_number.match(/^(\+251|0)(9|7)\d{8}$/))
    formErrors.value.phone_number = "Enter a valid Ethiopian phone number (e.g. +251912345678)."
  if (!signupForm.value.password || signupForm.value.password.length < 6)
    formErrors.value.password = "Password must be at least 6 characters."
  return Object.keys(formErrors.value).length === 0
}

const handleLogin = async () => {
  try {
    const data = await authStore.login(loginForm.value)
    router.push(data.redirectPath)
  } catch {}
}

const handleSignup = async () => {
  if (!validateSignup()) return
  try {
    const data = await authStore.signup(signupForm.value)
    router.push(data.redirectPath)
  } catch {}
}
</script>

<style scoped>
.auth-page {
  display: flex;
  min-height: 100vh;
  background: var(--c-bg);
  position: relative;
}

.eth-strip { position: absolute; top: 0; left: 0; right: 0; z-index: 10; }

.auth-brand {
  width: 45%;
  background: linear-gradient(160deg, #0f0f2a 0%, #1a0a3d 50%, #0f1a2a 100%);
  display: flex;
  align-items: center;
  padding: var(--sp-12);
  position: relative;
  overflow: hidden;
}
.auth-brand::before {
  content: "";
  position: absolute;
  top: -100px; right: -100px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%);
  pointer-events: none;
}
.auth-brand::after {
  content: "";
  position: absolute;
  bottom: -100px; left: -100px;
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%);
  pointer-events: none;
}

.brand-inner { position: relative; z-index: 1; }
.brand-logo {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: var(--sp-8);
}
.logo-icon { font-size: 2.5rem; }
.logo-text {
  font-family: "Outfit", sans-serif; font-size: 2rem; font-weight: 800;
  background: linear-gradient(135deg, #f5a623, #a78bfa);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.brand-headline { font-size: clamp(1.6rem, 3vw, 2.4rem); margin-bottom: var(--sp-4); line-height: 1.2; }
.brand-sub { color: var(--c-text-2); line-height: 1.7; margin-bottom: var(--sp-8); font-size: 1rem; }
.brand-features { display: flex; flex-direction: column; gap: var(--sp-3); }
.feature-item {
  display: flex; align-items: center; gap: var(--sp-3); font-size: 0.9rem; color: var(--c-text-2);
}
.feature-item span { font-size: 1.1rem; }

.auth-form-panel {
  width: 55%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-12) var(--sp-8);
  padding-top: calc(var(--sp-12) + 3px);
}

.auth-card {
  width: 100%;
  max-width: 440px;
}

.auth-tabs {
  display: flex;
  background: var(--c-surface);
  border-radius: var(--r-md);
  padding: 4px;
  margin-bottom: var(--sp-6);
  border: 1px solid var(--c-border);
}
.auth-tab {
  flex: 1; text-align: center; padding: 10px; border-radius: 8px;
  font-size: 0.9rem; font-weight: 600; color: var(--c-text-2); transition: all var(--t-base);
  text-decoration: none;
}
.auth-tab.active { background: var(--c-surface-3); color: var(--c-text); }
.auth-tab:hover:not(.active) { color: var(--c-text); }

.auth-form { display: flex; flex-direction: column; gap: var(--sp-4); }

.role-selector {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-3); margin-bottom: var(--sp-2);
}
.role-option {
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-4); border-radius: var(--r-md);
  border: 2px solid var(--c-border-2); background: var(--c-surface);
  cursor: pointer; transition: all var(--t-base); text-align: left;
}
.role-option.selected {
  border-color: var(--c-purple-2);
  background: rgba(124,58,237,0.12);
}
.role-icon { font-size: 1.8rem; }
.role-name { font-weight: 700; font-size: 0.9rem; color: var(--c-text); }
.role-desc { font-size: 0.75rem; color: var(--c-text-3); margin-top: 2px; }

.input-pw-wrap { position: relative; }
.input-pw-wrap .form-control { padding-right: 44px; }
.pw-toggle {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .auth-page { flex-direction: column; }
  .auth-brand { width: 100%; padding: var(--sp-8) var(--sp-6); }
  .brand-features { display: none; }
  .auth-form-panel { width: 100%; padding: var(--sp-6); }
}
</style>
