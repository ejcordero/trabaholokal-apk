<template>
  <AppShell title="Employment history" back @back="emit('back')">
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <StatCard label="Active" :value="activeCount" :icon="Icons.BriefcaseBusiness" />
          <StatCard label="Completed" :value="completedCount" :icon="Icons.CheckCircle2" />
        </div>

        <LoadingCards v-if="loading" :count="4" />
        <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />
        <EmptyState
          v-else-if="employments.length === 0"
          :icon="Icons.RouteIcon"
          title="No employment history"
          description="Accepted applicants appear here once an employment starts."
        />
        <div v-else class="space-y-2">
          <div
            v-for="emp in employments"
            :key="emp.id"
            class="tl-card clickable"
            @click="emit('open-employment', emp.id)"
          >
            <div class="tl-card-body space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-semibold text-sm truncate">{{ emp.jobTitle }}</p>
                  <p class="text-xs tl-muted truncate">{{ emp.workerName }}</p>
                </div>
                <StatusPill :status="emp.status" :list="EMPLOYMENT_STATUSES" />
              </div>

              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs tl-muted">
                <span class="inline-flex items-center gap-1">
                  <ion-icon :icon="Icons.CalendarDays" />
                  {{ formatDate(emp.startDate) }}{{ emp.endDate ? ` → ${formatDate(emp.endDate)}` : ' → present' }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <ion-icon :icon="Icons.Wallet" style="color: #059669" />
                  {{ formatCompensation(emp.agreedCompensation, emp.compensationType) }}
                </span>
              </div>

              <div class="flex items-center justify-between text-[11px] tl-muted">
                <span>
                  {{ emp.approvedWorkdays }}/{{ emp.targetWorkdays }} workdays ·
                  {{ emp.progressPercent }}%
                </span>
                <span class="tl-pill unverified">{{ emp.employmentEvent.replace(/_/g, ' ') }}</span>
              </div>

              <ProgressBar :value="emp.progressPercent" />

              <p v-if="emp.pendingReports > 0" class="text-[11px]" style="color: #b45309">
                {{ emp.pendingReports }} report(s) awaiting review
              </p>
            </div>
          </div>
        </div>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import {
  EMPLOYMENT_STATUSES,
  listEmployments,
  useAsync,
  type EmploymentDTO,
} from '../worker/_lib'
import {
  AppShell,
  EmptyState,
  ErrorRetry,
  formatCompensation,
  formatDate,
  Icons,
  LoadingCards,
  ProgressBar,
  PullRefresh,
  RefreshHeader,
  StatCard,
  StatusPill,
} from '../worker/_ui'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'open-employment', id: string): void
}>()

const { data, loading, error, refresh } = useAsync<EmploymentDTO[]>(() => listEmployments(), [])

const employments = computed(() =>
  (data.value ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
)
const activeCount = computed(
  () =>
    employments.value.filter((e) =>
      ['pending_start', 'active', 'paused'].includes(e.status)
    ).length
)
const completedCount = computed(
  () => employments.value.filter((e) => ['completed', 'terminated'].includes(e.status)).length
)
</script>
