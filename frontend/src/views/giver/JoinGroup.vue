<template>
  <div>
    <div class="page-header flex items-center gap-4">
      <RouterLink to="/giver/dashboard" class="btn btn-ghost btn-sm">← Back</RouterLink>
      <div>
        <h1 class="page-title">Join an Ekub <span>🔗</span></h1>
        <p>Enter the Group ID provided by your Collector to join.</p>
      </div>
    </div>

    <div class="join-layout">
      <div class="card">
        <div class="form-group mb-4">
          <label class="form-label">Group ID</label>
          <input v-model="groupId" class="form-control" type="text"
            placeholder="Paste the Group ID from your Collector" style="font-family:monospace" />
        </div>

        <div v-if="error" class="alert alert-error mb-4">⚠️ {{ error }}</div>
        <div v-if="success" class="alert alert-success mb-4">✅ {{ success }}</div>

        <button class="btn btn-primary btn-full btn-lg" @click="handleJoin" :disabled="loading || !groupId.trim()">
          <span v-if="loading" class="spinner" />
          <span v-else>🤝 Join Ekub Group</span>
        </button>

        <div class="divider" />

        <div style="text-align:center">
          <p class="text-muted text-sm">Don't have a Group ID?</p>
          <p class="text-sm mt-2">Ask your <strong>Collector</strong> to share the Group ID from their dashboard.</p>
        </div>
      </div>

      <div class="card card-glow" style="padding:var(--sp-8)">
        <div style="font-size:3rem;text-align:center;margin-bottom:var(--sp-4)">🪙</div>
        <h3 class="text-center mb-4">How Ekub Works</h3>
        <div class="how-it-works">
          <div class="how-step">
            <div class="how-icon">1️⃣</div>
            <div><strong>Join the Group</strong><p class="text-sm text-muted">Get added to a rotating savings group with a fixed contribution.</p></div>
          </div>
          <div class="how-step">
            <div class="how-icon">💳</div>
            <div><strong>Pay Each Round</strong><p class="text-sm text-muted">Transfer via CBE and upload your receipt to confirm payment.</p></div>
          </div>
          <div class="how-step">
            <div class="how-icon">🎯</div>
            <div><strong>Win the Pool</strong><p class="text-sm text-muted">One member wins the entire pooled amount each round until everyone has won.</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter, RouterLink } from "vue-router"
import api from "../../services/api.js"

const router = useRouter()
const groupId = ref("")
const loading = ref(false)
const error = ref(null)
const success = ref(null)

const handleJoin = async () => {
  error.value = null
  loading.value = true
  try {
    const { data } = await api.post("/groups/join", { group_id: groupId.value.trim() })
    success.value = `Joined "${data.membership.group.name}" successfully! Redirecting...`
    setTimeout(() => router.push("/giver/dashboard"), 1800)
  } catch (err) {
    error.value = err.response?.data?.error || "Failed to join group. Check the Group ID."
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.join-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-6); align-items: start; max-width: 900px; }
.how-it-works { display: flex; flex-direction: column; gap: var(--sp-5); }
.how-step { display: flex; gap: var(--sp-4); align-items: flex-start; }
.how-icon { font-size: 1.8rem; flex-shrink: 0; }
@media (max-width: 768px) { .join-layout { grid-template-columns: 1fr; } }
</style>
