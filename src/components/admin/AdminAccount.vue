<template>
  <AppShell title="Account" subtitle="Administrator · moderation tools">
    <div class="space-y-4">
      <div class="tl-card">
        <div class="tl-card-body account-card">
          <Avatar :name="user?.fullName ?? '?'" :src="user?.photoUrl ?? ''" size="lg" />
          <div class="min-w-0 flex-1">
            <p class="font-semibold truncate">{{ user?.fullName ?? 'Administrator' }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ user?.email }}</p>
            <div class="mt-1.5 flex items-center gap-2 flex-wrap">
              <span class="tl-pill capitalize">{{ user?.role ?? 'admin' }}</span>
              <span class="tl-pill approved inline-flex items-center gap-1">
                <IonIcon :icon="Icons.ShieldCheck" class="tiny-icon" />
                Moderator
              </span>
            </div>
          </div>
        </div>
      </div>

      <SectionTitle>Moderation</SectionTitle>
      <div class="tl-list">
        <button type="button" class="tl-card clickable link-row" @click="emit('navigate', 'notifications')">
          <div class="tl-card-body link-body">
            <IonIcon :icon="Icons.Bell" class="link-icon text-amber-600" />
            <div class="min-w-0 flex-1">
              <p class="font-medium text-sm">Notifications</p>
              <p class="text-xs text-muted-foreground truncate">
                Updates about reports and platform activity.
              </p>
            </div>
            <span v-if="unreadNotifications > 0" class="tl-pill danger-count">
              {{ unreadNotifications > 9 ? '9+' : unreadNotifications }}
            </span>
            <IonIcon :icon="Icons.ChevronRight" class="text-muted-foreground" />
          </div>
        </button>

        <button type="button" class="tl-card clickable link-row" @click="emit('navigate', 'audit')">
          <div class="tl-card-body link-body">
            <IonIcon :icon="Icons.Document" class="link-icon text-sky-600" />
            <div class="min-w-0 flex-1">
              <p class="font-medium text-sm">Audit logs</p>
              <p class="text-xs text-muted-foreground truncate">
                Chronological log of all moderation actions.
              </p>
            </div>
            <IonIcon :icon="Icons.ChevronRight" class="text-muted-foreground" />
          </div>
        </button>
      </div>

      <SectionTitle>Help</SectionTitle>
      <div class="tl-list">
        <button type="button" class="tl-card clickable link-row" @click="reportOpen = true">
          <div class="tl-card-body link-body">
            <IonIcon :icon="Icons.FileWarning" class="link-icon text-rose-600" />
            <div class="min-w-0 flex-1">
              <p class="font-medium text-sm">Report a problem</p>
              <p class="text-xs text-muted-foreground truncate">
                Flag a platform issue or abusive behavior.
              </p>
            </div>
            <IonIcon :icon="Icons.ChevronRight" class="text-muted-foreground" />
          </div>
        </button>
      </div>

      <div class="tl-divider" />

      <button
        type="button"
        class="tl-btn outline block logout-btn"
        :disabled="loggingOut"
        @click="doLogout"
      >
        <IonIcon :icon="loggingOut ? Icons.Loader2 : Icons.LogOut" :class="{ 'tl-spin': loggingOut }" />
        Sign out
      </button>

      <p class="text-[11px] text-muted-foreground text-center">
        <IonIcon :icon="Icons.ShieldCheck" class="tiny-icon" />
        All actions you take are recorded in the audit log.
      </p>
    </div>

    <BottomSheet :open="reportOpen" title="Report a problem" @close="closeReport">
      <div class="space-y-3">
        <Field label="Reason" required>
          <FormSelect
            v-model="reportReason"
            :options="REPORT_REASON_OPTIONS"
            placeholder="Select reason"
          />
        </Field>
        <Field
          label="What happened?"
          required
          hint="Be specific. Include dates, amounts, and any communication."
        >
          <textarea
            v-model="reportDescription"
            class="tl-textarea"
            rows="5"
            maxlength="2000"
            placeholder="Describe the issue…"
          />
        </Field>
        <div v-if="reportErr" class="error-box">
          <IonIcon :icon="Icons.AlertTriangle" class="error-icon" />
          <span>{{ reportErr }}</span>
        </div>
      </div>
      <template #footer>
        <div class="sheet-actions">
          <button type="button" class="tl-btn outline" :disabled="reportSaving" @click="closeReport">
            Cancel
          </button>
          <button type="button" class="tl-btn" :disabled="reportSaving" @click="submitReport">
            <IonIcon
              :icon="reportSaving ? Icons.Loader2 : Icons.Send"
              :class="{ 'tl-spin': reportSaving }"
            />
            {{ reportSaving ? 'Submitting…' : 'Submit report' }}
          </button>
        </div>
      </template>
    </BottomSheet>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { ref } from 'vue'

import {
  AppShell,
  Avatar,
  BottomSheet,
  Field,
  FormSelect,
  Icons,
  SectionTitle,
} from '../worker/_ui'
import {
  REPORT_REASONS,
  createReport,
  useSession,
  useToast,
} from '../worker/_lib'

withDefaults(defineProps<{ unreadNotifications?: number }>(), { unreadNotifications: 0 })

const emit = defineEmits<{
  (e: 'navigate', view: 'audit' | 'notifications'): void
}>()

const REPORT_REASON_OPTIONS = REPORT_REASONS.map((r) => ({ value: r.value, label: r.label }))

const { user, logout } = useSession()
const { toast } = useToast()

const loggingOut = ref(false)
const reportOpen = ref(false)
const reportReason = ref('')
const reportDescription = ref('')
const reportSaving = ref(false)
const reportErr = ref<string | null>(null)

function closeReport(): void {
  reportOpen.value = false
  reportReason.value = ''
  reportDescription.value = ''
  reportErr.value = null
}

async function submitReport(): Promise<void> {
  reportErr.value = null
  if (!reportReason.value) {
    reportErr.value = 'Select a reason.'
    return
  }
  if (!reportDescription.value.trim()) {
    reportErr.value = 'A description is required.'
    return
  }
  reportSaving.value = true
  try {
    await createReport({
      reason: reportReason.value,
      description: reportDescription.value.trim(),
      targetAccountId: user.value?.id ?? null,
    })
    toast('Report submitted — another moderator will review it.', 'success')
    closeReport()
  } catch (e: any) {
    const message = e?.message || 'Could not submit report.'
    reportErr.value = message
    toast(message, 'danger')
  } finally {
    reportSaving.value = false
  }
}

async function doLogout(): Promise<void> {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await logout()
    toast('Signed out. Session ended.', 'success')
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.account-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.link-row {
  width: 100%;
  text-align: left;
  font: inherit;
  padding: 0;
  color: inherit;
}

.link-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.link-icon {
  font-size: 21px;
  flex: none;
}

.danger-count {
  background: #e11d48;
  color: #fff;
}

.logout-btn {
  color: #be123c;
  border-color: #fda4af;
}

.error-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fff1f2;
  color: #9f1239;
  border-radius: 8px;
  padding: 8px;
  font-size: 13px;
}

.error-icon {
  font-size: 16px;
  margin-top: 1px;
  flex: none;
}

.sheet-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 4px;
}

.tiny-icon {
  font-size: 12px;
  vertical-align: -1px;
}
</style>
