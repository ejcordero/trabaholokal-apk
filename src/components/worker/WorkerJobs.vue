
<template>
  <AppShell title="Find Jobs" :subtitle="subtitle">
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
            fill="outline"
            size="default"
            @click="toggleMap"
          >
            <IonIcon
              :name="mapVisible ? 'list' : 'map'"
              slot="start"
            />
            {{ mapVisible ? 'List' : 'Map' }}
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

        <!-- Nearby jobs / Location indicator -->
        <div class="rounded-lg border border-border bg-card">
          <CardContent class="p-3 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium">
                {{ useGeo ? 'Nearby jobs enabled' : 'Find jobs near you' }}
              </p>

              <p class="text-xs text-muted-foreground">
                <template v-if="useGeo && coords">
                  Showing jobs within {{ distanceKm }} km of your current location.
                </template>

                <template v-else-if="savedLocationAvailable">
                  Job distances use your saved profile location.
                </template>

                <template v-else>
                  Set your location to see distances to available jobs.
                </template>
              </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                v-if="useGeo"
                type="button"
                class="text-xs text-primary underline"
                @click="clearGeo"
              >
                Clear
              </button>

              <IonButton
                size="small"
                fill="outline"
                @click="detectLocation"
              >
                {{ useGeo ? 'Refresh GPS' : 'Use my location' }}
              </IonButton>
            </div>
          </CardContent>
        </div>

        <!-- Nearby search radius -->
        <div v-if="useGeo && coords" class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium">
              Nearby search radius
            </span>

            <span class="text-xs text-muted-foreground">
              {{ distanceKm }} km
            </span>
          </div>

          <IonRange
            v-model="distanceKm"
            :min="1"
            :max="100"
            :step="1"
            @ionChange="loadInitial"
          />
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

        <!-- Interactive Google Map -->
        <div v-if="mapVisible" class="space-y-2">
          <div
  ref="mapElement"
  class="w-full rounded-xl overflow-hidden border border-border"
  style="height: 420px; min-height: 420px; width: 100%;"
/>

          <p
            v-if="mapError"
            class="text-xs text-muted-foreground"
          >
            {{ mapError }}
          </p>

          <p class="text-xs text-muted-foreground">
            Job pins show available job locations. Select a pin to view
            job details or open directions in Google Maps.
          </p>
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
  @did-present="initializeLocationAutocomplete"
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

<!-- Search location -->
<Field
  label="Search jobs near a location"
  hint="Type a barangay, municipality, street, or landmark, then select a Google suggestion."
>
  <div
    ref="locationAutocompleteHost"
    class="w-full"
  />
</Field>

<div
  v-if="locationSearchLabel"
  class="rounded-lg border p-3 space-y-2"
>
  <p class="text-sm font-medium">
    Selected location
  </p>

  <p class="text-sm text-muted-foreground">
    {{ locationSearchLabel }}
  </p>

  <button
    type="button"
    class="text-sm font-medium text-primary"
    @click="clearGeo"
  >
    Clear selected location
  </button>
</div>

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
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch
} from 'vue'

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
  getWorkerMe,
  JOB_CATEGORIES,
  URGENCY_LEVELS,
  useToast,
  type JobWithMatch,
} from '../worker/_lib'

interface WorkerJobsProps {
  openJobId: string | null
}

const props = defineProps<WorkerJobsProps>()

const emit = defineEmits<{
  'open-job-change': [id: string | null]
}>()

const { toast } = useToast()

const locationAutocompleteHost = ref<HTMLDivElement | null>(null)

const locationSearchLabel = ref('')

let locationAutocompleteElement: any = null
let locationSelectHandler: ((event: any) => void) | null = null

// ---------------------------------------------------------------------------
// Search and filters
// ---------------------------------------------------------------------------

const q = ref('')
const category = ref('')
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

const savedCoords = ref<{
  lat: number
  lon: number
} | null>(null)

const savedLocationAvailable = ref(false)

// ---------------------------------------------------------------------------
// Google Maps state
// ---------------------------------------------------------------------------

const mapVisible = ref(false)
const mapElement = ref<HTMLDivElement | null>(null)
const mapError = ref('')

let googleMap: any = null
let infoWindow: any = null
let jobMarkers: any[] = []
let workerMarker: any = null

let googleMapsPromise: Promise<any> | null = null

// ---------------------------------------------------------------------------
// Jobs and loading states
// ---------------------------------------------------------------------------

const jobs = ref<JobWithMatch[]>([])

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

const toggleMap = async () => {
  mapVisible.value = !mapVisible.value

  if (mapVisible.value) {
    await nextTick()
    await renderMap()
  }
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

  const minimum = parseCompensation(minComp.value)
  const maximum = parseCompensation(maxComp.value)

  if (
    minimum !== undefined &&
    maximum !== undefined &&
    minimum > maximum
  ) {
    error.value =
      'Minimum compensation cannot be greater than maximum compensation.'

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
    position => {
      coords.value = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      }

      locationSearchLabel.value = ''
      useGeo.value = true
      filtersOpen.value = false

      toast({
        message: 'Location set. Finding nearby jobs...',
        duration: 3000
      })

      void loadInitial()
    },

    geoError => {
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
  locationSearchLabel.value = ''

  void loadInitial()
}

// ---------------------------------------------------------------------------
// Apply and clear filters
// ---------------------------------------------------------------------------

const applyFilters = () => {
  filtersOpen.value = false
  void loadInitial()
}

const clearFilters = () => {
  q.value = ''
  category.value = ''
  urgency.value = ''

  minComp.value = ''
  maxComp.value = ''

  useGeo.value = false
  coords.value = null
  locationSearchLabel.value = ''

  distanceKm.value = 30

  filtersOpen.value = false

  void loadInitial()
}

// ---------------------------------------------------------------------------
// Google Maps loader
// ---------------------------------------------------------------------------

const loadGoogleMaps = async (): Promise<any> => {
  const w = window as any

  if (w.google?.maps?.importLibrary) {
    await w.google.maps.importLibrary('maps')
    return w.google.maps
  }

  if (googleMapsPromise) {
    return googleMapsPromise
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured.')
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__trabahoLokalGoogleMapsReady'

    w[callbackName] = () => {
      if (w.google?.maps?.importLibrary) {
        resolve(w.google.maps)
      } else {
        reject(new Error('Google Maps failed to initialize.'))
      }
    }

    const existingScript = document.getElementById(
      'trabaholokal-google-maps'
    ) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Unable to load Google Maps.')),
        { once: true }
      )

      return
    }

    const script = document.createElement('script')

    script.id = 'trabaholokal-google-maps'
    script.async = true
    script.defer = true

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&loading=async&callback=${callbackName}`

    script.onerror = () => {
      reject(new Error('Unable to load Google Maps.'))
    }

    document.head.appendChild(script)
  })

  const maps = await googleMapsPromise

  await maps.importLibrary('maps')

  return maps
}

// ---------------------------------------------------------------------------
// Google Places location search
// ---------------------------------------------------------------------------

const initializeLocationAutocomplete = async () => {
  await nextTick()

  const host = locationAutocompleteHost.value

  if (!host) return

if (locationAutocompleteElement) {
  if (locationAutocompleteElement.parentElement !== host) {
    host.replaceChildren(locationAutocompleteElement)
  }
  return
}

  try {
    const maps = await loadGoogleMaps()
    const places = await maps.importLibrary('places')

    const autocomplete = new places.PlaceAutocompleteElement({
      includedRegionCodes: ['ph']
    })

    autocomplete.placeholder =
      'Search barangay, municipality, street, or landmark'

    autocomplete.style.width = '100%'

    locationSelectHandler = async (event: any) => {
      try {
        const prediction = event.placePrediction

        if (!prediction) return

        const place = prediction.toPlace()

        await place.fetchFields({
          fields: ['formattedAddress', 'location']
        })

        if (!place.location) {
          toast({
            message: 'The selected location has no coordinates.',
            duration: 3000,
            color: 'danger'
          })
          return
        }

        const latitude = place.location.lat()
        const longitude = place.location.lng()

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          throw new Error('Invalid location coordinates.')
        }

        coords.value = {
          lat: latitude,
          lon: longitude
        }

        locationSearchLabel.value =
          place.formattedAddress || 'Selected location'

        useGeo.value = true

        toast({
          message: 'Location selected. Searching nearby jobs...',
          duration: 2500
        })

        await loadInitial()
      } catch (error) {
        console.error('Google Places selection failed:', error)

        toast({
          message: 'Unable to use that location. Please try again.',
          duration: 3000,
          color: 'danger'
        })
      }
    }

    autocomplete.addEventListener(
      'gmp-select',
      locationSelectHandler
    )

    locationAutocompleteElement = autocomplete
    host.replaceChildren(autocomplete)
  } catch (error) {
    console.error('Failed to initialize location search:', error)

    toast({
      message: 'Unable to load Google location search.',
      duration: 3000,
      color: 'danger'
    })
  }
}

// ---------------------------------------------------------------------------
// Google Map rendering
// ---------------------------------------------------------------------------

const renderMap = async () => {
  if (!mapVisible.value) return

  await nextTick()

  const element = mapElement.value

  if (!element) return

  try {
    mapError.value = ''

    const maps = await loadGoogleMaps()

    // Only jobs with valid coordinates can have pins.
    const validJobs = jobs.value.filter(job => {
      return (
        job.latitude != null &&
        job.longitude != null &&
        Number.isFinite(Number(job.latitude)) &&
        Number.isFinite(Number(job.longitude)) &&
        Math.abs(Number(job.latitude)) <= 90 &&
        Math.abs(Number(job.longitude)) <= 180
      )
    })

    const workerLocation = coords.value ?? savedCoords.value

    const firstJob = validJobs[0]

    const center = workerLocation
  ? {
      lat: workerLocation.lat,
      lng: workerLocation.lon
    }
  : firstJob
    ? {
        lat: Number(firstJob.latitude),
        lng: Number(firstJob.longitude)
      }
    : {
        // Default map center when no saved location or mapped jobs exist.
        lat: 12.8797,
        lng: 121.7740
      }

    // The map container is recreated when switching between Map and List.
    // Recreate the map if it points to an old container.
    if (googleMap && googleMap.getDiv() !== element) {
      jobMarkers.forEach(marker => marker.setMap(null))
      jobMarkers = []

      if (workerMarker) {
        workerMarker.setMap(null)
        workerMarker = null
      }

      googleMap = null
      infoWindow = null
    }

    if (!googleMap) {
      googleMap = new maps.Map(element, {
  center,
  zoom: workerLocation || firstJob ? 12 : 6,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  gestureHandling: 'greedy'
})

      infoWindow = new maps.InfoWindow()
    } else {
      googleMap.setCenter(center)
    }

    // Remove previous job markers.
    jobMarkers.forEach(marker => marker.setMap(null))
    jobMarkers = []

    // Remove previous worker marker.
    if (workerMarker) {
      workerMarker.setMap(null)
      workerMarker = null
    }

    // Display worker's saved or manually refreshed location.
    if (workerLocation) {
      workerMarker = new maps.Marker({
        map: googleMap,
        position: {
          lat: workerLocation.lat,
          lng: workerLocation.lon
        },
        title: 'Your location',
        label: 'You'
      })
    }

    // Display job location pins.
    for (const job of validJobs) {
      const latitude = Number(job.latitude)
      const longitude = Number(job.longitude)

      const marker = new maps.Marker({
        map: googleMap,
        position: {
          lat: latitude,
          lng: longitude
        },
        title: job.title
      })

      marker.addListener('click', () => {
        // Use DOM text nodes instead of inserting job text as HTML.
        const content = document.createElement('div')

        content.style.maxWidth = '240px'

        const title = document.createElement('strong')
        title.textContent = job.title

        const location = document.createElement('p')
        location.textContent =
          job.locationText ||
          [job.barangay, job.municipalityName]
            .filter(Boolean)
            .join(', ') ||
          'Location not specified'

        const distance = document.createElement('p')
        distance.textContent =
          job.distanceKm != null
            ? `${Number(job.distanceKm).toFixed(1)} km away`
            : 'Distance unavailable'

        const detailsButton = document.createElement('button')
        detailsButton.type = 'button'
        detailsButton.textContent = 'View job details'
        detailsButton.style.marginTop = '8px'
        detailsButton.style.cursor = 'pointer'

        detailsButton.addEventListener('click', () => {
          handleOpenJob(job.id)
          infoWindow.close()
        })

        const directionsLink = document.createElement('a')

        directionsLink.href =
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`

        directionsLink.target = '_blank'
        directionsLink.rel = 'noopener noreferrer'
        directionsLink.textContent = 'Open in Google Maps'
        directionsLink.style.display = 'block'
        directionsLink.style.marginTop = '8px'

        content.append(
          title,
          location,
          distance,
          detailsButton,
          directionsLink
        )

        infoWindow.setContent(content)

        infoWindow.open({
          map: googleMap,
          anchor: marker
        })
      })

      jobMarkers.push(marker)
    }

    if (validJobs.length === 0) {
      mapError.value =
        'No jobs with mapped coordinates are available in the currently loaded results.'
    }

  } catch (e: any) {
    console.error('Google Maps error:', e)

    mapError.value =
      e?.message || 'Unable to display Google Maps.'
  }
}

// Refresh the map when its visibility, jobs, or location changes.
watch(
  [mapVisible, jobs, coords, savedCoords],
  () => {
    if (mapVisible.value) {
      void renderMap()
    }
  },
  { deep: true }
)

// ---------------------------------------------------------------------------
// Initial setup
// ---------------------------------------------------------------------------


onMounted(async () => {

  // Load the worker's saved location and preferred search distance.
  try {
    const profile = await getWorkerMe()

    const latitude = Number(profile?.latitude)
    const longitude = Number(profile?.longitude)

    savedLocationAvailable.value =
      profile?.latitude != null &&
      profile?.longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)

    if (savedLocationAvailable.value) {
      savedCoords.value = {
        lat: latitude,
        lon: longitude
      }
    }

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

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

onBeforeUnmount(() => {
  // Clean up Google Places autocomplete.
  if (locationAutocompleteElement && locationSelectHandler) {
    locationAutocompleteElement.removeEventListener(
      'gmp-select',
      locationSelectHandler
    )
  }

  if (locationAutocompleteElement) {
    locationAutocompleteElement.remove()
    locationAutocompleteElement = null
  }

  locationSelectHandler = null

  // Clean up Google Maps job markers.
  jobMarkers.forEach(marker => marker.setMap(null))
  jobMarkers = []

  // Clean up worker marker.
  if (workerMarker) {
    workerMarker.setMap(null)
    workerMarker = null
  }

  // Clean up map information window.
  if (infoWindow) {
    infoWindow.close()
    infoWindow = null
  }

  googleMap = null
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
