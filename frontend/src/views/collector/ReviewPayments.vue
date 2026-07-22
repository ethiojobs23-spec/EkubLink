<template>
  <div>
    <!-- Header -->
    <div class="page-header flex items-center gap-4">
      <RouterLink to="/collector/dashboard" class="btn btn-ghost btn-sm">← Back</RouterLink>
      <div>
        <h1 class="page-title">Review Payments <span>📋</span></h1>
        <p v-if="activeRound">Round {{ activeRound.round_number }} — Due: {{ formatDate(activeRound.due_date) }}</p>
        <p v-else class="text-muted">No active round</p>
      </div>
    </div>

    <!-- Alert -->
    <Transition name="fade">
      <div v-if="actionMessage" :class="`alert alert-${actionMessage.type} mb-6`">
        {{ actionMessage.text }}
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center" style="padding:60px">
      <div class="spinner" style="width:40px;height:40px;border-width:3px" />
    </div>

    <!-- No Active Round -->
    <div v-else-if="!activeRound" class="card text-center" style="padding:60px">
      <div style="font-size:3rem;margin-bottom:12px">⏳</div>
      <h3>No Active Round</h3>
      <p class="mt-4">Create a new round to start collecting payments from members.</p>
      <button class="btn btn-primary mt-6" @click="showCreateRound = true">+ Create Round</button>
    </div>

    <!-- Create Round Modal -->
    <div v-if="showCreateRound" class="modal-overlay" @click.self="showCreateRound = false">
      <div class="modal-box card">
        <h3 class="mb-4">Create New Round</h3>
        <div class="form-group mb-4">
          <label class="form-label">Due Date</label>
          <input v-model="newRoundDate" type="date" class="form-control" :min="today" />
        </div>
        <div class="flex gap-3">
          <button class="btn btn-primary flex-1" @click="createRound" :disabled="creatingRound">
            <span v-if="creatingRound" class="spinner" />
            <span v-else>Create Round</span>
          </button>
          <button class="btn btn-ghost" @click="showCreateRound = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Payments Table -->
    <div v-else>
      <!-- Stats bar -->
      <div class="stats-row mb-6">
        <div class="stat-card"><div class="stat-label">Pending</div>
          <div class="stat-value" style="color:var(--c-warning)">{{ payments.length }}</div></div>
        <div class="stat-card"><div class="stat-label">Approved</div>
          <div class="stat-value" style="color:var(--c-success)">{{ approvedCount }}</div></div>
        <div class="stat-card"><div class="stat-label">Rejected</div>
          <div class="stat-value" style="color:var(--c-danger)">{{ rejectedCount }}</div></div>
      </div>

      <div v-if="payments.length === 0" class="card text-center" style="padding:40px">
        <div style="font-size:2.5rem;margin-bottom:12px">✅</div>
        <h3>All Caught Up!</h3>
        <p class="mt-2">No pending payments to review for this round.</p>
      </div>

      <div v-else class="card" style="padding:0;overflow:hidden">
        <div style="padding:20px 24px;border-bottom:1px solid var(--c-border)">
          <h3>Pending Receipts ({{ payments.length }})</h3>
        </div>
        <div class="payment-list">
          <div v-for="p in payments" :key="p.id" class="payment-row">
            <!-- Member Info -->
            <div class="member-info">
              <div class="avatar">{{ p.giver.full_name[0] }}</div>
              <div>
                <div class="font-bold" style="font-size:0.95rem">{{ p.giver.full_name }}</div>
                <div class="text-muted text-sm">{{ p.giver.phone_number }}</div>
              </div>
            </div>

            <!-- CBE Ref -->
            <div>
              <div class="text-muted text-sm">CBE Reference</div>
              <code class="ref-code">{{ p.cbe_ref_number }}</code>
            </div>

            <!-- Receipt Preview -->
            <div>
              <div class="text-muted text-sm">Receipt</div>
              <a :href="`${apiBase}${p.receipt_image_url}`" target="_blank" class="receipt-thumb-link">
                <img :src="`${apiBase}${p.receipt_image_url}`" class="receipt-thumb" alt="Receipt" @error="e => e.target.src='/no-image.png'" />
                <span class="view-label">View Full</span>
              </a>
            </div>

            <!-- Submitted At -->
            <div>
              <div class="text-muted text-sm">Submitted</div>
              <div class="text-sm">{{ timeAgo(p.submitted_at) }}</div>
            </div>

            <!-- Actions -->
            <div class="action-btns">
              <button class="btn btn-success btn-sm" @click="reviewPayment(p.id, 'APPROVED')"
                :disabled="reviewing === p.id">
                <span v-if="reviewing === p.id" class="spinner" />
                <span v-else>✓ Approve</span>
              </button>
              <button class="btn btn-danger btn-sm" @click="reviewPayment(p.id, 'REJECTED')"
                :disabled="reviewing === p.id">
                ✕ Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Run Draw CTA -->
      <div v-if="approvedCount > 0" class="draw-cta card card-gold mt-6 flex justify-between items-center">
        <div>
          <h3 class="text-gold">Ready to Run the Draw?</h3>
          <p>{{ approvedCount }} member(s) have approved payments this round.</p>
        </div>
        <RouterLink :to="`/collector/groups/${groupId}/draw`" class="btn btn-gold btn-lg">🎯 Run Draw</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRoute, RouterLink } from "vue-router"
import api from "../../services/api.js"

const route = useRoute()
const groupId = route.params.groupId
const apiBase = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001"

const payments = ref([])
const activeRound = ref(null)
const loading = ref(true)
const reviewing = ref(null)
const actionMessage = ref(null)
const showCreateRound = ref(false)
const newRoundDate = ref("")
const creatingRound = ref(false)
const approvedCount = ref(0)
const rejectedCount = ref(0)

const today = new Date().toISOString().split("T")[0]

const formatDate = (d) => new Date(d).toLocaleDateString("en-ET", { day: "2-digit", month: "short", year: "numeric" })

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const showMessage = (text, type = "success") => {
  actionMessage.value = { text, type }
  setTimeout(() => actionMessage.value = null, 4000)
}

const loadPayments = async () => {
  try {
    const { data } = await api.get(`/payments/pending/${groupId}`)
    payments.value = data.payments || []
    activeRound.value = data.activeRound || null
    // Load counts for sidebar
    const all = await api.get(`/rounds/${groupId}/active`)
    if (all.data.round) {
      approvedCount.value = all.data.round.payments.filter(p => p.status === "APPROVED").length
      rejectedCount.value = all.data.round.payments.filter(p => p.status === "REJECTED").length
    }
  } finally {
    loading.value = false
  }
}

const reviewPayment = async (paymentId, action) => {
  reviewing.value = paymentId
  try {
    const { data } = await api.patch(`/payments/${paymentId}/review`, { action })
    payments.value = payments.value.filter(p => p.id !== paymentId)
    if (action === "APPROVED") approvedCount.value++
    else rejectedCount.value++
    showMessage(`Payment ${action.toLowerCase()} for ${data.payment.giver.full_name}.`, action === "APPROVED" ? "success" : "error")
  } catch (err) {
    showMessage(err.response?.data?.error || "Action failed.", "error")
  } finally {
    reviewing.value = null
  }
}

const createRound = async () => {
  if (!newRoundDate.value) return
  creatingRound.value = true
  try {
    await api.post(`/rounds/create/${groupId}`, { due_date: newRoundDate.value })
    showCreateRound.value = false
    await loadPayments()
  } catch (err) {
    showMessage(err.response?.data?.error || "Failed to create round.", "error")
  } finally {
    creatingRound.value = false
  }
}

onMounted(loadPayments)
</script>

<style scoped>
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-4); }

.payment-list { display: flex; flex-direction: column; }
.payment-row {
  display: grid; grid-template-columns: 1.8fr 1.2fr 100px 1fr 180px;
  align-items: center; gap: var(--sp-4); padding: 20px 24px;
  border-bottom: 1px solid var(--c-border); transition: background 0.15s;
}
.payment-row:last-child { border-bottom: none; }
.payment-row:hover { background: rgba(255,255,255,0.02); }

.member-info { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--c-purple), #5b21b6);
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; flex-shrink: 0;
}

.ref-code { font-size: 0.82rem; color: var(--c-gold); background: var(--c-gold-glow);
  padding: 3px 8px; border-radius: 6px; }

.receipt-thumb-link { position: relative; display: inline-block; }
.receipt-thumb { width: 56px; height: 56px; object-fit: cover; border-radius: 8px;
  border: 1px solid var(--c-border-2); cursor: pointer; }
.view-label { position: absolute; inset: 0; background: rgba(0,0,0,0.6); border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 0.65rem;
  color: white; font-weight: 600; opacity: 0; transition: opacity 0.2s; }
.receipt-thumb-link:hover .view-label { opacity: 1; }

.action-btns { display: flex; gap: 8px; }

.draw-cta { background: linear-gradient(135deg, rgba(245,166,35,0.08), rgba(124,58,237,0.06)); }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
  z-index: 1000; display: flex; align-items: center; justify-content: center;
}
.modal-box { width: 100%; max-width: 400px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .payment-row { grid-template-columns: 1fr; gap: 12px; padding: 16px; }
}
</style>
