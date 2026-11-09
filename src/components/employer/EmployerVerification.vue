
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
              <p class="text-xs font-semibold uppercase tl-muted">Supporting documents</p>
              <p class="text-xs tl-muted">
                Upload a valid ID, business registration, business permit, proof of residence,
                or another document appropriate to your employer type. Only authorized
                administrators can review these private documents.
              </p>

              <div v-if="docs.length" class="space-y-2">
                <div
                  v-for="(path, index) in docs"
                  :key="path"
                  class="flex items-center gap-2 rounded-lg border p-3"
                >
                  <ion-icon
                    :icon="isPdf(path) ? Icons.FileText : Icons.Images"
                    class="text-xl shrink-0"
                  />
                  <span class="text-xs flex-1 min-w-0 break-all">
                    {{ fileName(path) }}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove document"
                    class="text-red-600 p-2"
                    @click="removeDoc(index)"
                  >
                    <ion-icon :icon="Icons.Trash2" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                class="tl-btn outline"
                :disabled="uploading || docs.length >= 10"
                @click="fileInput?.click()"
              >
                <ion-icon
                  :icon="uploading ? Icons.Loader2 : Icons.CloudUpload"
                  :class="{ 'tl-spin': uploading }"
                />
                {{ uploading ? 'Uploading...' : 'Add a document' }}
              </button>

              <p class="text-xs tl-muted">
                JPG, PNG, or PDF. Maximum 10 MB per file and 10 documents.
              </p>

              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                class="sr-only"
                @change="onFileChange"
              />

              <Field label="Note for reviewers" hint="Optional.">
                <textarea
                  v-model="note"
                  class="tl-textarea"
                  rows="2"
                  maxlength="1000"
                  placeholder="Anything the reviewer should know"
                />
              </Field>

              <p v-if="formError" class="tl-error">{{ formError }}</p>

              <button
                type="button"
                class="tl-btn"
                :disabled="submitting || uploading"
                @click="submit"
              >
                <ion-icon
                  :icon="submitting ? Icons.Loader2 : Icons.Send"
                  :class="{ 'tl-spin': submitting }"
                />
                Submit for verification
              </button>
            </div>
          </div>
        </template>

        <div v-else-if="submittedDocs.length" class="tl-card">
          <div class="tl-card-body space-y-2">
            <p class="text-xs font-semibold uppercase tl-muted">Submitted documents</p>
            <p class="text-xs tl-muted">
              Your submitted documents are stored privately.
            </p>
            <div
              v-for="path in submittedDocs"
              :key="path"
              class="flex items-center gap-2 rounded-lg border p-3"
            >
              <ion-icon
                :icon="isPdf(path) ? Icons.FileText : Icons.Images"
                class="text-xl shrink-0"
              />
              <span class="text-xs flex-1 min-w-0 break-all">
                {{ fileName(path) }}
              </span>
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
import { IonIcon } from '@ionic/vue'

import {
  ApiError,
  getEmployerMe,
  submitVerification,
  uploadEmployerVerificationDocument,
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
        description: 'Administrators are reviewing your documents.',
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
        description: 'Submit supporting documents for administrator review.',
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

function isPdf(path: string): boolean {
  return path.toLowerCase().endsWith('.pdf')
}

function fileName(path: string): string {
  return path.split('/').pop() || 'Verification document'
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return

  if (docs.value.length >= 10) {
    await toast('You can upload a maximum of 10 documents.', 'danger')
    return
  }

  uploading.value = true

  try {
    const path = await uploadEmployerVerificationDocument(file)
    docs.value = [...docs.value, path]
    await toast('Private document uploaded.')
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

  if (uploading.value) {
    formError.value = 'Please wait for the upload to finish.'
    return
  }

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
    } else if (/already under review|already verified/i.test(message)) {
      formError.value = message
    } else {
      formError.value = message || 'Could not submit verification.'
    }

    await toast(formError.value, 'danger')
  } finally {
    submitting.value = false
  }
}
</script>


