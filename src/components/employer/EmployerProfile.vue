<template>
  <AppShell title="Business profile" back @back="emit('back')">
    <LoadingCards v-if="loading" :count="3" />
    <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />

    <div v-else class="space-y-4">
      <div class="tl-card">
        <div class="tl-card-body flex items-center gap-3">
          <Avatar :name="form.businessName || 'Business'" :src="form.logoUrl" size="lg" />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-sm">{{ form.businessName || 'Your business' }}</p>
            <div class="mt-1">
              <VerifiedBadge :verification="me?.verification ?? 'unverified'" />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <button
              type="button"
              class="tl-btn outline sm"
              :disabled="uploading"
              @click="fileInput?.click()"
            >
              <ion-icon :icon="uploading ? Icons.Loader2 : Icons.Camera" :class="{ 'tl-spin': uploading }" />
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

      <div class="tl-card">
        <div class="tl-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tl-muted">Business details</p>

          <Field label="Business name" required :error="errors.businessName">
            <input v-model="form.businessName" class="tl-input" placeholder="Business or household name" />
          </Field>

          <Field label="Employer type">
            <FormSelect v-model="form.employerType" :options="employerTypeOptions" />
          </Field>

          <Field label="Contact person">
            <input v-model="form.contactPerson" class="tl-input" placeholder="Full name" />
          </Field>

          <Field label="Mobile number">
            <input v-model="form.mobileNumber" class="tl-input" type="tel" placeholder="e.g. 0917 123 4567" />
          </Field>

          <Field label="Description" hint="Tell workers about your business and work culture.">
            <textarea
              v-model="form.description"
              class="tl-textarea"
              rows="4"
              placeholder="What does your business do?"
            />
          </Field>
        </div>
      </div>

      <div class="tl-card">
        <div class="tl-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tl-muted">Location</p>

          <Field label="Municipality">
            <FormSelect
              v-model="form.municipalityId"
              :options="municipalityOptions"
              placeholder="Select a municipality"
            />
          </Field>

          <Field label="Barangay">
            <FormSelect
              v-model="form.barangay"
              :options="barangayOptions"
              placeholder="Select a barangay"
              :disabled="!form.municipalityId"
            />
          </Field>

          <Field label="Street address">
            <input v-model="form.address" class="tl-input" placeholder="House / unit, street" />
          </Field>
        </div>
      </div>

      <p v-if="formError" class="tl-error">{{ formError }}</p>

      <button type="button" class="tl-btn" :disabled="saving" @click="save">
        <ion-icon :icon="saving ? Icons.Loader2 : Icons.Check" :class="{ 'tl-spin': saving }" />
        Save changes
      </button>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

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
const uploading = ref(false)
const saving = ref(false)
const formError = ref('')
const errors = reactive<Record<string, string>>({})

const form = reactive({
  businessName: '',
  employerType: 'individual',
  contactPerson: '',
  mobileNumber: '',
  municipalityId: '',
  barangay: '',
  address: '',
  description: '',
  logoUrl: '',
})

const employerTypeOptions = EMPLOYER_TYPES.map((t) => ({ value: t.value, label: t.label }))

const {
  data: me,
  loading,
  error,
  refresh,
  setData,
} = useAsync<EmployerProfileDTO | null>(() => getEmployerMe(), [])

const { data: municipalities } = useAsync<MunicipalityDTO[]>(() => listMunicipalities(), [])

const municipalityOptions = computed(() =>
  (municipalities.value ?? []).map((m) => ({ value: m.id, label: m.name }))
)
const barangayOptions = computed(() => {
  const found = (municipalities.value ?? []).find((m) => m.id === form.municipalityId)
  return ((found as (MunicipalityDTO & { barangays?: string[] }) | undefined)?.barangays ?? []).map(
    (b) => ({ value: b, label: b })
  )
})

watch(
  me,
  (profile) => {
    if (!profile) return
    form.businessName = profile.businessName
    form.employerType = profile.employerType
    form.contactPerson = profile.contactPerson ?? ''
    form.mobileNumber = profile.mobileNumber ?? ''
    form.municipalityId = profile.municipalityId ?? ''
    form.barangay = profile.barangay ?? ''
    form.address = profile.address ?? ''
    form.description = profile.description ?? ''
    form.logoUrl = profile.logoUrl ?? ''
  },
  { immediate: true }
)

async function onLogoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploading.value = true
  try {
    form.logoUrl = await uploadImage(file)
    await toast('Logo uploaded. Remember to save.')
  } catch (e: any) {
    await toast(e?.message || 'Could not upload the logo.', 'danger')
  } finally {
    uploading.value = false
  }
}

async function save() {
  for (const key of Object.keys(errors)) delete errors[key]
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
      barangay: form.barangay || null,
      address: form.address.trim() || null,
      description: form.description.trim() || null,
      logoUrl: form.logoUrl || null,
    })
    if (updated) setData(updated)
    await refreshSession()
    await toast('Profile updated.')
    emit('back')
  } catch (e: any) {
    formError.value = e?.message || 'Could not save your profile.'
    await toast(formError.value, 'danger')
  } finally {
    saving.value = false
  }
}
</script>
