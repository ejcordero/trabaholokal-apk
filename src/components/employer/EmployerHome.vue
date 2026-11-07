<template>
  <AppShell title="TrabahoLokal" subtitle="Employer dashboard">
    <template #right>
      <RefreshHeader :refreshing="refreshing" @refresh="refreshAll" />
    </template>

    <PullRefresh :refreshing="refreshing" @refresh="refreshAll">
      <div class="space-y-4">
        <div class="tl-card">
          <div class="tl-card-body flex items-center gap-3">
            <Avatar :name="me?.businessName ?? user?.fullName ?? '?'" :src="me?.logoUrl ?? ''" />
            <div class="min-w-0 flex-1">
              <p class="text-xs tl-muted">{{ greeting }}</p>
              <h2 class="font-semibold text-lg truncate">
                {{ meLoading ? 'Loading…' : me?.businessName ?? user?.fullName ?? 'Employer' }}
              </h2>
              <div class="mt-1">
                <VerifiedBadge :verification="verification" />
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="verification !== 'verified' && !meLoading"
          class="tl-card clickable"
          :class="verification === 'pending' ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'"
          @click="emit('open-verification')"
        >
          <div class="tl-card-body flex items-start gap-3">
            <ion-icon
              :icon="verification === 'pending' ? Icons.ShieldAlert : Icons.ShieldCheck"
              :style="{ color: verification === 'pending' ? '#d97706' : '#059669', fontSize: '24px' }"
              class="shrink-0 mt-0.5"
            />
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm">
                {{ verification === 'pending' ? 'Verification under review' : 'Get verified to build trust' }}
              </p>
              <p class="text-xs tl-muted mt-0.5">
                {{
                  verification === 'pending'
                    ? 'Administrators are reviewing your documents.'
                    : 'Verified businesses attract more applicants.'
                }}
              </p>
            </div>
            <ion-icon :icon="Icons.ChevronRight" class="tl-muted mt-1" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <StatCard
            label="Published jobs"
            :value="jobsLoading ? '…' : publishedCount"
            :icon="Icons.Briefcase"
          />
          <StatCard
            label="Applicants"
            :value="appsLoading ? '…' : applicantsCount"
            :icon="Icons.Users"
          />
          <StatCard
            label="Active workforce"
            :value="empLoading ? '…' : workforceCount"
            :icon="Icons.BriefcaseBusiness"
          />
          <StatCard
            label="Pending reports"
            :value="empLoading ? '…' : pendingReports"
            :icon="Icons.FileWarning"
          />
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button type="button" class="quick-action" @click="emit('post-job')">
            <ion-icon :icon="Icons.Plus" class="tl-primary" />
            <span>Post a Job</span>
          </button>
          <button type="button" class="quick-action" @click="emit('open-applicants')">
            <ion-icon :icon="Icons.Users" class="tl-primary" />
            <span>Applicants</span>
          </button>
          <button type="button" class="quick-action" @click="emit('open-workforce')">
            <ion-icon :icon="Icons.BriefcaseBusiness" class="tl-primary" />
            <span>Workforce</span>
          </button>
        </div>

        <SectionTitle>
          Recent applicants
          <template #action>
            <button type="button" class="tl-btn ghost sm" @click="emit('open-applicants')">
              All <ion-icon :icon="Icons.ArrowRight" />
            </button>
          </template>
        </SectionTitle>

        <LoadingCards v-if="appsLoading" :count="3" />
        <ErrorRetry v-else-if="appsError" :message="appsError" @retry="appsRefresh" />
        <EmptyState
          v-else-if="recentApplicants.length === 0"
          :icon="Icons.Users"
          title="No applications yet"
          description="When workers apply to your jobs, you'll see them ranked by match here."
        >
          <template #action>
            <button type="button" class="tl-btn sm" @click="emit('post-job')">
              <ion-icon :icon="Icons.Plus" /> Post a job
            </button>
          </template>
        </EmptyState>
        <div v-else class="space-y-2">
          <div
            v-for="app in recentApplicants"
            :key="app.id"
            class="tl-card clickable"
            @click="emit('open-applicant', app)"
          >
            <div class="tl-card-body p-3 flex items-center gap-3">
              <Avatar :name="app.workerName ?? '?'" :src="app.workerPhotoUrl ?? ''" />
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm truncate">{{ app.workerName || 'Anonymous' }}</p>
                <p class="text-xs tl-muted truncate">{{ app.jobTitle }}</p>
                <p class="text-[11px] tl-muted">{{ relativeTime(app.createdAt) }}</p>
              </div>
              <div class="flex flex-col items-end gap-1">
                <span v-if="app.matchScore > 0" class="tl-pill approved">{{ app.matchScore }}% match</span>
                <span class="tl-pill unverified">{{ labelFor(app.status, APPLICATION_STATUSES) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="tl-divider" />

        <div class="tl-card bg-emerald-50" style="border-color: #a7f3d0">
          <div class="tl-card-body flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold text-sm">Need workers fast?</p>
              <p class="text-xs tl-muted mt-0.5">Post an urgent job and notify nearby workers instantly.</p>
            </div>
            <button type="button" class="tl-btn sm shrink-0" @click="emit('post-job')">
              <ion-icon :icon="Icons.Plus" /> Post
            </button>
          </div>
        </div>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import {
  APPLICATION_STATUSES,
  getEmployerMe,
  listApplications,
  listEmployments,
  listJobs,
  useAsync,
  useSession,
  type ApplicationDTO,
  type EmployerProfileDTO,
  type EmploymentDTO,
  type JobWithMatch,
} from '../worker/_lib'
import {
  AppShell,
  Avatar,
  EmptyState,
  ErrorRetry,
  Icons,
  labelFor,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
  relativeTime,
  SectionTitle,
  StatCard,
  VerifiedBadge,
} from '../worker/_ui'

const emit = defineEmits<{
  (e: 'open-jobs'): void
  (e: 'open-applicants'): void
  (e: 'open-workforce'): void
  (e: 'post-job'): void
  (e: 'open-verification'): void
  (e: 'open-applicant', app: ApplicationDTO): void
}>()

const { user } = useSession()

const {
  data: me,
  loading: meLoading,
  refresh: refreshMe,
} = useAsync<EmployerProfileDTO | null>(() => getEmployerMe(), [])

const {
  data: jobs,
  loading: jobsLoading,
  refresh: refreshJobs,
} = useAsync<JobWithMatch[]>(async () => (await listJobs({ mine: true, limit: 40 })).data, [])

const {
  data: apps,
  loading: appsLoading,
  error: appsError,
  refresh: appsRefresh,
} = useAsync<ApplicationDTO[]>(() => listApplications(), [])

const {
  data: employments,
  loading: empLoading,
  refresh: refreshEmployments,
} = useAsync<EmploymentDTO[]>(() => listEmployments('active'), [])

const refreshing = computed(() => meLoading.value || jobsLoading.value || appsLoading.value || empLoading.value)

const publishedCount = computed(() => (jobs.value ?? []).filter((j) => j.status === 'published').length)
const applicantsCount = computed(
  () =>
    (apps.value ?? []).filter((a) => ['pending', 'under_review', 'shortlisted'].includes(a.status)).length
)
const workforceCount = computed(() => (employments.value ?? []).length)
const pendingReports = computed(() =>
  (employments.value ?? []).reduce((sum, item) => sum + item.pendingReports, 0)
)

const recentApplicants = computed(() =>
  (apps.value ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
)

const verification = computed(() => me.value?.verification ?? 'unverified')

const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})

function refreshAll() {
  void refreshMe()
  void refreshJobs()
  void appsRefresh()
  void refreshEmployments()
}
</script>

<style scoped>
.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 80px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--tl-border);
  background: var(--tl-card);
  color: var(--tl-text);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
}
.quick-action:active {
  transform: scale(0.98);
}
.quick-action .ionicon {
  font-size: 20px;
}
</style>
