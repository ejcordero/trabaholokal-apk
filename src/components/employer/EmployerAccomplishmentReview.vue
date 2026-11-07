<template>
  <BottomSheet
    :open="!!accomplishment"
    :title="accomplishment ? `Report · ${formatDate(accomplishment.workDate)}` : 'Review report'"
    @close="emit('close')"
  >
    <div v-if="accomplishment" class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs tl-muted">Submitted {{ relativeTime(accomplishment.createdAt) }}</p>
        <StatusPill :status="accomplishment.status" :list="ACCOMPLISHMENT_STATUSES" />
      </div>

      <div>
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="tl-muted">Progress</span>
          <span class="font-medium">{{ accomplishment.progressPercent }}%</span>
        </div>
        <ProgressBar :value="accomplishment.progressPercent" />
      </div>

      <p v-if="accomplishment.description" class="text-sm">{{ accomplishment.description }}</p>

      <ul v-if="accomplishment.tasks.length" class="list-disc pl-5 text-sm space-y-0.5">
        <li v-for="(task, index) in accomplishment.tasks" :key="index">{{ task }}</li>
      </ul>

      <div v-if="accomplishment.photos.length" class="photo-grid">
        <img
          v-for="photo in accomplishment.photos"
          :key="photo.id"
          :src="photo.url"
          alt="Work photo"
          loading="lazy"
        />
      </div>

      <p v-if="accomplishment.remarks" class="text-xs tl-muted">
        Worker remarks: {{ accomplishment.remarks }}
      </p>

      <template v-if="isPending">
        <Field label="Decision" required>
          <div class="flex gap-2">
            <button
              type="button"
              class="tl-btn sm"
              :class="{ outline: decision !== 'approved' }"
              @click="decision = 'approved'"
            >
              <ion-icon :icon="Icons.Check" /> Approve
            </button>
            <button
              type="button"
              class="tl-btn sm danger"
              :class="{ outline: decision !== 'rejected' }"
              @click="decision = 'rejected'"
            >
              <ion-icon :icon="Icons.Close" /> Reject
            </button>
          </div>
        </Field>

        <Field label="Feedback" hint="Optional. Shared with the worker.">
          <textarea v-model="feedback" class="tl-textarea" rows="2" placeholder="Add feedback" />
        </Field>

        <Field v-if="decision === 'rejected'" label="Rejection reason" required>
          <textarea
            v-model="rejectionReason"
            class="tl-textarea"
            rows="2"
            placeholder="Explain what needs fixing"
          />
        </Field>

        <p v-if="formError" class="tl-error">{{ formError }}</p>

        <div class="flex gap-2">
          <button type="button" class="tl-btn outline" @click="emit('close')">Cancel</button>
          <button
            type="button"
            class="tl-btn"
            :disabled="submitting || !decision"
            @click="onSubmit"
          >
            <ion-icon :icon="submitting ? Icons.Loader2 : Icons.Send" :class="{ 'tl-spin': submitting }" />
            {{ decision === 'rejected' ? 'Reject report' : 'Approve report' }}
          </button>
        </div>
      </template>

      <template v-else>
        <div class="tl-card" style="background: var(--tl-bg)">
          <div class="tl-card-body">
            <p class="text-xs uppercase tl-muted">Reviewed</p>
            <p class="text-sm mt-0.5">
              {{ accomplishment.reviewedAt ? formatDateTime(accomplishment.reviewedAt) : 'Previously reviewed' }}
            </p>
            <p v-if="accomplishment.employerFeedback" class="text-sm mt-1">
              Feedback: {{ accomplishment.employerFeedback }}
            </p>
            <p v-if="accomplishment.rejectionReason" class="text-sm mt-1" style="color: #b91c1c">
              Reason: {{ accomplishment.rejectionReason }}
            </p>
          </div>
        </div>
        <button type="button" class="tl-btn outline" @click="emit('close')">Close</button>
      </template>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      title="Reject this report?"
      message="Rejecting means this workday will not count toward the worker's completed workdays. Add a clear reason first."
      confirm-label="Reject report"
      :danger="true"
      @cancel="confirmOpen = false"
      @confirm="submit"
    />
  </BottomSheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  ACCOMPLISHMENT_STATUSES,
  reviewAccomplishment,
  useToast,
  type AccomplishmentDTO,
} from '../worker/_lib'
import {
  BottomSheet,
  ConfirmDialog,
  Field,
  formatDate,
  formatDateTime,
  Icons,
  ProgressBar,
  relativeTime,
  StatusPill,
} from '../worker/_ui'

const props = defineProps<{ accomplishment: AccomplishmentDTO | null; employmentId?: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'reviewed', item: AccomplishmentDTO): void
}>()

const { toast } = useToast()
const decision = ref<'approved' | 'rejected' | ''>('')
const feedback = ref('')
const rejectionReason = ref('')
const submitting = ref(false)
const formError = ref('')
const confirmOpen = ref(false)

const isPending = computed(() => props.accomplishment?.status === 'pending')

watch(
  () => props.accomplishment?.id,
  () => {
    decision.value = ''
    feedback.value = ''
    rejectionReason.value = ''
    formError.value = ''
    confirmOpen.value = false
  }
)

function onSubmit() {
  if (!decision.value) {
    formError.value = 'Choose to approve or reject this report.'
    return
  }
  if (decision.value === 'rejected') {
    if (!rejectionReason.value.trim()) {
      formError.value = 'A rejection reason is required.'
      return
    }
    confirmOpen.value = true
    return
  }
  void submit()
}

async function submit() {
  confirmOpen.value = false
  const item = props.accomplishment
  if (!item || !decision.value) return
  if (decision.value === 'rejected' && !rejectionReason.value.trim()) {
    formError.value = 'A rejection reason is required.'
    return
  }
  submitting.value = true
  formError.value = ''
  try {
    const updated = await reviewAccomplishment(
      item.id,
      decision.value,
      feedback.value.trim() || null,
      decision.value === 'rejected' ? rejectionReason.value.trim() : null
    )
    await toast(decision.value === 'approved' ? 'Report approved.' : 'Report rejected.')
    emit('reviewed', updated)
    emit('close')
  } catch (e: any) {
    formError.value = e?.message || 'Could not review the report.'
    await toast(formError.value, 'danger')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.photo-grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--tl-border);
}
</style>
