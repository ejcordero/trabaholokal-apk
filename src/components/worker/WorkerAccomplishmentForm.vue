<template>
  <BottomSheet :open="true" title="Submit daily report" @close="emit('close')">
    <div class="space-y-4">
      <Field label="Work date" required>
        <IonInput
          :value="workDate"
          :max="today"
          type="date"
          class="tl-input"
          @ionInput="workDate = String($event.detail.value ?? '')"
        />
      </Field>

      <Field label="Tasks completed" hint="Add as many as you like.">
        <div class="space-y-2">
          <div v-for="(t, i) in tasks" :key="i" class="flex items-center gap-2">
            <IonInput
              :value="t"
              class="tl-input"
              :placeholder="`Task ${i + 1}`"
              @ionInput="setTask(i, String($event.detail.value ?? ''))"
            />
            <button
              v-if="tasks.length > 1"
              type="button"
              class="tl-btn ghost icon remove-task"
              :aria-label="`Remove task ${i + 1}`"
              @click="removeTask(i)"
            >
              <IonIcon :icon="Icons.CloseCircle" />
            </button>
          </div>
          <button type="button" class="tl-btn outline sm" @click="addTask">
            <IonIcon :icon="Icons.Plus" />
            Add task
          </button>
        </div>
      </Field>

      <Field label="Description of work" required>
        <IonTextarea
          :value="description"
          class="tl-input"
          placeholder="What did you do today? Be specific — materials used, areas completed, etc."
          :rows="4"
          :maxlength="2000"
          auto-grow
          @ionInput="description = String($event.detail.value ?? '')"
        />
      </Field>

      <Field :label="`Progress: ${progress}%`">
        <IonRange
          :value="progress"
          :min="0"
          :max="100"
          :step="5"
          @ionChange="progress = Number($event.detail.value ?? 0)"
        />
      </Field>

      <Field label="Remarks" hint="Optional — anything the employer should know.">
        <IonTextarea
          :value="remarks"
          class="tl-input"
          placeholder="e.g. Materials ran low. Need more cement tomorrow."
          :rows="2"
          :maxlength="1000"
          auto-grow
          @ionInput="remarks = String($event.detail.value ?? '')"
        />
      </Field>

      <Field label="Photos" hint="JPG/PNG/WEBP up to 5MB each.">
        <div class="space-y-2">
          <button type="button" class="tl-btn sm" :disabled="uploading || saving" @click="fileInput?.click()">
            <IonIcon :icon="Icons.Plus" />
            {{ uploading ? 'Uploading…' : 'Add photos' }}
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            class="hidden-file"
            @change="onFileChange"
          />
          <div v-if="photos.length > 0" class="photo-grid">
            <div v-for="(p, i) in photos" :key="i" class="photo-item">
              <img :src="p.url" :alt="p.name" />
              <button
                type="button"
                class="photo-remove"
                :aria-label="`Remove ${p.name}`"
                @click="photos.splice(i, 1)"
              >
                <IonIcon :icon="Icons.CloseCircle" />
              </button>
            </div>
          </div>
        </div>
      </Field>

      <div v-if="err" class="error-box">
        <IonIcon :icon="Icons.AlertTriangle" class="shrink-0" />
        <span>{{ err }}</span>
      </div>

      <div class="tl-divider" />
    </div>

    <template #footer>
      <div class="form-actions">
        <button type="button" class="tl-btn outline" :disabled="saving" @click="emit('close')">Cancel</button>
        <button
          type="button"
          class="tl-btn"
          :disabled="saving || uploading"
          @click="submit"
        >
          <IonIcon v-if="saving" :icon="Icons.Loader2" class="tl-spin" />
          <IonIcon v-else :icon="Icons.Send" />
          {{ saving ? 'Submitting…' : 'Submit report' }}
        </button>
      </div>
    </template>
  </BottomSheet>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonIcon, IonInput, IonRange, IonTextarea } from '@ionic/vue'
import { BottomSheet, Field, Icons } from './_ui'
import {
  ApiError,
  createAccomplishment,
  uploadImage,
  useToast,
  type AccomplishmentDTO,
} from './_lib'

const props = defineProps<{ employmentId: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', acc: AccomplishmentDTO): void
}>()

const { toast } = useToast()

const today = new Date().toISOString().slice(0, 10)
const workDate = ref(today)
const tasks = ref<string[]>([''])
const description = ref('')
const progress = ref(0)
const remarks = ref('')
const photos = ref<{ url: string; name: string }[]>([])
const uploading = ref(false)
const saving = ref(false)
const err = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function setTask(i: number, value: string) {
  tasks.value = tasks.value.map((task, index) => (index === i ? value : task))
}

function addTask() {
  tasks.value = [...tasks.value, '']
}

function removeTask(i: number) {
  tasks.value = tasks.value.filter((_, index) => index !== i)
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  uploading.value = true
  try {
    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast(`${file.name} is not a JPG/PNG/WEBP image.`, 'danger')
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast(`${file.name} is over 5MB.`, 'danger')
        continue
      }
      const url = await uploadImage(file)
      photos.value = [...photos.value, { url, name: file.name }]
    }
  } catch (e: any) {
    toast(e?.message || 'Upload failed.', 'danger')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function submit() {
  err.value = null
  if (!workDate.value) {
    err.value = 'Work date is required.'
    return
  }
  if (!description.value.trim()) {
    err.value = 'A description of work is required.'
    return
  }
  saving.value = true
  try {
    const acc = await createAccomplishment(props.employmentId, {
      workDate: workDate.value,
      tasks: tasks.value.filter(Boolean),
      description: description.value.trim(),
      progressPercent: progress.value,
      remarks: remarks.value.trim() || null,
      photoUrls: photos.value.map((p) => p.url),
    })
    toast('Your employer will review it shortly.', 'success')
    emit('saved', acc)
    emit('close')
  } catch (e: any) {
    const status = e instanceof ApiError ? e.status : 0
    if (status === 409) {
      err.value = 'You already have a pending report for this date. Wait for review or change the date.'
    } else {
      err.value = e?.message || 'Could not submit report.'
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.remove-task {
  flex: none;
  color: var(--tl-muted);
}
.hidden-file {
  display: none;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--tl-border);
}
.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
}
.error-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background: #fff1f2;
  color: #be123c;
  font-size: 13px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-bottom: 12px;
}
</style>
