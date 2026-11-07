<template>
  <AppShell
    title="TrabahoLokal"
    subtitle="Worker dashboard"
    :right="refreshHeader"
  >
    <PullRefresh @refresh="refreshAll" :refreshing="refreshing">
      <div class="space-y-4">
        <!-- Greeting + availability -->
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">{{ greeting }}</p>
                <h2 class="font-semibold text-lg truncate">Hello, {{ user?.fullName?.split(' ')[0] ?? 'Worker' }}</h2>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {{ available ? 'Available for work' : 'Not available' }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-1">
                <IonToggle 
                  :checked="available" 
                  @update:checked="toggleAvailable"
                  :disabled="toggling"
                />
                <span class="text-[10px] text-muted-foreground">{{ toggling ? 'Updating…' : 'Tap to toggle' }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Quick stats -->
        <div class="grid grid-cols-3 gap-2">
          <StatCard 
            label="Active work" 
            :value="empLoading ? '...' : activeEmpCount" 
            icon="briefcase-business" 
          />
          <StatCard 
            label="Pending apps" 
            :value="appLoading ? '...' : pendingAppCount" 
            icon="clipboard-list" 
          />
          <StatCard 
            label="Unread" 
            :value="notifLoading ? '...' : unreadNotifs" 
            icon="notifications" 
          />
        </div>

        <!-- Quick actions -->
        <div class="grid grid-cols-3 gap-2">
          <QuickAction 
            icon="briefcase" 
            label="Find Jobs" 
            @click="$emit('open-jobs')" 
          />
          <QuickAction 
            icon="clipboard-list" 
            label="Applications" 
            @click="$emit('open-applications')" 
          />
          <QuickAction 
            icon="award" 
            label="Skills" 
            @click="$emit('open-skills-profile')" 
          />
        </div>

        <!-- Skill unlock highlight -->
        <div v-if="!unlockLoading && unlockData?.length > 0" class="border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20">
          <CardContent class="p-4">
            <div class="flex items-start gap-3">
              <div class="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                <IonIcon name="sparkles" class="text-violet-600 dark:text-violet-400" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm">Unlock more jobs</p>
                <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {{ unlockData.length }} skill recommendation{{ unlockData.length === 1 ? '' : 's' }} could unlock up to {{ unlockData.reduce((s, r) => s + r.potentialCount, 0) }} more nearby jobs.
                </p>
                <IonButton 
                  size="small" 
                  fill="outline" 
                  class="mt-2"
                  @click="$emit('open-skill-unlock')"
                >
                  View recommendations
                  <IonIcon name="arrow-forward" slot="end" />
                </IonButton>
              </div>
            </div>
          </CardContent>
        </div>

        <!-- Recommended jobs -->
<SectionTitle>
          <template #action>
            <IonButton 
              v-if="jobsData?.data?.length" 
              size="small" 
              fill="outline" 
              @click="$emit('open-jobs')"
            >
              See all 
              <IonIcon name="arrow-forward" slot="end" />
            </IonButton>
          </template>
        </SectionTitle>
          Recommended jobs
        <div v-if="jobsLoading">
          <LoadingCards :count="3" />
        </div>
        <div v-else-if="jobsError">
          <ErrorRetry :message="jobsError" @retry="jobsRefresh" />
        </div>
        <div v-else-if="!jobsData?.data || jobsData.data.length === 0">
<EmptyState
            icon="briefcase"
            title="No jobs yet"
            description="New opportunities will appear here as employers post them."
          >
            <template #action>
              <IonButton 
                v-if="jobsData?.data?.length === 0" 
                size="small" 
                @click="$emit('open-jobs')"
              >
                Browse all jobs
              </IonButton>
            </template>
          </EmptyState>
        </div>
        <div v-else class="space-y-2">
          <JobCard
            v-for="job in jobsData.data.slice(0, 5)"
            :key="job.id"
            :job="job"
            :match="job.match"
            @click="$emit('open-job', job.id)"
          />
        </div>

        <!-- Recent activity -->
        <div v-if="appData?.length > 0">
          <SectionTitle>
            <template #action>
              <IonButton 
                v-if="appData?.length" 
                size="small" 
                fill="outline" 
                @click="$emit('open-applications')"
              >
                All 
                <IonIcon name="arrow-forward" slot="end" />
              </IonButton>
            </template>
          </SectionTitle>
            Recent applications
          <div class="space-y-2">
            <Card 
              v-for="app in appData.slice(0, 2)"
              :key="app.id"
              @click="$emit('open-applications')"
              class="active:scale-[0.99] transition-transform"
            >
              <CardContent class="p-3 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-sm truncate">{{ app.jobTitle }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ app.employerName }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <MatchRing v-if="app.matchScore > 0" :score="app.matchScore" :size="36" />
                  <StatusPill :status="app.status" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  IonToggle,
  IonIcon,
  IonButton
} from '@ionic/vue'
import { 
  AppShell, 
  StatCard, 
  SectionTitle, 
  LoadingCards, 
  ErrorRetry, 
  EmptyState, 
  PullRefresh,
  Card,
  CardContent,
  MatchRing,
  StatusPill
} from '../worker/_ui'
import { useAsync, useToast, useSession } from '../worker/_lib'
import { 
  listJobs, 
  listApplications, 
  listEmployments, 
  listNotifications, 
  getSkillUnlock,
  getWorkerMe,
  updateWorkerMe
} from '../worker/_lib'
import { type JobDTO, type EmploymentDTO, type ApplicationDTO, type NotificationDTO, type SkillUnlockDTO } from '../worker/_lib'

interface WorkerHomeProps {
  onOpenJobs: () => void
  onOpenApplications: () => void
  onOpenSkillUnlock: () => void
  onOpenSkillsProfile: () => void
  onOpenJob: (jobId: string) => void
}

defineProps<WorkerHomeProps>()
const emit = defineEmits<{
  'open-jobs': []
  'open-applications': []
  'open-skill-unlock': []
  'open-skills-profile': []
  'open-job': [jobId: string]
}>()

const { user } = useSession()
const { toast } = useToast()
const available = ref(false)
const toggling = ref(false)

// Async data requests
const meReq = useAsync(async () => {
  return await getWorkerMe()
}, [])

const jobsReq = useAsync(async () => {
  return await listJobs({ limit: 5 })
}, [])

const empReq = useAsync(async () => {
  return await listEmployments('active')
}, [])

const appReq = useAsync(async () => {
  return await listApplications()
}, [])

const notifReq = useAsync(async () => {
  return await listNotifications()
}, [])

const unlockReq = useAsync(async () => {
  return await getSkillUnlock()
}, [])

// Computed values
const refreshing = computed(() =>
  meReq.loading.value ||
  jobsReq.loading.value ||
  empReq.loading.value ||
  appReq.loading.value ||
  notifReq.loading.value ||
  unlockReq.loading.value
)

const activeEmpCount = computed(() =>
  (empReq.data.value ?? []).length
)

const pendingAppCount = computed(() =>
  (appReq.data.value ?? []).filter((a) =>
    ['pending', 'under_review', 'shortlisted'].includes(a.status)
  ).length
)

const unreadNotifs = computed(() =>
  (notifReq.data.value ?? []).filter((n) => !n.read).length
)

const empLoading = computed(() => empReq.loading.value)
const appLoading = computed(() => appReq.loading.value)
const notifLoading = computed(() => notifReq.loading.value)
const unlockLoading = computed(() => unlockReq.loading.value)

const unlockData = computed(() => unlockReq.data.value ?? [])
const jobsData = computed(() => jobsReq.data.value)
const jobsLoading = computed(() => jobsReq.loading.value)
const jobsError = computed(() => jobsReq.error.value)
const jobsRefresh = () => jobsReq.refresh()
const appData = computed(() => appReq.data.value ?? [])

const hour = new Date().getHours()

const greeting = computed(() => {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const refreshHeader = computed(() => {
  return '<RefreshHeader @refresh="refreshAll" :refreshing="refreshing" />'
})

// Watch for me data to set available status
watch(meReq.data, (data) => {
  if (data) available.value = data.available
})

const refreshAll = () => {
  meReq.refresh()
  jobsReq.refresh()
  empReq.refresh()
  appReq.refresh()
  notifReq.refresh()
  unlockReq.refresh()
}

const toggleAvailable = async (next: boolean) => {
  toggling.value = true
  available.value = next
  try {
    await updateWorkerMe({ available: next })
    toast({
      message: next ? 'You are now available' : 'Marked unavailable',
      duration: 3000
    })
  } catch (e: any) {
    available.value = !next
    const msg = e?.message || 'Could not update availability.'
    toast({
      message: 'Failed: ' + msg,
      duration: 3000,
      color: 'danger'
    })
  } finally {
    toggling.value = false
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>