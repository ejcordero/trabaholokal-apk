<template>
  <BottomSheet :open="Boolean(userId)" :title="displayName || 'User details'" @close="emit('close')">
    <LoadingCards v-if="loading && !account" :count="3" />
    <ErrorRetry v-else-if="error && !account" :message="error ?? ''" @retry="refresh" />
    <EmptyState
      v-else-if="!account"
      title="No user selected"
      description="Close and try again."
    />
    <div v-else class="space-y-3">
      <div class="profile-head">
        <Avatar :name="displayName || '?'" :src="photoUrl" size="lg" />
        <div class="min-w-0 flex-1">
          <p class="font-semibold truncate">{{ displayName || 'Unnamed' }}</p>
          <p class="text-xs text-muted-foreground truncate">{{ account.email }}</p>
          <div class="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span class="tl-pill capitalize">{{ account.role }}</span>
            <StatusPill :status="account.status" />
            <VerifiedBadge
              v-if="isEmployer && account.employerProfile"
              :verification="account.employerProfile.verification ?? 'unverified'"
            />
          </div>
        </div>
      </div>

      <div v-if="isAdmin" class="tl-card admin-note">
        <div class="tl-card-body note-body">
          <IonIcon :icon="Icons.ShieldAlert" class="note-icon" />
          <span>Administrator accounts cannot be moderated here.</span>
        </div>
      </div>

      <div v-if="account.status === 'suspended' && account.suspendReason" class="tl-card suspend-note">
        <div class="tl-card-body">
          <p class="note-title">Suspension reason</p>
          <p class="text-sm pre-line">{{ account.suspendReason }}</p>
        </div>
      </div>

      <SectionTitle>Account</SectionTitle>
      <div class="tl-card">
        <div class="tl-card-body info-list">
          <InfoRow label="Account ID" mono>{{ account.id }}</InfoRow>
          <InfoRow label="Role"><span class="capitalize">{{ account.role }}</span></InfoRow>
          <InfoRow label="Status"><StatusPill :status="account.status" /></InfoRow>
          <InfoRow label="Created">{{ formatDate(account.createdAt) }}</InfoRow>
        </div>
      </div>

      <template v-if="isWorker && account.workerProfile">
        <SectionTitle>Worker profile</SectionTitle>
        <div class="tl-card">
          <div class="tl-card-body info-list">
            <InfoRow label="Municipality">{{ account.workerProfile?.municipalityName ?? '—' }}</InfoRow>
            <InfoRow label="Barangay">{{ account.workerProfile?.barangay ?? '—' }}</InfoRow>
            <InfoRow label="Available">{{ account.workerProfile?.available ? 'Yes' : 'No' }}</InfoRow>
            <InfoRow label="Skills">
              {{ account.workerProfile?.skills?.length ?? 0 }} declared
            </InfoRow>
            <InfoRow v-if="account.workerProfile?.education" label="Education">
              {{ account.workerProfile?.education }}
            </InfoRow>
          </div>
        </div>
        <div v-if="account.workerProfile?.bio" class="tl-card muted-card">
          <div class="tl-card-body">
            <p class="note-title">Bio</p>
            <p class="text-sm pre-line">{{ account.workerProfile?.bio }}</p>
          </div>
        </div>
      </template>

      <template v-if="isEmployer && account.employerProfile">
        <SectionTitle>Employer profile</SectionTitle>
        <div class="tl-card">
          <div class="tl-card-body info-list">
            <InfoRow label="Business">{{ account.employerProfile?.businessName }}</InfoRow>
            <InfoRow label="Type">
              {{ labelFor(account.employerProfile?.employerType ?? '', EMPLOYER_TYPES) }}
            </InfoRow>
            <InfoRow label="Verification">
              <VerifiedBadge :verification="account.employerProfile?.verification ?? 'unverified'" />
            </InfoRow>
            <InfoRow label="Municipality">{{ account.employerProfile?.municipalityName ?? '—' }}</InfoRow>
            <InfoRow label="Address">{{ account.employerProfile?.address ?? '—' }}</InfoRow>
            <InfoRow label="Jobs posted">{{ account.jobs?.length ?? 0 }}</InfoRow>
            <InfoRow v-if="account.employerProfile?.verificationNote" label="Verification note">
              {{ account.employerProfile?.verificationNote }}
            </InfoRow>
          </div>
        </div>

        <template v-if="account.jobs && account.jobs.length > 0">
          <SectionTitle>Jobs</SectionTitle>
          <div class="tl-list">
            <button
              v-for="j in account.jobs.slice(0, 5)"
              :key="j.id"
              type="button"
              class="tl-card clickable job-row"
              @click="emit('view-job', j.id)"
            >
              <div class="tl-card-body job-row-body">
                <IonIcon :icon="Icons.Briefcase" class="text-muted-foreground" />
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm truncate">{{ j.title }}</p>
                  <p class="text-[11px] text-muted-foreground truncate">
                    {{ j.status }} · {{ j.moderationStatus ?? 'ok' }}
                  </p>
                </div>
                <IonIcon :icon="Icons.ChevronRight" class="text-muted-foreground" />
              </div>
            </button>
          </div>
        </template>
      </template>

      <template v-if="isAdmin && account.adminProfile">
        <SectionTitle>Administrator</SectionTitle>
        <div class="tl-card">
          <div class="tl-card-body info-list">
            <InfoRow label="Full name">{{ account.adminProfile?.fullName }}</InfoRow>
          </div>
        </div>
      </template>

      <div class="tl-divider" />

      <template v-if="!isAdmin">
        <SectionTitle>Moderation</SectionTitle>
        <Field
          label="Reason / note"
          hint="Required when suspending. Visible to the user where applicable."
        >
          <textarea
            v-model="reason"
            class="tl-textarea"
            rows="3"
            maxlength="1000"
            placeholder="e.g. Repeated scam reports confirmed after review."
          />
        </Field>

        <div class="space-y-2 mt-2">
          <button
            v-if="account.status === 'active'"
            type="button"
            class="tl-btn outline block danger-outline"
            :disabled="acting"
            @click="pendingAction = 'suspend'"
          >
            <IonIcon :icon="Icons.Ban" />
            Suspend account
          </button>
          <button
            v-else
            type="button"
            class="tl-btn outline block success-outline"
            :disabled="acting"
            @click="pendingAction = 'restore'"
          >
            <IonIcon :icon="Icons.RotateCw" />
            Restore account
          </button>

          <div v-if="isEmployer && account.employerProfile" class="verify-btn-row">
            <button
              v-if="account.employerProfile?.verification !== 'verified'"
              type="button"
              class="tl-btn outline block success-outline"
              :disabled="acting"
              @click="pendingAction = 'verify'"
            >
              <IonIcon :icon="Icons.ShieldCheck" />
              Verify
            </button>
            <button
              v-else
              type="button"
              class="tl-btn outline block warning-outline"
              :disabled="acting"
              @click="pendingAction = 'unverify'"
            >
              <IonIcon :icon="Icons.ShieldAlert" />
              Unverify
            </button>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <button type="button" class="tl-btn outline block" @click="emit('close')">Close</button>
    </template>
  </BottomSheet>

  <ConfirmDialog
    :open="pendingAction !== null"
    :title="confirmTitle"
    :message="confirmMessage"
    :danger="confirmDanger"
    confirm-label="Confirm"
    @confirm="performAction"
    @cancel="pendingAction = null"
  />
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed, defineComponent, h, ref, watch } from 'vue'

import {
  Avatar,
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  ErrorRetry,
  Field,
  Icons,
  LoadingCards,
  SectionTitle,
  StatusPill,
  VerifiedBadge,
} from '../worker/_ui'
import {
  EMPLOYER_TYPES,
  adminGetUser,
  adminUserAction,
  formatDate,
  labelFor,
  useAsync,
  useToast,
  type AdminUserDetail,
} from '../worker/_lib'

const InfoRow = defineComponent({
  name: 'InfoRow',
  props: {
    label: { type: String, required: true },
    mono: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'info-row' }, [
        h('span', { class: 'info-label' }, props.label),
        h('span', { class: ['info-value', props.mono ? 'mono' : ''] }, slots.default ? slots.default() : []),
      ])
  },
})

type ModerationAction = 'suspend' | 'restore' | 'verify' | 'unverify'

const props = defineProps<{ userId: string | null }>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
  (e: 'view-job', jobId: string): void
}>()

const { toast } = useToast()

const {
  data: account,
  loading,
  error,
  refresh,
} = useAsync<AdminUserDetail | null>(
  () => (props.userId ? adminGetUser(props.userId) : Promise.resolve(null)),
  () => [props.userId]
)

const pendingAction = ref<ModerationAction | null>(null)
const reason = ref('')
const acting = ref(false)

watch(
  () => props.userId,
  () => {
    pendingAction.value = null
    reason.value = ''
  }
)

const isWorker = computed(() => account.value?.role === 'worker')
const isEmployer = computed(() => account.value?.role === 'employer')
const isAdmin = computed(() => account.value?.role === 'admin')

const displayName = computed<string>(() => {
  const a = account.value
  if (!a) return ''
  if (a.role === 'worker') return a.workerProfile?.fullName ?? a.email
  if (a.role === 'employer') return a.employerProfile?.businessName ?? a.email
  return a.adminProfile?.fullName ?? a.email
})

const photoUrl = computed<string>(() => {
  const a = account.value
  if (!a) return ''
  if (a.role === 'worker') return a.workerProfile?.photoUrl ?? ''
  if (a.role === 'employer') return a.employerProfile?.logoUrl ?? ''
  return ''
})

const confirmTitle = computed(() => {
  switch (pendingAction.value) {
    case 'suspend':
      return 'Suspend this account?'
    case 'restore':
      return 'Restore this account?'
    case 'verify':
      return 'Verify this employer?'
    case 'unverify':
      return 'Remove verification?'
    default:
      return 'Confirm action'
  }
})

const confirmMessage = computed(() => {
  switch (pendingAction.value) {
    case 'suspend':
      return 'The user will be signed out and unable to access the platform until restored. A reason is required and will be visible to the user.'
    case 'restore':
      return 'The user will regain access and be notified.'
    case 'verify':
      return 'The employer will be marked as verified. Workers will see the verified badge.'
    case 'unverify':
      return 'The verified badge will be removed. The employer will be notified.'
    default:
      return ''
  }
})

const confirmDanger = computed(
  () => pendingAction.value === 'suspend' || pendingAction.value === 'unverify'
)

function actionSuccess(action: ModerationAction): string {
  switch (action) {
    case 'suspend':
      return 'Account suspended. The user has been signed out and notified.'
    case 'restore':
      return 'Account restored. The user has been notified.'
    case 'verify':
      return 'Employer verified. Workers will see the verified badge.'
    default:
      return 'Employer unverified. The employer has been notified.'
  }
}

async function performAction(): Promise<void> {
  const a = account.value
  const action = pendingAction.value
  if (!a || !action || acting.value) return
  if (action === 'suspend' && !reason.value.trim()) {
    toast('Provide a clear reason for suspension.', 'danger')
    return
  }
  acting.value = true
  try {
    await adminUserAction(a.id, action, reason.value.trim() || null)
    toast(actionSuccess(action), 'success')
    pendingAction.value = null
    reason.value = ''
    emit('updated')
    await refresh()
  } catch (e: any) {
    toast(e?.message || 'Could not update account.', 'danger')
  } finally {
    acting.value = false
  }
}
</script>

<style scoped>
.profile-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-note {
  border-color: #fcd34d;
  background: #fffbeb;
}

.note-body {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #78350f;
  font-size: 13px;
}

.note-icon {
  font-size: 20px;
  flex: none;
  margin-top: 1px;
}

.suspend-note {
  border-color: #fda4af;
  background: #fff1f2;
}

.note-title {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6b7280;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

:deep(.info-row) {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

:deep(.info-label) {
  color: var(--tl-muted);
  font-size: 12px;
  flex: none;
}

:deep(.info-value) {
  text-align: right;
  font-size: 13px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.info-value.mono) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}

.muted-card {
  background: #f9fafb;
}

.pre-line {
  white-space: pre-line;
}

.job-row {
  width: 100%;
  text-align: left;
  font: inherit;
  padding: 0;
  color: inherit;
}

.job-row-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.danger-outline {
  color: #be123c;
  border-color: #fda4af;
}

.success-outline {
  color: #047857;
  border-color: #6ee7b7;
}

.warning-outline {
  color: #b45309;
  border-color: #fcd34d;
}

.verify-btn-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
</style>
