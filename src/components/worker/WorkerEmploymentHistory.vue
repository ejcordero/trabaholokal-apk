
<template>
  <AppShell title="Work Experience" @back="emit('back')">
    <div class="space-y-4 pb-6">

      <!-- Introduction -->
      <div>
        <h2 class="text-base font-semibold">Your Work Experience</h2>
        <p class="text-sm text-medium">
          Add previous jobs, informal work, freelance work, or self-employment.
          This helps employers understand your experience.
        </p>
      </div>

      <!-- Feedback -->
      <div
        v-if="feedback.message"
        class="rounded-lg p-3 text-sm"
        :class="feedback.type === 'error'
          ? 'bg-red-50 text-red-700'
          : 'bg-green-50 text-green-700'"
        role="status"
      >
        {{ feedback.message }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center gap-2 py-8">
        <IonSpinner name="crescent" />
        <span class="text-sm text-medium">Loading work experience...</span>
      </div>

      <template v-else>

        <!-- Add button -->
        <IonButton
          v-if="!showForm"
          expand="block"
          @click="openNewForm"
        >
          <IonIcon name="add-outline" slot="start" />
          Add Work Experience
        </IonButton>

        <!-- Work experience form -->
        <IonCard v-if="showForm">
          <IonCardContent class="space-y-4">
            <div>
              <h2 class="text-base font-semibold">
                {{ editingId ? 'Edit Work Experience' : 'Add Work Experience' }}
              </h2>
              <p class="text-sm text-medium">
                Fields marked as required must be completed.
              </p>
            </div>

            <IonInput
              v-model="form.jobTitle"
              label="Job Title *"
              label-placement="stacked"
              fill="outline"
              placeholder="e.g. Farm Worker, Carpenter, Sales Assistant"
              :maxlength="150"
            />

            <IonInput
              v-model="form.employerName"
              label="Employer or Client Name"
              label-placement="stacked"
              fill="outline"
              placeholder="Enter employer, client, or business name"
              :maxlength="150"
            />

            <IonSelect
              v-model="form.employerType"
              label="Employer Type"
              label-placement="stacked"
              fill="outline"
              interface="popover"
              placeholder="Select employer type"
            >
              <IonSelectOption value="individual">Individual / Client</IonSelectOption>
              <IonSelectOption value="business">Business</IonSelectOption>
              <IonSelectOption value="organization">Organization</IonSelectOption>
              <IonSelectOption value="community">Community</IonSelectOption>
              <IonSelectOption value="self_employed">Self-employed</IonSelectOption>
              <IonSelectOption value="other">Other</IonSelectOption>
            </IonSelect>

            <IonInput
              v-model="form.startDate"
              type="date"
              label="Start Date *"
              label-placement="stacked"
              fill="outline"
            />

            <IonCheckbox
              :checked="form.isCurrent"
              @ionChange="form.isCurrent = $event.detail.checked"
            >
              I currently work here
            </IonCheckbox>

            <IonInput
              v-if="!form.isCurrent"
              v-model="form.endDate"
              type="date"
              label="End Date"
              label-placement="stacked"
              fill="outline"
            />

            <div>
              <IonTextarea
                v-model="form.tasksText"
                label="Tasks and Responsibilities"
                label-placement="stacked"
                fill="outline"
                placeholder="Enter one task per line&#10;e.g. Planting crops&#10;Watering plants&#10;Harvesting vegetables"
                :auto-grow="true"
                :rows="4"
                :maxlength="2000"
              />
              <p class="text-xs text-medium mt-1">
                Enter each task on a separate line.
              </p>
            </div>

            <IonTextarea
              v-model="form.description"
              label="Work Description"
              label-placement="stacked"
              fill="outline"
              placeholder="Describe your responsibilities or accomplishments."
              :auto-grow="true"
              :rows="3"
              :maxlength="1000"
            />

            <div class="border-t pt-4 space-y-3">
              <div>
                <h3 class="text-sm font-semibold">Optional Reference</h3>
                <p class="text-xs text-medium">
                  Reference details are kept private and are not shown in the
                  employer-facing work history.
                </p>
              </div>

              <IonInput
                v-model="form.referenceName"
                label="Reference Name"
                label-placement="stacked"
                fill="outline"
                placeholder="Name of former employer or reference"
                :maxlength="150"
              />

              <IonInput
                v-model="form.referenceContact"
                label="Reference Contact"
                label-placement="stacked"
                fill="outline"
                placeholder="Optional contact information"
                :maxlength="150"
              />
            </div>

            <div class="flex gap-2">
              <IonButton
                expand="block"
                class="flex-1"
                :disabled="saving"
                @click="saveEntry"
              >
                <IonSpinner v-if="saving" name="crescent" slot="start" />
                {{ saving ? 'Saving...' : 'Save Experience' }}
              </IonButton>

              <IonButton
                fill="outline"
                color="medium"
                :disabled="saving"
                @click="cancelForm"
              >
                Cancel
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <!-- Work history list -->
        <div v-if="history.length > 0" class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold">Previous Experience</h2>
            <span class="text-xs text-medium">
              {{ history.length }} {{ history.length === 1 ? 'record' : 'records' }}
            </span>
          </div>

          <IonCard v-for="item in history" :key="item.id">
            <IonCardContent class="space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="font-semibold">{{ item.jobTitle }}</h3>
                  <p class="text-sm text-medium">
                    {{ item.employerName || 'Employer not specified' }}
                  </p>
                </div>

                <span
                  v-if="item.isCurrent"
                  class="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700"
                >
                  Current
                </span>
              </div>

              <p class="text-xs text-medium">
                {{ formatDate(item.startDate) }}
                –
                {{ item.isCurrent ? 'Present' : formatDate(item.endDate) }}
              </p>

              <p v-if="item.employerType" class="text-xs text-medium">
                {{ formatEmployerType(item.employerType) }}
              </p>

              <div v-if="item.description">
                <p class="text-sm">{{ item.description }}</p>
              </div>

              <div v-if="item.tasks?.length">
                <p class="text-sm font-medium mb-1">Tasks and responsibilities</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li
                    v-for="(task, index) in item.tasks"
                    :key="index"
                    class="text-sm"
                  >
                    {{ task }}
                  </li>
                </ul>
              </div>

              <div class="flex gap-2 border-t pt-3">
                <IonButton
                  size="small"
                  fill="outline"
                  @click="editEntry(item)"
                >
                  <IonIcon name="create-outline" slot="start" />
                  Edit
                </IonButton>

                <IonButton
                  size="small"
                  fill="outline"
                  color="danger"
                  @click="askDelete(item)"
                >
                  <IonIcon name="trash-outline" slot="start" />
                  Delete
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <!-- Empty state -->
        <IonCard v-else-if="!showForm">
          <IonCardContent class="py-8 text-center space-y-2">
            <IonIcon
              name="briefcase-outline"
              class="text-4xl text-medium"
            />
            <h3 class="font-semibold">No work experience yet</h3>
            <p class="text-sm text-medium">
              Add your previous jobs or informal work experience to build
              your work history.
            </p>
            <IonButton @click="openNewForm">
              Add Your First Experience
            </IonButton>
          </IonCardContent>
        </IonCard>

      </template>

      <!-- Delete confirmation -->
      <ConfirmDialog
        :open="!!deleteTarget"
        title="Delete Work Experience?"
        message="This work experience record will be permanently deleted. This action cannot be undone."
        confirm-label="Delete"
        cancel-label="Keep Record"
        :danger="true"
        @confirm="deleteEntry"
        @cancel="deleteTarget = null"
      />

    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
} from '@ionic/vue'

import {
  listWorkerWorkHistory,
  saveWorkerWorkHistory,
  deleteWorkerWorkHistory,
  type WorkerWorkHistoryDTO,
  type WorkerWorkHistoryInput,
} from './_lib'

import {
  AppShell,
  ConfirmDialog,
} from './_ui'

const emit = defineEmits<{
  back: []
}>()

const loading = ref(true)
const saving = ref(false)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const history = ref<WorkerWorkHistoryDTO[]>([])
const deleteTarget = ref<WorkerWorkHistoryDTO | null>(null)

const feedback = reactive({
  message: '',
  type: 'success' as 'success' | 'error',
})

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

function showFeedback(message: string, type: 'success' | 'error' = 'success') {
  feedback.message = message
  feedback.type = type
}

function clearFeedback() {
  feedback.message = ''
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not specified'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatEmployerType(value: string): string {
  const labels: Record<string, string> = {
    individual: 'Individual / Client',
    business: 'Business',
    organization: 'Organization',
    community: 'Community',
    self_employed: 'Self-employed',
    other: 'Other',
  }

  return labels[value] ?? value
}

async function loadHistory() {
  loading.value = true
  clearFeedback()

  try {
    history.value = await listWorkerWorkHistory()
  } catch (error) {
    showFeedback(
      error instanceof Error ? error.message : 'Failed to load work experience.',
      'error',
    )
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, emptyForm())
  editingId.value = null
}

function openNewForm() {
  resetForm()
  clearFeedback()
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  resetForm()
  clearFeedback()
}

function editEntry(item: WorkerWorkHistoryDTO) {
  clearFeedback()
  editingId.value = item.id

  Object.assign(form, {
    jobTitle: item.jobTitle,
    employerName: item.employerName ?? '',
    employerType: item.employerType ?? '',
    startDate: item.startDate,
    endDate: item.endDate ?? '',
    isCurrent: item.isCurrent,
    tasksText: (item.tasks ?? []).join('\n'),
    description: item.description ?? '',
    referenceName: item.referenceName ?? '',
    referenceContact: item.referenceContact ?? '',
  })

  showForm.value = true
}

async function saveEntry() {
  if (saving.value) return

  const jobTitle = form.jobTitle.trim()

  if (jobTitle.length < 2) {
    showFeedback('Please enter a job title with at least 2 characters.', 'error')
    return
  }

  if (!form.startDate) {
    showFeedback('Please provide a start date.', 'error')
    return
  }

  if (
    !form.isCurrent &&
    form.endDate &&
    form.endDate < form.startDate
  ) {
    showFeedback('End date cannot be earlier than start date.', 'error')
    return
  }

  const tasks = form.tasksText
    .split('\n')
    .map((task) => task.trim())
    .filter(Boolean)

  const payload: WorkerWorkHistoryInput = {
    id: editingId.value ?? undefined,
    jobTitle,
    employerName: form.employerName.trim() || null,
    employerType: form.employerType || null,
    startDate: form.startDate,
    endDate: form.isCurrent ? null : form.endDate || null,
    isCurrent: form.isCurrent,
    tasks,
    description: form.description.trim() || null,
    referenceName: form.referenceName.trim() || null,
    referenceContact: form.referenceContact.trim() || null,
  }

  saving.value = true
  clearFeedback()

  try {
    const wasEditing = !!editingId.value

await saveWorkerWorkHistory(payload)

showForm.value = false
resetForm()

await loadHistory()
showFeedback(
  wasEditing ? 'Work experience updated.' : 'Work experience saved.',
)
  } catch (error) {
    showFeedback(
      error instanceof Error ? error.message : 'Failed to save work experience.',
      'error',
    )
  } finally {
    saving.value = false
  }
}

function askDelete(item: WorkerWorkHistoryDTO) {
  deleteTarget.value = item
}

async function deleteEntry() {
  const target = deleteTarget.value
  if (!target) return

  deleteTarget.value = null
  clearFeedback()

  try {
    await deleteWorkerWorkHistory(target.id)
    history.value = history.value.filter((item) => item.id !== target.id)
    showFeedback('Work experience deleted.')
  } catch (error) {
    showFeedback(
      error instanceof Error ? error.message : 'Failed to delete work experience.',
      'error',
    )
  }
}

onMounted(loadHistory)
</script>
