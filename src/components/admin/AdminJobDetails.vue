<template>
  <BottomSheet :open="Boolean(jobId)" :title="jobTitle" @close="emit('close')">
    <LoadingCards v-if="loading && !job" :count="3" />
    <ErrorRetry v-else-if="error && !job" :message="error ?? ''" @retry="refresh" />
    <EmptyState v-else-if="!job" title="No job selected" description="Close and try again." />
    <div v-else class="space-y-3">
      <div class="tl-card">
        <div class="tl-card-body">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <UrgencyTag :level="job?.urgencyLevel ?? 'normal'" />
                <span class="tl-pill">{{ labelFor(job?.category ?? '', JOB_CATEGORIES) }}</span>
                <span class="tl-pill">
                  {{ labelFor(job?.employmentType ?? '', EMPLOYMENT_TYPES) }}
                </span>
              </div>
              <h2 class="font-semibold text-lg mt-1">{{ job?.title }}</h2>
              <button type="button" class="employer-link" @click="viewEmployer">
                <IonIcon :icon="Icons.Building2" class="tiny-icon" />
                <span class="truncate">{{ job?.employerName }}</span>
                <VerifiedBadge :verification="job?.employerVerification ?? 'unverified'" />
                <IonIcon :icon="Icons.ChevronRight" class="tiny-icon" />
              </button>
            </div>
            <StatusPill :status="job?.status ?? 'draft'" />
          </div>

          <div class="detail-grid mt-3">
            <div class="detail-box">
              <p class="detail-label">Compensation</p>
              <p class="detail-value">
                {{ formatCompensation(job?.compensation ?? 0, job?.compensationType ?? 'daily') }}
              </p>
              <p class="text-[11px] text-muted-foreground mt-0.5">
                {{ labelFor(job?.compensationType ?? '', COMPENSATION_TYPES) }}
              </p>
            </div>
            <div class="detail-box">
              <p class="detail-label">Positions</p>
              <p class="detail-value">{{ job?.positions ?? 0 }} open</p>
            </div>
            <div class="detail-box">
              <p class="detail-label">Duration</p>
              <p class="detail-value">{{ formatRange(job?.startDate, job?.endDate) }}</p>
            </div>
            <div class="detail-box">
              <p class="detail-label">Location</p>
              <p class="detail-value truncate">
                {{ job?.municipalityName ?? job?.barangay ?? 'N/A' }}
              </p>
              <p v-if="job?.locationText" class="text-[11px] text-muted-foreground truncate">
                {{ job?.locationText }}
              </p>
            </div>
            <div v-if="job?.workingHours" class="detail-box span-2">
              <p class="detail-label">Working hours</p>
              <p class="detail-value">{{ job?.workingHours }}</p>
            </div>
            <div v-if="job?.applicationDeadline" class="detail-box span-2">
              <p class="detail-label">Apply by</p>
              <p class="detail-value">{{ formatDate(job?.applicationDeadline) }}</p>
            </div>
          </div>

          <div class="tl-divider" />
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11px] text-muted-foreground uppercase">Moderation</span>
            <StatusPill :status="job?.moderationStatus ?? 'ok'" />
          </div>
        </div>
      </div>

      <ScamFlags v-if="scamFlags.length > 0" :flags="scamFlags" />

      <SectionTitle>Description</SectionTitle>
      <div class="tl-card">
        <div class="tl-card-body">
          <p class="text-sm pre-line">{{ job?.description }}</p>
        </div>
      </div>

      <template v-if="responsibilities.length > 0">
        <SectionTitle>Responsibilities</SectionTitle>
        <div class="tl-card">
          <div class="tl-card-body">
            <ul class="list-disc">
              <li v-for="(r, i) in responsibilities" :key="i">{{ r }}</li>
            </ul>
          </div>
        </div>
      </template>

      <template v-if="qualifications.length > 0">
        <SectionTitle>Qualifications</SectionTitle>
        <div class="tl-card">
          <div class="tl-card-body">
            <ul class="list-disc">
              <li v-for="(q, i) in qualifications" :key="i">{{ q }}</li>
            </ul>
          </div>
        </div>
      </template>

      <template v-if="requiredSkills.length > 0">
        <SectionTitle>Required skills</SectionTitle>
        <div class="tl-list">
          <div v-for="rs in requiredSkills" :key="rs.id" class="tl-card">
            <div class="tl-card-body skill-row">
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm truncate">{{ rs.skillName }}</p>
                <p v-if="rs.categoryName" class="text-[11px] text-muted-foreground truncate">
                  {{ rs.categoryName }}
                </p>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="tl-pill capitalize">{{ rs.importance }}</span>
                <span class="tl-pill">w{{ rs.weight }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="tl-divider" />

      <SectionTitle>Moderation</SectionTitle>
      <p class="text-xs text-muted-foreground">
        Removing hides the job but preserves historical records.
      </p>

      <Field
        :label="pendingAction === 'remove' ? 'Reason (required)' : 'Reason / note'"
        :required="pendingAction === 'remove'"
        hint="Visible to the employer where applicable. Required when removing."
      >
        <textarea
          v-model="reason"
          class="tl-textarea"
          rows="3"
          maxlength="1000"
          placeholder="e.g. Listing requests an upfront placement fee, confirmed scam pattern."
        />
      </Field>

      <div class="space-y-2">
        <div v-if="job?.moderationStatus !== 'removed'" class="action-grid">
          <button
            type="button"
            class="tl-btn outline block warning-outline"
            :disabled="acting || job?.moderationStatus === 'flagged'"
            @click="pendingAction = 'flag'"
          >
            <IonIcon :icon="Icons.FileWarning" />
            Flag
          </button>
          <button
            type="button"
            class="tl-btn outline block"
            :disabled="acting || job?.moderationStatus === 'under_review'"
            @click="pendingAction = 'under_review'"
          >
            <IonIcon :icon="Icons.Search" />
            Review
          </button>
          <button
            type="button"
            class="tl-btn outline block danger-outline span-2"
            :disabled="acting"
            @click="pendingAction = 'remove'"
          >
            <IonIcon :icon="Icons.Trash2" />
            Remove job
          </button>
        </div>
        <button
          v-else
          type="button"
          class="tl-btn outline block success-outline"
          :disabled="acting"
          @click="pendingAction = 'restore'"
        >
          <IonIcon :icon="Icons.RotateCw" />
          Restore job
        </button>
      </div>
    </div>

    <template #footer>
      <button type="button" class="tl-btn outline block" @click="emit('close')">Close</button>
    </template>
  </BottomSheet>

  <ConfirmDialog
    :open="pendingAction !== null"
    :title="confirmTitle"
    :message="confirmMessage"
    :danger="pendingAction === 'remove'"
    confirm-label="Confirm"
    @confirm="performAction"
    @cancel="pendingAction = null"
  />
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed, ref, watch } from 'vue'

import {
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  ErrorRetry,
  Field,
  Icons,
  LoadingCards,
  ScamFlags,
  SectionTitle,
  StatusPill,
  UrgencyTag,
  VerifiedBadge,
} from '../worker/_ui'
import {
  COMPENSATION_TYPES,
  EMPLOYMENT_TYPES,
  JOB_CATEGORIES,
  adminJobAction,
  formatCompensation,
  formatDate,
  formatRange,
  getJob,
  labelFor,
  useAsync,
  useToast,
  type JobWithMatch,
} from '../worker/_lib'

type ModerationAction = 'remove' | 'flag' | 'under_review' | 'restore'

const props = defineProps<{ jobId: string | null }>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
  (e: 'view-employer', employerId: string): void
}>()

const { toast } = useToast()

const {
  data: job,
  loading,
  error,
  refresh,
} = useAsync<JobWithMatch | null>(
  () => (props.jobId ? getJob(props.jobId) : Promise.resolve(null)),
  () => [props.jobId]
)

const pendingAction = ref<ModerationAction | null>(null)
const reason = ref('')
const acting = ref(false)

watch(
  () => props.jobId,
  () => {
    pendingAction.value = null
    reason.value = ''
  }
)

const responsibilities = computed(() => job.value?.responsibilities ?? [])
const qualifications = computed(() => job.value?.qualifications ?? [])
const requiredSkills = computed(() => job.value?.requiredSkills ?? [])
const scamFlags = computed(() => job.value?.scamFlags ?? [])

const jobTitle = computed(() => job.value?.title ?? 'Job details')

const confirmTitle = computed(() => {
  switch (pendingAction.value) {
    case 'remove':
      return 'Remove this job?'
    case 'flag':
      return 'Flag this job?'
    case 'under_review':
      return 'Mark this job under review?'
    case 'restore':
      return 'Restore this job?'
    default:
      return 'Confirm action'
  }
})

const confirmMessage = computed(() => {
  switch (pendingAction.value) {
    case 'remove':
      return 'The job will be hidden from workers and marked as removed. Historical records (applications, employments) are preserved. A reason is required.'
    case 'flag':
      return 'The job will be flagged for review. Workers will see a safety notice. The employer will be notified.'
    case 'under_review':
      return 'The job will be marked as under review while you investigate.'
    case 'restore':
      return 'The job will be restored to OK moderation status and visible again.'
    default:
      return ''
  }
})

function viewEmployer(): void {
  const id = job.value?.employerId
  if (id) emit('view-employer', id)
}

function actionSuccess(action: ModerationAction): string {
  switch (action) {
    case 'remove':
      return 'Job removed. The job is hidden from workers and historical records are preserved.'
    case 'flag':
      return 'Job flagged. The employer has been notified.'
    case 'under_review':
      return 'Job marked under review.'
    default:
      return 'Job restored. The job is visible again with moderation cleared.'
  }
}

async function performAction(): Promise<void> {
  const current = job.value
  const action = pendingAction.value
  if (!current || !action || acting.value) return
  if (action === 'remove' && !reason.value.trim()) {
    toast('Provide a reason for removing this job.', 'danger')
    return
  }
  acting.value = true
  try {
    await adminJobAction(current.id, action, reason.value.trim() || null)
    toast(actionSuccess(action), 'success')
    pendingAction.value = null
    reason.value = ''
    emit('updated')
    await refresh()
  } catch (e: any) {
    toast(e?.message || 'Could not update job.', 'danger')
  } finally {
    acting.value = false
  }
}
</script>

<style scoped>
.employer-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--tl-muted);
  font: inherit;
  font-size: 12px;
  max-width: 100%;
  cursor: pointer;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.detail-box {
  border-radius: 8px;
  background: #f3f4f6;
  padding: 8px;
  min-width: 0;
}

.detail-label {
  margin: 0;
  color: var(--tl-muted);
  font-size: 12px;
}

.detail-value {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 600;
  min-width: 0;
}

.span-2 {
  grid-column: span 2 / span 2;
}

.pre-line {
  white-space: pre-line;
}

.list-disc {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
}

.skill-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.danger-outline {
  color: #be123c;
  border-color: #fda4af;
}

.success-outline {
  color: #047857;
  border-color: #6ee7b7;
}

.warning-outline {
  color: #b45309;
  border-color: #fcd34d;
}

.tiny-icon {
  font-size: 13px;
}
</style>
