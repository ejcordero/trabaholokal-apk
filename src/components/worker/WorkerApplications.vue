<template>
  <AppShell
    title="My Applications"
    :subtitle="`${totalCount} total`"
    :right="refreshHeader"
  >
    <PullRefresh @refresh="refresh" :refreshing="loading">
      <!-- Filter chips -->
      <div class="flex items-center gap-2 mb-3 overflow-x-auto">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          @click="filter = f.key"
          :class="[
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap',
            filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          ]"
        >
          {{ f.label }}
          <span :class="[
            'text-[10px]',
            filter === f.key ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
          ]">{{ f.key === 'all' ? totalCount : getCount(f.statuses) }}</span>
        </button>
      </div>

      <!-- Applications list -->
      <div v-if="loading">
        <LoadingCards :count="4" />
      </div>
      <div v-else-if="error">
        <ErrorRetry :message="error" @retry="refresh" />
      </div>
      <div v-else-if="filtered.length === 0">
        <EmptyState
          icon="clipboard-list"
          :title="filter === 'all' ? 'No applications yet' : `No ${getFilterLabel(filter).toLowerCase()} applications`"
          :description="filter === 'all' ? 'Browse jobs and apply to get started.' : 'Try a different filter.'"
        />
      </div>
      <div v-else class="space-y-2">
        <Card
          v-for="app in filtered"
          :key="app.id"
          @click="selectedId = app.id"
          class="active:scale-[0.99] transition-transform"
        >
          <CardContent class="p-4 space-y-1.5">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="font-semibold truncate">{{ app.jobTitle }}</h3>
                <p class="text-xs text-muted-foreground truncate">{{ app.employerName }}</p>
              </div>
              <StatusPill :status="app.status" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">{{ relativeTime(app.createdAt) }}</span>
              <span v-if="app.matchScore > 0" class="text-xs font-semibold text-emerald-700">{{ app.matchScore }}% match</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PullRefresh>

    <!-- Detail sheet -->
    <ion-modal 
      :is-open="!!selectedId" 
      @will-dismiss="selectedId = null"
      :breakpoints="[0, 0.75, 1]"
      :initial-breakpoint="0.75"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title class="truncate">{{ selected?.jobTitle || 'Application' }}</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div v-if="selected" class="space-y-4">
          <div class="flex items-center justify-between">
            <StatusPill :status="selected.status" />
            <MatchRing v-if="selected.matchScore > 0" :score="selected.matchScore" :size="48" />
          </div>

          <!-- Quick facts -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-md bg-muted/50 p-2">
              <p class="text-muted-foreground">Compensation</p>
              <p class="font-semibold text-sm">{{ formatCompensation(selected.compensation, selected.compensationType) }}</p>
            </div>
            <div class="rounded-md bg-muted/50 p-2">
              <p class="text-muted-foreground">Category</p>
              <p class="font-semibold text-sm">{{ labelFor(selected.jobCategory, JOB_CATEGORIES) }}</p>
            </div>
            <div v-if="selected.municipalityName" class="rounded-md bg-muted/50 p-2 col-span-2">
              <p class="text-muted-foreground">Location</p>
              <p class="font-semibold text-sm">{{ selected.municipalityName }}</p>
            </div>
            <div class="rounded-md bg-muted/50 p-2 col-span-2">
              <p class="text-muted-foreground">Applied on</p>
              <p class="font-semibold text-sm">{{ formatDateTime(selected.createdAt) }}</p>
            </div>
          </div>

          <!-- Message -->
          <div v-if="selected.message">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Your message</p>
            <p class="text-sm italic whitespace-pre-line">"{{ selected.message }}"</p>
          </div>

          <!-- Employer note -->
          <div v-if="selected.employerNote" class="rounded-md bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm">
            <p class="font-medium text-emerald-800 dark:text-emerald-300 mb-0.5">Note from employer</p>
            <p class="text-emerald-700 dark:text-emerald-400">{{ selected.employerNote }}</p>
          </div>

          <!-- Match breakdown -->
          <MatchBreakdownCard v-if="selected.matchDetails" :match="selected.matchDetails" />

          <!-- Actions -->
          <div class="flex flex-col gap-2">
            <IonButton 
              fill="outline" 
              @click="viewJob(selected.jobId)"
            >
              <IonIcon name="briefcase" slot="start" />
              View job
            </IonButton>
            <IonButton 
              v-if="canWithdraw(selected.status)"
              fill="outline" 
              color="danger"
              @click="confirmWithdraw = selected.id"
            >
              <IonIcon name="close-circle" slot="start" />
              Withdraw application
            </IonButton>
            <p v-if="selected.status === 'accepted'" class="text-xs text-muted-foreground text-center">
              Accepted applications can't be withdrawn. Contact the employer if you need to cancel.
            </p>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Withdraw confirmation dialog -->
    <ConfirmDialog
      :is-open="!!confirmWithdraw"
      @confirm="withdrawApplication"
      @cancel="confirmWithdraw = null"
      :loading="withdrawing"
    >
      <template #title>Withdraw application?</template>
      <template #description>
        This will remove you from consideration. The employer will be notified. You can re-apply if the job is still open.
      </template>
      <template #confirm>Withdraw</template>
    </ConfirmDialog>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  IonModal,
  IonIcon,
  IonButton
} from '@ionic/vue'
import { 
  AppShell, 
  LoadingCards, 
  ErrorRetry, 
  EmptyState, 
  PullRefresh,
  Card,
  CardContent,
  StatusPill,
  MatchRing,
  ConfirmDialog
} from '../worker/_ui'
import { 
  listApplications, 
  updateApplicationStatus,
  useAsync,
  useToast,
  APPLICATION_STATUSES,
  JOB_CATEGORIES,
  labelFor,
  formatCompensation,
  formatDateTime,
  relativeTime
} from '../worker/_lib'
import { type ApplicationDTO, type MatchBreakdown } from '../worker/_lib'

interface WorkerApplicationsProps {
  onOpenJob: (jobId: string) => void
}

defineProps<WorkerApplicationsProps>()
const emit = defineEmits<{
  'open-job': [jobId: string]
}>()

const { toast } = useToast()
const filter = ref<'all' | 'pending' | 'shortlisted' | 'accepted' | 'rejected'>('all')
const selectedId = ref<string | null>(null)
const confirmWithdraw = ref<string | null>(null)
const withdrawing = ref(false)
const data = ref<ApplicationDTO[]>([])

type ApplicationFilterKey =
  | 'all'
  | 'pending'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'

interface ApplicationFilter {
  key: ApplicationFilterKey
  label: string
  statuses: string[]
}

const FILTERS: ApplicationFilter[] = [
  { key: 'all', label: 'All', statuses: [] },
  { key: 'pending', label: 'Pending', statuses: ['pending', 'under_review'] },
  { key: 'shortlisted', label: 'Shortlisted', statuses: ['shortlisted'] },
  { key: 'accepted', label: 'Accepted', statuses: ['accepted'] },
  { key: 'rejected', label: 'Rejected', statuses: ['rejected'] },
]

const loading = ref(false)
const error = ref<string | null>(null)

const totalCount = computed(() => data.value.length)

const filtered = computed(() => {
  if (filter.value === 'all') return data.value
  const f = FILTERS.find(x => x.key === filter.value)
  return f ? data.value.filter(a => f.statuses.includes(a.status)) : []
})

const refreshHeader = computed(() => {
  return '<RefreshHeader @refresh="refresh" :refreshing="loading" />'
})

onMounted(() => {
  refresh()
})

const refresh = async () => {
  loading.value = true
  error.value = null
  
  try {
    const apps = await listApplications()
    data.value = apps
  } catch (e: any) {
    error.value = e?.message || 'Failed to load applications.'
  } finally {
    loading.value = false
  }
}

const getCount = (statuses: string[]) => {
  return data.value.filter(a => statuses.includes(a.status)).length
}

const getFilterLabel = (key: string) => {
  return FILTERS.find(f => f.key === key)?.label || key
}

const canWithdraw = (status: string) => ['pending', 'under_review', 'shortlisted', 'rejected'].includes(status)

const viewJob = (jobId: string) => {
  selectedId.value = null
  emit('open-job', jobId)
}

const selected = computed(
  () => data.value.find((app) => app.id === selectedId.value) ?? null
)

const withdrawApplication = async () => {
  if (!confirmWithdraw.value) return
  
  withdrawing.value = true
  
  try {
    const updated = await updateApplicationStatus(confirmWithdraw.value, 'withdrawn')
    data.value = data.value.map(a => a.id === updated.id ? updated : a)
    toast({
      message: 'Application withdrawn',
      duration: 3000
    })
    confirmWithdraw.value = null
    selectedId.value = null
  } catch (e: any) {
    const status = e?.status || 0
    const msg = e?.message || 'Could not withdraw.'
    
    if (status === 400) {
      toast({
        message: 'Cannot withdraw: ' + msg,
        duration: 3000,
        color: 'danger'
      })
    } else {
      toast({
        message: 'Failed: ' + msg,
        duration: 3000,
        color: 'danger'
      })
    }
  } finally {
    withdrawing.value = false
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