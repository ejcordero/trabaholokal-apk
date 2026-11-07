<template>
  <AppShell
    title="Find Jobs"
    :subtitle="subtitle"
    :right="refreshHeader"
  >
    <PullRefresh @refresh="loadInitial" :refreshing="refreshing">
      <div class="space-y-3">
        <!-- Search + filter button -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <IonIcon name="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <IonInput
              v-model="q"
              placeholder="Search jobs…"
              class="pl-8"
            />
          </div>
          <IonButton 
            fill="outline" 
            size="default"
            @click="filtersOpen = true"
          >
            <IonIcon name="filter" slot="start" />
            {{ activeFilterCount }}
          </IonButton>
        </div>

        <!-- Location indicator -->
        <div v-if="useGeo && coords" class="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <CardContent class="p-2 text-xs flex items-center justify-between">
            <span class="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
              <IonIcon name="location" /> Within {{ distanceKm }} km of your location
            </span>
            <button class="text-emerald-700 underline" @click="clearGeo">Clear</button>
          </CardContent>
        </div>

        <!-- Offline mode indicator -->
        <div v-if="offlineMode && jobs.length > 0" class="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900">
          <CardContent class="p-2.5 text-xs flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <IonIcon name="warning" class="h-4 w-4 shrink-0" />
            <span>You are offline — showing cached jobs. New applications will be saved offline and synced when you reconnect.</span>
          </CardContent>
        </div>

        <!-- Job list -->
        <div v-if="!initialLoaded && refreshing">
          <LoadingCards :count="4" />
        </div>
        <div v-else-if="error">
          <ErrorRetry :message="error" @retry="loadInitial" />
        </div>
        <div v-else-if="jobs.length === 0">
          <EmptyState
            icon="briefcase"
            title="No jobs found"
            description="Try adjusting your filters or search query."
          >
            <template #action>
              <IonButton 
                v-if="activeFilterCount > 0" 
                size="small" 
                fill="outline" 
                @click="clearFilters"
              >
                Clear filters
              </IonButton>
            </template>
          </EmptyState>
        </div>
        <div v-else class="space-y-2">
          <JobCard
            v-for="job in jobs"
            :key="job.id"
            :job="job"
            :match="job.match"
            @click="$emit('open-job-change', job.id)"
          />
          <IonButton 
            v-if="hasMore" 
            fill="outline" 
            expand="block"
            @click="loadMore"
            :disabled="loadingMore"
          >
            <IonIcon v-if="loadingMore" name="refresh" slot="start" />
            Load more
          </IonButton>
        </div>
      </div>
    </PullRefresh>

    <!-- Filter sheet -->
    <ion-modal 
      :is-open="filtersOpen" 
      @will-dismiss="filtersOpen = false"
      :breakpoints="[0, 0.75, 1]"
      :initial-breakpoint="0.75"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Filters</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="space-y-4">
          <Field label="Category">
            <FormSelect 
              :value="category" 
              @update:value="category = $event"
              :options="[{ value: '', label: 'All categories' }, ...JOB_CATEGORIES.map(c => ({ value: c.value, label: c.label }))]"
            />
          </Field>
          <Field label="Municipality">
            <FormSelect 
              :value="municipalityId" 
              @update:value="municipalityId = $event"
              :options="[{ value: '', label: 'All municipalities' }, ...municipalities.map(m => ({ value: m.id, label: m.name }))]"
            />
          </Field>
          <Field label="Urgency">
            <FormSelect 
              :value="urgency" 
              @update:value="urgency = $event"
              :options="[{ value: '', label: 'Any urgency' }, ...URGENCY_LEVELS.map(u => ({ value: u.value, label: u.label }))]"
            />
          </Field>
          <Separator />
          <div>
            <div class="flex items-center justify-between mb-1">
              <Label class="text-sm font-medium">Sort by distance</Label>
              <button 
                @click="useGeo ? clearGeo() : detectLocation()"
                :class="useGeo ? 'text-emerald-700' : 'text-primary'"
                class="text-xs font-medium"
              >
                {{ useGeo ? 'On' : 'Use my location' }}
              </button>
            </div>
            <div v-if="useGeo" class="space-y-2">
              <p class="text-xs text-muted-foreground">Within {{ distanceKm }} km</p>
              <IonRange 
                v-model="distanceKm" 
                :min="1" 
                :max="100" 
                :step="1"
              />
            </div>
          </div>
          <Separator />
          <Field label="Minimum compensation (₱)">
            <IonInput 
              v-model="minComp" 
              placeholder="e.g. 500"
              @input="minComp = $event.replace(/[^0-9]/g, '')"
              type="number"
            />
          </Field>
          <Field label="Maximum compensation (₱)">
            <IonInput 
              v-model="maxComp" 
              placeholder="e.g. 2000"
              @input="maxComp = $event.replace(/[^0-9]/g, '')"
              type="number"
            />
          </Field>
        </div>
      </ion-content>
      <ion-footer>
        <div class="ion-padding">
          <IonButton 
            fill="outline" 
            @click="clearFilters"
          >
            Clear all
          </IonButton>
          <IonButton @click="filtersOpen = false; loadInitial()">
  Apply filters
</IonButton>
        </div>
      </ion-footer>
    </ion-modal>

    <!-- Job detail sheet -->
    <JobDetailSheet
      :job-id="openJobId"
      :job="jobs.find(j => j.id === openJobId) || null"
      @open-change="$emit('open-job-change', $event)"
      @applied="loadInitial"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  IonModal,
  IonIcon,
  IonInput,
  IonButton,
  IonRange,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter
} from '@ionic/vue'
import { 
  AppShell, 
  Field, 
  FormSelect, 
  LoadingCards, 
  ErrorRetry, 
  EmptyState, 
  PullRefresh,
  Separator,
  CardContent,
  JobCard
} from '../worker/_ui'
import {
  listJobs,
  getMunicipalities,
  getWorkerMe,
  JOB_CATEGORIES,
  URGENCY_LEVELS,
  useToast,
  type JobWithMatch,
  type MunicipalityDTO
} from '../worker/_lib'

interface WorkerJobsProps {
  openJobId: string | null
}

defineProps<WorkerJobsProps>()
const emit = defineEmits<{
  'open-job-change': [id: string | null]
}>()

const { toast } = useToast()
const q = ref('')
const category = ref('')
const municipalityId = ref('')
const distanceKm = ref(30)
const useGeo = ref(false)
const coords = ref<{ lat: number; lon: number } | null>(null)
const urgency = ref('')
const minComp = ref('')
const maxComp = ref('')
const filtersOpen = ref(false)

const jobs = ref<JobWithMatch[]>([])
const loadingMore = ref(false)
const hasMore = ref(false)
const offset = ref(0)
const refreshing = ref(false)
const error = ref<string | null>(null)
const initialLoaded = ref(false)
const offlineMode = ref(false)
const municipalities = ref<MunicipalityDTO[]>([])

const activeFilterCount = computed(() => 
  [category.value, municipalityId.value, urgency.value, minComp.value, maxComp.value].filter(Boolean).length + (useGeo.value ? 1 : 0)
)

const subtitle = computed(() => {
  let result = `${jobs.value.length} job${jobs.value.length === 1 ? '' : 's'}`
  if (activeFilterCount.value > 0) {
    result += ` · ${activeFilterCount.value} filter${activeFilterCount.value === 1 ? '' : 's'}`
  }
  return result
})

const refreshHeader = computed(() => {
  return '<RefreshHeader @refresh="loadInitial" :refreshing="refreshing" />'
})

onMounted(async () => {
  // Load municipalities
  try {
    const munis = await getMunicipalities()
    municipalities.value = munis
  } catch (e) {
    console.error('Failed to load municipalities:', e)
  }

    // Load the worker's saved preferred search distance.
    try {
    const profile = await getWorkerMe()
    const savedDistance = Number(profile.preferredDistanceKm)

    if (Number.isFinite(savedDistance) && savedDistance > 0) {
      distanceKm.value = Math.min(100, Math.max(1, Math.round(savedDistance)))
    }
  } catch (e) {
    console.error('Failed to load worker preferences:', e)
  }

  // Check for cached jobs and load initial
  loadInitial()
})

const buildQuery = (off: number) => {
  const params: any = {
    limit: 15,
    offset: off
  }
  if (q.value) params.q = q.value
  if (category.value) params.category = category.value
  if (municipalityId.value) params.municipalityId = municipalityId.value
  if (urgency.value) params.urgencyLevel = urgency.value
  if (minComp.value) params.minCompensation = parseInt(minComp.value)
  if (maxComp.value) params.maxCompensation = parseInt(maxComp.value)
  if (useGeo.value && coords.value) {
    params.lat = coords.value.lat
    params.lon = coords.value.lon
    params.distanceKm = distanceKm.value
  }
  return params
}

const loadInitial = async (signal?: AbortSignal) => {
  refreshing.value = true
  error.value = null
  initialLoaded.value = true
  
  try {
    const res = await listJobs(buildQuery(0))
    jobs.value = res.data
    hasMore.value = res.hasMore
    offset.value = res.nextOffset
    offlineMode.value = false
  } catch (e: any) {
    if ((e as Error).name !== 'AbortError') {
      if (!navigator.onLine) {
  offlineMode.value = true
  error.value = 'You are offline. Reconnect to browse available jobs. Your saved applications remain available separately.'
      } else {
        offlineMode.value = false
        error.value = e?.message || 'Failed to load jobs.'
      }
    }
  } finally {
    refreshing.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  
  try {
    const res = await listJobs(buildQuery(offset.value))
    jobs.value = [...jobs.value, ...res.data]
    hasMore.value = res.hasMore
    offset.value = res.nextOffset
  } catch (e: any) {
    const msg = e?.message || 'Failed to load more.'
    toast({
      message: 'Failed: ' + msg,
      duration: 3000,
      color: 'danger'
    })
  } finally {
    loadingMore.value = false
  }
}

const detectLocation = () => {
  if (!navigator.geolocation) {
    toast({
      message: 'Geolocation unsupported',
      duration: 3000,
      color: 'danger'
    })
    return
  }

  useGeo.value = true

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      coords.value = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      }

      toast({
        message: 'Location set. Finding nearby jobs...',
        duration: 3000
      })

      loadInitial()
    },
    () => {
      useGeo.value = false
      coords.value = null

      toast({
        message: 'Location denied',
        duration: 3000,
        color: 'danger'
      })

      loadInitial()
    },
    { enableHighAccuracy: true, timeout: 8000 }
  )
}

const clearGeo = () => {
  useGeo.value = false
  coords.value = null
  loadInitial()
}

const clearFilters = () => {
  q.value = ''
  category.value = ''
  municipalityId.value = ''
  urgency.value = ''
  minComp.value = ''
  maxComp.value = ''

  useGeo.value = false
  coords.value = null

  distanceKm.value = 30

  loadInitial()
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