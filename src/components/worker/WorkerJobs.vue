
<template>
  <AppShell
    title="Find Jobs"
    :subtitle="subtitle"
  >
    <PullRefresh @refresh="loadInitial" :refreshing="refreshing">
      <div class="space-y-3">

        <!-- Search and actions -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <IonIcon
              name="search"
              class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />

            <IonInput
              v-model="q"
              placeholder="Search jobs..."
              class="pl-8"
              @keyup.enter="loadInitial"
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

          <IonButton
            fill="clear"
            size="default"
            :disabled="refreshing"
            @click="loadInitial"
          >
            <IonIcon name="refresh" />
          </IonButton>
        </div>

        <!-- Location indicator -->
        <div
          v-if="useGeo && coords"
          class="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg"
        >
          <CardContent class="p-2 text-xs flex items-center justify-between">
            <span class="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
              <IonIcon name="location" />
              Within {{ distanceKm }} km of your location
            </span>

            <button
              type="button"
              class="text-emerald-700 underline"
              @click="clearGeo"
            >
              Clear
            </button>
          </CardContent>
        </div>

        <!-- Offline indicator -->
        <div
          v-if="offlineMode && jobs.length > 0"
          class="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 rounded-lg"
        >
          <CardContent class="p-2.5 text-xs flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <IonIcon name="warning" class="h-4 w-4 shrink-0" />
            <span>
              You are offline. Showing the jobs already loaded on this screen.
              Reconnect to refresh job listings.
            </span>
          </CardContent>
        </div>

        <!-- Initial loading -->
        <div v-if="!initialLoaded && refreshing">
          <LoadingCards :count="4" />
        </div>

        <!-- Error without previously loaded jobs -->
        <div v-else-if="error && jobs.length === 0">
          <ErrorRetry
            :message="error"
            @retry="loadInitial"
          />
        </div>

        <!-- Empty state -->
        <div v-else-if="jobs.length === 0 && initialLoaded">
          <EmptyState
            icon="briefcase"
            title="No jobs found"
            description="Try adjusting your filters or search query."
          >
            <template #action>
              <IonButton
                v-if="activeFilterCount > 0 || q.trim()"
                size="small"
                fill="outline"
                @click="clearFilters"
              >
                Clear filters
              </IonButton>
            </template>
          </EmptyState>
        </div>

        <!-- Job list -->
        <div v-else-if="jobs.length > 0" class="space-y-2">

          <!-- Refresh error while preserving existing results -->
          <div
            v-if="error"
            class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
          >
            {{ error }}
          </div>

          <JobCard
            v-for="job in jobs"
            :key="job.id"
            :job="job"
            :match="job.match"
            @open="handleOpenJob"
          />

          <!-- Pagination -->
          <IonButton
            v-if="hasMore"
            fill="outline"
            expand="block"
            :disabled="loadingMore || refreshing"
            @click="loadMore"
          >
            <IonIcon
              v-if="loadingMore"
              name="refresh"
              slot="start"
            />
            {{ loadingMore ? 'Loading...' : 'Load more' }}
          </IonButton>

        </div>
      </div>
    </PullRefresh>

    <!-- Filter sheet -->
    <IonModal
      :is-open="filtersOpen"
      :breakpoints="[0, 0.75, 1]"
      :initial-breakpoint="0.75"
      @will-dismiss="filtersOpen = false"
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Filters</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent class="ion-padding">
        <div class="space-y-4">

          <!-- Category -->
          <Field label="Category">
            <FormSelect
              :value="category"
              @update:value="category = $event"
              :options="[
                { value: '', label: 'All categories' },
                ...JOB_CATEGORIES.map(c => ({
                  value: c.value,
                  label: c.label
                }))
              ]"
            />
          </Field>

          <!-- Municipality -->
          <Field label="Municipality">
            <FormSelect
              :value="municipalityId"
              @update:value="municipalityId = $event"
              :options="[
                { value: '', label: 'All municipalities' },
                ...municipalities.map(m => ({
                  value: m.id,
                  label: m.name
                }))
              ]"
            />
          </Field>

          <!-- Urgency -->
          <Field label="Urgency">
            <FormSelect
              :value="urgency"
              @update:value="urgency = $event"
              :options="[
                { value: '', label: 'Any urgency' },
                ...URGENCY_LEVELS.map(u => ({
                  value: u.value,
                  label: u.label
                }))
              ]"
            />
          </Field>

          <Separator />

          <!-- Distance -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-medium">
  Sort by distance
</p>

              <button
                type="button"
                @click="useGeo ? clearGeo() : detectLocation()"
                :class="useGeo ? 'text-emerald-700' : 'text-primary'"
                class="text-xs font-medium"
              >
                {{ useGeo ? 'On' : 'Use my location' }}
              </button>
            </div>

            <div v-if="useGeo" class="space-y-2">
              <p class="text-xs text-muted-foreground">
                Within {{ distanceKm }} km
              </p>

              <IonRange
                v-model="distanceKm"
                :min="1"
                :max="100"
                :step="1"
              />
            </div>
          </div>

          <Separator />

          <!-- Minimum compensation -->
          <Field label="Minimum compensation (₱)">
            <IonInput
              v-model="minComp"
              type="number"
              inputmode="numeric"
              min="0"
              placeholder="e.g. 500"
            />
          </Field>

          <!-- Maximum compensation -->
          <Field label="Maximum compensation (₱)">
            <IonInput
              v-model="maxComp"
              type="number"
              inputmode="numeric"
              min="0"
              placeholder="e.g. 2000"
            />
          </Field>

        </div>
      </IonContent>

      <IonFooter>
        <div class="ion-padding flex gap-2">
          <IonButton
            expand="block"
            fill="outline"
            @click="clearFilters"
          >
            Clear all
          </IonButton>

          <IonButton
            expand="block"
            @click="applyFilters"
          >
            Apply filters
          </IonButton>
        </div>
      </IonFooter>
    </IonModal>

    <!-- Job detail sheet -->
    <JobDetailSheet
      :job-id="props.openJobId"
      :job="jobs.find(j => j.id === props.openJobId) || null"
      @open-change="handleOpenJob"
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
  IonHeader,
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

import JobDetailSheet from './JobDetailSheet.vue'

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

const props = defineProps<WorkerJobsProps>()

const emit = defineEmits<{
  'open-job-change': [id: string | null]
}>()

const { toast } = useToast()

// ---------------------------------------------------------------------------
// Search and filters
// ---------------------------------------------------------------------------

const q = ref('')
const category = ref('')
const municipalityId = ref('')
const urgency = ref('')

const minComp = ref<string | number>('')
const maxComp = ref<string | number>('')

const filtersOpen = ref(false)

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

const distanceKm = ref(30)
const useGeo = ref(false)

const coords = ref<{
  lat: number
  lon: number
} | null>(null)

// ---------------------------------------------------------------------------
// Jobs and loading states
// ---------------------------------------------------------------------------

const jobs = ref<JobWithMatch[]>([])
const municipalities = ref<MunicipalityDTO[]>([])

const loadingMore = ref(false)
const refreshing = ref(false)
const initialLoaded = ref(false)

const hasMore = ref(false)
const offset = ref(0)

const error = ref<string | null>(null)
const offlineMode = ref(false)

// Prevent an older request from overwriting newer search results.
let latestRequestId = 0

// ---------------------------------------------------------------------------
// Computed values
// ---------------------------------------------------------------------------

const activeFilterCount = computed(() => {
  return [
    category.value,
    municipalityId.value,
    urgency.value,
    minComp.value,
    maxComp.value
  ].filter(value => String(value).trim() !== '').length
  + (useGeo.value ? 1 : 0)
})

const subtitle = computed(() => {
  const count = jobs.value.length

  let result = `${count} job${count === 1 ? '' : 's'}`

  if (activeFilterCount.value > 0) {
    result += ` · ${activeFilterCount.value} filter${activeFilterCount.value === 1 ? '' : 's'}`
  }

  return result
})

// ---------------------------------------------------------------------------
// Event handling
// ---------------------------------------------------------------------------

const handleOpenJob = (id: string | null) => {
  emit('open-job-change', id)
}

// ---------------------------------------------------------------------------
// Compensation parsing
// ---------------------------------------------------------------------------

const parseCompensation = (
  value: string | number
): number | undefined => {
  const normalized = String(value).replace(/[^0-9]/g, '')

  if (!normalized) return undefined

  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : undefined
}

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

const buildQuery = (requestOffset: number) => {
  const params: Record<string, any> = {
    limit: 15,
    offset: requestOffset
  }

  const search = q.value.trim()

  if (search) {
    params.q = search
  }

  if (category.value) {
    params.category = category.value
  }

  if (municipalityId.value) {
    params.municipalityId = municipalityId.value
  }

  if (urgency.value) {
    params.urgencyLevel = urgency.value
  }

  const minimum = parseCompensation(minComp.value)
  const maximum = parseCompensation(maxComp.value)

  if (minimum !== undefined) {
    params.minCompensation = minimum
  }

  if (maximum !== undefined) {
    params.maxCompensation = maximum
  }

  if (useGeo.value && coords.value) {
    params.lat = coords.value.lat
    params.lon = coords.value.lon
    params.distanceKm = distanceKm.value
  }

  return params
}

// ---------------------------------------------------------------------------
// Load initial jobs / refresh
// ---------------------------------------------------------------------------

const loadInitial = async () => {
  const requestId = ++latestRequestId

  refreshing.value = true
  error.value = null

  if (!initialLoaded.value) {
    jobs.value = []
  }

  // Validate compensation range.
  const minimum = parseCompensation(minComp.value)
  const maximum = parseCompensation(maxComp.value)

  if (
    minimum !== undefined &&
    maximum !== undefined &&
    minimum > maximum
  ) {
    error.value = 'Minimum compensation cannot be greater than maximum compensation.'
    refreshing.value = false
    initialLoaded.value = true

    toast({
      message: error.value,
      duration: 3000,
      color: 'warning'
    })

    return
  }

  try {
    const res = await listJobs(buildQuery(0))

    // Ignore an outdated response.
    if (requestId !== latestRequestId) return

    jobs.value = res.data
    hasMore.value = res.hasMore
    offset.value = res.nextOffset

    offlineMode.value = false
    error.value = null

  } catch (e: any) {
    if (requestId !== latestRequestId) return

    if (!navigator.onLine) {
      offlineMode.value = true

      error.value = jobs.value.length > 0
        ? 'Unable to refresh jobs while offline.'
        : 'You are offline. Reconnect to browse available jobs.'
    } else {
      offlineMode.value = false
      error.value = e?.message || 'Failed to load jobs.'
    }

    console.error('Failed to load jobs:', e)

  } finally {
    if (requestId === latestRequestId) {
      refreshing.value = false
      initialLoaded.value = true
    }
  }
}

// ---------------------------------------------------------------------------
// Load more jobs
// ---------------------------------------------------------------------------

const loadMore = async () => {
  if (
    !hasMore.value ||
    loadingMore.value ||
    refreshing.value
  ) {
    return
  }

  if (!navigator.onLine) {
    toast({
      message: 'Reconnect to load more jobs.',
      duration: 3000,
      color: 'warning'
    })

    return
  }

  loadingMore.value = true

  try {
    const res = await listJobs(buildQuery(offset.value))

    // Avoid duplicate jobs if the API returns overlapping records.
    const existingIds = new Set(jobs.value.map(job => job.id))

    const newJobs = res.data.filter(
      job => !existingIds.has(job.id)
    )

    jobs.value = [...jobs.value, ...newJobs]

    hasMore.value = res.hasMore
    offset.value = res.nextOffset

  } catch (e: any) {
    console.error('Failed to load more jobs:', e)

    toast({
      message: e?.message || 'Failed to load more jobs.',
      duration: 3000,
      color: 'danger'
    })

  } finally {
    loadingMore.value = false
  }
}

// ---------------------------------------------------------------------------
// Geolocation
// ---------------------------------------------------------------------------

const detectLocation = () => {
  if (!navigator.geolocation) {
    toast({
      message: 'Geolocation is not supported on this device.',
      duration: 3000,
      color: 'danger'
    })

    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      coords.value = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      }

      useGeo.value = true
      filtersOpen.value = false

      toast({
        message: 'Location set. Finding nearby jobs...',
        duration: 3000
      })

      loadInitial()
    },

    (geoError) => {
      useGeo.value = false
      coords.value = null

      let message = 'Unable to access your location.'

      if (geoError.code === geoError.PERMISSION_DENIED) {
        message = 'Location permission was denied.'
      } else if (geoError.code === geoError.TIMEOUT) {
        message = 'Location request timed out.'
      }

      toast({
        message,
        duration: 3000,
        color: 'danger'
      })
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  )
}

const clearGeo = () => {
  useGeo.value = false
  coords.value = null

  loadInitial()
}

// ---------------------------------------------------------------------------
// Apply and clear filters
// ---------------------------------------------------------------------------

const applyFilters = () => {
  filtersOpen.value = false
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

  filtersOpen.value = false

  loadInitial()
}

// ---------------------------------------------------------------------------
// Initial setup
// ---------------------------------------------------------------------------

onMounted(async () => {
  // Load municipality options.
  try {
    municipalities.value = await getMunicipalities()
  } catch (e) {
    console.error('Failed to load municipalities:', e)
  }

  // Load the worker's saved preferred search distance.
  try {
    const profile = await getWorkerMe()
    const savedDistance = Number(profile?.preferredDistanceKm)

    if (
      Number.isFinite(savedDistance) &&
      savedDistance > 0
    ) {
      distanceKm.value = Math.min(
        100,
        Math.max(1, Math.round(savedDistance))
      )
    }
  } catch (e) {
    console.error('Failed to load worker preferences:', e)
  }

  // Load the first page of jobs.
  await loadInitial()
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
