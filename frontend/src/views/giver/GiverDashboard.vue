<template>
  <div>
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">My Ekub Groups <span>🤝</span></h1>
        <p>Track your contributions and Ekub status.</p>
      </div>
      <RouterLink to="/giver/groups/join" class="btn btn-primary">
        🔗 Join an Ekub
      </RouterLink>
    </div>

    <div v-if="loading" class="flex justify-center" style="padding:60px">
      <div class="spinner" style="width:40px;height:40px;border-width:3px" />
    </div>

    <div v-else-if="memberships.length === 0" class="card text-center" style="padding:60px">
      <div style="font-size:4rem;margin-bottom:16px">🤝</div>
      <h3>No Groups Yet</h3>
      <p class="mt-4">Join an Ekub group using a Group ID from your Collector.</p>
      <RouterLink to="/giver/groups/join" class="btn btn-primary mt-6">Join My First Ekub</RouterLink>
    </div>

    <div v-else class="grid-auto">
      <div v-for="m in memberships" :key="m.id" class="group-card card">
        <div class="flex justify-between items-center mb-4">
          <span :class="`badge badge-${m.group.status.toLowerCase()}`">{{ m.group.status }}</span>
          <span v-if="m.has_won" class="badge badge-approved">🏆 Winner!</span>
        </div>

        <h3 class="mb-2">{{ m.group.name }}</h3>

        <div class="group-meta">
          <div class="meta-row"><span>💰 Contribution</span>
            <strong>{{ formatCurrency(m.group.contribution_amount) }}</strong></div>
          <div class="meta-row"><span>👥 Members</span>
            <strong>{{ m.group._count.members }} / {{ m.group.max_members }}</strong></div>
          <div class="meta-row"><span>🔄 Frequency</span>
            <strong>{{ m.group.cycle_frequency }}</strong></div>
          <div class="meta-row"><span>🏦 CBE Account</span>
            <strong style="font-size:0.8rem">{{ m.group.account_number }}</strong></div>
        </div>

        <!-- Active Round Info -->
        <div v-if="m.group.rounds[0]" class="round-box mt-4">
          <div class="round-header">
            <span>📅 Round {{ m.group.rounds[0].round_number }}</span>
            <span class="text-sm" style="color:var(--c-text-3)">Due: {{ formatDate(m.group.rounds[0].due_date) }}</span>
          </div>
          <RouterLink :to="`/giver/groups/${m.group.id}/pay`" class="btn btn-primary btn-sm btn-full mt-3">
            💳 Submit Payment
          </RouterLink>
        </div>
        <div v-else class="round-box mt-4" style="text-align:center;color:var(--c-text-3);font-size:0.85rem">
          ⏳ Waiting for next round...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { RouterLink } from "vue-router"
import api from "../../services/api.js"

const memberships = ref([])
const loading = ref(true)

const formatCurrency = (v) => new Intl.NumberFormat("am-ET", { style: "currency", currency: "ETB", minimumFractionDigits: 0 }).format(v)
const formatDate = (d) => new Date(d).toLocaleDateString("en-ET", { day: "2-digit", month: "short", year: "numeric" })

onMounted(async () => {
  try {
    const { data } = await api.get("/groups/joined")
    memberships.value = data.memberships
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.group-card { transition: all 0.25s; }
.group-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-glow); }
.group-meta { display: flex; flex-direction: column; gap: 8px; }
.meta-row { display: flex; justify-content: space-between; align-items: center;
  font-size: 0.88rem; color: var(--c-text-2); }
.meta-row strong { color: var(--c-text); }
.round-box {
  background: var(--c-surface-2); border: 1px solid var(--c-border);
  border-radius: var(--r-md); padding: 14px;
}
.round-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; font-weight: 600; }
</style>
