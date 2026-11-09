
<template>
  <AppShell title="Account" subtitle="Profile, settings & more">
    <PullRefresh @refresh="reloadOffline" :refreshing="false">
      <div class="space-y-4">
        <!-- User card -->
        <Card>
          <CardContent class="p-4 flex items-center gap-4">
            <Avatar :src="user?.photoUrl ?? undefined" :alt="user?.fullName ?? ''">
              <template #fallback>
                {{ initials(user?.fullName || '?') }}
              </template>
            </Avatar>

            <div class="min-w-0 flex-1">
              <p class="font-semibold truncate">{{ user?.fullName }}</p>
              <p class="text-xs text-muted-foreground truncate">
                {{ user?.email }}
              </p>
              <StatusPill :status="user?.role || 'worker'" />
            </div>
          </CardContent>
        </Card>

        <!-- Language settings -->
<LanguageSelector />

        <!-- Online indicator -->
        <div
          :class="[
            'flex items-center justify-between rounded-md border px-3 py-2 text-xs',
            online
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
          ]"
        >
          <span
            :class="[
              'inline-flex items-center gap-1.5',
              online
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-amber-800 dark:text-amber-300'
            ]"
          >
            <span
              :class="[
                'h-2 w-2 rounded-full',
                online ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              ]"
            />
            {{ online ? 'Online' : 'Offline' }}
          </span>

          <span class="text-muted-foreground">
            {{ online ? 'Applications can sync' : 'Applications will be queued' }}
          </span>
        </div>

        <!-- Offline applications -->
        <SectionTitle>
          Offline applications

          <template #action>
            <IonButton
              v-if="pendingOfflineCount > 0"
              size="small"
              fill="outline"
              @click="syncAll"
              :disabled="syncing || !online"
            >
              <IonIcon name="refresh" slot="start" />
              Sync all
            </IonButton>
          </template>
        </SectionTitle>

        <div v-if="offlineApps.length === 0">
          <Card class="border-dashed">
            <CardContent class="p-3 text-xs text-muted-foreground text-center">
              No offline applications queued. Applications saved without an
              internet connection will appear here.
            </CardContent>
          </Card>
        </div>

        <div v-else class="space-y-2">
          <Card v-for="app in offlineApps" :key="app.clientId">
            <CardContent class="p-3 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-sm truncate">
                    Job {{ app.jobId.slice(-6) }}
                  </p>
                  <p class="text-[11px] text-muted-foreground">
                    Saved {{ relativeTime(app.savedAt) }}
                  </p>
                </div>

                <StatusPill :status="app.status" />
              </div>

              <p
                v-if="app.message"
                class="text-xs text-muted-foreground line-clamp-2 italic"
              >
                "{{ app.message }}"
              </p>

              <p
                v-if="app.lastError && app.status === 'sync_failed'"
                class="text-[11px] text-rose-700 dark:text-rose-400"
              >
                {{ app.lastError }}
              </p>

              <div class="flex gap-2">
                <IonButton
                  v-if="app.status !== 'submitted'"
                  size="small"
                  fill="outline"
                  class="flex-1"
                  @click="syncOne(app)"
                  :disabled="!canSync(app)"
                >
                  <IonIcon name="send" slot="start" />
                  {{ app.status === 'syncing' ? 'Syncing...' : 'Sync now' }}
                </IonButton>

                <div
                  v-else
                  class="flex-1 text-xs text-emerald-700 dark:text-emerald-400 flex items-center"
                >
                  <IonIcon name="checkmark-circle" class="mr-1" />
                  Successfully submitted
                </div>

                <IonButton
                  size="small"
                  fill="outline"
                  color="danger"
                  @click="removeQueuedApplication(app.clientId)"
                  :disabled="app.status === 'syncing'"
                >
                  <IonIcon name="trash" />
                </IonButton>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Quick links -->
        <SectionTitle>Skills & work</SectionTitle>

        <div class="space-y-2">
          <LinkRow
            icon="award"
            title="Skills profile"
            description="Manage your skills and edit profile."
            @click="navigate('skills-profile')"
          />

          <LinkRow
            icon="document-text"
            title="Skills passport"
            description="Your shareable resume-free profile."
            @click="navigate('passport')"
          />

          <LinkRow
            icon="sparkles"
            title="Skill unlock"
            description="Recommended skills to learn."
            @click="navigate('skill-unlock')"
          />

          <LinkRow
            icon="map"
            title="Employment history"
            description="Full work timeline."
            @click="navigate('employment-history')"
          />
        </div>

        <SectionTitle>Activity</SectionTitle>

        <div class="space-y-2">
          <LinkRow
            icon="notifications"
            title="Notifications"
            description="Updates about your applications."
            :badge="unreadNotifications > 0 ? unreadNotifications : undefined"
            @click="navigate('notifications')"
          />

          <LinkRow
            icon="create"
            title="Edit profile"
            description="Update your details and preferences."
            @click="navigate('profile')"
          />

          <LinkRow
            icon="warning"
            title="Report a problem"
            description="Flag scams or abusive behavior."
            @click="reportOpen = true"
          />
        </div>

        <!-- Sign out -->
        <IonButton
          fill="outline"
          color="danger"
          expand="block"
          @click="doLogout"
          :disabled="loggingOut"
        >
          <IonIcon
            :name="loggingOut ? 'refresh' : 'log-out'"
            slot="start"
          />
          {{ loggingOut ? 'Signing out...' : 'Sign out' }}
        </IonButton>
      </div>
    </PullRefresh>

    <!-- Report sheet -->
    <ion-modal
      :is-open="reportOpen"
      @will-dismiss="reportOpen = false"
      :breakpoints="[0, 0.75, 1]"
      :initial-breakpoint="0.75"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Report a problem</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div class="space-y-4">
          <Field label="Reason" required>
            <FormSelect
              :value="reportReason"
              @update:value="reportReason = $event"
              :options="REPORT_REASONS.map(r => ({
                value: r.value,
                label: r.label
              }))"
              placeholder="Select reason"
            />
          </Field>

          <Field
            label="What happened?"
            required
            hint="Be specific. Include dates, amounts, and any communication."
          >
            <IonTextarea
              v-model="reportDescription"
              :rows="5"
              :maxlength="2000"
              placeholder="Describe the issue..."
            />
          </Field>

          <div
            v-if="reportError"
            class="rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-sm p-2 flex items-start gap-2"
          >
            <IonIcon name="warning" />
            <span>{{ reportError }}</span>
          </div>
        </div>
      </ion-content>

      <ion-footer>
        <div class="ion-padding flex gap-2">
          <IonButton
            fill="outline"
            expand="block"
            @click="reportOpen = false"
            :disabled="reportSaving"
          >
            Cancel
          </IonButton>

          <IonButton
            expand="block"
            @click="submitReport"
            :disabled="reportSaving"
          >
            <IonIcon
              :name="reportSaving ? 'refresh' : 'send'"
              slot="start"
            />
            Submit report
          </IonButton>
        </div>
      </ion-footer>
    </ion-modal>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

import LanguageSelector from '../shared/LanguageSelector.vue'
import type { OfflineApplication } from '../worker/_lib'

import {
  IonModal,
  IonIcon,
  IonButton,
  IonTextarea
} from '@ionic/vue'

import {
  AppShell,
  PullRefresh,
  SectionTitle,
  LinkRow,
  Card,
  CardContent,
  StatusPill,
  Avatar,
  Field,
  FormSelect
} from '../worker/_ui'

import {
  getOfflineApplications,
  saveOfflineApplication,
  removeOfflineApplication,
  applyToJob,
  useSession,
  useToast,
  REPORT_REASONS,
  initials,
  relativeTime
} from '../worker/_lib'

type AccountView =
  | 'skills-profile'
  | 'passport'
  | 'skill-unlock'
  | 'employment-history'
  | 'profile'
  | 'notifications'

interface WorkerAccountProps {
  onNavigate: (view: AccountView) => void
  unreadNotifications: number
}

const props = defineProps<WorkerAccountProps>()

const { user, logout } = useSession()
const { toast } = useToast()

const emit = defineEmits<{
  navigate: [view: AccountView]
}>()

const offlineApps = ref<OfflineApplication[]>([])
const online = ref(
  typeof navigator !== 'undefined' ? navigator.onLine : true
)

const reportOpen = ref(false)
const syncing = ref(false)
const loggingOut = ref(false)

const reportReason = ref('')
const reportDescription = ref('')
const reportSaving = ref(false)
const reportError = ref<string | null>(null)

const pendingOfflineCount = computed(() => {
  return offlineApps.value.filter(
    app =>
      app.status === 'saved_offline' ||
      app.status === 'sync_failed'
  ).length
})

// Navigation
const navigate = (view: AccountView) => {
  emit('navigate', view)
}

// Offline queue
const reloadOffline = () => {
  offlineApps.value = getOfflineApplications()
}

// Recover an interrupted sync after reopening the app.
const recoverInterruptedSyncs = () => {
  const apps = getOfflineApplications()

  for (const app of apps) {
    if (app.status === 'syncing') {
      saveOfflineApplication({
        ...app,
        status: 'sync_failed',
        lastError: 'Previous sync was interrupted. Please retry.'
      })
    }
  }

  reloadOffline()
}

// Check whether an application can be synchronized.
const canSync = (app: OfflineApplication): boolean => {
  return (
    (app.status === 'saved_offline' ||
      app.status === 'sync_failed') &&
    online.value &&
    !syncing.value
  )
}

// Actual server submission.
// Never mark an application as submitted unless applyToJob succeeds.
const submitQueuedApplication = async (
  app: OfflineApplication
): Promise<void> => {
  await applyToJob(app.jobId, app.message || null)
}

// Update a queue item.
const updateQueueStatus = (
  app: OfflineApplication,
  status: OfflineApplication['status'],
  lastError: string | null = null
) => {
  saveOfflineApplication({
    ...app,
    status,
    lastError
  })

  reloadOffline()
}

// Synchronize one application.
const syncOne = async (app: OfflineApplication) => {
  if (!canSync(app)) return

  syncing.value = true

  updateQueueStatus(app, 'syncing')

  try {
    await submitQueuedApplication(app)

    // Keep the successful record visible until the worker removes it.
    updateQueueStatus(app, 'submitted')

    toast({
      message: 'Application submitted successfully.',
      duration: 3000,
      color: 'success'
    })
  } catch (error: any) {
    const message =
      error?.message || 'Could not submit application.'

    updateQueueStatus(app, 'sync_failed', message)

    toast({
      message: `Sync failed: ${message}`,
      duration: 4000,
      color: 'danger'
    })
  } finally {
    syncing.value = false
    reloadOffline()
  }
}

// Synchronize all pending applications.
const syncAll = async () => {
  if (syncing.value) return

  if (
    typeof navigator !== 'undefined' &&
    !navigator.onLine
  ) {
    online.value = false

    toast({
      message: 'No internet connection.',
      duration: 3000,
      color: 'danger'
    })

    return
  }

  const pending = offlineApps.value.filter(
    app =>
      app.status === 'saved_offline' ||
      app.status === 'sync_failed'
  )

  if (pending.length === 0) return

  syncing.value = true

  let submitted = 0
  let failed = 0

  try {
    for (const app of pending) {
      // Stop trying if the device loses its connection.
      if (
        typeof navigator !== 'undefined' &&
        !navigator.onLine
      ) {
        online.value = false

        updateQueueStatus(
          app,
          'sync_failed',
          'Internet connection was lost. Please retry.'
        )

        failed++
        continue
      }

      updateQueueStatus(app, 'syncing')

      try {
        await submitQueuedApplication(app)

        updateQueueStatus(app, 'submitted')
        submitted++
      } catch (error: any) {
        updateQueueStatus(
          app,
          'sync_failed',
          error?.message || 'Could not submit application.'
        )

        failed++
      }
    }
  } finally {
    syncing.value = false
    reloadOffline()
  }

  toast({
    message: `${submitted} submitted, ${failed} failed.`,
    duration: 4000,
    color: failed > 0 ? 'danger' : 'success'
  })
}

// Remove a queue record manually.
const removeQueuedApplication = (clientId: string) => {
  removeOfflineApplication(clientId)
  reloadOffline()
}

// Sign out
const doLogout = async () => {
  if (loggingOut.value) return

  loggingOut.value = true

  try {
    await logout()

    toast({
      message: 'Signed out',
      duration: 3000
    })
  } catch (error: any) {
    toast({
      message: error?.message || 'Could not sign out.',
      duration: 3000,
      color: 'danger'
    })
  } finally {
    loggingOut.value = false
  }
}

// Report submission is not connected to a backend yet.
// Do not show a false success message.
const submitReport = async () => {
  reportError.value = null

  if (!reportReason.value) {
    reportError.value = 'Select a reason.'
    return
  }

  if (!reportDescription.value.trim()) {
    reportError.value = 'A description is required.'
    return
  }

  reportError.value =
    'Report submission is not connected yet. Your report has not been sent.'
}

// Network listeners
const onOnline = () => {
  online.value = true
  reloadOffline()
}

const onOffline = () => {
  online.value = false
  reloadOffline()
}

onMounted(() => {
  recoverInterruptedSyncs()

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', onOnline)
  window.removeEventListener('offline', onOffline)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
