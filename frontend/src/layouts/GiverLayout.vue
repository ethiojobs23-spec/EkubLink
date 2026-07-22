<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-mark">🪙 EkubLink</div>
        <div style="margin-top:4px;font-size:0.75rem;color:var(--c-purple-2)">Giver Portal</div>
      </div>
      <nav class="sidebar-nav">
        <RouterLink to="/giver/dashboard" class="nav-item" active-class="active">
          <span class="nav-icon">🏠</span> My Ekubs
        </RouterLink>
        <RouterLink to="/giver/groups/join" class="nav-item" active-class="active">
          <span class="nav-icon">🔗</span> Join an Ekub
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <div style="font-size:0.8rem;color:var(--c-text-3);margin-bottom:8px;">
          Signed in as <strong style="color:var(--c-text-2)">{{ authStore.user?.full_name }}</strong>
        </div>
        <div style="font-size:0.75rem;color:var(--c-text-3);margin-bottom:12px;">
          📞 {{ authStore.user?.phone_number }}
        </div>
        <button class="btn btn-ghost btn-sm btn-full" @click="handleLogout">Sign Out</button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="eth-strip" style="margin-bottom:var(--sp-6);border-radius:var(--r-full)" />
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { useRouter, RouterLink, RouterView } from "vue-router"
import { useAuthStore } from "../stores/auth.js"

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push("/login")
}
</script>
