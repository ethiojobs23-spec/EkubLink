<template>
  <div>
    <!-- Header -->
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">My Ekub Groups <span class="text-gold">👑</span></h1>
        <p>Manage your rotating savings groups and review payments.</p>
      </div>
      <RouterLink to="/collector/groups/create" class="btn btn-gold">
        ➕ Create New Ekub
      </RouterLink>
    </div>

    <!-- Stats Row -->
    <div class="stats-row mb-6">
      <div class="stat-card">
        <div class="stat-label">Total Groups</div>
        <div class="stat-value text-gold">{{ groups.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Groups</div>
        <div class="stat-value text-purple">{{ activeGroups }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Members</div>
        <div class="stat-value">{{ totalMembers }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending Reviews</div>
        <div class="stat-value" style="color:var(--c-warning)">{{ totalPending }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center" style="padding:60px 0">
      <div class="spinner" style="width:40px;height:40px;border-width:3px" />
    </div>

    <!-- Empty State -->
    <div v-else-if="groups.length === 0" class="card text-center" style="padding:60px">
      <div style="font-size:4rem;margin-bottom:16px">🪙</div>
      <h3>No Ekub Groups Yet</h3>
      <p class="mt-4">Start by creating your first rotating savings group.</p>
      <RouterLink to="/collector/groups/create" class="btn btn-gold mt-6">Create My First Ekub</RouterLink>
    </div>

    <!-- Groups Grid -->
    <div v-else class="grid-auto">
      <div v-for="group in groups" :key="group.id" class="group-card card">
        <!-- Status Badge -->
        <div class="flex justify-between items-center mb-4">
          <span :class="`badge badge-${group.status.toLowerCase()}`">{{ group.status }}</span>
          <span style="font-size:0.8rem;color:var(--c-text-3)">{{ group.cycle_frequency }}</span>
        </div>

        <h3 style="margin-bottom:8px">{{ group.name }}</h3>

        <div class="group-meta">
          <div class="meta-row">
            <span>💰 Contribution</span>
            <strong>{{ formatCurrency(group.contribution_amount) }}</strong>
          </div>
          <div class="meta-row">
            <span>👥 Members</span>
            <strong>{{ group._count.members }} / {{ group.max_members }}</strong>
          </div>
          <div class="meta-row">
            <span>🏦 Account</span>
            <strong style="font-size:0.8rem">{{ group.account_number }}</strong>
          </div>
          <div v-if="group.rounds[0]" class="meta-row">
            <span>⏱️ Due Date</span>
            <strong>{{ formatDate(group.rounds[0].due_date) }}</strong>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 mt-4" style="flex-wrap:wrap">
          <RouterLink :to="`/collector/groups/${group.id}/payments`" class="btn btn-primary btn-sm">
            📋 Review Payments
          </RouterLink>
          <RouterLink :to="`/collector/groups/${group.id}/draw`" class="btn btn-gold btn-sm">
            🎯 Run Draw
          </RouterLink>
        </div>

        <!-- Invite Code -->
        <div class="invite-code mt-4" @click="copyInvite(group.id)">
          <span>🔗 Group ID:</span>
          <code>{{ group.id.slice(0, 16) }}...</code>
          <span class="copy-hint">{{ copiedId === group.id ? "✅ Copied!" : "Click to copy" }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { RouterLink } from "vue-router"
import api from "../../services/api.js"

const groups = ref([])
const loading = ref(true)
const copiedId = ref(null)

const activeGroups = computed(() => groups.value.filter(g => g.status === "ACTIVE").length)
const totalMembers = computed(() => groups.value.reduce((a, g) => a + g._count.members, 0))
const totalPending = computed(() => groups.value.reduce((a, g) => a + (g.rounds[0] ? 1 : 0), 0))

const formatCurrency = (v) => new Intl.NumberFormat("am-ET", { style: "currency", currency: "ETB", minimumFractionDigits: 0 }).format(v)
const formatDate = (d) => new Date(d).toLocaleDateString("en-ET", { day: "2-digit", month: "short", year: "numeric" })

const copyInvite = async (id) => {
  await navigator.clipboard.writeText(id)
  copiedId.value = id
  setTimeout(() => copiedId.value = null, 2000)
}

onMounted(async () => {
  try {
    const { data } = await api.get("/groups/my-groups")
    groups.value = data.groups
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--sp-4); }
@media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }

.group-card { transition: all 0.25s; }
.group-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-glow); }

.group-meta { display: flex; flex-direction: column; gap: 8px; }
.meta-row { display: flex; justify-content: space-between; align-items: center;
  font-size: 0.88rem; color: var(--c-text-2); }
.meta-row strong { color: var(--c-text); }

.invite-code {
  padding: 10px 12px; background: var(--c-surface-2); border-radius: var(--r-md);
  cursor: pointer; font-size: 0.8rem; color: var(--c-text-3);
  display: flex; align-items: center; gap: 8px; transition: background 0.2s;
}
.invite-code:hover { background: var(--c-surface-3); }
.invite-code code { color: var(--c-purple-2); font-size: 0.78rem; }
.copy-hint { margin-left: auto; font-size: 0.75rem; }
</style>
