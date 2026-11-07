<template>
  <AppShell :title="isEdit ? 'Edit job' : 'Post a job'" back @back="emit('close')">
    <template #right>
      <button type="button" class="tl-btn ghost icon" aria-label="Close" @click="emit('close')">
        <ion-icon :icon="Icons.Close" />
      </button>
    </template>

    <LoadingCards v-if="loadingExisting" :count="3" />
    <ErrorRetry v-else-if="existingError" :message="existingError" @retry="reloadExisting" />

    <div v-else class="space-y-4">
      <div class="tl-card">
        <div class="tl-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tl-muted">Job basics</p>

          <Field label="Job title" required :error="errors.title">
            <input v-model="form.title" class="tl-input" placeholder="e.g. Construction helper" maxlength="120" />
          </Field>

          <Field label="Category" required :error="errors.category">
            <FormSelect v-model="form.category" :options="categoryOptions" placeholder="Select a category" />
          </Field>

          <Field label="Description" required :error="errors.description">
            <textarea
              v-model="form.description"
              class="tl-textarea"
              rows="5"
              placeholder="Describe the work, the site, and what a typical day looks like."
            />
          </Field>

          <div class="grid grid-cols-2 gap-2">
            <Field label="Employment type">
              <FormSelect v-model="form.employmentType" :options="employmentTypeOptions" />
            </Field>
            <Field label="Urgency">
              <FormSelect v-model="form.urgencyLevel" :options="urgencyOptions" />
            </Field>
          </div>
        </div>
      </div>

      <div class="tl-card">
        <div class="tl-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tl-muted">Compensation & schedule</p>

          <div class="grid grid-cols-2 gap-2">
            <Field label="Compensation" required :error="errors.compensation">
              <input
                v-model.number="form.compensation"
                class="tl-input"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="0"
              />
            </Field>
            <Field label="Pay basis">
              <FormSelect v-model="form.compensationType" :options="compensationOptions" />
            </Field>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <Field label="Positions needed" :error="errors.positions">
              <input v-model.number="form.positions" class="tl-input" type="number" min="1" step="1" />
            </Field>
            <Field label="Working hours" hint="e.g. 8am–5pm, Mon–Sat">
              <input v-model="form.workingHours" class="tl-input" placeholder="8am–5pm" />
            </Field>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <Field label="Start date">
              <input v-model="form.startDate" class="tl-input" type="date" />
            </Field>
            <Field label="End date" hint="Leave blank for open-ended">
              <input v-model="form.endDate" class="tl-input" type="date" />
            </Field>
          </div>

          <Field label="Application deadline">
            <input v-model="form.applicationDeadline" class="tl-input" type="date" />
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

          <Field label="Landmark / address" hint="Helps workers find the exact site.">
            <input v-model="form.locationText" class="tl-input" placeholder="e.g. Near the public market" />
          </Field>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="tl-btn outline sm"
              :disabled="locating"
              @click="useMyLocation"
            >
              <ion-icon :icon="locating ? Icons.Loader2 : Icons.MapPin" :class="{ 'tl-spin': locating }" />
              {{ locating ? 'Locating…' : 'Use my location' }}
            </button>
            <span v-if="form.latitude != null && form.longitude != null" class="tl-caption">
              {{ form.latitude.toFixed(4) }}, {{ form.longitude.toFixed(4) }}
            </span>
          </div>
        </div>
      </div>

      <div class="tl-card">
        <div class="tl-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tl-muted">Responsibilities</p>

          <div v-for="(item, index) in form.responsibilities" :key="`r-${index}`" class="flex items-start gap-2">
            <input
              v-model="form.responsibilities[index]"
              class="tl-input"
              placeholder="Describe a responsibility"
            />
            <button
              type="button"
              class="tl-btn ghost icon"
              style="color: #b91c1c"
              aria-label="Remove responsibility"
              @click="removeItem('responsibilities', index)"
            >
              <ion-icon :icon="Icons.Trash2" />
            </button>
          </div>

          <div class="flex gap-2">
            <input v-model="responsibilityDraft" class="tl-input" placeholder="Add a responsibility" @keydown.enter.prevent="addItem('responsibilities')" />
            <button type="button" class="tl-btn outline sm" @click="addItem('responsibilities')">
              <ion-icon :icon="Icons.Plus" /> Add
            </button>
          </div>
        </div>
      </div>

      <div class="tl-card">
        <div class="tl-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tl-muted">Qualifications</p>

          <div v-for="(item, index) in form.qualifications" :key="`q-${index}`" class="flex items-start gap-2">
            <input v-model="form.qualifications[index]" class="tl-input" placeholder="Describe a qualification" />
            <button
              type="button"
              class="tl-btn ghost icon"
              style="color: #b91c1c"
              aria-label="Remove qualification"
              @click="removeItem('qualifications', index)"
            >
              <ion-icon :icon="Icons.Trash2" />
            </button>
          </div>

          <div class="flex gap-2">
            <input v-model="qualificationDraft" class="tl-input" placeholder="Add a qualification" @keydown.enter.prevent="addItem('qualifications')" />
            <button type="button" class="tl-btn outline sm" @click="addItem('qualifications')">
              <ion-icon :icon="Icons.Plus" /> Add
            </button>
          </div>
        </div>
      </div>

      <div class="tl-card">
        <div class="tl-card-body space-y-3">
          <p class="text-xs font-semibold uppercase tl-muted">Required skills</p>
          <p class="text-xs tl-muted">
            Required skills drive the match score workers see. Add the skills this job truly needs.
          </p>
          <EmployerRequiredSkills v-model="requiredSkills" />
        </div>
      </div>

      <div v-if="safetyFlags.length" class="tl-safety">
        <div class="flex items-center gap-2 font-semibold mb-1">
          <ion-icon :icon="Icons.FileWarning" />
          <span>Safety check</span>
        </div>
        <ul style="margin: 4px 0 0; padding-left: 18px">
          <li v-for="(flag, index) in safetyFlags" :key="index">{{ flag }}</li>
        </ul>
        <p class="tl-caption" style="margin-top: 4px">
          Your listing looks unusual. Please remove any fee requests before publishing.
        </p>
      </div>

      <p v-if="formError" class="tl-error">{{ formError }}</p>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="tl-btn outline"
          :disabled="saving"
          @click="submit(isEdit ? existing?.status ?? 'draft' : 'draft')"
        >
          <ion-icon :icon="saving ? Icons.Loader2 : Icons.Document" :class="{ 'tl-spin': saving }" />
          {{ isEdit ? 'Save changes' : 'Save as draft' }}
        </button>
        <button type="button" class="tl-btn" :disabled="saving" @click="submit('published')">
          <ion-icon :icon="saving ? Icons.Loader2 : Icons.CloudUpload" :class="{ 'tl-spin': saving }" />
          {{ isEdit && existing?.status === 'published' ? 'Save & keep published' : 'Publish job' }}
        </button>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import {
  COMPENSATION_TYPES,
  createJob,
  detectScamFlags,
  EMPLOYMENT_TYPES,
  getJob,
  JOB_CATEGORIES,
  listMunicipalities,
  updateJob,
  URGENCY_LEVELS,
  useAsync,
  useToast,
  type JobWithMatch,
  type MunicipalityDTO,
} from '../worker/_lib'
import { AppShell, ErrorRetry, Field, FormSelect, Icons, LoadingCards } from '../worker/_ui'

import EmployerRequiredSkills from './EmployerRequiredSkills.vue'

interface RequiredSkill {
  skillId: string
  skillName: string
  importance: 'required' | 'preferred'
  weight: number
}

const props = defineProps<{ jobId?: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', job: JobWithMatch): void
}>()

const { toast } = useToast()

const isEdit = computed(() => Boolean(props.jobId))
const categoryOptions = JOB_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))
const employmentTypeOptions = EMPLOYMENT_TYPES.map((c) => ({ value: c.value, label: c.label }))
const urgencyOptions = URGENCY_LEVELS.map((c) => ({ value: c.value, label: c.label }))
const compensationOptions = COMPENSATION_TYPES.map((c) => ({ value: c.value, label: c.label }))
const requiredSkills = ref<RequiredSkill[]>([])
const responsibilityDraft = ref('')
const qualificationDraft = ref('')
const saving = ref(false)
const locating = ref(false)
const formError = ref('')
const errors = reactive<Record<string, string>>({})

const form = reactive({
  title: '',
  category: '',
  description: '',
  responsibilities: [] as string[],
  qualifications: [] as string[],
  compensation: 0,
  compensationType: 'daily',
  positions: 1,
  employmentType: 'regular',
  startDate: '',
  endDate: '',
  municipalityId: '',
  barangay: '',
  locationText: '',
  latitude: null as number | null,
  longitude: null as number | null,
  urgencyLevel: 'normal',
  workingHours: '',
  applicationDeadline: '',
})

const {
  data: existing,
  loading: loadingExisting,
  error: existingError,
  refresh: reloadExisting,
} = useAsync<JobWithMatch | null>(
  async () => (props.jobId ? await getJob(props.jobId) : null),
  () => [props.jobId]
)

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
  existing,
  (job) => {
    if (!job) return
    form.title = job.title
    form.category = job.category
    form.description = job.description
    form.responsibilities = [...job.responsibilities]
    form.qualifications = [...job.qualifications]
    form.compensation = job.compensation
    form.compensationType = job.compensationType
    form.positions = job.positions
    form.employmentType = job.employmentType
    form.startDate = job.startDate ?? ''
    form.endDate = job.endDate ?? ''
    form.municipalityId = job.municipalityId ?? ''
    form.barangay = job.barangay ?? ''
    form.locationText = job.locationText ?? ''
    form.latitude = job.latitude ?? null
    form.longitude = job.longitude ?? null
    form.urgencyLevel = job.urgencyLevel
    form.workingHours = job.workingHours ?? ''
    form.applicationDeadline = job.applicationDeadline ?? ''
    requiredSkills.value = job.requiredSkills.map((s) => ({
      skillId: s.skillId,
      skillName: s.skillName,
      importance: s.importance,
      weight: s.weight,
    }))
  },
  { immediate: true }
)

const safetyFlags = computed(() =>
  detectScamFlags({
    title: form.title,
    description: form.description,
    compensation: Number(form.compensation) || 0,
    compensationType: form.compensationType,
  })
)

function addItem(field: 'responsibilities' | 'qualifications') {
  const draft = field === 'responsibilities' ? responsibilityDraft : qualificationDraft
  const value = draft.value.trim()
  if (!value) return
  form[field].push(value)
  draft.value = ''
}

function removeItem(field: 'responsibilities' | 'qualifications', index: number) {
  form[field].splice(index, 1)
}

function useMyLocation() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    void toast('Location is not available on this device.', 'warning')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.latitude = position.coords.latitude
      form.longitude = position.coords.longitude
      locating.value = false
      void toast('Location captured.')
    },
    () => {
      locating.value = false
      void toast('Could not get your location. You can enter it manually.', 'danger')
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

function validate() {
  for (const key of Object.keys(errors)) delete errors[key]
  if (!form.title.trim()) errors.title = 'A job title is required.'
  else if (form.title.trim().length < 5) errors.title = 'Use at least 5 characters.'
  if (!form.category) errors.category = 'Choose a category.'
  if (!form.description.trim()) errors.description = 'Describe the job.'
  else if (form.description.trim().length < 20) errors.description = 'Add at least 20 characters.'
  const pay = Number(form.compensation)
  if (!pay || pay <= 0) errors.compensation = 'Enter a valid compensation amount.'
  if (!form.positions || form.positions < 1) errors.positions = 'At least one position is required.'
  return Object.keys(errors).length === 0
}

function buildPayload(status: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    category: form.category,
    description: form.description.trim(),
    responsibilities: form.responsibilities.map((r) => r.trim()).filter(Boolean),
    qualifications: form.qualifications.map((q) => q.trim()).filter(Boolean),
    compensation: Number(form.compensation),
    compensation_type: form.compensationType,
    positions: Math.max(1, Number(form.positions) || 1),
    employment_type: form.employmentType,
    urgency_level: form.urgencyLevel,
    status,
    required_skills: requiredSkills.value.map((s) => ({
      skill_id: s.skillId,
      importance: s.importance,
      weight: s.weight,
    })),
    scam_flags: safetyFlags.value,
  }
  if (form.startDate) payload.start_date = form.startDate
  if (form.endDate) payload.end_date = form.endDate
  if (form.municipalityId) payload.municipality_id = form.municipalityId
  if (form.barangay) payload.barangay = form.barangay
  if (form.locationText.trim()) payload.location_text = form.locationText.trim()
  if (form.latitude != null && form.longitude != null) {
    payload.latitude = form.latitude
    payload.longitude = form.longitude
  }
  if (form.workingHours.trim()) payload.working_hours = form.workingHours.trim()
  if (form.applicationDeadline) payload.application_deadline = form.applicationDeadline
  return payload
}

async function submit(status: string) {
  formError.value = ''
  if (!validate()) {
    formError.value = 'Please fix the highlighted fields.'
    return
  }
  saving.value = true
  try {
    const payload = buildPayload(status)
    const saved = props.jobId ? await updateJob(props.jobId, payload) : await createJob(payload)
    if (safetyFlags.value.length) {
      await toast('Saved. Your listing was flagged for a safety review.', 'warning')
    } else {
      await toast(status === 'published' ? 'Job published.' : 'Job saved.')
    }
    emit('saved', saved)
  } catch (e: any) {
    formError.value = e?.message || 'Could not save the job.'
    await toast(formError.value, 'danger')
  } finally {
    saving.value = false
  }
}
</script>
