
<template>
<AppShell title="Edit Profile" back @back="emit('back')">
    <div class="space-y-4 pb-6">
      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <IonCard v-for="n in 3" :key="n">
          <IonCardContent>
            <IonSkeletonText animated style="width: 60%; height: 18px" />
            <IonSkeletonText animated style="width: 100%; height: 40px" />
            <IonSkeletonText animated style="width: 100%; height: 40px" />
          </IonCardContent>
        </IonCard>
      </div>

      <template v-else>
        <!-- Personal information -->
        <IonCard>
          <IonCardContent class="space-y-4">
            <div>
              <h2 class="text-base font-semibold">Personal Information</h2>
              <p class="text-sm text-medium">
                Keep your contact and profile information updated.
              </p>
            </div>

            <IonInput
              v-model="form.fullName"
              label="Full Name"
              label-placement="stacked"
              placeholder="Enter your full name"
              fill="outline"
              :maxlength="150"
            />

            <IonInput
              v-model="form.mobileNumber"
              label="Mobile Number"
              label-placement="stacked"
              placeholder="e.g. 09XXXXXXXXX"
              type="tel"
              fill="outline"
              :maxlength="30"
            />

            <IonTextarea
              v-model="form.bio"
              label="About Me"
              label-placement="stacked"
              placeholder="Tell employers about yourself, your experience, and strengths."
              fill="outline"
              :auto-grow="true"
              :rows="3"
              :maxlength="1000"
            />

            <IonTextarea
              v-model="form.education"
              label="Education"
              label-placement="stacked"
              placeholder="e.g. High School Graduate, TESDA NC II, College Level"
              fill="outline"
              :auto-grow="true"
              :rows="2"
              :maxlength="500"
            />
          </IonCardContent>
        </IonCard>

        <!-- Location -->
        <IonCard>
          <IonCardContent class="space-y-4">
            <div>
              <h2 class="text-base font-semibold">Location</h2>
              <p class="text-sm text-medium">
                Help employers find work opportunities near your location.
              </p>
            </div>

            <!-- Google Places autocomplete -->
            <div>
              <label class="text-sm font-medium">
                Search for a location
              </label>

              <div
                ref="autocompleteHost"
                class="w-full mt-2"
              />

              <p class="text-xs text-medium mt-2">
                Search for a barangay, municipality, landmark, or address.
                Select a Google suggestion to fill in your location details.
              </p>
            </div>

            <!-- Municipality -->
            <IonInput
              v-model="form.municipalityName"
              label="Municipality"
              label-placement="stacked"
              placeholder="Enter municipality or city"
              fill="outline"
              @ionInput="syncMunicipalityId"
            />

            <!-- Barangay -->
            <IonInput
              v-model="form.barangay"
              label="Barangay"
              label-placement="stacked"
              placeholder="Enter your barangay"
              fill="outline"
              :maxlength="100"
            />

            <!-- Current coordinates -->
            <div class="space-y-2">
              <IonButton
                expand="block"
                fill="outline"
                :disabled="locating || saving"
                @click="useMyLocation"
              >
                <IonSpinner
                  v-if="locating"
                  name="crescent"
                  class="mr-2"
                />

                <IonIcon
                  v-else
                  :icon="locateOutline"
                  slot="start"
                />

                {{
                  locating
                    ? 'Getting location...'
                    : form.latitude !== null
                      ? 'Update My Location'
                      : 'Use My Current Location'
                }}
              </IonButton>

              <div
                v-if="
                  form.latitude !== null &&
                  form.longitude !== null
                "
                class="text-xs text-medium"
              >
                <IonIcon
                  :icon="checkmarkCircleOutline"
                  color="success"
                  class="align-middle"
                />

                <span class="ml-1">
                  Coordinates captured:
                  {{ form.latitude.toFixed(6) }},
                  {{ form.longitude.toFixed(6) }}
                </span>
              </div>

              <p v-else class="text-xs text-medium">
                No coordinates saved yet. Search for a location or
                manually capture your current location.
              </p>
            </div>

            <p class="text-xs text-medium">
              Your location is used to help match you with nearby
              opportunities. Your precise coordinates are not displayed
              to employers.
            </p>
          </IonCardContent>
        </IonCard>

        <!-- Job preferences -->
        <IonCard>
          <IonCardContent class="space-y-4">
            <div>
              <h2 class="text-base font-semibold">Job Preferences</h2>
              <p class="text-sm text-medium">
                Select the types of work you are interested in.
              </p>
            </div>

            <IonSelect
              v-model="form.preferredCategories"
              label="Preferred Job Categories"
              label-placement="stacked"
              placeholder="Select job categories"
              interface="alert"
              :multiple="true"
              fill="outline"
            >
              <IonSelectOption
                v-for="category in JOB_CATEGORIES"
                :key="category.value"
                :value="category.value"
              >
                {{ category.label }}
              </IonSelectOption>
            </IonSelect>

            <p class="text-xs text-medium">
              You can select more than one category. These preferences do not
              prevent you from browsing other jobs.
            </p>

            <IonSelect
              v-model="form.preferredDistanceKm"
              label="Preferred Job Distance"
              label-placement="stacked"
              interface="popover"
              fill="outline"
            >
              <IonSelectOption :value="5">Within 5 km</IonSelectOption>
              <IonSelectOption :value="10">Within 10 km</IonSelectOption>
              <IonSelectOption :value="20">Within 20 km</IonSelectOption>
              <IonSelectOption :value="30">Within 30 km</IonSelectOption>
              <IonSelectOption :value="50">Within 50 km</IonSelectOption>
              <IonSelectOption :value="100">Within 100 km</IonSelectOption>
            </IonSelect>

            <p class="text-xs text-medium">
              This is your preferred search distance, not a guarantee of
              travel distance or job availability.
            </p>
          </IonCardContent>
        </IonCard>

        <!-- Availability -->
        <IonCard>
          <IonCardContent>
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <h2 class="text-base font-semibold">Available for Work</h2>
                <p class="text-sm text-medium">
                  Let employers know whether you are currently open to work.
                </p>
              </div>

              <IonToggle
                v-model="form.available"
                aria-label="Available for work"
              />
            </div>

            <div class="mt-3">
              <IonBadge :color="form.available ? 'success' : 'medium'">
                {{ form.available ? 'Currently Available' : 'Not Available' }}
              </IonBadge>
            </div>
          </IonCardContent>
        </IonCard>

        <!-- Work preferences -->
        <IonCard>
          <IonCardContent class="space-y-4">
            <div>
              <h2 class="text-base font-semibold">Work Preferences</h2>
              <p class="text-sm text-medium">
                Tell employers what kind of work arrangements suit you.
                You may leave any field unanswered.
              </p>
            </div>

            <IonSelect
              v-model="form.employmentTypes"
              label="Preferred Employment Types"
              label-placement="stacked"
              placeholder="Select employment types"
              interface="alert"
              :multiple="true"
              fill="outline"
            >
              <IonSelectOption
                v-for="option in EMPLOYMENT_TYPE_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </IonSelectOption>
            </IonSelect>

            <IonSelect
              v-model="form.workSchedules"
              label="Preferred Work Schedules"
              label-placement="stacked"
              placeholder="Select schedules"
              interface="alert"
              :multiple="true"
              fill="outline"
            >
              <IonSelectOption
                v-for="option in WORK_SCHEDULE_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </IonSelectOption>
            </IonSelect>

            <IonSelect
              v-model="form.workArrangements"
              label="Preferred Work Arrangements"
              label-placement="stacked"
              placeholder="Select arrangements"
              interface="alert"
              :multiple="true"
              fill="outline"
            >
              <IonSelectOption
                v-for="option in WORK_ARRANGEMENT_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </IonSelectOption>
            </IonSelect>

            <div>
              <label class="text-sm font-medium">Earliest Start Date</label>
              <IonInput
                v-model="form.earliestStartDate"
                type="date"
                fill="outline"
                class="mt-2"
              />
            </div>

            <IonSelect
              v-model="form.willingToRelocate"
              label="Willing to Relocate?"
              label-placement="stacked"
              placeholder="No preference specified"
              interface="popover"
              fill="outline"
            >
              <IonSelectOption value="yes">Yes</IonSelectOption>
              <IonSelectOption value="no">No</IonSelectOption>
            </IonSelect>

            <IonSelect
              v-model="form.willingToLiveIn"
              label="Willing to Work Live-in?"
              label-placement="stacked"
              placeholder="No preference specified"
              interface="popover"
              fill="outline"
            >
              <IonSelectOption value="yes">Yes</IonSelectOption>
              <IonSelectOption value="no">No</IonSelectOption>
            </IonSelect>

            <div>
              <h3 class="text-sm font-medium">
                Expected Minimum Compensation
              </h3>

              <p class="text-xs text-medium mb-2">
                Optional. Enter your preferred minimum pay.
              </p>

              <IonInput
                v-model="form.expectedMinCompensation"
                type="number"
                min="0"
                placeholder="e.g. 500"
                fill="outline"
              />

              <IonSelect
                v-model="form.compensationType"
                label="Compensation Basis"
                label-placement="stacked"
                placeholder="Select pay basis"
                interface="popover"
                fill="outline"
              >
                <IonSelectOption
                  v-for="option in COMPENSATION_TYPE_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </IonSelectOption>
              </IonSelect>
            </div>
          </IonCardContent>
        </IonCard>

        <!-- Save -->
        <IonButton
          expand="block"
          :disabled="saving || !form.fullName.trim()"
          @click="saveProfile"
        >
          <IonSpinner
            v-if="saving"
            name="crescent"
            class="mr-2"
          />

          <IonIcon
            v-else
            :icon="saveOutline"
            slot="start"
          />

          {{ saving ? 'Saving Profile...' : 'Save Changes' }}
        </IonButton>

        <IonButton
          expand="block"
          fill="clear"
          color="medium"
          :disabled="saving"
          @click="emit('back')"
        >
          Cancel
        </IonButton>
      </template>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue'

import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonSpinner,
  IonTextarea,
  IonToggle,
} from '@ionic/vue'

import {
  saveOutline,
  locateOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons'

import type {
  MunicipalityDTO,
  WorkerProfileDTO,
} from './_lib'

import {
  AppShell,
} from './_ui'

import {
  JOB_CATEGORIES,
  getWorkerMe,
  getMunicipalities,
  updateWorkerMe,
  getWorkerWorkPreferences,
  saveWorkerWorkPreferences,
  useToast,
} from './_lib'

const emit = defineEmits<{
  (event: 'back'): void
}>()

const { toast } = useToast()

// --------------------------------------------------
// OPTIONS
// --------------------------------------------------

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'contractual', label: 'Contractual' },
  { value: 'job_order', label: 'Job Order (JO)' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const WORK_SCHEDULE_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'flexible', label: 'Flexible schedule' },
]

const WORK_ARRANGEMENT_OPTIONS = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

const COMPENSATION_TYPE_OPTIONS = [
  { value: 'daily', label: 'Per Day' },
  { value: 'weekly', label: 'Per Week' },
  { value: 'monthly', label: 'Per Month' },
  { value: 'fixed', label: 'Fixed / Project' },
  { value: 'hourly', label: 'Per Hour' },
]

// --------------------------------------------------
// STATE
// --------------------------------------------------

const loading = ref(true)
const saving = ref(false)
const locating = ref(false)

const municipalities = ref<MunicipalityDTO[]>([])
const profile = ref<WorkerProfileDTO | null>(null)

const autocompleteHost = ref<HTMLDivElement | null>(null)

const form = reactive({
  fullName: '',
  mobileNumber: '',
  bio: '',
  education: '',

  municipalityId: '',
  municipalityName: '',
  barangay: '',

  latitude: null as number | null,
  longitude: null as number | null,

  preferredCategories: [] as string[],
  preferredDistanceKm: 30,
  available: false,

  employmentTypes: [] as string[],
  workSchedules: [] as string[],
  workArrangements: [] as string[],

  earliestStartDate: '',

  willingToRelocate: '' as '' | 'yes' | 'no',
  willingToLiveIn: '' as '' | 'yes' | 'no',

  expectedMinCompensation: '',
  compensationType: '',
})

// --------------------------------------------------
// MUNICIPALITY MATCHING
// --------------------------------------------------

function syncMunicipalityId(): void {
  const typedName = form.municipalityName.trim().toLowerCase()

  const matched = municipalities.value.find(
    (municipality) =>
      municipality.name.trim().toLowerCase() === typedName
  )

  form.municipalityId = matched?.id ?? ''
}

// --------------------------------------------------
// LOAD PROFILE
// --------------------------------------------------

async function loadProfile(): Promise<void> {
  loading.value = true

  try {
    const [worker, municipalityList, preferences] = await Promise.all([
      getWorkerMe(),
      getMunicipalities(),
      getWorkerWorkPreferences(),
    ])

    profile.value = worker
    municipalities.value = municipalityList

    form.fullName = worker.fullName ?? ''
    form.mobileNumber = worker.mobileNumber ?? ''
    form.bio = worker.bio ?? ''
    form.education = worker.education ?? ''

    form.municipalityId = worker.municipalityId ?? ''
    form.municipalityName = worker.municipalityName ?? ''
    form.barangay = worker.barangay ?? ''

    form.latitude = worker.latitude ?? null
    form.longitude = worker.longitude ?? null

    form.preferredCategories = [
      ...(worker.preferredCategories ?? []),
    ]

    const distance = Number(worker.preferredDistanceKm)

    form.preferredDistanceKm =
      [5, 10, 20, 30, 50, 100].includes(distance)
        ? distance
        : 30

    form.available = worker.available ?? false

    if (preferences) {
      form.employmentTypes = [...preferences.employmentTypes]
      form.workSchedules = [...preferences.workSchedules]
      form.workArrangements = [...preferences.workArrangements]

      form.earliestStartDate =
        preferences.earliestStartDate ?? ''

      form.willingToRelocate =
        preferences.willingToRelocate == null
          ? ''
          : preferences.willingToRelocate
            ? 'yes'
            : 'no'

      form.willingToLiveIn =
        preferences.willingToLiveIn == null
          ? ''
          : preferences.willingToLiveIn
            ? 'yes'
            : 'no'

      form.expectedMinCompensation =
        preferences.expectedMinCompensation == null
          ? ''
          : String(preferences.expectedMinCompensation)

      form.compensationType =
        preferences.compensationType ?? ''
    }
  } catch (error: any) {
    toast({
      message: error?.message || 'Failed to load your profile.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    loading.value = false
  }
}

// --------------------------------------------------
// GOOGLE PLACES AUTOCOMPLETE
// --------------------------------------------------

let autocompleteElement: HTMLElement | null = null

let placeSelectHandler: ((event: Event) => void) | null = null

let googlePlacesPromise: Promise<any> | null = null

async function loadGooglePlaces(): Promise<any> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error(
      'Google Maps API key is missing. Check your .env file.'
    )
  }

  const googleWindow = window as any

  // Reuse Google Maps if it has already loaded.
  if (googleWindow.google?.maps?.importLibrary) {
    return googleWindow.google.maps.importLibrary('places')
  }

  // Avoid loading the Google script multiple times.
  if (googlePlacesPromise) {
    return googlePlacesPromise
  }

  googlePlacesPromise = new Promise<any>((resolve, reject) => {
    const script = document.createElement('script')

    const callbackName = '__trabahoLokalGoogleMapsReady'

    script.id = 'trabaholokal-google-maps'
    script.async = true
    script.defer = true

    googleWindow[callbackName] = async () => {
      try {
        const places =
          await googleWindow.google.maps.importLibrary('places')

        delete googleWindow[callbackName]

        resolve(places)
      } catch (error) {
        delete googleWindow[callbackName]
        reject(error)
      }
    }

    script.onerror = () => {
      delete googleWindow[callbackName]

      googlePlacesPromise = null

      reject(
        new Error(
          'Google Maps could not load. Check your API key, billing, and API restrictions.'
        )
      )
    }

    script.src =
      'https://maps.googleapis.com/maps/api/js' +
      `?key=${encodeURIComponent(apiKey)}` +
      '&v=weekly' +
      '&loading=async' +
      `&callback=${callbackName}`

    document.head.appendChild(script)
  })

  return googlePlacesPromise
}

function getAddressComponent(
  components: any[],
  ...types: string[]
): string {
  const component = components.find((item: any) =>
    types.some((type) => item.types.includes(type))
  )

  return component?.longText ?? ''
}

async function initializeGoogleAutocomplete(): Promise<void> {
  try {
    const places = await loadGooglePlaces()

    // The page may have been closed while Google was loading.
    if (!autocompleteHost.value) return

    const element = new places.PlaceAutocompleteElement({
      includedRegionCodes: ['ph'],
    })

    element.style.width = '100%'

    element.setAttribute(
      'placeholder',
      'Search barangay, municipality, or address'
    )

    placeSelectHandler = async (event: Event) => {
      try {
        const prediction = (event as any).placePrediction

        if (!prediction) return

        const place = prediction.toPlace()

        await place.fetchFields({
          fields: [
            'addressComponents',
            'formattedAddress',
            'location',
          ],
        })

        const components = place.addressComponents ?? []

        // Municipality or city.
        form.municipalityName = getAddressComponent(
          components,
          'locality',
          'administrative_area_level_3',
          'postal_town'
        )

        // Barangay or local district, when available.
        form.barangay = getAddressComponent(
          components,
          'sublocality_level_1',
          'sublocality',
          'neighborhood',
          'administrative_area_level_4'
        )

        // Match the selected municipality to Supabase.
        syncMunicipalityId()

        // Save selected place coordinates.
        if (place.location) {
          form.latitude = place.location.lat()
          form.longitude = place.location.lng()
        } else {
          form.latitude = null
          form.longitude = null
        }

        toast({
          message: 'Location selected. Remember to save your profile.',
          duration: 3000,
          color: 'success',
        })
      } catch (error: any) {
        toast({
          message:
            error?.message ||
            'Could not retrieve the selected location.',
          duration: 3000,
          color: 'danger',
        })
      }
    }

    element.addEventListener(
      'gmp-select',
      placeSelectHandler
    )

    autocompleteHost.value.replaceChildren(element)

    autocompleteElement = element
  } catch (error: any) {
    console.error(
      'Google Places initialization failed:',
      error
    )

    toast({
      message:
        error?.message ||
        'Could not initialize Google Places.',
      duration: 3000,
      color: 'danger',
    })
  }
}

// --------------------------------------------------
// GPS LOCATION
// --------------------------------------------------

async function useMyLocation(): Promise<void> {
  if (!navigator.geolocation) {
    toast({
      message: 'Location is not supported by this browser.',
      duration: 3000,
      color: 'danger',
    })
    return
  }

  locating.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.latitude = position.coords.latitude
      form.longitude = position.coords.longitude

      locating.value = false

      toast({
        message: 'Location captured. Remember to save your profile.',
        duration: 3000,
        color: 'success',
      })
    },
    (error) => {
      locating.value = false

      const message =
        error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Please allow location access in your browser.'
          : error.code === error.TIMEOUT
            ? 'Location request timed out. Please try again.'
            : 'Unable to get your current location.'

      toast({
        message,
        duration: 3000,
        color: 'danger',
      })
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  )
}

// --------------------------------------------------
// SAVE PROFILE
// --------------------------------------------------

async function saveProfile(): Promise<void> {
  if (saving.value) return

  const fullName = form.fullName.trim()
  const mobileNumber = form.mobileNumber.trim()
  const barangay = form.barangay.trim()
  const municipalityName = form.municipalityName.trim()

  if (!fullName) {
    toast({
      message: 'Please enter your full name.',
      duration: 3000,
      color: 'warning',
    })
    return
  }

  if (fullName.length > 150 || mobileNumber.length > 30) {
    toast({
      message: 'Please check the length of your name or mobile number.',
      duration: 3000,
      color: 'warning',
    })
    return
  }

  if (form.bio.length > 1000 || form.education.length > 500) {
    toast({
      message: 'Some profile information is too long.',
      duration: 3000,
      color: 'warning',
    })
    return
  }

  if (
    !Number.isInteger(form.preferredDistanceKm) ||
    form.preferredDistanceKm < 1
  ) {
    toast({
      message: 'Please select a valid preferred distance.',
      duration: 3000,
      color: 'warning',
    })
    return
  }

  const compensationText = form.expectedMinCompensation.trim()

  if (
    compensationText !== '' &&
    (
      !Number.isFinite(Number(compensationText)) ||
      Number(compensationText) < 0
    )
  ) {
    toast({
      message: 'Please enter a valid non-negative expected compensation.',
      duration: 3000,
      color: 'warning',
    })
    return
  }

  if (compensationText !== '' && !form.compensationType) {
    toast({
      message: 'Please select a compensation basis.',
      duration: 3000,
      color: 'warning',
    })
    return
  }

  saving.value = true

  try {
    // Save main worker profile, including location.
    const updated = await updateWorkerMe({
      fullName,
      mobileNumber,
      bio: form.bio.trim(),
      education: form.education.trim(),

      municipalityId: form.municipalityId || null,
      municipalityName: municipalityName || null,
      barangay,

      latitude: form.latitude,
      longitude: form.longitude,

      preferredCategories: form.preferredCategories,
      preferredDistanceKm: form.preferredDistanceKm,
      available: form.available,
    })

    // Save work preferences.
    await saveWorkerWorkPreferences({
      employmentTypes: form.employmentTypes,
      workSchedules: form.workSchedules,
      workArrangements: form.workArrangements,

      earliestStartDate: form.earliestStartDate || null,

      willingToRelocate:
        form.willingToRelocate === ''
          ? null
          : form.willingToRelocate === 'yes',

      willingToLiveIn:
        form.willingToLiveIn === ''
          ? null
          : form.willingToLiveIn === 'yes',

      expectedMinCompensation:
        compensationText === ''
          ? null
          : Number(compensationText),

      compensationType:
        compensationText === ''
          ? null
          : form.compensationType || null,
    })

    profile.value = updated

    toast({
      message: 'Your profile has been updated successfully.',
      duration: 3000,
      color: 'success',
    })

    emit('back')
  } catch (error: any) {
    toast({
      message: error?.message || 'Failed to save your profile.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    saving.value = false
  }
}

// --------------------------------------------------
// INITIALIZATION AND CLEANUP
// --------------------------------------------------

onMounted(async () => {
  await loadProfile()

  // Wait for the location search container to render.
  await nextTick()

  await initializeGoogleAutocomplete()
})

onBeforeUnmount(() => {
  if (autocompleteElement && placeSelectHandler) {
    autocompleteElement.removeEventListener(
      'gmp-select',
      placeSelectHandler
    )
  }

  autocompleteElement?.remove()

  autocompleteElement = null
  placeSelectHandler = null
})
</script>
