<template>
  <AppShell :title="employment?.jobTitle ?? 'Employment'" back @back="emit('back')">
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <LoadingCards v-if="loading" :count="3" />
      <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />
      <EmptyState
        v-else-if="!employment"
        :icon="Icons.BriefcaseBusiness"
        title="Employment not found"
        description="This employment may no longer be available."
      />

      <div v-else class="space-y-4">
        <div class="tl-card">
          <div class="tl-card-body space-y-3">
            <div class="flex items-center gap-3">
              <Avatar :name="employment.workerName" :src="employment.workerPhotoUrl ?? ''" size="lg" />
              <div class="min-w-0 flex-1">
                <p class="font-semibold truncate">{{ employment.workerName }}</p>
                <p class="text-xs tl-muted truncate">{{ employment.jobTitle }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <StatusPill :status="employment.status" :list="EMPLOYMENT_STATUSES" />
                  <span class="tl-caption">{{ employment.employmentEvent.replace(/_/g, ' ') }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center gap-1.5">
                <ion-icon :icon="Icons.Wallet" style="color: #059669" />
                <span>{{ formatCompensation(employment.agreedCompensation, employment.compensationType) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <ion-icon :icon="Icons.MapPin" />
                <span>{{ employment.municipalityName ?? 'Location N/A' }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <ion-icon :icon="Icons.CalendarDays" />
                <span>Started {{ formatDate(employment.startDate) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <ion-icon :icon="Icons.Time" />
                <span>{{ employment.workingHours ?? 'Hours not set' }}</span>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="tl-muted">Workday progress</span>
                <span class="font-medium">
                  {{ employment.approvedWorkdays }}/{{ employment.targetWorkdays }} workdays ·
                  {{ employment.progressPercent }}%
                </span>
              </div>
              <ProgressBar :value="employment.progressPercent" />
            </div>

            <div v-if="employment.pendingReports > 0" class="tl-safety">
              <div class="flex items-center gap-2 font-semibold">
                <ion-icon :icon="Icons.FileWarning" />
                <span>{{ employment.pendingReports }} accomplishment report(s) awaiting review</span>
              </div>
              <p class="tl-caption mt-1">Open the Reports tab to approve or reject them.</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-if="canComplete"
                type="button"
                class="tl-btn"
                :disabled="completing"
                @click="completeOpen = true"
              >
                <ion-icon :icon="completing ? Icons.Loader2 : Icons.CheckCircle2" :class="{ 'tl-spin': completing }" />
                Mark completed
              </button>
              <button
                v-if="employment.evaluations.length === 0"
                type="button"
                class="tl-btn outline"
                @click="evaluationOpen = true"
              >
                <ion-icon :icon="Icons.Star" /> Evaluate worker
              </button>
            </div>
          </div>
        </div>

        <div class="tl-chip-row">
          <button type="button" class="tl-chip" :class="{ on: tab === 'reports' }" @click="tab = 'reports'">
            Reports ({{ employment.accomplishments.length }})
          </button>
          <button type="button" class="tl-chip" :class="{ on: tab === 'renewals' }" @click="tab = 'renewals'">
            Renewals ({{ employment.renewals.length }})
          </button>
          <button type="button" class="tl-chip" :class="{ on: tab === 'evaluation' }" @click="tab = 'evaluation'">
            Evaluation ({{ employment.evaluations.length }})
          </button>
        </div>

        <div v-if="tab === 'reports'">
          <EmployerAccomplishments
            :accomplishments="employment.accomplishments"
            @review="reviewTarget = $event"
          />
        </div>

        <div v-else-if="tab === 'renewals'">
          <EmployerRenewalManagement :employment-id="employmentId" @created="onRenewalCreated" />
        </div>

        <div v-else class="space-y-3">
          <EmptyState
            v-if="employment.evaluations.length === 0"
            :icon="Icons.Star"
            title="No evaluation yet"
            description="Evaluate the worker's punctuality, quality, and attitude after the job."
          >
            <template #action>
              <button type="button" class="tl-btn sm" @click="evaluationOpen = true">
                <ion-icon :icon="Icons.Star" /> Evaluate worker
              </button>
            </template>
          </EmptyState>
          <div v-else class="space-y-2">
            <div v-for="evaluation in employment.evaluations" :key="evaluation.id" class="tl-card">
              <div class="tl-card-body space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-0.5">
                    <ion-icon
                      v-for="n in 5"
                      :key="n"
                      :icon="Icons.Star"
                      :style="{ color: n <= evaluation.rating ? '#d97706' : '#d1d5db', fontSize: '16px' }"
                    />
                  </div>
                  <span class="tl-caption">{{ formatDate(evaluation.createdAt) }}</span>
                </div>
                <p v-if="evaluation.comment" class="text-sm">“{{ evaluation.comment }}”</p>
                <div class="flex flex-wrap gap-2 text-xs tl-muted">
                  <span v-if="evaluation.punctuality != null">Punctuality: {{ evaluation.punctuality }}/5</span>
                  <span v-if="evaluation.quality != null">Quality: {{ evaluation.quality }}/5</span>
                  <span v-if="evaluation.attitude != null">Attitude: {{ evaluation.attitude }}/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PullRefresh>

    <EmployerAccomplishmentReview
      :accomplishment="reviewTarget"
      :employment-id="employmentId"
      @close="reviewTarget = null"
      @reviewed="onReviewed"
    />

    <BottomSheet :open="evaluationOpen" title="Evaluate worker" @close="evaluationOpen = false">
      <div class="space-y-3">
        <p class="text-sm tl-muted">
          Your honest feedback helps workers build their verified passport and improve.
        </p>

        <Field label="Overall rating" required>
          <div class="flex items-center gap-1">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="tl-btn ghost icon"
              :aria-label="`${n} star${n === 1 ? '' : 's'}`"
              @click="evaluation.rating = n"
            >
              <ion-icon
                :icon="Icons.Star"
                :style="{ color: n <= evaluation.rating ? '#d97706' : '#d1d5db', fontSize: '28px' }"
              />
            </button>
          </div>
        </Field>

        <Field label="Comment" hint="Optional but appreciated.">
          <textarea v-model="evaluation.comment" class="tl-textarea" rows="3" placeholder="How did the work go?" />
        </Field>

        <p v-if="evaluationError" class="tl-error">{{ evaluationError }}</p>

        <div class="flex gap-2">
          <button type="button" class="tl-btn outline" @click="evaluationOpen = false">Cancel</button>
          <button type="button" class="tl-btn" :disabled="evaluating" @click="submitEvaluation">
            <ion-icon :icon="evaluating ? Icons.Loader2 : Icons.Send" :class="{ 'tl-spin': evaluating }" />
            Submit evaluation
          </button>
        </div>
      </div>
    </BottomSheet>

    <ConfirmDialog
      :open="completeOpen"
      title="Mark employment completed?"
      message="This finalizes the work period and stops further daily reports. Make sure all accomplishment reports are reviewed."
      confirm-label="Mark completed"
      :danger="true"
      @cancel="completeOpen = false"
      @confirm="markCompleted"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import {
  createEvaluation,
  EMPLOYMENT_STATUSES,
  getEmployment,
  completeEmployment,
  useAsync,
  useToast,
  type AccomplishmentDTO,
  type EmploymentDetailDTO,
} from '../worker/_lib'
import {
  AppShell,
  Avatar,
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  ErrorRetry,
  Field,
  formatCompensation,
  formatDate,
  Icons,
  LoadingCards,
  ProgressBar,
  PullRefresh,
  RefreshHeader,
  StatusPill,
} from '../worker/_ui'

import EmployerAccomplishments from './EmployerAccomplishments.vue'
import EmployerAccomplishmentReview from './EmployerAccomplishmentReview.vue'
import EmployerRenewalManagement from './EmployerRenewalManagement.vue'

const props = defineProps<{ employmentId: string }>()
const emit = defineEmits<{ (e: 'back'): void }>()

const { toast } = useToast()
const tab = ref<'reports' | 'renewals' | 'evaluation'>('reports')
const reviewTarget = ref<AccomplishmentDTO | null>(null)
const completeOpen = ref(false)
const completing = ref(false)
const evaluationOpen = ref(false)
const evaluating = ref(false)
const evaluationError = ref('')
const evaluation = reactive({ rating: 0, comment: '' })

const {
  data: employment,
  loading,
  error,
  refresh,
  setData,
} = useAsync<EmploymentDetailDTO>(() => getEmployment(props.employmentId), () => [props.employmentId])

const canComplete = computed(() =>
  Boolean(
    employment.value &&
      ['pending_start', 'active', 'paused'].includes(employment.value.status)
  )
)

async function markCompleted() {
  const current = employment.value
  if (!current) return

  completeOpen.value = false
  completing.value = true

  try {
    const updated = await completeEmployment(current.id)

    setData(updated)
    await toast('Employment marked as completed.')
  } catch (e: any) {
    await toast(
      e?.message || 'Could not complete the employment.',
      'danger'
    )
  } finally {
    completing.value = false
  }
}

function onReviewed(updated: AccomplishmentDTO) {
  const current = employment.value
  if (!current) return
  setData({
    ...current,
    accomplishments: current.accomplishments.map((a) => (a.id === updated.id ? updated : a)),
  })
  reviewTarget.value = updated
  void refresh()
}

function onRenewalCreated() {
  void refresh()
}

async function submitEvaluation() {
  const current = employment.value
  if (!current) return
  evaluationError.value = ''
  if (!evaluation.rating) {
    evaluationError.value = 'Choose an overall rating.'
    return
  }
  evaluating.value = true
  try {
    await createEvaluation({
      employmentId: current.id,
      rating: evaluation.rating,
      comment: evaluation.comment.trim() || null,
    })
    await toast('Evaluation submitted.')
    evaluationOpen.value = false
    evaluation.rating = 0
    evaluation.comment = ''
    await refresh()
  } catch (e: any) {
    evaluationError.value = e?.message || 'Could not submit the evaluation.'
    await toast(evaluationError.value, 'danger')
  } finally {
    evaluating.value = false
  }
}
</script>
