<template>
  <AppShell title="Workforce" :subtitle="`${employments.length} employment${employments.length === 1 ? '' : 's'}`">
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-2">
          <StatCard label="Active" :value="active.length" :icon="Icons.BriefcaseBusiness" />
          <StatCard label="Completed" :value="completed.length" :icon="Icons.CheckCircle2" />
          <StatCard label="Pending reports" :value="pendingReports" :icon="Icons.FileWarning" />
          <StatCard label="Workdays logged" :value="approvedWorkdays" :icon="Icons.CalendarDays" />
        </div>

        <LoadingCards v-if="loading" :count="4" />
        <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />
        <EmptyState
          v-else-if="employments.length === 0"
          :icon="Icons.BriefcaseBusiness"
          title="No workforce yet"
          description="When you accept an applicant and start an employment, your workers will appear here."
        />

        <template v-else>
          <SectionTitle v-if="active.length">
            Active employment
            <template #action>
              <span class="tl-caption">{{ active.length }}</span>
            </template>
          </SectionTitle>
          <div class="space-y-2">
            <EmploymentCard
              v-for="emp in active"
              :key="emp.id"
              :emp="emp"
              show-worker
              @open="emit('open-employment', $event)"
            />
          </div>

          <SectionTitle v-if="completed.length">Past employment</SectionTitle>
          <div class="space-y-2">
            <EmploymentCard
              v-for="emp in completed"
              :key="emp.id"
              :emp="emp"
              show-worker
              @open="emit('open-employment', $event)"
            />
          </div>
        </template>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { listEmployments, useAsync, type EmploymentDTO } from '../worker/_lib'
import {
  AppShell,
  EmploymentCard,
  EmptyState,
  ErrorRetry,
  Icons,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
  SectionTitle,
  StatCard,
} from '../worker/_ui'

const emit = defineEmits<{ (e: 'open-employment', id: string): void }>()

const { data, loading, error, refresh } = useAsync<EmploymentDTO[]>(() => listEmployments(), [])

const employments = computed(() => data.value ?? [])
const active = computed(() =>
  employments.value.filter((e) => e.status === 'active' || e.status === 'pending_start' || e.status === 'paused')
)
const completed = computed(() =>
  employments.value.filter((e) => e.status === 'completed' || e.status === 'terminated')
)
const pendingReports = computed(() =>
  employments.value.reduce((sum, item) => sum + item.pendingReports, 0)
)
const approvedWorkdays = computed(() =>
  employments.value.reduce((sum, item) => sum + item.approvedWorkdays, 0)
)
</script>
