   <template>
  <div class="admin-app">
    <template v-if="view === 'audit'">
      <AdminAuditLogs @back="view = null" />
    </template>

    <template v-else-if="view === 'notifications'">
      <AppShell
        :title="t('admin.notifications')"
        :subtitle="unreadCount > 0
          ? t('admin.unreadCount', { count: unreadCount })
          : t('admin.allCaughtUp')"
        :back="true"
        @back="view = null"
      >
        <template #right>
          <RefreshHeader :refreshing="notifLoading" @refresh="refreshNotifications" />
        </template>

        <PullRefresh :refreshing="notifLoading" @refresh="refreshNotifications">
          <div class="tl-between mb-3">
            <p class="text-xs text-muted-foreground">
              {{ t('admin.tapNotification') }}
            </p>

            <button
              type="button"
              class="tl-btn outline sm"
              :disabled="markingAll || unreadCount === 0"
              @click="markAll"
            >
              <IonIcon
                :icon="markingAll ? Icons.Loader2 : Icons.CheckCircle2"
                :class="{ 'tl-spin': markingAll }"
              />
              {{ t('admin.markAllRead') }}
            </button>
          </div>

          <LoadingCards v-if="notifLoading" :count="4" />

          <ErrorRetry
            v-else-if="notifError"
            :message="notifError ?? ''"
            @retry="refreshNotifications"
          />

          <EmptyState
            v-else-if="!notifications || notifications.length === 0"
            :icon="Icons.BellRing"
            :title="t('admin.noNotifications')"
            :description="t('admin.notificationDescription')"
          />

          <div v-else class="tl-list">
            <button
              v-for="n in notifications"
              :key="n.id"
              type="button"
              class="tl-card notif-card"
              :class="{ unread: !n.read }"
              @click="markOne(n)"
            >
              <div class="tl-card-body notif-body">
                <IonIcon
                  :icon="n.type === 'report_update' ? Icons.ShieldCheck : Icons.Bell"
                  :class="[
                    'notif-icon',
                    n.type === 'report_update' ? 'text-emerald-600' : 'text-muted-foreground',
                  ]"
                />

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="font-medium text-sm truncate">{{ n.title }}</p>
                    <span v-if="!n.read" class="tl-pill approved">
                      {{ t('admin.new') }}
                    </span>
                  </div>

                  <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {{ n.body }}
                  </p>

                  <p class="text-[11px] text-muted-foreground mt-1">
                    {{ relativeTime(n.createdAt) }}
                  </p>
                </div>

                <IonIcon
                  v-if="markingId === n.id"
                  :icon="Icons.Loader2"
                  class="tl-spin text-muted-foreground"
                />
              </div>
            </button>
          </div>
        </PullRefresh>
      </AppShell>
    </template>

    <template v-else>
      <AdminOverview
        v-if="tab === 'overview'"
        @open-reports="tab = 'reports'"
        @open-audit="view = 'audit'"
      />

      <AdminReports
        v-else-if="tab === 'reports'"
        :key="`reports-${version}`"
        @open-report="reportSheet = $event"
      />

      <AdminJobModeration
        v-else-if="tab === 'jobs'"
        :key="`jobs-${version}`"
        @open-job="jobSheet = $event"
      />

      <AdminUsers
        v-else-if="tab === 'users'"
        :key="`users-${version}`"
        @open-user="userSheet = $event"
      />

      <AdminAccount
        v-else-if="tab === 'account'"
        :unread-notifications="unreadCount"
        @navigate="goView"
      />
    </template>

    <AdminReportDetails
      :report="reportSheet"
      @close="reportSheet = null"
      @updated="onReportUpdated"
      @view-user="userSheet = $event"
      @view-job="jobSheet = $event"
    />

    <AdminUserDetails
      :user-id="userSheet"
      @close="userSheet = null"
      @updated="onSheetUpdated"
      @view-job="jobSheet = $event"
    />

    <AdminJobDetails
      :job-id="jobSheet"
      @close="jobSheet = null"
      @updated="onSheetUpdated"
      @view-employer="userSheet = $event"
    />

    <BottomTabs :items="tabs" :active="tab" @change="goTab" />
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  AppShell,
  BottomTabs,
  EmptyState,
  ErrorRetry,
  Icons,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
  type TabItem,
} from '../worker/_ui'

import {
  adminOverview,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  relativeTime,
  useAsync,
  useToast,
  type NotificationDTO,
  type OverviewData,
  type ReportDTO,
} from '../worker/_lib'

import AdminAccount from './AdminAccount.vue'
import AdminAuditLogs from './AdminAuditLogs.vue'
import AdminJobDetails from './AdminJobDetails.vue'
import AdminJobModeration from './AdminJobModeration.vue'
import AdminOverview from './AdminOverview.vue'
import AdminReportDetails from './AdminReportDetails.vue'
import AdminReports from './AdminReports.vue'
import AdminUserDetails from './AdminUserDetails.vue'
import AdminUsers from './AdminUsers.vue'

type TabKey = 'overview' | 'reports' | 'jobs' | 'users' | 'account'
type SubView = 'audit' | 'notifications' | null

// Global English/Filipino translations
const { t } = useI18n({ useScope: 'global' })

const { toast } = useToast()

const tab = ref<TabKey>('overview')
const view = ref<SubView>(null)
const version = ref(0)

const reportSheet = ref<ReportDTO | null>(null)
const userSheet = ref<string | null>(null)
const jobSheet = ref<string | null>(null)

const { data: overview, refresh: refreshOverview } = useAsync<OverviewData>(
  () => adminOverview(),
  []
)

const {
  data: notifications,
  loading: notifLoading,
  error: notifError,
  refresh: refreshNotifications,
  setData: setNotifications,
} = useAsync<NotificationDTO[]>(() => listNotifications(), [])

const pendingReports = computed(() => overview.value?.pendingReports ?? 0)

const unreadCount = computed(
  () => (notifications.value ?? []).filter((n) => !n.read).length
)

const markingAll = ref(false)
const markingId = ref<string | null>(null)

// Admin navigation with global language support
const tabs = computed<TabItem[]>(() => [
  {
    key: 'overview',
    label: t('common.overview'),
    icon: Icons.Home,
  },
  {
    key: 'reports',
    label: t('common.reports'),
    icon: Icons.FileWarning,
    badge: pendingReports.value,
  },
  {
    key: 'jobs',
    label: t('common.jobs'),
    icon: Icons.Briefcase,
  },
  {
    key: 'users',
    label: t('common.users'),
    icon: Icons.Users,
  },
  {
    key: 'account',
    label: t('common.account'),
    icon: Icons.User,
    badge: unreadCount.value,
  },
])

let notifTimer: ReturnType<typeof setTimeout> | undefined

watch(view, (next) => {
  if (next !== 'notifications') {
    if (notifTimer) clearTimeout(notifTimer)

    notifTimer = setTimeout(() => {
      void refreshNotifications()
    }, 800)
  }
})

onUnmounted(() => {
  if (notifTimer) clearTimeout(notifTimer)
})

function goTab(key: string): void {
  view.value = null
  tab.value = key as TabKey
}

function goView(name: 'audit' | 'notifications'): void {
  view.value = name
}

function onSheetUpdated(): void {
  version.value += 1
  void refreshOverview()
  void refreshNotifications()
}

function onReportUpdated(): void {
  onSheetUpdated()
  reportSheet.value = null
}

async function markOne(n: NotificationDTO): Promise<void> {
  if (n.read || markingId.value) return

  markingId.value = n.id

  try {
    await markNotificationRead(n.id)

    setNotifications(
      (notifications.value ?? []).map((x) =>
        x.id === n.id ? { ...x, read: true } : x
      )
    )

    toast(t('admin.markedAsRead'), 'success')
  } catch (e: any) {
    toast(e?.message || t('admin.couldNotMarkRead'), 'danger')
  } finally {
    markingId.value = null
  }
}

async function markAll(): Promise<void> {
  if (markingAll.value || unreadCount.value === 0) return

  markingAll.value = true

  try {
    await markAllNotificationsRead()

    setNotifications(
      (notifications.value ?? []).map((x) => ({ ...x, read: true }))
    )

    toast(t('admin.allMarkedRead'), 'success')
  } catch (e: any) {
    toast(e?.message || t('admin.couldNotMarkAllRead'), 'danger')
  } finally {
    markingAll.value = false
  }
}
</script>

<style scoped>
.admin-app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: var(--tl-bg);
}

.notif-card {
  width: 100%;
  text-align: left;
  font: inherit;
  padding: 0;
  color: inherit;
  opacity: 0.75;
}

.notif-card.unread {
  opacity: 1;
  border-color: #6ee7b7;
  box-shadow: 0 0 0 1px #a7f3d0;
}

.notif-body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notif-icon {
  font-size: 21px;
  margin-top: 2px;
  flex: none;
}
</style>
