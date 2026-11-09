
<template>
  <AppShell title="Business profile" back @back="emit('back')">
    <LoadingCards v-if="loading" :count="3" />
    <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />

    <div v-else class="space-y-4">
      <!-- Business logo -->
      <div class="tl-card">
        <div class="tl-card-body flex items-center gap-3">
          <Avatar
            :name="form.businessName || 'Business'"
            :src="form.logoUrl"
            size="lg"
          />

          <div class="min-w-0 flex-1">
            <p class="font-medium text-sm">
              {{ form.businessName || 'Your business' }}
            </p>

            <div class="mt-1">
              <VerifiedBadge
                :verification="me?.verification ?? 'unverified'"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <button
              type="button"
              class="tl-btn outline sm"
              :disabled="uploading"
              @click="fileInput?.click()"
            >
              <ion-icon
                :icon="uploading ? Icons.Loader2 : Icons.Camera"
                :class="{ 'tl-spin': uploading }"
              />
              {{ uploading ? 'Uploading' : 'Logo' }}
            </button>

            <button
              v-if="form.logoUrl"
              type="button"
              class="tl-btn ghost sm"
              style="color: #b91c1c"
              @click="form.logoUrl = ''"
            >
              Remove
            </button>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="sr-only"
            @change="onLogoChange"
          />
        </div>
      </div>

      <!-- Business details -->
      <div class="tl-card">
        <div class="tl-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tl-muted">
            Business details
          </p>

          <Field
            label="Business name"
            required
            :error="errors.businessName"
          >
            <input
              v-model="form.businessName"
              class="tl-input"
              placeholder="Business or household name"
            />
          </Field>

          <Field label="Employer type">
            <FormSelect
              v-model="form.employerType"
              :options="employerTypeOptions"
            />
          </Field>

          <Field label="Contact person">
            <input
              v-model="form.contactPerson"
              class="tl-input"
              placeholder="Full name"
            />
          </Field>

          <Field label="Mobile number">
            <input
              v-model="form.mobileNumber"
              class="tl-input"
              type="tel"
              placeholder="e.g. 0917 123 4567"
            />
          </Field>

          <Field
            label="Description"
            hint="Tell workers about your business and work culture."
          >
            <textarea
              v-model="form.description"
              class="tl-textarea"
              rows="4"
              placeholder="What does your business do?"
            />
          </Field>
        </div>
      </div>

      <!-- Location -->
      <div class="tl-card">
        <div class="tl-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tl-muted">
            Location
          </p>

          <Field
            label="Search for a location"
            hint="Search for a barangay, municipality, landmark, or street."
          >
            <div
              ref="autocompleteHost"
              class="w-full"
            />
          </Field>

          <Field label="Municipality">
            <input
              v-model="form.municipalityName"
              class="tl-input"
              placeholder="Enter municipality or city"
              @input="syncMunicipalityId"
            />
          </Field>

          <Field label="Barangay">
            <input
              v-model="form.barangay"
              class="tl-input"
              placeholder="Enter barangay"
            />
          </Field>

          <Field label="Street address">
            <input
              v-model="form.address"
              class="tl-input"
              placeholder="House / unit, street"
            />
          </Field>

          <div class="space-y-2">
            <button
              type="button"
              class="tl-btn"
              :disabled="locating || saving"
              @click="useMyLocation"
            >
              <ion-icon
                :icon="locating ? Icons.Loader2 : Icons.MapPin"
                :class="{ 'tl-spin': locating }"
              />

              {{
                locating
                  ? 'Getting location...'
                  : form.latitude !== null
                    ? 'Update My Location'
                    : 'Use My Current Location'
              }}
            </button>

            <p
              v-if="
                form.latitude !== null &&
                form.longitude !== null
              "
              class="text-xs tl-muted"
            >
              <ion-icon :icon="Icons.CheckCircle" />
              Coordinates captured:
              {{ form.latitude.toFixed(6) }},
              {{ form.longitude.toFixed(6) }}
            </p>

            <p v-else class="text-xs tl-muted">
              No coordinates saved yet. You can search for a place
              or manually capture your current location.
            </p>
          </div>
        </div>
      </div>

      <p v-if="formError" class="tl-error">
        {{ formError }}
      </p>

      <!-- Save -->
      <button
        type="button"
        class="tl-btn"
        :disabled="saving || uploading"
        @click="save"
      >
        <ion-icon
          :icon="saving ? Icons.Loader2 : Icons.Check"
          :class="{ 'tl-spin': saving }"
        />
        Save changes
      </button>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'

import {
  EMPLOYER_TYPES,
  getEmployerMe,
  listMunicipalities,
  updateEmployerMe,
  uploadImage,
  useAsync,
  useSession,
  useToast,
  type EmployerProfileDTO,
  type MunicipalityDTO,
} from '../worker/_lib'

import {
  AppShell,
  Avatar,
  ErrorRetry,
  Field,
  FormSelect,
  Icons,
  LoadingCards,
  VerifiedBadge,
} from '../worker/_ui'

const emit = defineEmits<{ (e: 'back'): void }>()

const { toast } = useToast()
const { refresh: refreshSession } = useSession()

const fileInput = ref<HTMLInputElement | null>(null)
const autocompleteHost = ref<HTMLDivElement | null>(null)

const uploading = ref(false)
const saving = ref(false)
const locating = ref(false)

const formError = ref('')

const errors = reactive<Record<string, string>>({})

const form = reactive({
  businessName: '',
  employerType: 'individual',
  contactPerson: '',
  mobileNumber: '',
  municipalityId: '',
  municipalityName: '',
  barangay: '',
  address: '',
  latitude: null as number | null,
  longitude: null as number | null,
  description: '',
  logoUrl: '',
})

const employerTypeOptions = EMPLOYER_TYPES.map((t) => ({
  value: t.value,
  label: t.label,
}))

const {
  data: me,
  loading,
  error,
  refresh,
  setData,
} = useAsync<EmployerProfileDTO | null>(
  () => getEmployerMe(),
  []
)

const { data: municipalities } = useAsync<MunicipalityDTO[]>(
  () => listMunicipalities(),
  []
)

// --------------------------------------------------
// MUNICIPALITY ID MATCHING
// --------------------------------------------------

function syncMunicipalityId() {
  const typedName = form.municipalityName.trim().toLowerCase()

  const matched = (municipalities.value ?? []).find(
    (municipality) =>
      municipality.name.trim().toLowerCase() === typedName
  )

  form.municipalityId = matched?.id ?? ''
}

// --------------------------------------------------
// LOAD EMPLOYER PROFILE
// --------------------------------------------------

watch(
  me,
  (profile) => {
    if (!profile) return

    form.businessName = profile.businessName
    form.employerType = profile.employerType
    form.contactPerson = profile.contactPerson ?? ''
    form.mobileNumber = profile.mobileNumber ?? ''

    form.municipalityId = profile.municipalityId ?? ''
    form.municipalityName = profile.municipalityName ?? ''

    form.barangay = profile.barangay ?? ''
    form.address = profile.address ?? ''

    form.latitude = profile.latitude ?? null
    form.longitude = profile.longitude ?? null

    form.description = profile.description ?? ''
    form.logoUrl = profile.logoUrl ?? ''
  },
  { immediate: true }
)

// --------------------------------------------------
// GOOGLE MAPS / PLACES AUTOCOMPLETE
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

  // Prevent multiple script requests.
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

async function initializeGoogleAutocomplete() {
  try {
    const places = await loadGooglePlaces()

    // The component may have been closed while Google was loading.
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

        // Street address.
        const streetNumber = getAddressComponent(
          components,
          'street_number'
        )

        const street = getAddressComponent(
          components,
          'route'
        )

        form.address = [streetNumber, street]
          .filter(Boolean)
          .join(' ')

        // Use the full Google address if street information
        // is not available.
        if (!form.address) {
          form.address = place.formattedAddress ?? ''
        }

        // Match municipality to the existing Supabase record.
        syncMunicipalityId()

        // Save the selected location coordinates.
        if (place.location) {
          form.latitude = place.location.lat()
          form.longitude = place.location.lng()
        } else {
          form.latitude = null
          form.longitude = null
        }

        await toast(
          'Location selected. Remember to save your profile.'
        )
      } catch (error: any) {
        await toast(
          error?.message ||
            'Could not retrieve the selected location.',
          'danger'
        )
      }
    }

    element.addEventListener(
      'gmp-select',
      placeSelectHandler
    )

    autocompleteHost.value.replaceChildren(element)

    autocompleteElement = element
  } catch (error: any) {
    console.error('Google Places initialization failed:', error)

    await toast(
      error?.message || 'Could not initialize Google Places.',
      'danger'
    )
  }
}

// --------------------------------------------------
// GOOGLE MAPS CLEANUP
// --------------------------------------------------

onMounted(() => {
  void initializeGoogleAutocomplete()
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

// --------------------------------------------------
// LOGO UPLOAD
// --------------------------------------------------

async function onLogoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  input.value = ''

  if (!file) return

  uploading.value = true

  try {
    form.logoUrl = await uploadImage(file)

    await toast('Logo uploaded. Remember to save.')
  } catch (error: any) {
    await toast(
      error?.message || 'Could not upload the logo.',
      'danger'
    )
  } finally {
    uploading.value = false
  }
}

// --------------------------------------------------
// MANUAL GPS LOCATION
// --------------------------------------------------

async function useMyLocation() {
  if (!navigator.geolocation) {
    await toast(
      'Location is not supported by this browser.',
      'danger'
    )
    return
  }

  locating.value = true

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      form.latitude = position.coords.latitude
      form.longitude = position.coords.longitude

      locating.value = false

      await toast(
        'Location captured. Remember to save your profile.'
      )
    },
    async (error) => {
      locating.value = false

      const message =
        error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Please allow location access in your browser.'
          : error.code === error.TIMEOUT
            ? 'Location request timed out. Please try again.'
            : 'Unable to get your current location.'

      await toast(message, 'danger')
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  )
}

// --------------------------------------------------
// SAVE EMPLOYER PROFILE
// --------------------------------------------------

async function save() {
  for (const key of Object.keys(errors)) {
    delete errors[key]
  }

  formError.value = ''

  if (!form.businessName.trim()) {
    errors.businessName = 'A business name is required.'
    return
  }

  saving.value = true

  try {
    const updated = await updateEmployerMe({
      businessName: form.businessName.trim(),
      employerType: form.employerType,
      contactPerson: form.contactPerson.trim() || null,
      mobileNumber: form.mobileNumber.trim() || null,

      municipalityId: form.municipalityId || null,
      municipalityName: form.municipalityName.trim() || null,

      barangay: form.barangay.trim() || null,
      address: form.address.trim() || null,

      latitude: form.latitude,
      longitude: form.longitude,

      description: form.description.trim() || null,
      logoUrl: form.logoUrl || null,
    })

    if (updated) {
      setData(updated)
    }

    await refreshSession()

    await toast('Profile updated.')

    emit('back')
  } catch (error: any) {
    formError.value =
      error?.message || 'Could not save your profile.'

    await toast(formError.value, 'danger')
  } finally {
    saving.value = false
  }
}
</script>
