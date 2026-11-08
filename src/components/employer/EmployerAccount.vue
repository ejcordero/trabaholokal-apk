<template>
  <AppShell title="Account">
    <div class="space-y-4">
      <div class="tl-card">
        <div class="tl-card-body flex items-center gap-3">
          <Avatar :name="me?.businessName ?? user?.fullName ?? '?'" :src="me?.logoUrl ?? ''" size="lg" />
          <div class="min-w-0 flex-1">
            <p class="font-semibold truncate">
              {{ me?.businessName ?? user?.fullName ?? 'Employer' }}
            </p>
            <p class="text-xs tl-muted truncate">{{ me?.email ?? user?.email ?? '' }}</p>
            <div class="mt-1">
              <VerifiedBadge :verification="me?.verification ?? 'unverified'" />
            </div>
          </div>
          <button type="button" class="tl-btn ghost icon" aria-label="Refresh profile" @click="refreshMe">
            <ion-icon :icon="meLoading ? Icons.Loader2 : Icons.RefreshCw" :class="{ 'tl-spin': meLoading }" />
          </button>
        </div>
      </div>

      <ErrorRetry v-if="meError" :message="meError" @retry="refreshMe" />

      <div
        v-if="(me?.verification ?? 'unverified') !== 'verified'"
        class="tl-card clickable"
        style="background: var(--tl-primary-soft)"
        @click="emit('navigate', 'verification')"
      >
        <div class="tl-card-body flex items-center gap-3">
          <ion-icon :icon="Icons.ShieldCheck" class="tl-primary" style="font-size: 22px" />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-sm">Complete verification</p>
            <p class="text-xs tl-muted">
              {{
                (me?.verification ?? 'unverified') === 'pending'
                  ? 'Your documents are under review.'
                  : 'Upload business documents to earn a verified badge.'
              }}
            </p>
          </div>
          <ion-icon :icon="Icons.ChevronRight" class="tl-muted" />
        </div>
      </div>

      <div class="tl-card">
        <div class="tl-card-body p-0">
          <button type="button" class="account-row" @click="emit('navigate', 'profile')">
            <ion-icon :icon="Icons.Building2" class="tl-primary" />
            <span class="flex-1">Business profile</span>
            <ion-icon :icon="Icons.ChevronRight" class="tl-muted" />
          </button>
          <button type="button" class="account-row" @click="emit('navigate', 'verification')">
            <ion-icon :icon="Icons.ShieldCheck" class="tl-primary" />
            <span class="flex-1">Verification</span>
            <ion-icon :icon="Icons.ChevronRight" class="tl-muted" />
          </button>
          <button type="button" class="account-row" @click="emit('navigate', 'notifications')">
            <ion-icon :icon="Icons.Bell" class="tl-primary" />
            <span class="flex-1">Notifications</span>
            <span v-if="unreadNotifications > 0" class="tl-pill pending">
              {{ unreadNotifications }}
            </span>
            <ion-icon :icon="Icons.ChevronRight" class="tl-muted" />
          </button>
          <button type="button" class="account-row" @click="reportOpen = true">
            <ion-icon :icon="Icons.FileWarning" style="color: #b45309" />
            <span class="flex-1">Report a problem</span>
            <ion-icon :icon="Icons.ChevronRight" class="tl-muted" />
          </button>
          <button type="button" class="account-row" @click="logout">
            <ion-icon :icon="Icons.LogOut" style="color: #b91c1c" />
            <span class="flex-1" style="color: #b91c1c">Log out</span>
          </button>
        </div>
      </div>

      <p class="tl-caption text-center">
        TrabahoLokal · Connecting skilled workers with trustworthy employers.
      </p>
    </div>

    <BottomSheet :open="reportOpen" title="Report a problem" @close="reportOpen = false">
      <div class="space-y-3">
        <p class="text-xs tl-muted">
          Tell administrators what went wrong. Reports are reviewed by the moderation team.
        </p>

        <Field label="Reason" required>
          <FormSelect v-model="reportReason" :options="reasonOptions" placeholder="Choose a reason" />
        </Field>

        <Field label="Description" required>
          <textarea
            v-model="reportDescription"
            class="tl-textarea"
            rows="4"
            placeholder="Describe the issue in detail"
          />
        </Field>

        <p v-if="reportError" class="tl-error">{{ reportError }}</p>

        <div class="flex gap-2">
          <button type="button" class="tl-btn outline" @click="reportOpen = false">Cancel</button>
          <button type="button" class="tl-btn" :disabled="reporting" @click="submitReport">
            <ion-icon :icon="reporting ? Icons.Loader2 : Icons.Send" :class="{ 'tl-spin': reporting }" />
            Submit report
          </button>
        </div>
      </div>
    </BottomSheet>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import {
  createReport,
  getEmployerMe,
  REPORT_REASONS,
  useAsync,
  useSession,
  useToast,
  type EmployerProfileDTO,
} from '../worker/_lib'
import {
  Avatar,
  AppShell,
  BottomSheet,
  ErrorRetry,
  Field,
  FormSelect,
  Icons,
  VerifiedBadge,
} from '../worker/_ui'

defineProps<{ unreadNotifications: number }>()
const emit = defineEmits<{ (e: 'navigate', viewName: string): void }>()

const { user, logout: sessionLogout } = useSession()
const { toast } = useToast()

const {
  data: me,
  loading: meLoading,
  error: meError,
  refresh: refreshMe,
} = useAsync<EmployerProfileDTO | null>(() => getEmployerMe(), [])

const reportOpen = ref(false)
const reportReason = ref('')
const reportDescription = ref('')
const reporting = ref(false)
const reportError = ref('')

const reasonOptions = REPORT_REASONS.map((r) => ({ value: r.value, label: r.label }))

async function submitReport() {
  reportError.value = ''
  if (!reportReason.value) {
    reportError.value = 'Choose a reason for the report.'
    return
  }
  if (!reportDescription.value.trim()) {
    reportError.value = 'Describe the problem before submitting.'
    return
  }
  reporting.value = true
  try {
    await createReport({
      reason: reportReason.value,
      description: reportDescription.value.trim(),
      targetAccountId: user.value?.id ?? null,
    })
    await toast('Report submitted. Thank you.')
    reportOpen.value = false
    reportReason.value = ''
    reportDescription.value = ''
  } catch (e: any) {
    reportError.value = e?.message || 'Could not submit the report.'
    await toast(reportError.value, 'danger')
  } finally {
    reporting.value = false
  }
}

async function logout() {
  await sessionLogout()
  await toast('Signed out.')
}
</script>

<style scoped>
.account-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 0;
  border-bottom: 1px solid var(--tl-border);
  background: transparent;
  color: var(--tl-text);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.account-row:last-child {
  border-bottom: 0;
}
.account-row:active {
  background: var(--tl-bg);
}
.account-row .ionicon {
  font-size: 19px;
}
</style>
