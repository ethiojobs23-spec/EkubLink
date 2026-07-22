<template>
  <div>
    <div class="page-header flex items-center gap-4">
      <RouterLink to="/collector/dashboard" class="btn btn-ghost btn-sm">← Back</RouterLink>
      <div>
        <h1 class="page-title">Create New Ekub <span>✨</span></h1>
        <p>Set up the rules for your rotating savings group.</p>
      </div>
    </div>

    <div class="create-layout">
      <form @submit.prevent="handleCreate" class="card" novalidate>
        <div class="form-section">
          <h3 class="section-title">📋 Group Details</h3>
          <div class="form-grid">
            <div class="form-group" style="grid-column:span 2">
              <label class="form-label">Group Name *</label>
              <input v-model="form.name" class="form-control" type="text"
                placeholder="e.g. Addis Friends Ekub 2026" required />
            </div>
            <div class="form-group">
              <label class="form-label">Contribution Amount (ETB) *</label>
              <input v-model="form.contribution_amount" class="form-control" type="number" min="100" step="50"
                placeholder="1000" required />
            </div>
            <div class="form-group">
              <label class="form-label">Max Members *</label>
              <input v-model="form.max_members" class="form-control" type="number" min="2" max="500"
                placeholder="10" required />
            </div>
            <div class="form-group">
              <label class="form-label">Cycle Frequency *</label>
              <select v-model="form.cycle_frequency" class="form-control" required>
                <option value="">Select frequency</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Winner Selection Method *</label>
              <select v-model="form.selection_method" class="form-control" required>
                <option value="">Select method</option>
                <option value="RANDOM">Random Draw</option>
                <option value="FIXED_ORDER">Fixed Order</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Start Date *</label>
              <input v-model="form.start_date" class="form-control" type="date" :min="today" required />
            </div>
          </div>
        </div>

        <div class="divider" />

        <div class="form-section">
          <h3 class="section-title">🏦 CBE Account Details</h3>
          <p class="text-muted text-sm mb-4">Members will transfer contributions to this account.</p>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Bank Name</label>
              <input v-model="form.bank_name" class="form-control" type="text" value="CBE" placeholder="CBE" />
            </div>
            <div class="form-group">
              <label class="form-label">CBE Account Number *</label>
              <input v-model="form.account_number" class="form-control" type="text"
                placeholder="1000123456789" required />
            </div>
          </div>
        </div>

        <div v-if="error" class="alert alert-error mt-4">⚠️ {{ error }}</div>
        <div v-if="success" class="alert alert-success mt-4">✅ {{ success }}</div>

        <div class="flex gap-3 mt-6">
          <button type="submit" class="btn btn-gold btn-lg" :disabled="loading">
            <span v-if="loading" class="spinner" style="border-top-color:#000" />
            <span v-else>🪙 Create Ekub Group</span>
          </button>
          <RouterLink to="/collector/dashboard" class="btn btn-ghost btn-lg">Cancel</RouterLink>
        </div>
      </form>

      <!-- Preview Panel -->
      <div class="preview-panel">
        <div class="card card-glow">
          <h3 class="mb-4">📊 Group Preview</h3>
          <div class="preview-item">
            <span>Group Name</span>
            <strong>{{ form.name || "—" }}</strong>
          </div>
          <div class="preview-item">
            <span>Contribution</span>
            <strong class="text-gold">{{ form.contribution_amount ? formatCurrency(form.contribution_amount) : "—" }}</strong>
          </div>
          <div class="preview-item">
            <span>Members</span>
            <strong>{{ form.max_members || "—" }}</strong>
          </div>
          <div class="preview-item">
            <span>Frequency</span>
            <strong>{{ form.cycle_frequency || "—" }}</strong>
          </div>
          <div class="preview-item">
            <span>Total Pool</span>
            <strong class="text-purple">{{ totalPool || "—" }}</strong>
          </div>
          <div class="preview-item">
            <span>Selection</span>
            <strong>{{ form.selection_method || "—" }}</strong>
          </div>

          <div v-if="form.contribution_amount && form.max_members" class="pool-highlight mt-4">
            <div style="font-size:0.75rem;color:var(--c-text-3);margin-bottom:4px">Total Payout Per Round</div>
            <div style="font-size:2rem;font-weight:800;font-family:Outfit,sans-serif" class="text-gold">
              {{ formatCurrency(form.contribution_amount * form.max_members) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useRouter, RouterLink } from "vue-router"
import api from "../../services/api.js"

const router = useRouter()
const loading = ref(false)
const error = ref(null)
const success = ref(null)
const today = new Date().toISOString().split("T")[0]

const form = ref({
  name: "", contribution_amount: "", max_members: "",
  cycle_frequency: "", selection_method: "", start_date: "",
  bank_name: "CBE", account_number: "",
})

const formatCurrency = (v) => new Intl.NumberFormat("am-ET", { style: "currency", currency: "ETB", minimumFractionDigits: 0 }).format(v)

const totalPool = computed(() => {
  if (form.value.contribution_amount && form.value.max_members) {
    return formatCurrency(parseFloat(form.value.contribution_amount) * parseInt(form.value.max_members))
  }
  return null
})

const handleCreate = async () => {
  error.value = null
  loading.value = true
  try {
    const { data } = await api.post("/groups/create", form.value)
    success.value = `"${data.group.name}" created! Redirecting...`
    setTimeout(() => router.push("/collector/dashboard"), 1500)
  } catch (err) {
    error.value = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Failed to create group."
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-layout { display: grid; grid-template-columns: 1fr 320px; gap: var(--sp-6); align-items: start; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-4); }
.section-title { font-size: 1rem; margin-bottom: var(--sp-4); }
.preview-item { display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid var(--c-border); font-size: 0.88rem; color: var(--c-text-2); }
.preview-item:last-of-type { border-bottom: none; }
.preview-item strong { color: var(--c-text); }
.pool-highlight { text-align: center; padding: 16px; background: var(--c-gold-glow); border-radius: var(--r-md); }

@media (max-width: 900px) {
  .create-layout { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .form-group[style] { grid-column: span 1 !important; }
}
</style>
