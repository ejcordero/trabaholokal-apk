<template>
  <AppShell title="Notifications" back @back="emit('back')">
    <template #right>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="tl-btn ghost sm"
          :disabled="markingAll || unreadCount === 0"
          @click="markAll"
        >
          <ion-icon :icon="markingAll ? Icons.Loader2 : Icons.CheckDone" :class="{ 'tl-spin': markingAll }" />
          Mark all
        </button>
        <RefreshHeader :refreshing="loading" @refresh="refresh" />
      </div>
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <div class="space-y-3">
        <p v-if="unreadCount > 0" class="text-xs tl-muted">
          {{ unreadCount }} unread notification{{ unreadCount === 1 ? '' : 's' }}
        </p>

        <LoadingCards v-if="loading" :count="4" />
        <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />
        <EmptyState
          v-else-if="notifications.length === 0"
          :icon="Icons.Bell"
          title="No notifications"
          description="Updates about your jobs, applicants, and workforce will appear here."
        />
        <div v-else class="space-y-2">
          <button
            v-for="item in notifications"
            :key="item.id"
            type="button"
            class="tl-card clickable"
            :style="{
              width: '100%',
              textAlign: 'left',
              background: item.read ? 'var(--tl-card)' : 'var(--tl-primary-soft)',
            }"
            @click="markRead(item.id, item.read)"
          >
            <div class="tl-card-body p-3 flex items-start gap-2">
              <div class="tl-primary mt-0.5">
                <ion-icon :icon="iconFor(item.type)" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <p class="font-medium text-sm">{{ item.title }}</p>
                  <span v-if="!item.read" class="tl-pill pending shrink-0">New</span>
                </div>
                <p class="text-xs tl-muted mt-0.5">{{ item.body }}</p>
                <p class="text-[11px] tl-muted mt-1">{{ relativeTime(item.createdAt) }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  useAsync,
  useToast,
  type NotificationDTO,
} from '../worker/_lib'
import {
  AppShell,
  EmptyState,
  ErrorRetry,
  Icons,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
  relativeTime,
} from '../worker/_ui'

const emit = defineEmits<{ (e: 'back'): void }>()

const { toast } = useToast()
const markingAll = ref(false)

const {
  data,
  loading,
  error,
  refresh,
  setData,
} = useAsync<NotificationDTO[]>(() => listNotifications(), [])

const notifications = computed(() => data.value ?? [])
const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

function iconFor(type: string) {
  const map: Record<string, string> = {
    application: Icons.Users,
    applicant: Icons.Users,
    job: Icons.Briefcase,
    employment: Icons.BriefcaseBusiness,
    accomplishment: Icons.ClipboardList,
    report: Icons.FileWarning,
    renewal: Icons.RotateCw,
    evaluation: Icons.Star,
    verification: Icons.ShieldCheck,
    message: Icons.Chat,
  }
  return map[type] ?? Icons.Bell
}

async function markRead(id: string, read: boolean) {
  if (read) return
  setData(notifications.value.map((n) => (n.id === id ? { ...n, read: true } : n)))
  try {
    await markNotificationRead(id)
    await toast('Notification marked as read.')
  } catch (e: any) {
    await toast(e?.message || 'Could not mark the notification as read.', 'danger')
    void refresh()
  }
}

async function markAll() {
  markingAll.value = true
  try {
    await markAllNotificationsRead()
    setData(notifications.value.map((n) => ({ ...n, read: true })))
    await toast('All notifications marked as read.')
  } catch (e: any) {
    await toast(e?.message || 'Could not update notifications.', 'danger')
  } finally {
    markingAll.value = false
  }
}
</script>
