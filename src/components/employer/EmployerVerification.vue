<template>
  <AppShell title="Verification" back @back="emit('back')">
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <LoadingCards v-if="loading" :count="2" />
      <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />

      <div v-else class="space-y-4">
        <div class="tl-card" :style="{ background: statusStyle.bg, borderColor: statusStyle.border }">
          <div class="tl-card-body flex items-start gap-3">
            <ion-icon
              :icon="statusStyle.icon"
              :style="{ color: statusStyle.color, fontSize: '28px' }"
              class="shrink-0"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-semibold">{{ statusStyle.title }}</p>
                <VerifiedBadge :verification="verification" />
              </div>
              <p class="text-xs tl-muted mt-1">{{ statusStyle.description }}</p>
              <p v-if="me?.verificationNote" class="text-xs mt-1">
                Admin note: {{ me.verificationNote }}
              </p>
            </div>
          </div>
        </div>

        <template v-if="verification === 'unverified'">
          <div class="tl-card">
            <div class="tl-card-body space-y-3">
              <p class="text-xs font-semibold uppercase tl-muted">Business documents</p>
              <p class="text-xs tl-muted">
                Upload a business permit, DTI/SEC registration, or a valid ID. Documents are only
                visible to administrators.
              </p>

              <div v-if="docs.length" class="doc-grid">
                <div v-for="(url, index) in docs" :key="url" class="doc-item">
                  <img :src="url" alt="Verification document" />
                  <button type="button" aria-label="Remove document" @click="removeDoc(index)">
                    <ion-icon :icon="Icons.Trash2" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                class="tl-btn outline"
                :disabled="uploading"
                @click="fileInput?.click()"
              >
                <ion-icon :icon="uploading ? Icons.Loader2 : Icons.CloudUpload" :class="{ 'tl-spin': uploading }" />
                {{ uploading ? 'Uploading…' : 'Add a document' }}
              </button>
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="sr-only"
                @change="onFileChange"
              />

              <Field label="Note for reviewers" hint="Optional.">
                <textarea
                  v-model="note"
                  class="tl-textarea"
                  rows="2"
                  placeholder="Anything the reviewer should know"
                />
              </Field>

              <p v-if="formError" class="tl-error">{{ formError }}</p>

              <button type="button" class="tl-btn" :disabled="submitting" @click="submit">
                <ion-icon :icon="submitting ? Icons.Loader2 : Icons.Send" :class="{ 'tl-spin': submitting }" />
                Submit for verification
              </button>
            </div>
          </div>
        </template>

        <div v-else-if="submittedDocs.length" class="tl-card">
          <div class="tl-card-body space-y-2">
            <p class="text-xs font-semibold uppercase tl-muted">Submitted documents</p>
            <div class="doc-grid">
              <div v-for="url in submittedDocs" :key="url" class="doc-item">
                <img :src="url" alt="Submitted document" />
              </div>
            </div>
          </div>
        </div>

        <div class="tl-card">
          <div class="tl-card-body space-y-2">
            <p class="text-xs font-semibold uppercase tl-muted">Why get verified?</p>
            <ul class="list-disc pl-5 text-sm space-y-1">
              <li>Verified employers rank higher and attract more applicants.</li>
              <li>A verified badge signals trust to workers.</li>
              <li>Verification is required for some platform features.</li>
            </ul>
          </div>
        </div>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  ApiError,
  getEmployerMe,
  submitVerification,
  uploadImage,
  useAsync,
  useToast,
  type EmployerProfileDTO,
} from '../worker/_lib'
import {
  AppShell,
  ErrorRetry,
  Field,
  Icons,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
  VerifiedBadge,
} from '../worker/_ui'

const emit = defineEmits<{ (e: 'back'): void }>()

const { toast } = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const docs = ref<string[]>([])
const note = ref('')
const uploading = ref(false)
const submitting = ref(false)
const formError = ref('')

const {
  data: me,
  loading,
  error,
  refresh,
  setData,
} = useAsync<EmployerProfileDTO | null>(() => getEmployerMe(), [])

const verification = computed(() => me.value?.verification ?? 'unverified')
const submittedDocs = computed(() => me.value?.documentUrls ?? [])

const statusStyle = computed(() => {
  switch (verification.value) {
    case 'verified':
      return {
        title: 'You are verified',
        description: 'Workers can see your verified badge on every job you post.',
        icon: Icons.ShieldCheck,
        color: '#059669',
        bg: '#ecfdf5',
        border: '#a7f3d0',
      }
    case 'pending':
      return {
        title: 'Verification under review',
        description: 'Administrators are reviewing your documents. This usually takes 1–3 days.',
        icon: Icons.ShieldAlert,
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
      }
    case 'suspended':
      return {
        title: 'Verification suspended',
        description: 'Contact support if you believe this is a mistake.',
        icon: Icons.Ban,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
      }
    default:
      return {
        title: 'Get verified',
        description: 'Upload your business documents to earn a verified badge.',
        icon: Icons.ShieldCheck,
        color: '#0f766e',
        bg: '#f0fdfa',
        border: '#99f6e4',
      }
  }
})

watch(
  me,
  (profile) => {
    if (!profile) return
    docs.value = [...profile.documentUrls]
  },
  { immediate: true }
)

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploading.value = true
  try {
    const url = await uploadImage(file)
    docs.value = [...docs.value, url]
    await toast('Document uploaded.')
  } catch (e: any) {
    await toast(e?.message || 'Could not upload the document.', 'danger')
  } finally {
    uploading.value = false
  }
}

function removeDoc(index: number) {
  docs.value = docs.value.filter((_, i) => i !== index)
}

async function submit() {
  formError.value = ''
  if (!docs.value.length) {
    formError.value = 'Upload at least one document.'
    return
  }
  submitting.value = true
  try {
    await submitVerification(docs.value, note.value.trim() || null)
    await toast('Verification submitted for review.')
    if (me.value) {
      setData({
        ...me.value,
        verification: 'pending',
        documentUrls: [...docs.value],
        verificationNote: note.value.trim() || null,
      })
    }
    note.value = ''
    await refresh()
  } catch (e: any) {
    const message = String(e?.message ?? '')
    if (e instanceof ApiError && e.status === 409) {
      formError.value = message
    } else if (/already under review|already verified/i.test(message) || message.includes('23505')) {
      formError.value = message || 'A verification request is already pending.'
    } else {
      formError.value = message || 'Could not submit verification.'
    }
    await toast(formError.value, 'danger')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.doc-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.doc-item {
  position: relative;
}
.doc-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--tl-border);
}
.doc-item button {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.72);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
</style>
