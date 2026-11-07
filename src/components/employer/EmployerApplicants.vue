<template>
  <AppShell title="Applicants" :subtitle="`${applicants.length} total`">
    <template #right>
      <RefreshHeader :refreshing="refreshing" @refresh="refreshAll" />
    </template>

    <PullRefresh :refreshing="refreshing" @refresh="refreshAll">
      <div class="space-y-4">
        <button type="button" class="tl-card clickable" style="width: 100%; text-align: left" @click="emit('open-shortlist')">
          <div class="tl-card-body flex items-center gap-3">
            <div class="tl-primary" style="font-size: 22px">
              <ion-icon :icon="Icons.Star" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm">Shortlisted candidates</p>
              <p class="text-xs tl-muted">
                {{ shortlistedCount }} worker{{ shortlistedCount === 1 ? '' : 's' }} ready for review
              </p>
            </div>
            <ion-icon :icon="Icons.ChevronRight" class="tl-muted" />
          </div>
        </button>

        <Field label="Filter by job">
          <FormSelect v-model="jobFilter" :options="jobOptions" placeholder="All jobs" />
        </Field>

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
          </button>
        </div>

        <LoadingCards v-if="loading" :count="4" />
        <ErrorRetry v-else-if="error" :message="error" @retry="refreshAll" />
        <EmptyState
          v-else-if="filtered.length === 0"
          :icon="Icons.Users"
          title="No applicants here"
          :description="
            applicants.length === 0
              ? 'Applications will appear here once workers apply to your jobs.'
              : 'Try a different filter or job.'
          "
        />
        <div v-else class="space-y-2">
          <div
            v-for="app in filtered"
            :key="app.id"
            class="tl-card clickable"
            @click="selected = app"
          >
            <div class="tl-card-body">
              <div class="flex items-start gap-3">
                <MatchRing :score="app.matchScore" :size="50" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="font-semibold text-sm truncate">{{ app.workerName || 'Anonymous' }}</p>
                      <p class="text-xs tl-muted truncate">{{ app.jobTitle }}</p>
                    </div>
                    <StatusPill :status="app.status" :list="APPLICATION_STATUSES" />
                  </div>
                  <p class="text-[11px] tl-muted mt-1">
                    {{ app.workerMunicipality ?? 'Location N/A' }} · {{ relativeTime(app.createdAt) }}
                  </p>
                  <p v-if="app.message" class="text-xs tl-muted mt-1 line-clamp-2">
                    “{{ app.message }}”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PullRefresh>

    <EmployerApplicantDetails
      :application="selected"
      @close="selected = null"
      @updated="onUpdated"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  APPLICATION_STATUSES,
  listApplications,
  listJobs,
  useAsync,
  type ApplicationDTO,
  type JobWithMatch,
} from '../worker/_lib'
import {
  AppShell,
  EmptyState,
  ErrorRetry,
  Field,
  FormSelect,
  Icons,
  LoadingCards,
  MatchRing,
  PullRefresh,
  RefreshHeader,
  relativeTime,
  StatusPill,
} from '../worker/_ui'

import EmployerApplicantDetails from './EmployerApplicantDetails.vue'

const emit = defineEmits<{ (e: 'open-shortlist'): void }>()

const filters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
] as const

const filter = ref('all')
const jobFilter = ref('')
const selected = ref<ApplicationDTO | null>(null)

const {
  data: apps,
  loading,
  error,
  refresh: refreshApps,
  setData: setApps,
} = useAsync<ApplicationDTO[]>(() => listApplications(), [])

const {
  data: jobs,
  loading: jobsLoading,
  refresh: refreshJobs,
} = useAsync<JobWithMatch[]>(async () => (await listJobs({ mine: true, limit: 40 })).data, [])

const applicants = computed(() => apps.value ?? [])
const refreshing = computed(() => loading.value || jobsLoading.value)
const shortlistedCount = computed(
  () => applicants.value.filter((a) => a.status === 'shortlisted').length
)

const jobOptions = computed(() => [
  { value: '', label: 'All jobs' },
  ...(jobs.value ?? []).map((j) => ({ value: j.id, label: j.title })),
])

const filtered = computed(() =>
  applicants.value.filter((a) => {
    if (filter.value !== 'all' && a.status !== filter.value) return false
    if (jobFilter.value && a.jobId !== jobFilter.value) return false
    return true
  })
)

function refreshAll() {
  void refreshApps()
  void refreshJobs()
}

function onUpdated(next: ApplicationDTO) {
  setApps(applicants.value.map((a) => (a.id === next.id ? next : a)))
  selected.value = next
}
</script>
