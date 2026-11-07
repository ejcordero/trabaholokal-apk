<template>
  <AppShell :title="job?.title ?? 'Job details'" back @back="emit('back')">
    <template #right>
      <RefreshHeader :refreshing="refreshing" @refresh="refreshAll" />
    </template>

    <PullRefresh :refreshing="refreshing" @refresh="refreshAll">
      <LoadingCards v-if="loading" :count="3" />
      <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />
      <EmptyState
        v-else-if="!job"
        :icon="Icons.Briefcase"
        title="Job not found"
        description="This job may have been removed."
      />

      <div v-else class="space-y-4">
        <div class="tl-card">
          <div class="tl-card-body space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <UrgencyTag :level="job.urgencyLevel" />
                  <span class="text-[11px] uppercase tl-muted">
                    {{ labelFor(job.category, JOB_CATEGORIES) }}
                  </span>
                </div>
                <h2 class="text-lg font-semibold mt-1">{{ job.title }}</h2>
                <p class="text-xs tl-muted mt-0.5">
                  {{ job.positions }} position{{ job.positions === 1 ? '' : 's' }} ·
                  {{ labelFor(job.employmentType, EMPLOYMENT_TYPES) }}
                </p>
              </div>
              <StatusPill :status="job.status" :list="JOB_STATUSES" />
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <FairPayChip :fair="fair" />
              <ScamFlags v-if="job.scamFlags.length" :flags="job.scamFlags" />
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center gap-1.5">
                <ion-icon :icon="Icons.Wallet" style="color: #059669" />
                <span>{{ formatCompensation(job.compensation, job.compensationType) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <ion-icon :icon="Icons.MapPin" />
                <span>{{ job.municipalityName ?? job.barangay ?? 'Location N/A' }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <ion-icon :icon="Icons.CalendarDays" />
                <span>Starts {{ formatDate(job.startDate) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <ion-icon :icon="Icons.Users" />
                <span>{{ applicants.length }} applicant{{ applicants.length === 1 ? '' : 's' }}</span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button type="button" class="tl-btn outline sm" @click="emit('edit')">
                <ion-icon :icon="Icons.Pencil" /> Edit
              </button>
              <button
                v-if="job.status === 'draft'"
                type="button"
                class="tl-btn sm"
                :disabled="acting"
                @click="askStatus('published')"
              >
                <ion-icon :icon="Icons.CloudUpload" /> Publish
              </button>
              <button
                v-if="job.status === 'published'"
                type="button"
                class="tl-btn outline sm"
                :disabled="acting"
                @click="askStatus('paused')"
              >
                <ion-icon :icon="Icons.Time" /> Pause
              </button>
              <button
                v-if="job.status === 'paused'"
                type="button"
                class="tl-btn outline sm"
                :disabled="acting"
                @click="askStatus('published')"
              >
                <ion-icon :icon="Icons.Play" /> Resume
              </button>
              <button
                v-if="job.status === 'published' || job.status === 'paused'"
                type="button"
                class="tl-btn outline sm"
                :disabled="acting"
                @click="askStatus('closed')"
              >
                <ion-icon :icon="Icons.Ban" /> Close
              </button>
            </div>
          </div>
        </div>

        <div class="tl-card">
          <div class="tl-card-body space-y-3">
            <SectionTitle>Description</SectionTitle>
            <p class="text-sm whitespace-pre-line">{{ job.description }}</p>

            <template v-if="job.responsibilities.length">
              <p class="text-xs font-semibold uppercase tl-muted">Responsibilities</p>
              <ul class="list-disc pl-5 text-sm space-y-1">
                <li v-for="(item, index) in job.responsibilities" :key="index">{{ item }}</li>
              </ul>
            </template>

            <template v-if="job.qualifications.length">
              <p class="text-xs font-semibold uppercase tl-muted">Qualifications</p>
              <ul class="list-disc pl-5 text-sm space-y-1">
                <li v-for="(item, index) in job.qualifications" :key="index">{{ item }}</li>
              </ul>
            </template>

            <template v-if="job.requiredSkills.length">
              <p class="text-xs font-semibold uppercase tl-muted">Required skills</p>
              <div class="space-y-1.5">
                <div
                  v-for="skill in job.requiredSkills"
                  :key="skill.id"
                  class="flex items-center justify-between gap-2 text-sm"
                >
                  <span>{{ skill.skillName }}</span>
                  <span class="tl-pill" :class="skill.importance === 'required' ? 'approved' : 'unverified'">
                    {{ skill.importance }} · {{ Math.round(skill.weight * 100) }}%
                  </span>
                </div>
              </div>
            </template>

            <template v-if="job.workingHours || job.locationText || job.applicationDeadline">
              <p class="text-xs font-semibold uppercase tl-muted">Details</p>
              <div class="text-sm space-y-1">
                <p v-if="job.workingHours"><strong>Hours:</strong> {{ job.workingHours }}</p>
                <p v-if="job.locationText"><strong>Location:</strong> {{ job.locationText }}</p>
                <p v-if="job.applicationDeadline">
                  <strong>Deadline:</strong> {{ formatDate(job.applicationDeadline) }}
                </p>
              </div>
            </template>
          </div>
        </div>

        <SectionTitle>
          Applicants
          <template #action>
            <span class="tl-caption">{{ applicants.length }}</span>
          </template>
        </SectionTitle>

        <LoadingCards v-if="appsLoading" :count="3" />
        <ErrorRetry v-else-if="appsError" :message="appsError" @retry="refreshApps" />
        <EmptyState
          v-else-if="applicants.length === 0"
          :icon="Icons.Users"
          title="No applicants yet"
          :description="
            job.status === 'published'
              ? 'Share your listing to reach more workers.'
              : 'Publish this job so workers can apply.'
          "
        />
        <div v-else class="space-y-2">
          <div
            v-for="app in sortedApplicants"
            :key="app.id"
            class="tl-card clickable"
            @click="selected = app"
          >
            <div class="tl-card-body flex items-center gap-3">
              <MatchRing :score="app.matchScore" :size="48" />
              <Avatar :name="app.workerName ?? '?'" :src="app.workerPhotoUrl ?? ''" size="sm" />
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm truncate">{{ app.workerName || 'Anonymous' }}</p>
                <p class="text-xs tl-muted truncate">
                  {{ app.workerMunicipality ?? 'Location N/A' }} · {{ relativeTime(app.createdAt) }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-1">
                <StatusPill :status="app.status" :list="APPLICATION_STATUSES" />
                <ion-icon :icon="Icons.ChevronRight" class="tl-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PullRefresh>

    <ConfirmDialog
      :open="!!statusAction"
      :title="statusCopy.title"
      :message="statusCopy.message"
      :confirm-label="statusCopy.confirmLabel"
      :danger="statusAction === 'closed'"
      @cancel="statusAction = null"
      @confirm="confirmStatus"
    />

    <EmployerApplicantDetails
      :application="selected"
      @close="selected = null"
      @updated="onApplicantUpdated"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  getFairPay,
  getJob,
  JOB_CATEGORIES,
  listApplications,
  updateJob,
  useAsync,
  useToast,
  type ApplicationDTO,
  type FairPayResult,
  type JobWithMatch,
} from '../worker/_lib'
import {
  AppShell,
  Avatar,
  ConfirmDialog,
  EmptyState,
  ErrorRetry,
  FairPayChip,
  formatCompensation,
  formatDate,
  Icons,
  labelFor,
  LoadingCards,
  MatchRing,
  PullRefresh,
  RefreshHeader,
  relativeTime,
  ScamFlags,
  SectionTitle,
  StatusPill,
  UrgencyTag,
} from '../worker/_ui'

import EmployerApplicantDetails from './EmployerApplicantDetails.vue'

const props = defineProps<{ jobId: string }>()
const emit = defineEmits<{
  (e: 'back'): void
  (e: 'edit'): void
}>()

const JOB_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
  { value: 'removed', label: 'Removed' },
] as const

const { toast } = useToast()
const selected = ref<ApplicationDTO | null>(null)
const statusAction = ref<string | null>(null)
const acting = ref(false)

const {
  data: job,
  loading,
  error,
  refresh,
  setData: setJob,
} = useAsync<JobWithMatch>(() => getJob(props.jobId), () => [props.jobId])

const {
  data: apps,
  loading: appsLoading,
  error: appsError,
  refresh: refreshApps,
  setData: setApps,
} = useAsync<ApplicationDTO[]>(() => listApplications({ jobId: props.jobId }), () => [props.jobId])

const { data: fair, refresh: refreshFair } = useAsync<FairPayResult | null>(async () => {
  const current = job.value
  if (!current) return null
  return getFairPay({
  category: current.category,
  compensationType: current.compensationType,
  compensation: current.compensation,
  municipalityId: current.municipalityId,
})
}, () => [job.value?.id])

const applicants = computed(() => apps.value ?? [])
const sortedApplicants = computed(() =>
  applicants.value.slice().sort((a, b) => b.matchScore - a.matchScore)
)
const refreshing = computed(() => loading.value || appsLoading.value)

const statusCopy = computed(() => {
  const map: Record<string, { title: string; message: string; confirmLabel: string }> = {
    published: {
      title: 'Publish this job?',
      message: 'Workers will be able to view and apply to this job immediately.',
      confirmLabel: 'Publish',
    },
    paused: {
      title: 'Pause this job?',
      message: 'Your job will be hidden from applicants until you resume it.',
      confirmLabel: 'Pause',
    },
    closed: {
      title: 'Close this job?',
      message: 'Closing stops new applications. Existing applicants are kept.',
      confirmLabel: 'Close job',
    },
  }
  return map[statusAction.value ?? ''] ?? { title: '', message: '', confirmLabel: 'Confirm' }
})

function askStatus(status: string) {
  statusAction.value = status
}

function refreshAll() {
  void refresh()
  void refreshApps()
  void refreshFair()
}

async function confirmStatus() {
  const next = statusAction.value
  const current = job.value
  if (!next || !current) return
  statusAction.value = null
  acting.value = true
  try {
    const updated = await updateJob(current.id, { status: next })
    setJob(updated)
    await toast(`Job ${next}.`)
    void refreshFair()
  } catch (e: any) {
    await toast(e?.message || 'Could not update the job.', 'danger')
  } finally {
    acting.value = false
  }
}

function onApplicantUpdated(next: ApplicationDTO) {
  setApps((apps.value ?? []).map((a) => (a.id === next.id ? next : a)))
  selected.value = next
}
</script>
