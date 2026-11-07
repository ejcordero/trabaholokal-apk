<template>
  <AppShell title="Jobs" :subtitle="`${data?.length ?? 0} listings`">
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <div class="filters">
        <div class="search-wrap">
          <IonIcon :icon="Icons.Search" class="search-icon text-muted-foreground" />
          <input
            v-model="q"
            type="text"
            class="tl-input search-input"
            placeholder="Search title or description…"
          />
        </div>
        <div class="filters-grid">
          <Field>
            <FormSelect v-model="status" :options="STATUS_OPTIONS" />
          </Field>
          <Field>
            <FormSelect v-model="moderation" :options="MODERATION_OPTIONS" />
          </Field>
        </div>
        <div class="tl-card">
          <div class="tl-card-body suspicious-row">
            <div class="min-w-0">
              <p class="text-sm font-medium">Suspicious only</p>
              <p class="text-xs text-muted-foreground truncate">
                Listings with scam flags or flagged status
              </p>
            </div>
            <IonToggle v-model="suspicious" />
          </div>
        </div>
      </div>

      <LoadingCards v-if="loading" :count="5" />
      <ErrorRetry v-else-if="error" :message="error ?? ''" @retry="refresh" />
      <EmptyState
        v-else-if="!data || data.length === 0"
        :icon="Icons.Briefcase"
        title="No jobs found"
        description="Try adjusting your search or filters."
      />
      <div v-else class="tl-list">
        <button
          v-for="job in data"
          :key="job.id"
          type="button"
          class="tl-card clickable job-card"
          :class="jobStateClass(job)"
          @click="emit('open-job', job.id)"
        >
          <div class="tl-card-body">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm truncate">{{ job.title }}</p>
                <p class="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                  <IonIcon :icon="Icons.Building2" class="tiny-icon shrink-0" />
                  <span class="truncate">{{ job.employerName }}</span>
                  <VerifiedBadge :verification="job.employerVerification" />
                </p>
              </div>
              <StatusPill :status="job.status" />
            </div>

            <div
              class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-2"
            >
              <span class="tl-pill">{{ labelFor(job.category, JOB_CATEGORIES) }}</span>
              <span class="inline-flex items-center gap-0.5">
                <IonIcon :icon="Icons.Wallet" class="tiny-icon text-emerald-600" />
                {{ formatCompensation(job.compensation, job.compensationType) }}
              </span>
              <span v-if="job.municipalityName" class="inline-flex items-center gap-0.5">
                <IonIcon :icon="Icons.MapPin" class="tiny-icon" />
                {{ job.municipalityName }}
              </span>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap mt-2">
              <span class="text-[10px] text-muted-foreground uppercase">Moderation:</span>
              <StatusPill :status="job.moderationStatus" />
              <span
                v-if="job.scamFlags.length > 0"
                class="inline-flex items-center gap-0.5 text-[11px] text-amber-700"
              >
                <IonIcon :icon="Icons.FileWarning" class="tiny-icon" />
                {{ job.scamFlags.length }} flag{{ job.scamFlags.length > 1 ? 's' : '' }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon, IonToggle } from '@ionic/vue'
import { onUnmounted, ref, watch } from 'vue'

import {
  AppShell,
  EmptyState,
  ErrorRetry,
  Field,
  FormSelect,
  Icons,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
  StatusPill,
  VerifiedBadge,
} from '../worker/_ui'
import {
  JOB_CATEGORIES,
  JOB_STATUS_VALUES,
  adminListJobs,
  formatCompensation,
  labelFor,
  useAsync,
  type JobWithMatch,
} from '../worker/_lib'

const emit = defineEmits<{
  (e: 'open-job', jobId: string): void
}>()

const MODERATION_OPTIONS = [
  { value: 'all', label: 'All moderation' },
  { value: 'ok', label: 'OK' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'removed', label: 'Removed' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...JOB_STATUS_VALUES.map((s) => ({
    value: s,
    label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  })),
]

const q = ref('')
const debouncedQ = ref('')
const status = ref('all')
const moderation = ref('all')
const suspicious = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined
watch(q, (value) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    debouncedQ.value = value.trim()
  }, 350)
})
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

const { data, loading, error, refresh } = useAsync<JobWithMatch[]>(
  () =>
    adminListJobs({
      q: debouncedQ.value || undefined,
      status: status.value === 'all' ? undefined : status.value,
      moderationStatus: moderation.value === 'all' ? undefined : moderation.value,
      suspicious: suspicious.value,
    }),
  () => [debouncedQ.value, status.value, moderation.value, suspicious.value]
)

function jobStateClass(job: JobWithMatch): string {
  if (job.moderationStatus === 'flagged') return 'flagged'
  if (job.moderationStatus === 'removed') return 'removed'
  return ''
}
</script>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
}

.search-input {
  padding-left: 36px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.suspicious-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.job-card {
  width: 100%;
  text-align: left;
  font: inherit;
  padding: 0;
  color: inherit;
}

.job-card.flagged {
  border-color: #fcd34d;
}

.job-card.removed {
  border-color: #fda4af;
  opacity: 0.8;
}

.tiny-icon {
  font-size: 12px;
  vertical-align: -1px;
}
</style>
