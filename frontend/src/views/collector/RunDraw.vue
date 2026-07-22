<template>
  <div>
    <div class="page-header flex items-center gap-4">
      <RouterLink :to="`/collector/groups/${groupId}/payments`" class="btn btn-ghost btn-sm">← Back</RouterLink>
      <div>
        <h1 class="page-title">Run The Draw <span>🎯</span></h1>
        <p>Randomly select the winner from members with approved payments.</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center" style="padding:80px">
      <div class="spinner" style="width:48px;height:48px;border-width:4px" />
    </div>

    <div v-else class="draw-layout">
      <!-- Draw Panel -->
      <div class="draw-panel">
        <div v-if="!winner" class="draw-card card card-glow text-center">
          <div class="draw-icon" :class="{ spinning: isSpinning }">🎱</div>
          <h2 class="mt-4">Ready to Draw?</h2>
          <p class="mt-2">{{ eligibleCount }} member(s) with approved payments are eligible.</p>

          <div v-if="eligibleCount === 0" class="alert alert-warning mt-6">
            No approved payments yet. Approve at least one payment before running the draw.
          </div>

          <button v-else class="btn btn-gold btn-lg mt-6" @click="handleDraw" :disabled="isSpinning || drawing">
            <span v-if="isSpinning || drawing" class="spinner" style="border-top-color:#000" />
            <span v-else>🎯 Run The Draw Now</span>
          </button>
        </div>

        <!-- Winner Reveal -->
        <div v-else class="winner-card card text-center">
          <div class="confetti-emoji">🎉</div>
          <h2 class="winner-title">We Have a Winner!</h2>
          <div class="winner-avatar">{{ winner.full_name[0] }}</div>
          <h1 class="winner-name text-gold">{{ winner.full_name }}</h1>
          <p class="text-muted">{{ winner.phone_number }}</p>
          <div class="pool-amount mt-4">
            <div class="text-muted text-sm">Payout Amount</div>
            <div class="amount-value">{{ formatCurrency(poolAmount) }}</div>
          </div>
          <div class="alert alert-success mt-6" style="text-align:left">
            🏦 Transfer <strong>{{ formatCurrency(poolAmount) }}</strong> to {{ winner.full_name }}'s CBE account.
          </div>
          <button class="btn btn-primary mt-4" @click="winner = null">🔄 Reset Draw View</button>
        </div>
      </div>

      <!-- Eligible Members -->
      <div class="eligible-panel">
        <div class="card">
          <h3 class="mb-4">✅ Eligible Members ({{ eligibleCount }})</h3>
          <div v-if="eligibleMembers.length === 0" class="text-muted text-sm">No eligible members yet.</div>
          <div v-for="m in eligibleMembers" :key="m.id" class="eligible-row">
            <div class="avatar" style="width:36px;height:36px;font-size:0.9rem;flex-shrink:0">
              {{ m.giver.full_name[0] }}
            </div>
            <div>
              <div style="font-size:0.9rem;font-weight:600">{{ m.giver.full_name }}</div>
              <div style="font-size:0.75rem;color:var(--c-text-3)">{{ m.cbe_ref_number }}</div>
            </div>
            <span class="badge badge-approved" style="margin-left:auto">Approved</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="alert alert-error mt-6">⚠️ {{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRoute, RouterLink } from "vue-router"
import api from "../../services/api.js"

const route = useRoute()
const groupId = route.params.groupId

const loading = ref(true)
const drawing = ref(false)
const isSpinning = ref(false)
const winner = ref(null)
const poolAmount = ref(0)
const eligibleMembers = ref([])
const error = ref(null)

const eligibleCount = computed(() => eligibleMembers.value.length)
const formatCurrency = (v) => new Intl.NumberFormat("am-ET", { style: "currency", currency: "ETB", minimumFractionDigits: 0 }).format(v)

const loadData = async () => {
  try {
    const { data } = await api.get(`/rounds/${groupId}/active`)
    if (data.round) {
      eligibleMembers.value = data.round.payments.filter(p => p.status === "APPROVED")
    }
  } finally {
    loading.value = false
  }
}

const handleDraw = async () => {
  isSpinning.value = true
  drawing.value = true
  error.value = null

  // Animate for suspense
  await new Promise(r => setTimeout(r, 2500))

  try {
    const { data: roundData } = await api.get(`/rounds/${groupId}/active`)
    if (!roundData.round) { error.value = "No active round found."; return }

    const { data } = await api.post(`/rounds/${roundData.round.id}/draw`)
    winner.value = data.winner
    poolAmount.value = data.poolAmount
  } catch (err) {
    error.value = err.response?.data?.error || "Draw failed."
  } finally {
    isSpinning.value = false
    drawing.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.draw-layout { display: grid; grid-template-columns: 1fr 340px; gap: var(--sp-6); align-items: start; }

.draw-card { padding: var(--sp-10); }
.draw-icon { font-size: 5rem; display: block; transition: transform 0.1s; }
.draw-icon.spinning { animation: roulette 0.15s linear infinite; }
@keyframes roulette { to { transform: rotate(360deg) scale(1.1); } }

.winner-card { padding: var(--sp-8); animation: fadeInScale 0.6s ease; }
@keyframes fadeInScale { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.confetti-emoji { font-size: 4rem; animation: bounce 0.6s ease; }
@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
.winner-title { font-size: 1.5rem; margin: 12px 0; }
.winner-avatar {
  width: 80px; height: 80px; border-radius: 50%; margin: 16px auto;
  background: linear-gradient(135deg, var(--c-gold), #d97706);
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; font-weight: 800; color: #000;
}
.winner-name { font-size: 2rem; margin: 8px 0 4px; }
.pool-amount { background: var(--c-gold-glow); border-radius: var(--r-md); padding: 16px; }
.amount-value { font-size: 2rem; font-weight: 800; font-family: Outfit,sans-serif; color: var(--c-gold); }

.eligible-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 0;
  border-bottom: 1px solid var(--c-border);
}
.eligible-row:last-child { border-bottom: none; }

.avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, var(--c-purple), #5b21b6);
  display: flex; align-items: center; justify-content: center; font-weight: 700;
}

@media (max-width: 900px) { .draw-layout { grid-template-columns: 1fr; } }
</style>
