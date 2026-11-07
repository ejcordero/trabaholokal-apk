
<template>
  <AppShell title="Edit Profile" @back="emit('back')">
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
                Help employers find workers in their area.
              </p>
            </div>

            <IonSelect
              v-model="form.municipalityId"
              label="Municipality"
              label-placement="stacked"
              placeholder="Select municipality"
              interface="popover"
              fill="outline"
            >
              <IonSelectOption
                v-for="municipality in municipalities"
                :key="municipality.id"
                :value="municipality.id"
              >
                {{ municipality.name }}
              </IonSelectOption>
            </IonSelect>

            <IonInput
              v-model="form.barangay"
              label="Barangay"
              label-placement="stacked"
              placeholder="Enter your barangay"
              fill="outline"
              :maxlength="100"
            />

            <p class="text-xs text-medium">
              Your location is used to help match you with nearby opportunities.
              Your device location is not requested by this form.
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

        <!-- Save -->
        <IonButton
          expand="block"
          :disabled="saving || !form.fullName.trim()"
          @click="saveProfile"
        >
          <IonSpinner v-if="saving" name="crescent" class="mr-2" />
          <IonIcon v-else :icon="saveOutline" slot="start" />
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
import { onMounted, reactive, ref } from 'vue'

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

import { saveOutline } from 'ionicons/icons'

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
  useToast,
} from './_lib'

const emit = defineEmits<{
  (event: 'back'): void
}>()

const { toast } = useToast()

const loading = ref(true)
const saving = ref(false)

const municipalities = ref<MunicipalityDTO[]>([])
const profile = ref<WorkerProfileDTO | null>(null)

const form = reactive({
  fullName: '',
  mobileNumber: '',
  bio: '',
  education: '',
  municipalityId: '',
  barangay: '',
  preferredCategories: [] as string[],
  preferredDistanceKm: 30,
  available: false,
})

onMounted(loadProfile)

async function loadProfile(): Promise<void> {
  loading.value = true

  try {
    const [worker, municipalityList] = await Promise.all([
      getWorkerMe(),
      getMunicipalities(),
    ])

    profile.value = worker
    municipalities.value = municipalityList

    form.fullName = worker.fullName ?? ''
    form.mobileNumber = worker.mobileNumber ?? ''
    form.bio = worker.bio ?? ''
    form.education = worker.education ?? ''
    form.municipalityId = worker.municipalityId ?? ''
    form.barangay = worker.barangay ?? ''

    form.preferredCategories = [
      ...(worker.preferredCategories ?? []),
    ]

    const distance = Number(worker.preferredDistanceKm)

    form.preferredDistanceKm =
      [5, 10, 20, 30, 50, 100].includes(distance)
        ? distance
        : 30

    form.available = worker.available ?? false
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

async function saveProfile(): Promise<void> {
  if (saving.value) return

  const fullName = form.fullName.trim()
  const mobileNumber = form.mobileNumber.trim()
  const barangay = form.barangay.trim()

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

  saving.value = true

  try {
    const updated = await updateWorkerMe({
      fullName,
      mobileNumber,
      bio: form.bio.trim(),
      education: form.education.trim(),
      municipalityId: form.municipalityId,
      barangay,
      preferredCategories: form.preferredCategories,
      preferredDistanceKm: form.preferredDistanceKm,
      available: form.available,
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
</script>
