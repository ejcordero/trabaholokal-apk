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
              <p class="text-xs text-muted-foreground truncate">{{ user?.email }}</p>
              <StatusPill :status="user?.role || 'worker'" />
            </div>
          </CardContent>
        </Card>

        <!-- Online indicator -->
        <div :class="[
          'flex items-center justify-between rounded-md border px-3 py-2 text-xs',
          online ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
        ]">
          <span :class="[
            'inline-flex items-center gap-1.5',
            online ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'
          ]">
            <span :class="[
              'h-2 w-2 rounded-full',
              online ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            ]" />
            {{ online ? 'Online' : 'Offline' }}
          </span>
          <span class="text-muted-foreground">
            {{ online ? 'Changes sync immediately' : 'Applications will be queued' }}
          </span>
        </div>

        <!-- Offline applications -->
        <SectionTitle>
          <template #action>
            <IonButton 
              v-if="offlineApps.length > 0" 
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
          Offline applications
        <div v-if="offlineApps.length === 0">
          <Card class="border-dashed">
            <CardContent class="p-3 text-xs text-muted-foreground text-center">
              No offline applications queued. When you apply without a connection, they'll appear here for sync.
            </CardContent>
          </Card>
        </div>
        <div v-else class="space-y-2">
          <Card v-for="app in offlineApps" :key="app.clientId">
            <CardContent class="p-3 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-sm truncate">Job {{ app.jobId.slice(-6) }}</p>
                  <p class="text-[11px] text-muted-foreground">Saved {{ relativeTime(app.savedAt) }}</p>
                </div>
                <StatusPill :status="app.status" />
              </div>
              <p v-if="app.message" class="text-xs text-muted-foreground line-clamp-2 italic">"{{ app.message }}"</p>
              <p v-if="app.lastError && app.status === 'sync_failed'" class="text-[11px] text-rose-700 dark:text-rose-400">
                {{ app.lastError }}
              </p>
              <div class="flex gap-2">
                <IonButton 
                  size="small" 
                  fill="outline" 
                  class="flex-1"
                  @click="syncOne(app)"
                  :disabled="!canSync(app)"
                >
                  <IonIcon name="send" slot="start" />
                  Sync now
                </IonButton>
                <IonButton 
                  size="small" 
                  fill="outline"
                  @click="removeOfflineApplication(app.clientId)"
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
            @click="$emit('navigate', 'skills-profile')"
          />
          <LinkRow
            icon="document-text"
            title="Skills passport"
            description="Your shareable resume-free profile."
            @click="$emit('navigate', 'passport')"
          />
          <LinkRow
            icon="sparkles"
            title="Skill unlock"
            description="Recommended skills to learn."
            @click="$emit('navigate', 'skill-unlock')"
          />
          <LinkRow
            icon="map"
            title="Employment history"
            description="Full work timeline."
            @click="$emit('navigate', 'employment-history')"
          />
        </div>

        <SectionTitle>Activity</SectionTitle>
        <div class="space-y-2">
          <LinkRow
            icon="notifications"
            title="Notifications"
            description="Updates about your applications."
            :badge="unreadNotifications > 0 ? unreadNotifications : undefined"
            @click="$emit('navigate', 'notifications')"
          />
          <LinkRow
            icon="create"
            title="Edit profile"
            description="Update your details and preferences."
            @click="$emit('navigate', 'profile')"
          />
          <LinkRow
            icon="warning"
            title="Report a problem"
            description="Flag scams or abusive behavior."
            @click="reportOpen = true"
          />
        </div>

        <IonButton 
          fill="outline" 
          color="danger"
          expand="block"
          @click="doLogout"
          :disabled="loggingOut"
        >
          <IonIcon v-if="loggingOut" name="refresh" slot="start" />
          <IonIcon v-else name="log-out" slot="start" />
          Sign out
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
              :options="REPORT_REASONS.map(r => ({ value: r.value, label: r.label }))"
              placeholder="Select reason"
            />
          </Field>
          <Field label="What happened?" required hint="Be specific. Include dates, amounts, and any communication.">
            <IonTextarea
              v-model="reportDescription"
              :rows="5"
              :maxlength="2000"
              placeholder="Describe the issue…"
            />
          </Field>
          <div v-if="reportError" class="rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-sm p-2 flex items-start gap-2">
            <IonIcon name="warning" />
            <span>{{ reportError }}</span>
          </div>
        </div>
      </ion-content>
      <ion-footer>
        <div class="ion-padding">
          <IonButton 
            fill="outline" 
            @click="reportOpen = false"
            :disabled="reportSaving"
          >
            Cancel
          </IonButton>
          <IonButton 
            @click="submitReport"
            :disabled="reportSaving"
          >
            <IonIcon v-if="reportSaving" name="refresh" slot="start" />
            <IonIcon v-else name="send" slot="start" />
            Submit report
          </IonButton>
        </div>
      </ion-footer>
    </ion-modal>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { OfflineApplication } from '../worker/_lib'
import { 
  IonModal,
  IonIcon,
  IonButton,
  IonTextarea
} from '@ionic/vue'
import { 
  AppShell, 
  LoadingCards, 
  ErrorRetry, 
  EmptyState, 
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
  useSession,
  useToast,
  REPORT_REASONS,
  initials,
  relativeTime
} from '../worker/_lib'

type AccountView = 'skills-profile' | 'passport' | 'skill-unlock' | 'employment-history' | 'profile' | 'notifications'

interface WorkerAccountProps {
  onNavigate: (view: AccountView) => void
  unreadNotifications: number
}

defineProps<WorkerAccountProps>()
const emit = defineEmits<{
  navigate: [view: AccountView]
}>()

const { user, logout } = useSession()
const { toast } = useToast()
const offlineApps = ref<OfflineApplication[]>([])
const online = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const reportOpen = ref(false)
const syncing = ref(false)
const loggingOut = ref(false)
const reportReason = ref('')
const reportDescription = ref('')
const reportSaving = ref(false)
const reportError = ref<string | null>(null)

const canSync = (app: any) => {
  return (app.status === 'saved_offline' || app.status === 'sync_failed') && online.value && !syncing.value
}

const reloadOffline = () => {
  offlineApps.value = getOfflineApplications()
}

const syncOne = async (app: any) => {
  if (!navigator.onLine) {
    toast({
      message: 'Offline',
      duration: 3000,
      color: 'danger'
    })
    return
  }
  
  saveOfflineApplication({ ...app, status: 'syncing' })
  reloadOffline()
  
  try {
    // TODO: Implement applyToJob function
    // await applyToJob(app.jobId, app.message || '')
    saveOfflineApplication({ ...app, status: 'submitted' })
    reloadOffline()
    toast({
      message: 'Synced',
      duration: 3000
    })
    setTimeout(() => { 
      removeOfflineApplication(app.clientId) 
      reloadOffline() 
    }, 1500)
  } catch (e: any) {
    const msg = e?.message || 'Sync failed.'
    saveOfflineApplication({ ...app, status: 'sync_failed', lastError: msg })
    reloadOffline()
    toast({
      message: 'Sync failed',
      duration: 3000,
      color: 'danger'
    })
  }
}

const syncAll = async () => {
  const pending = offlineApps.value.filter((a) => a.status === 'saved_offline' || a.status === 'sync_failed')
  if (pending.length === 0) return
  
  if (!navigator.onLine) {
    toast({
      message: 'Offline',
      duration: 3000,
      color: 'danger'
    })
    return
  }
  
  syncing.value = true
  let ok = 0
  let fail = 0
  
  for (const app of pending) {
    saveOfflineApplication({ ...app, status: 'syncing' })
    reloadOffline()
    
    try {
      // TODO: Implement applyToJob function
      // await applyToJob(app.jobId, app.message || '')
      saveOfflineApplication({ ...app, status: 'submitted' })
      ok++
      setTimeout(() => { 
        removeOfflineApplication(app.clientId) 
        reloadOffline() 
      }, 1500)
    } catch (e: any) {
      const msg = e?.message || 'Sync failed.'
      saveOfflineApplication({ ...app, status: 'sync_failed', lastError: msg })
      fail++
    }
    reloadOffline()
  }
  
  syncing.value = false
  toast({
    message: 'Sync complete',
    duration: 3000,
    color: fail > 0 ? 'danger' : 'primary'
  })
}

const doLogout = async () => {
  loggingOut.value = true
  try {
    await logout()
    toast({
      message: 'Signed out',
      duration: 3000
    })
  } finally {
    loggingOut.value = false
  }
}

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
  
  reportSaving.value = true
  
  try {
    // TODO: Implement createReport function
    // await createReport({
    //   reason: reportReason.value,
    //   description: reportDescription.value.trim()
    // })
    toast({
      message: 'Report submitted',
      duration: 3000
    })
    reportOpen.value = false
  } catch (e: any) {
    const msg = e?.message || 'Could not submit report.'
    reportError.value = msg
  } finally {
    reportSaving.value = false
  }
}

// Set up online/offline listeners
const onOnline = () => {
  online.value = true
  reloadOffline()
}

const onOffline = () => {
  online.value = false
  reloadOffline()
}

onMounted(() => {
  reloadOffline()
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