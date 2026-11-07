<template>
  <div class="space-y-3">
    <LoadingCards v-if="loading" :count="2" />
    <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />

    <template v-else-if="employment">
      <div v-if="pendingRenewal" class="tl-card" style="background: var(--tl-bg)">
        <div class="tl-card-body space-y-1">
          <div class="flex items-center justify-between gap-2">
            <p class="font-medium text-sm">Renewal request pending</p>
            <StatusPill :status="pendingRenewal.status" :list="RENEWAL_STATUSES" />
          </div>
          <p class="text-xs tl-muted">
            Proposed new end date {{ formatDate(pendingRenewal.newEndDate) }} ·
            {{ pendingRenewal.proposedExtension.replace(/_/g, ' ') }}
          </p>
        </div>
      </div>

      <div v-if="canRequest && !pendingRenewal" class="tl-card">
        <div class="tl-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tl-muted">Request a renewal</p>
          <p class="text-xs tl-muted">
            Extend the worker's contract beyond {{ formatDate(employment.endDate ?? employment.startDate) }}.
          </p>

          <div class="grid grid-cols-2 gap-2">
            <Field label="Extension">
              <FormSelect v-model="form.proposedExtension" :options="extensionOptions" />
            </Field>
            <Field label="New end date" required>
              <input v-model="form.newEndDate" class="tl-input" type="date" />
            </Field>
          </div>

          <Field label="Compensation terms" required>
            <input v-model="form.compensationTerms" class="tl-input" placeholder="e.g. ₱500 per day" />
          </Field>

          <Field label="Reason" hint="Optional. Helps the worker decide.">
            <textarea v-model="form.reason" class="tl-textarea" rows="2" placeholder="Why extend this employment?" />
          </Field>

          <p v-if="formError" class="tl-error">{{ formError }}</p>

          <button type="button" class="tl-btn" :disabled="saving" @click="submit">
            <ion-icon :icon="saving ? Icons.Loader2 : Icons.Send" :class="{ 'tl-spin': saving }" />
            Send renewal request
          </button>
        </div>
      </div>

      <p v-else-if="!canRequest && !pendingRenewal" class="text-xs tl-muted">
        Renewals can only be requested while this employment is active.
      </p>

      <SectionTitle>
        Renewal history
        <template #action>
          <div class="flex items-center gap-2">
            <span class="tl-caption">{{ renewals.length }}</span>
            <RefreshHeader :refreshing="loading" @refresh="refresh" />
          </div>
        </template>
      </SectionTitle>

      <EmptyState
        v-if="renewals.length === 0"
        :icon="Icons.RotateCw"
        title="No renewals yet"
        description="Renewal requests and their outcomes will appear here."
      />
      <div v-else class="space-y-2">
        <div v-for="renewal in renewals" :key="renewal.id" class="tl-card">
          <div class="tl-card-body space-y-1">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-medium text-sm">{{ renewal.proposedExtension.replace(/_/g, ' ') }}</p>
                <p class="text-[11px] tl-muted">{{ relativeTime(renewal.createdAt) }}</p>
              </div>
              <StatusPill :status="renewal.status" :list="RENEWAL_STATUSES" />
            </div>
            <p class="text-xs tl-muted">New end date: {{ formatDate(renewal.newEndDate) }}</p>
            <p class="text-xs tl-muted">Terms: {{ renewal.compensationTerms }}</p>
            <p v-if="renewal.reason" class="text-xs">Reason: {{ renewal.reason }}</p>
            <p v-if="renewal.respondedAt" class="text-[11px] tl-muted">
              Responded {{ relativeTime(renewal.respondedAt) }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import {
  ApiError,
  createRenewal,
  getEmployment,
  listRenewals,
  RENEWAL_EXTENSIONS,
  RENEWAL_STATUSES,
  useAsync,
  useToast,
  type EmploymentDetailDTO,
  type RenewalDTO,
} from '../worker/_lib'
import {
  EmptyState,
  ErrorRetry,
  Field,
  FormSelect,
  formatDate,
  Icons,
  LoadingCards,
  RefreshHeader,
  relativeTime,
  SectionTitle,
  StatusPill,
} from '../worker/_ui'

const props = defineProps<{ employmentId: string }>()
const emit = defineEmits<{ (e: 'created', renewal: RenewalDTO): void }>()

const { toast } = useToast()
const saving = ref(false)
const formError = ref('')

function defaultEndDate() {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString().slice(0, 10)
}

const form = reactive({
  proposedExtension: '1_month',
  newEndDate: defaultEndDate(),
  compensationTerms: '',
  reason: '',
})

const extensionOptions = RENEWAL_EXTENSIONS.map((r) => ({ value: r.value, label: r.label }))

interface RenewalBundle {
  employment: EmploymentDetailDTO
  renewals: RenewalDTO[]
}

const {
  data,
  loading,
  error,
  refresh,
  setData,
} = useAsync<RenewalBundle>(async () => {
  const [employment, renewals] = await Promise.all([
    getEmployment(props.employmentId),
    listRenewals(props.employmentId),
  ])
  return { employment, renewals }
}, () => [props.employmentId])

const employment = computed(() => data.value?.employment ?? null)
const renewals = computed(() => data.value?.renewals ?? [])
const pendingRenewal = computed(
  () => renewals.value.find((r) => r.status === 'pending') ?? null
)
const canRequest = computed(() => {
  const status = employment.value?.status
  return Boolean(status && ['active', 'pending_start', 'paused'].includes(status))
})

async function submit() {
  formError.value = ''
  if (!form.newEndDate) {
    formError.value = 'Choose the new end date.'
    return
  }
  if (!form.compensationTerms.trim()) {
    formError.value = 'Describe the compensation terms.'
    return
  }
  saving.value = true
  try {
    const created = await createRenewal(props.employmentId, {
      proposedExtension: form.proposedExtension,
      newEndDate: form.newEndDate,
      compensationTerms: form.compensationTerms.trim(),
      reason: form.reason.trim() || null,
    })
    setData(
      data.value
        ? { ...data.value, renewals: [created, ...data.value.renewals] }
        : data.value
    )
    form.reason = ''
    await toast('Renewal request sent.')
    emit('created', created)
  } catch (e: any) {
    const message = String(e?.message ?? '')
    if (e instanceof ApiError && e.status === 409) {
      formError.value = 'A renewal request is already pending for this employment.'
      await toast(formError.value, 'warning')
      void refresh()
    } else if (/pending renewal/i.test(message)) {
      formError.value = message
      await toast(message, 'warning')
      void refresh()
    } else {
      formError.value = message || 'Could not send the renewal request.'
      await toast(formError.value, 'danger')
    }
  } finally {
    saving.value = false
  }
}
</script>
