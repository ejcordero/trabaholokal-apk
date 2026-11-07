<template>
  <AppShell title="My Jobs" :subtitle="`${jobs.length} total`">
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <div class="space-y-4">
        <div class="tl-chip-row">
          <button
            v-for="chip in filters"
            :key="chip.value"
            type="button"
            class="tl-chip"
            :class="{ on: filter === chip.value }"
            @click="filter = chip.value"
          >
            {{ chip.label }}
            <span v-if="chip.value !== 'all'" class="tl-caption">{{ countFor(chip.value) }}</span>
          </button>
        </div>

        <LoadingCards v-if="loading" :count="4" />
        <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />
        <EmptyState
          v-else-if="filtered.length === 0"
          :icon="Icons.Briefcase"
          :title="jobs.length === 0 ? 'No jobs yet' : 'No jobs in this filter'"
          :description="
            jobs.length === 0
              ? 'Post your first job to start receiving applicants.'
              : 'Try a different status filter.'
          "
        >
          <template #action>
            <button v-if="jobs.length === 0" type="button" class="tl-btn sm" @click="emit('new-job')">
              <ion-icon :icon="Icons.Plus" /> Post a job
            </button>
          </template>
        </EmptyState>

        <div v-else class="space-y-3">
          <div v-for="job in filtered" :key="job.id" class="tl-card">
            <div class="tl-card-body">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <UrgencyTag :level="job.urgencyLevel" />
                    <span class="text-[11px] uppercase tl-muted">
                      {{ labelFor(job.category, JOB_CATEGORIES) }}
                    </span>
                  </div>
                  <h3 class="tl-card-title truncate mt-1">{{ job.title }}</h3>
                  <p class="text-xs tl-muted mt-0.5">
                    Posted {{ formatDate(job.createdAt) }} · {{ job.positions }} position{{ job.positions === 1 ? '' : 's' }}
                  </p>
                </div>
                <StatusPill :status="job.status" :list="JOB_STATUSES" />
              </div>

              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs tl-muted mt-2">
                <span class="inline-flex items-center gap-1">
                  <ion-icon :icon="Icons.Wallet" style="color: #059669" />
                  {{ formatCompensation(job.compensation, job.compensationType) }}
                </span>
                <span v-if="job.municipalityName" class="inline-flex items-center gap-1">
                  <ion-icon :icon="Icons.MapPin" />
                  {{ job.municipalityName }}
                </span>
              </div>

              <ScamFlags v-if="job.scamFlags.length" :flags="job.scamFlags" />

              <div v-if="job.requiredSkills.length" class="tl-chip-row mt-2">
                <span v-for="skill in job.requiredSkills.slice(0, 3)" :key="skill.id" class="tl-chip">
                  {{ skill.skillName }}
                </span>
                <span v-if="job.requiredSkills.length > 3" class="tl-caption">
                  +{{ job.requiredSkills.length - 3 }} more
                </span>
              </div>

              <div class="flex flex-wrap gap-2 mt-3">
                <button type="button" class="tl-btn outline sm" @click="emit('open-job', job.id)">
                  <ion-icon :icon="Icons.Eye" /> View
                </button>
                <button type="button" class="tl-btn outline sm" @click="emit('new-job')">
                  <ion-icon :icon="Icons.Pencil" /> Post new
                </button>
                <button
                  v-if="job.status === 'draft'"
                  type="button"
                  class="tl-btn sm"
                  :disabled="acting === job.id"
                  @click="askStatus(job, 'published')"
                >
                  <ion-icon :icon="Icons.CloudUpload" /> Publish
                </button>
                <button
                  v-if="job.status === 'published'"
                  type="button"
                  class="tl-btn outline sm"
                  :disabled="acting === job.id"
                  @click="askStatus(job, 'paused')"
                >
                  <ion-icon :icon="Icons.Time" /> Pause
                </button>
                <button
                  v-if="job.status === 'paused'"
                  type="button"
                  class="tl-btn outline sm"
                  :disabled="acting === job.id"
                  @click="askStatus(job, 'published')"
                >
                  <ion-icon :icon="Icons.Play" /> Resume
                </button>
                <button
                  v-if="job.status === 'published' || job.status === 'paused'"
                  type="button"
                  class="tl-btn outline sm"
                  :disabled="acting === job.id"
                  @click="askStatus(job, 'closed')"
                >
                  <ion-icon :icon="Icons.Ban" /> Close
                </button>
                <button
                  v-if="job.status !== 'archived' && job.status !== 'removed'"
                  type="button"
                  class="tl-btn ghost sm"
                  style="color: #b91c1c"
                  :disabled="acting === job.id"
                  @click="archiveTarget = job"
                >
                  <ion-icon :icon="Icons.Document" /> Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PullRefresh>

    <ConfirmDialog
      :open="!!statusAction"
      :title="statusAction?.title ?? ''"
      :message="statusAction?.message ?? ''"
      :confirm-label="statusAction?.confirmLabel ?? 'Confirm'"
      :danger="statusAction?.status === 'closed'"
      @cancel="statusAction = null"
      @confirm="confirmStatus"
    />

    <ConfirmDialog
      :open="!!archiveTarget"
      title="Archive this job?"
      :message="archiveTarget ? `“${archiveTarget.title}” will be archived and hidden from applicants.` : ''"
      confirm-label="Archive"
      :danger="true"
      @cancel="archiveTarget = null"
      @confirm="confirmArchive"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  archiveJob,
  JOB_CATEGORIES,
  listJobs,
  updateJob,
  useAsync,
  useToast,
  type JobWithMatch,
} from '../worker/_lib'
import {
  AppShell,
  ConfirmDialog,
  EmptyState,
  ErrorRetry,
  formatCompensation,
  formatDate,
  Icons,
  labelFor,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
  ScamFlags,
  StatusPill,
  UrgencyTag,
} from '../worker/_ui'

const emit = defineEmits<{
  (e: 'open-job', id: string): void
  (e: 'new-job'): void
}>()

const JOB_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
  { value: 'removed', label: 'Removed' },
] as const

const filters = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
] as const

const { toast } = useToast()
const filter = ref('all')
const acting = ref('')
const archiveTarget = ref<JobWithMatch | null>(null)
const statusAction = ref<{
  job: JobWithMatch
  status: string
  title: string
  message: string
  confirmLabel: string
} | null>(null)

const {
  data,
  loading,
  error,
  refresh,
  setData,
} = useAsync<JobWithMatch[]>(async () => (await listJobs({ mine: true, limit: 40 })).data, [])

const jobs = computed(() => data.value ?? [])
const filtered = computed(() =>
  filter.value === 'all' ? jobs.value : jobs.value.filter((j) => j.status === filter.value)
)

function countFor(status: string) {
  return jobs.value.filter((j) => j.status === status).length
}

function askStatus(job: JobWithMatch, status: string) {
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
  const copy = map[status] ?? { title: 'Update job?', message: '', confirmLabel: 'Update' }
  statusAction.value = { job, status, ...copy }
}

async function confirmStatus() {
  const action = statusAction.value
  if (!action) return
  statusAction.value = null
  acting.value = action.job.id
  try {
    const updated = await updateJob(action.job.id, { status: action.status })
    setData(jobs.value.map((j) => (j.id === updated.id ? updated : j)))
    await toast(`Job ${action.status}.`)
  } catch (e: any) {
    await toast(e?.message || 'Could not update the job.', 'danger')
  } finally {
    acting.value = ''
  }
}

async function confirmArchive() {
  const target = archiveTarget.value
  if (!target) return
  archiveTarget.value = null
  acting.value = target.id
  try {
    await archiveJob(target.id)
    setData(jobs.value.map((j) => (j.id === target.id ? { ...j, status: 'archived' } : j)))
    await toast('Job archived.')
  } catch (e: any) {
    await toast(e?.message || 'Could not archive the job.', 'danger')
  } finally {
    acting.value = ''
  }
}
</script>
