<template>
  <AppShell title="Reports" :subtitle="subtitle">
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <div class="filter-row tl-scroll-x">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          type="button"
          class="tl-chip"
          :class="{ on: filter === f.key }"
          @click="filter = f.key"
        >
          {{ f.label }}
          <span class="chip-count">{{ counts[f.key] }}</span>
        </button>
      </div>

      <LoadingCards v-if="loading" :count="4" />
      <ErrorRetry v-else-if="error" :message="error ?? ''" @retry="refresh" />
      <EmptyState
        v-else-if="filtered.length === 0"
        :icon="Icons.FileWarning"
        :title="emptyTitle"
        :description="emptyDescription"
      />
      <div v-else class="tl-list">
        <button
          v-for="report in filtered"
          :key="report.id"
          type="button"
          class="tl-card clickable report-card"
          @click="emit('open-report', report)"
        >
          <div class="tl-card-body report-body">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="font-medium text-sm truncate">{{ report.reporterName }}</p>
                  <span class="tl-pill capitalize">{{ report.reporterRole }}</span>
                </div>
                <p class="text-xs text-muted-foreground truncate mt-0.5">
                  <IonIcon :icon="Icons.AlertTriangle" class="inline-icon text-amber-600" />
                  {{ labelFor(report.reason, REPORT_REASONS) }}
                </p>
              </div>
              <StatusPill :status="report.status" :list="REPORT_STATUSES" />
            </div>

            <p class="text-xs text-muted-foreground line-clamp-2 mt-2">{{ report.description }}</p>

            <div class="flex items-center justify-between gap-2 text-[11px] text-muted-foreground mt-2">
              <span class="truncate">
                Target:
                {{ report.targetJobTitle
                  ? `Job · ${report.targetJobTitle}`
                  : report.targetName
                    ? `Account · ${report.targetName}`
                    : '—' }}
              </span>
              <span class="shrink-0">{{ relativeTime(report.createdAt) }}</span>
            </div>
          </div>
        </button>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed, ref } from 'vue'

import {
  EmptyState,
  ErrorRetry,
  Icons,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
  StatusPill,
  AppShell,
} from '../worker/_ui'
import {
  REPORT_REASONS,
  REPORT_STATUSES,
  labelFor,
  listReports,
  relativeTime,
  useAsync,
  type ReportDTO,
} from '../worker/_lib'

type FilterKey = 'all' | 'open' | 'under_review' | 'resolved' | 'dismissed'

const emit = defineEmits<{
  (e: 'open-report', report: ReportDTO): void
}>()

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
]

const { data, loading, error, refresh } = useAsync<ReportDTO[]>(() => listReports(), [])

const filter = ref<FilterKey>('all')

const counts = computed(() => {
  const list = data.value ?? []
  return {
    all: list.length,
    open: list.filter((r) => r.status === 'open').length,
    under_review: list.filter((r) => r.status === 'under_review').length,
    resolved: list.filter((r) => r.status === 'resolved').length,
    dismissed: list.filter((r) => r.status === 'dismissed').length,
  }
})

const filtered = computed(() => {
  const list = data.value ?? []
  return filter.value === 'all' ? list : list.filter((r) => r.status === filter.value)
})

const subtitle = computed(() => `${counts.value.all} total · ${counts.value.open} open`)

const emptyTitle = computed(() =>
  filter.value === 'all' ? 'No reports yet' : `No ${filter.value.replace('_', ' ')} reports`
)

const emptyDescription = computed(() =>
  filter.value === 'all'
    ? 'Reports submitted by users will appear here for moderation.'
    : 'Try a different filter.'
)
</script>

<style scoped>
.filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  padding-bottom: 2px;
}

.tl-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  cursor: pointer;
  font: inherit;
}

.chip-count {
  font-size: 10px;
  opacity: 0.75;
}

.report-card {
  width: 100%;
  text-align: left;
  font: inherit;
  padding: 0;
  color: inherit;
}

.report-body {
  display: flex;
  flex-direction: column;
}

.inline-icon {
  font-size: 13px;
  vertical-align: -2px;
  margin-right: 4px;
}
</style>
