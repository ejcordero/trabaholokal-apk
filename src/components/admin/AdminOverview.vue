<template>
  <AppShell title="TrabahoLokal" subtitle="Admin · Moderation & safety">
    <template #right>
      <RefreshHeader :refreshing="refreshing" @refresh="refreshAll" />
    </template>

    <PullRefresh :refreshing="refreshing" @refresh="refreshAll">
      <div class="space-y-4">
        <div class="tl-card">
          <div class="tl-card-body">
            <p class="text-xs text-muted-foreground">{{ greeting }}</p>
            <h2 class="font-semibold text-lg truncate">{{ user?.fullName ?? 'Administrator' }}</h2>
            <p class="text-xs text-muted-foreground mt-0.5">
              Review reports, moderate jobs, and ensure platform safety.
            </p>
          </div>
        </div>

        <ErrorRetry v-if="overviewError" :message="overviewError ?? ''" @retry="refreshOverview" />
        <template v-else>
          <SectionTitle>Platform</SectionTitle>
          <div class="stats-grid">
            <StatCard
              label="Workers"
              :value="overviewLoading ? '…' : String(overview?.workers ?? 0)"
              :icon="Icons.User"
            />
            <StatCard
              label="Employers"
              :value="overviewLoading ? '…' : String(overview?.employers ?? 0)"
              :icon="Icons.Building2"
            />
            <StatCard
              label="Published Jobs"
              :value="overviewLoading ? '…' : String(overview?.publishedJobs ?? 0)"
              :icon="Icons.Briefcase"
            />
            <StatCard
              label="Applications"
              :value="overviewLoading ? '…' : String(overview?.applications ?? 0)"
              :icon="Icons.ClipboardList"
            />
            <StatCard
              label="Pending Reports"
              :value="overviewLoading ? '…' : String(overview?.pendingReports ?? 0)"
              :icon="Icons.FileWarning"
            />
            <StatCard
              label="Suspended"
              :value="overviewLoading ? '…' : String(overview?.suspendedAccounts ?? 0)"
              :icon="Icons.Ban"
            />
            <StatCard
              label="Completed Jobs"
              :value="overviewLoading ? '…' : String(overview?.completedEmployments ?? 0)"
              :icon="Icons.CheckCircle2"
            />
            <StatCard
              label="Admins"
              :value="overviewLoading ? '…' : String(overview?.admins ?? 0)"
              :icon="Icons.ShieldCheck"
            />
          </div>

          <button
            type="button"
            class="tl-card clickable action-card"
            :class="{ warn: pendingReports > 0 }"
            @click="emit('open-reports')"
          >
            <div class="tl-card-body action-body">
              <IonIcon
                :icon="Icons.FileWarning"
                :class="['action-icon', pendingReports > 0 ? 'text-amber-600' : 'text-muted-foreground']"
              />
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-sm">Pending reports</p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {{ pendingReports > 0
                    ? `${pendingReports} open report${pendingReports > 1 ? 's' : ''} awaiting review`
                    : 'All caught up — no open reports' }}
                </p>
              </div>
              <IonIcon :icon="Icons.ChevronRight" class="text-muted-foreground" />
            </div>
          </button>
        </template>

        <SectionTitle>
          Recent audit
          <template #action>
            <button type="button" class="tl-btn ghost sm" @click="emit('open-audit')">
              All
              <IonIcon :icon="Icons.ArrowRight" class="tiny-icon" />
            </button>
          </template>
        </SectionTitle>

        <LoadingCards v-if="auditLoading" :count="3" />
        <ErrorRetry v-else-if="auditError" :message="auditError ?? ''" @retry="refreshAudit" />
        <EmptyState
          v-else-if="!audit || audit.length === 0"
          :icon="Icons.Document"
          title="No audit entries"
          description="Moderation actions will appear here."
        />
        <div v-else class="tl-list">
          <div v-for="entry in audit" :key="entry.id" class="tl-card">
            <div class="tl-card-body audit-row">
              <IonIcon :icon="Icons.ShieldCheck" class="audit-icon text-emerald-600" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate">{{ actionLabel(entry.action) }}</p>
                <p class="text-xs text-muted-foreground truncate">
                  {{ entry.adminName }} · {{ entry.targetType
                  }}{{ entry.targetId ? ` · ${entry.targetId.slice(-6)}` : '' }}
                </p>
                <p v-if="entry.reason" class="text-[11px] text-muted-foreground italic truncate mt-0.5">
                  &ldquo;{{ entry.reason }}&rdquo;
                </p>
                <p class="text-[11px] text-muted-foreground mt-0.5">{{ relativeTime(entry.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="tl-divider" />

        <p class="text-[11px] text-muted-foreground text-center">
          <IonIcon :icon="Icons.ShieldCheck" class="tiny-icon" />
          Moderation actions are logged and auditable. Suspend with clear reasons only.
        </p>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed } from 'vue'

import {
  AppShell,
  EmptyState,
  ErrorRetry,
  Icons,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
  SectionTitle,
  StatCard,
} from '../worker/_ui'
import {
  adminAuditLogs,
  adminOverview,
  relativeTime,
  useAsync,
  useSession,
  type AuditLogDTO,
  type OverviewData,
} from '../worker/_lib'

const emit = defineEmits<{
  (e: 'open-reports'): void
  (e: 'open-audit'): void
}>()

const ACTION_LABELS: Record<string, string> = {
  suspend: 'Suspended account',
  restore: 'Restored account',
  verify: 'Verified employer',
  unverify: 'Unverified employer',
  remove: 'Removed job',
  flag: 'Flagged job',
  under_review: 'Marked job under review',
  restore_job: 'Restored job',
  flag_job: 'Flagged job',
  remove_job: 'Removed job',
  resolve_report: 'Resolved report',
  dismiss_report: 'Dismissed report',
  review_report: 'Reviewed report',
  update_report: 'Updated report',
}

const { user } = useSession()

const {
  data: overview,
  loading: overviewLoading,
  error: overviewError,
  refresh: refreshOverview,
} = useAsync<OverviewData>(() => adminOverview(), [])

const {
  data: audit,
  loading: auditLoading,
  error: auditError,
  refresh: refreshAudit,
} = useAsync<AuditLogDTO[]>(() => adminAuditLogs(5), [])

const pendingReports = computed(() => overview.value?.pendingReports ?? 0)
const refreshing = computed(() => overviewLoading.value || auditLoading.value)

const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})

function refreshAll(): void {
  void refreshOverview()
  void refreshAudit()
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.action-card {
  width: 100%;
  text-align: left;
  font: inherit;
  padding: 0;
  color: inherit;
  margin-top: 12px;
}

.action-card.warn {
  border-color: #fcd34d;
  background: #fffbeb;
}

.action-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-icon {
  font-size: 24px;
  flex: none;
}

.audit-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.audit-icon {
  font-size: 16px;
  margin-top: 2px;
  flex: none;
}

.tiny-icon {
  font-size: 12px;
  vertical-align: -1px;
}
</style>
