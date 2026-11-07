<template>
  <AppShell
    title="Audit Logs"
    :subtitle="`${filtered.length} entries`"
    :back="true"
    @back="emit('back')"
  >
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <div class="search-wrap">
        <IonIcon :icon="Icons.Search" class="search-icon text-muted-foreground" />
        <input
          v-model="q"
          type="text"
          class="tl-input search-input"
          placeholder="Search action, admin, target…"
        />
      </div>

      <LoadingCards v-if="loading" :count="5" />
      <ErrorRetry v-else-if="error" :message="error ?? ''" @retry="refresh" />
      <EmptyState
        v-else-if="filtered.length === 0"
        :icon="Icons.Document"
        title="No audit entries"
        :description="q.trim() ? 'No entries match your search.' : 'Moderation actions will be recorded here.'"
      />
      <div v-else class="tl-list">
        <div v-for="entry in filtered" :key="entry.id" class="tl-card">
          <div class="tl-card-body">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="font-medium text-sm truncate">{{ actionLabel(entry.action) }}</p>
                  <span class="tl-pill">{{ entry.targetType }}</span>
                </div>
                <p class="text-xs text-muted-foreground truncate mt-0.5">
                  by {{ entry.adminName }}{{ entry.targetId ? ` · target ${entry.targetId.slice(-8)}` : '' }}
                </p>
              </div>
              <span class="tl-pill shrink-0">{{ relativeTime(entry.createdAt) }}</span>
            </div>

            <p v-if="entry.reason" class="text-xs text-muted-foreground italic line-clamp-2 mt-2">
              &ldquo;{{ entry.reason }}&rdquo;
            </p>
            <p v-if="metadataText(entry)" class="text-[11px] text-muted-foreground truncate mt-1">
              <IonIcon :icon="Icons.Info" class="tiny-icon" />
              {{ metadataText(entry) }}
            </p>
            <p class="text-[11px] text-muted-foreground mt-1">{{ formatDateTime(entry.createdAt) }}</p>
          </div>
        </div>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed, ref } from 'vue'

import {
  AppShell,
  EmptyState,
  ErrorRetry,
  Icons,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
} from '../worker/_ui'
import {
  adminAuditLogs,
  formatDateTime,
  relativeTime,
  useAsync,
  type AuditLogDTO,
} from '../worker/_lib'

const emit = defineEmits<{
  (e: 'back'): void
}>()

const ACTION_LABELS: Record<string, string> = {
  suspend: 'Suspended account',
  restore: 'Restored account',
  verify: 'Verified employer',
  unverify: 'Unverified employer',
  remove: 'Removed job',
  flag: 'Flagged job',
  under_review: 'Marked under review',
  restore_job: 'Restored job',
  flag_job: 'Flagged job',
  remove_job: 'Removed job',
  resolve_report: 'Resolved report',
  dismiss_report: 'Dismissed report',
  review_report: 'Reviewed report',
  update_report: 'Updated report',
}

const q = ref('')

const { data, loading, error, refresh } = useAsync<AuditLogDTO[]>(() => adminAuditLogs(100), [])

const filtered = computed(() => {
  const list = data.value ?? []
  const needle = q.value.trim().toLowerCase()
  if (!needle) return list
  return list.filter(
    (e) =>
      e.action.toLowerCase().includes(needle) ||
      e.adminName.toLowerCase().includes(needle) ||
      e.targetType.toLowerCase().includes(needle) ||
      (e.reason ?? '').toLowerCase().includes(needle) ||
      (e.targetId ?? '').toLowerCase().includes(needle)
  )
})

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

function metadataText(entry: AuditLogDTO): string {
  const meta = entry.metadata
  if (!meta || typeof meta !== 'object') return ''
  return Object.entries(meta as Record<string, unknown>)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join(' · ')
}
</script>

<style scoped>
.search-wrap {
  position: relative;
  margin-bottom: 12px;
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

.tiny-icon {
  font-size: 12px;
  vertical-align: -1px;
}
</style>
