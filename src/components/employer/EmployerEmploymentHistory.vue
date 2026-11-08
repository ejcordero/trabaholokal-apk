
<template>
  <AppShell title="Work Experience" @back="emit('back')">
    <div class="space-y-4 p-1">
      <div class="space-y-1">
        <h2 class="text-base font-semibold">Previous and current work</h2>
        <p class="text-xs tl-muted">
          Add work experience, including informal jobs, freelance work, and self-employment.
          This is separate from jobs completed through TrabahoLokal.
        </p>
      </div>

      <div v-if="error" class="tl-card">
        <div class="tl-card-body text-sm" style="color: #b91c1c">
          {{ error }}
        </div>
      </div>

      <div v-if="notice" class="tl-card">
        <div class="tl-card-body text-sm" style="color: #047857">
          {{ notice }}
        </div>
      </div>

      <div class="tl-card">
        <div class="tl-card-body space-y-3">
          <h3 class="font-semibold text-sm">
            {{ editingId ? 'Edit work experience' : 'Add work experience' }}
          </h3>

          <IonItem>
            <IonInput
              v-model="form.jobTitle"
              label="Job title"
              label-placement="stacked"
              placeholder="e.g. Construction Helper"
              required
            />
          </IonItem>

          <IonItem>
            <IonInput
              v-model="form.employerName"
              label="Employer or client name"
              label-placement="stacked"
              placeholder="Optional"
            />
          </IonItem>

          <IonItem>
            <IonSelect
              v-model="form.employerType"
              label="Employer type"
              label-placement="stacked"
              placeholder="Select type"
              interface="popover"
            >
              <IonSelectOption value="individual">Individual / Client</IonSelectOption>
              <IonSelectOption value="business">Business</IonSelectOption>
              <IonSelectOption value="organization">Organization</IonSelectOption>
              <IonSelectOption value="community">Community</IonSelectOption>
              <IonSelectOption value="self_employed">Self-employed</IonSelectOption>
              <IonSelectOption value="other">Other</IonSelectOption>
            </IonSelect>
          </IonItem>

          <div class="grid grid-cols-2 gap-2">
            <IonItem>
              <IonInput
                v-model="form.startDate"
                type="date"
                label="Start date"
                label-placement="stacked"
              />
            </IonItem>

            <IonItem>
              <IonInput
                v-model="form.endDate"
                type="date"
                label="End date"
                label-placement="stacked"
                :disabled="form.isCurrent"
              />
            </IonItem>
          </div>

          <IonItem lines="none">
            <IonCheckbox v-model="form.isCurrent">
              Currently working here
            </IonCheckbox>
          </IonItem>

          <IonItem>
            <IonTextarea
              v-model="form.tasksText"
              label="Tasks performed"
              label-placement="stacked"
              placeholder="Enter one task per line"
              :rows="4"
              auto-grow
            />
          </IonItem>

          <IonItem>
            <IonTextarea
              v-model="form.description"
              label="Work description"
              label-placement="stacked"
              placeholder="Describe your responsibilities or experience"
              :rows="3"
              auto-grow
            />
          </IonItem>

          <div class="border-t pt-3 space-y-2">
            <p class="text-xs font-semibold">Optional reference</p>

            <IonItem>
              <IonInput
                v-model="form.referenceName"
                label="Reference name"
                label-placement="stacked"
                placeholder="Person who can verify this experience"
              />
            </IonItem>

            <IonItem>
              <IonInput
                v-model="form.referenceContact"
                label="Reference contact"
                label-placement="stacked"
                placeholder="Phone number or email"
              />
            </IonItem>

            <p class="text-[11px] tl-muted">
              Reference details are private to you and are not displayed in the employer-facing work-history view.
            </p>
          </div>

          <div class="flex gap-2">
            <IonButton
              expand="block"
              :disabled="saving"
              @click="save"
            >
              {{ saving ? 'Saving...' : editingId ? 'Update experience' : 'Save experience' }}
            </IonButton>

            <IonButton
              v-if="editingId"
              fill="outline"
              color="medium"
              @click="resetForm"
            >
              Cancel
            </IonButton>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-sm">Your work experience</h3>
        <span class="text-xs tl-muted">{{ history.length }} record(s)</span>
      </div>

      <div v-if="loading" class="tl-card">
        <div class="tl-card-body text-sm tl-muted">Loading work experience...</div>
      </div>

      <div
        v-else-if="history.length === 0"
        class="tl-card"
      >
        <div class="tl-card-body text-sm tl-muted">
          You haven't added any work experience yet.
        </div>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="entry in history"
          :key="entry.id"
          class="tl-card"
        >
          <div class="tl-card-body space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h4 class="font-semibold text-sm">{{ entry.jobTitle }}</h4>
                <p class="text-xs tl-muted">
                  {{ entry.employerName || employerTypeLabel(entry.employerType) }}
                </p>
              </div>

              <span
                v-if="entry.isCurrent"
                class="tl-pill approved"
              >
                Current
              </span>
            </div>

            <p class="text-xs tl-muted">
              {{ formatDate(entry.startDate) }}
              –
              {{ entry.isCurrent ? 'Present' : entry.endDate ? formatDate(entry.endDate) : 'Not specified' }}
            </p>

            <p v-if="entry.description" class="text-sm">
              {{ entry.description }}
            </p>

            <div v-if="entry.tasks.length" class="space-y-1">
              <p class="text-xs font-semibold">Tasks performed</p>
              <ul class="list-disc pl-5 text-xs space-y-1">
                <li v-for="(task, index) in entry.tasks" :key="index">
                  {{ task }}
                </li>
              </ul>
            </div>

            <div class="flex gap-2 pt-2">
              <IonButton
                size="small"
                fill="outline"
                @click="editEntry(entry)"
              >
                Edit
              </IonButton>

              <IonButton
                size="small"
                fill="outline"
                color="danger"
                :disabled="deletingId === entry.id"
                @click="removeEntry(entry.id)"
              >
                {{ deletingId === entry.id ? 'Deleting...' : 'Delete' }}
              </IonButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  IonButton,
  IonCheckbox,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from '@ionic/vue'

import {
  listWorkerWorkHistory,
  saveWorkerWorkHistory,
  deleteWorkerWorkHistory,
  type WorkerWorkHistoryDTO,
  type WorkerWorkHistoryInput,
} from '../worker/_lib'

import { AppShell } from '../worker/_ui'

const emit = defineEmits<{
  back: []
}>()

const history = ref<WorkerWorkHistoryDTO[]>([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref('')
const editingId = ref<string | null>(null)
const error = ref('')
const notice = ref('')

const emptyForm = () => ({
  jobTitle: '',
  employerName: '',
  employerType: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  tasksText: '',
  description: '',
  referenceName: '',
  referenceContact: '',
})

const form = reactive(emptyForm())

function resetForm() {
  Object.assign(form, emptyForm())
  editingId.value = null
}

async function loadHistory() {
  loading.value = true
  error.value = ''

  try {
    history.value = await listWorkerWorkHistory()
  } catch (err: any) {
    error.value = err?.message || 'Failed to load work experience.'
  } finally {
    loading.value = false
  }
}

async function save() {
  error.value = ''
  notice.value = ''

  if (!form.jobTitle.trim()) {
    error.value = 'Please enter a job title.'
    return
  }

  if (!form.startDate) {
    error.value = 'Please select a start date.'
    return
  }

  if (
    !form.isCurrent &&
    form.endDate &&
    form.endDate < form.startDate
  ) {
    error.value = 'End date cannot be earlier than start date.'
    return
  }

  const payload: WorkerWorkHistoryInput = {
    id: editingId.value ?? undefined,
    jobTitle: form.jobTitle,
    employerName: form.employerName,
    employerType: form.employerType || null,
    startDate: form.startDate,
    endDate: form.isCurrent ? null : form.endDate || null,
    isCurrent: form.isCurrent,
    tasks: form.tasksText.split('\n'),
    description: form.description,
    referenceName: form.referenceName,
    referenceContact: form.referenceContact,
  }

  saving.value = true

  try {
    await saveWorkerWorkHistory(payload)
    resetForm()
    await loadHistory()
    notice.value = 'Work experience saved successfully.'
  } catch (err: any) {
    error.value = err?.message || 'Failed to save work experience.'
  } finally {
    saving.value = false
  }
}

function editEntry(entry: WorkerWorkHistoryDTO) {
  notice.value = ''
  error.value = ''
  editingId.value = entry.id

  Object.assign(form, {
    jobTitle: entry.jobTitle,
    employerName: entry.employerName ?? '',
    employerType: entry.employerType ?? '',
    startDate: entry.startDate,
    endDate: entry.endDate ?? '',
    isCurrent: entry.isCurrent,
    tasksText: entry.tasks.join('\n'),
    description: entry.description ?? '',
    referenceName: entry.referenceName ?? '',
    referenceContact: entry.referenceContact ?? '',
  })
}

async function removeEntry(id: string) {
  const confirmed = window.confirm('Delete this work experience record?')
  if (!confirmed) return

  error.value = ''
  notice.value = ''
  deletingId.value = id

  try {
    await deleteWorkerWorkHistory(id)

    if (editingId.value === id) {
      resetForm()
    }

    await loadHistory()
    notice.value = 'Work experience deleted.'
  } catch (err: any) {
    error.value = err?.message || 'Failed to delete work experience.'
  } finally {
    deletingId.value = ''
  }
}

function employerTypeLabel(type?: string | null): string {
  const labels: Record<string, string> = {
    individual: 'Individual / Client',
    business: 'Business',
    organization: 'Organization',
    community: 'Community',
    self_employed: 'Self-employed',
    other: 'Other',
  }

  return type ? labels[type] ?? 'Employer not specified' : 'Employer not specified'
}

function formatDate(value: string): string {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', {
    month: 'short',
    year: 'numeric',
  })
}

onMounted(loadHistory)
</script>
