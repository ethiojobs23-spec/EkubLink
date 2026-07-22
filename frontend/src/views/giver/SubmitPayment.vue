<template>
  <div>
    <div class="page-header flex items-center gap-4">
      <RouterLink to="/giver/dashboard" class="btn btn-ghost btn-sm">← Back</RouterLink>
      <div>
        <h1 class="page-title">Submit Payment <span>💳</span></h1>
        <p>Upload your CBE transfer receipt for this round.</p>
      </div>
    </div>

    <div v-if="loadingRound" class="flex justify-center" style="padding:80px">
      <div class="spinner" style="width:40px;height:40px;border-width:3px" />
    </div>

    <div v-else-if="!activeRound" class="card text-center" style="padding:60px">
      <div style="font-size:3rem;margin-bottom:12px">⏳</div>
      <h3>No Active Round</h3>
      <p class="mt-2">Your Collector has not started a new round yet. Check back soon.</p>
    </div>

    <div v-else class="submit-layout">
      <!-- Payment Instructions -->
      <div class="instructions-panel">
        <div class="card card-gold">
          <h3 class="mb-4">📋 How to Pay</h3>
          <div class="step-list">
            <div class="step"><span class="step-num">1</span>
              <div>Open your <strong>CBE Birr</strong> or <strong>CBE Mobile Banking</strong> app</div></div>
            <div class="step"><span class="step-num">2</span>
              <div>Transfer <strong class="text-gold">{{ formatCurrency(activeRound.group.contribution_amount) }}</strong> to:</div></div>
            <div class="cbe-account">
              <div class="bank-name">🏦 {{ activeRound.group.bank_name }}</div>
              <div class="account-number">{{ activeRound.group.account_number }}</div>
              <button class="btn btn-ghost btn-sm mt-2" @click="copyAccount">
                {{ copied ? "✅ Copied!" : "📋 Copy Account" }}
              </button>
            </div>
            <div class="step"><span class="step-num">3</span>
              <div>Take a screenshot of the <strong>transaction receipt</strong></div></div>
            <div class="step"><span class="step-num">4</span>
              <div>Upload the screenshot and enter your <strong>CBE Reference Number</strong> below</div></div>
          </div>
        </div>

        <!-- Existing Payment Status -->
        <div v-if="existingPayment" class="card mt-4">
          <h3 class="mb-3">Your Payment Status</h3>
          <div class="flex items-center gap-3">
            <span :class="`badge badge-${existingPayment.status.toLowerCase()}`" style="font-size:0.85rem">
              {{ existingPayment.status }}
            </span>
            <span class="text-sm text-muted">CBE Ref: {{ existingPayment.cbe_ref_number }}</span>
          </div>
          <p v-if="existingPayment.status === 'PENDING'" class="text-sm mt-3" style="color:var(--c-warning)">
            ⏳ Your receipt is under review. The Collector will approve it shortly.
          </p>
          <p v-if="existingPayment.status === 'APPROVED'" class="text-sm mt-3" style="color:var(--c-success)">
            ✅ Payment approved! You are entered in the draw for this round.
          </p>
          <p v-if="existingPayment.status === 'REJECTED'" class="text-sm mt-3" style="color:var(--c-danger)">
            ❌ Payment rejected. Please re-submit with the correct receipt.
          </p>
        </div>
      </div>

      <!-- Upload Form -->
      <div class="form-panel">
        <div class="card">
          <h3 class="mb-2">Round {{ activeRound.round_number }} Payment</h3>
          <p class="text-muted text-sm mb-6">
            Due: {{ formatDate(activeRound.due_date) }} •
            Amount: <strong class="text-gold">{{ formatCurrency(activeRound.group.contribution_amount) }}</strong>
          </p>

          <form @submit.prevent="handleSubmit" novalidate>
            <!-- CBE Ref -->
            <div class="form-group mb-4">
              <label class="form-label">CBE Transaction Reference Number *</label>
              <input v-model="form.cbe_ref_number" class="form-control" type="text"
                placeholder="e.g. FT2605XXXXXX" :disabled="hasApprovedPayment" required />
              <span class="text-muted text-sm" style="margin-top:4px;display:block">
                Found in your CBE Birr transaction history
              </span>
            </div>

            <!-- File Upload Zone -->
            <div class="form-group mb-6">
              <label class="form-label">Receipt Screenshot *</label>
              <div class="upload-zone" :class="{ 'drag-over': isDragOver, 'has-file': !!previewUrl }"
                @dragover.prevent="isDragOver = true" @dragleave="isDragOver = false"
                @drop.prevent="handleDrop" :disabled="hasApprovedPayment">

                <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp"
                  @change="handleFileChange" :disabled="hasApprovedPayment" ref="fileInput" />

                <!-- Preview -->
                <div v-if="previewUrl" class="file-preview">
                  <img :src="previewUrl" alt="Receipt preview" class="preview-img" />
                  <div class="preview-info">
                    <div class="preview-name">{{ selectedFile?.name }}</div>
                    <div class="preview-size">{{ formatFileSize(selectedFile?.size) }}</div>
                    <button type="button" class="btn btn-danger btn-sm mt-2" @click="clearFile">✕ Remove</button>
                  </div>
                </div>

                <!-- Upload Prompt -->
                <div v-else class="upload-prompt">
                  <div style="font-size:3rem;margin-bottom:12px">📤</div>
                  <p class="font-bold">Drop your receipt here</p>
                  <p class="text-muted text-sm mt-1">or click to browse</p>
                  <p class="text-muted text-sm mt-2">JPEG, PNG, WebP — Max 5MB</p>
                </div>
              </div>

              <div v-if="fileError" class="alert alert-error mt-2">⚠️ {{ fileError }}</div>
            </div>

            <div v-if="submitError" class="alert alert-error mb-4">⚠️ {{ submitError }}</div>
            <div v-if="submitSuccess" class="alert alert-success mb-4">✅ {{ submitSuccess }}</div>

            <button type="submit" class="btn btn-primary btn-full btn-lg"
              :disabled="submitting || !form.cbe_ref_number || !selectedFile || hasApprovedPayment">
              <span v-if="submitting" class="spinner" />
              <span v-else-if="hasApprovedPayment">✅ Payment Already Approved</span>
              <span v-else>📤 Submit Receipt</span>
            </button>
          </form>
        </div>
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

const activeRound = ref(null)
const existingPayment = ref(null)
const loadingRound = ref(true)
const submitting = ref(false)
const isDragOver = ref(false)
const copied = ref(false)
const selectedFile = ref(null)
const previewUrl = ref(null)
const fileError = ref(null)
const submitError = ref(null)
const submitSuccess = ref(null)
const fileInput = ref(null)

const form = ref({ cbe_ref_number: "" })

const hasApprovedPayment = computed(() => existingPayment.value?.status === "APPROVED")

const formatCurrency = (v) => new Intl.NumberFormat("am-ET", { style: "currency", currency: "ETB", minimumFractionDigits: 0 }).format(v)
const formatDate = (d) => new Date(d).toLocaleDateString("en-ET", { day: "2-digit", month: "short", year: "numeric" })
const formatFileSize = (bytes) => {
  if (!bytes) return ""
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const validateFile = (file) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
  if (!allowed.includes(file.type)) { fileError.value = "Only JPEG, PNG, and WebP images are allowed."; return false }
  if (file.size > 5 * 1024 * 1024) { fileError.value = "File size must be under 5MB."; return false }
  fileError.value = null
  return true
}

const setFile = (file) => {
  if (!validateFile(file)) return
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) setFile(file)
}

const handleDrop = (e) => {
  isDragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file) setFile(file)
}

const clearFile = () => {
  selectedFile.value = null
  previewUrl.value = null
  if (fileInput.value) fileInput.value.value = ""
}

const copyAccount = async () => {
  await navigator.clipboard.writeText(activeRound.value.group.account_number)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

const handleSubmit = async () => {
  submitError.value = null
  submitting.value = true

  const formData = new FormData()
  formData.append("round_id", activeRound.value.id)
  formData.append("cbe_ref_number", form.value.cbe_ref_number)
  formData.append("receipt", selectedFile.value)

  try {
    await api.post("/payments/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    submitSuccess.value = "Receipt submitted! Your Collector will review it shortly."
    await loadData()
  } catch (err) {
    submitError.value = err.response?.data?.error || "Failed to submit. Please try again."
  } finally {
    submitting.value = false
  }
}

const loadData = async () => {
  try {
    const { data } = await api.get(`/rounds/${groupId}/active`)
    activeRound.value = data.round

    if (data.round) {
      const paymentsRes = await api.get(`/payments/my-payments/${groupId}`)
      const myPayments = paymentsRes.data.payments
      existingPayment.value = myPayments.find(p => p.round.id === data.round.id) || null
    }
  } finally {
    loadingRound.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.submit-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--sp-6); align-items: start; }

.step-list { display: flex; flex-direction: column; gap: var(--sp-4); }
.step { display: flex; align-items: flex-start; gap: var(--sp-3); font-size: 0.9rem; }
.step-num {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: var(--c-gold); color: #000; font-weight: 800; font-size: 0.8rem;
  display: flex; align-items: center; justify-content: center;
}
.cbe-account {
  background: var(--c-surface-2); border: 1px solid var(--c-border-2);
  border-radius: var(--r-md); padding: var(--sp-4); margin-left: calc(26px + var(--sp-3));
}
.bank-name { font-size: 0.8rem; color: var(--c-text-3); margin-bottom: 4px; }
.account-number { font-size: 1.3rem; font-weight: 800; font-family: "Outfit", sans-serif; color: var(--c-gold); letter-spacing: 0.05em; }

.upload-zone { min-height: 200px; }
.upload-zone.has-file { border-style: solid; border-color: var(--c-success); background: var(--c-success-bg); }

.file-preview { display: flex; gap: var(--sp-4); align-items: flex-start; }
.preview-img { width: 100px; height: 100px; object-fit: cover; border-radius: var(--r-md); border: 1px solid var(--c-border-2); }
.preview-name { font-weight: 600; font-size: 0.88rem; word-break: break-all; }
.preview-size { font-size: 0.8rem; color: var(--c-text-3); }

.upload-prompt { pointer-events: none; }

@media (max-width: 900px) { .submit-layout { grid-template-columns: 1fr; } }
</style>
