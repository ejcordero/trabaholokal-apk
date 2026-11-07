<template>
  <BottomSheet :open="Boolean(report)" :title="reportTitle" @close="emit('close')">
    <div v-if="report" class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <StatusPill :status="report.status" :list="REPORT_STATUSES" />
        <span class="tl-pill">{{ formatDateTime(report.createdAt) }}</span>
      </div>

      <SectionTitle>Reporter</SectionTitle>
      <div class="tl-card">
        <div class="tl-card-body reporter-row">
          <IonIcon :icon="Icons.User" class="row-icon text-muted-foreground" />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-sm truncate">{{ report.reporterName }}</p>
            <p class="text-xs text-muted-foreground">
              <span class="tl-pill capitalize">{{ report.reporterRole }}</span>
              Account ID: {{ report.reporterAccountId.slice(-8) }}
            </p>
          </div>
        </div>
      </div>

      <SectionTitle>Target</SectionTitle>
      <button
        v-if="report.targetAccountId"
        type="button"
        class="tl-card clickable target-card"
        @click="viewUser"
      >
        <div class="tl-card-body reporter-row">
          <IonIcon :icon="Icons.User" class="row-icon text-amber-600" />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-sm truncate">{{ report.targetName ?? 'Account' }}</p>
            <p class="text-xs text-muted-foreground truncate">
              Account ID: {{ report.targetAccountId.slice(-8) }}
            </p>
          </div>
          <IonIcon :icon="Icons.ChevronRight" class="text-muted-foreground" />
        </div>
      </button>
      <button
        v-else-if="report.targetJobId"
        type="button"
        class="tl-card clickable target-card"
        @click="viewJob"
      >
        <div class="tl-card-body reporter-row">
          <IonIcon :icon="Icons.Briefcase" class="row-icon text-amber-600" />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-sm truncate">{{ report.targetJobTitle ?? 'Job' }}</p>
            <p class="text-xs text-muted-foreground truncate">
              Job ID: {{ report.targetJobId.slice(-8) }}
            </p>
          </div>
          <IonIcon :icon="Icons.ChevronRight" class="text-muted-foreground" />
        </div>
      </button>
      <div v-else class="tl-card">
        <div class="tl-card-body text-xs text-muted-foreground">
          No target recorded for this report.
        </div>
      </div>

      <button
        v-if="report.targetAccountId"
        type="button"
        class="tl-btn outline block"
        @click="viewUser"
      >
        <IonIcon :icon="Icons.User" />
        View reported user
      </button>
      <button
        v-if="report.targetJobId"
        type="button"
        class="tl-btn outline block"
        @click="viewJob"
      >
        <IonIcon :icon="Icons.Briefcase" />
        View reported job
      </button>

      <SectionTitle>Description</SectionTitle>
      <div class="tl-card">
        <div class="tl-card-body">
          <p class="text-sm pre-line">{{ report.description }}</p>
        </div>
      </div>

      <template v-if="report.resolutionNote">
        <SectionTitle>Existing resolution note</SectionTitle>
        <div class="tl-card muted-card">
          <div class="tl-card-body">
            <p class="text-sm pre-line">{{ report.resolutionNote }}</p>
          </div>
        </div>
      </template>

      <div class="tl-divider" />

      <div class="space-y-3">
        <Field label="Update status" required>
          <FormSelect v-model="status" :options="STATUS_OPTIONS" />
        </Field>
        <Field
          label="Resolution note"
          hint="Visible to the reporter. Required when resolving or dismissing."
        >
          <textarea
            v-model="note"
            class="tl-textarea"
            rows="4"
            maxlength="2000"
            placeholder="Explain the outcome of this report…"
          />
        </Field>
      </div>
    </div>

    <template #footer>
      <div class="sheet-actions">
        <button type="button" class="tl-btn outline" :disabled="saving" @click="emit('close')">
          Cancel
        </button>
        <button type="button" class="tl-btn" :disabled="saving || !report" @click="save">
          <IonIcon
            :icon="saving ? Icons.Loader2 : Icons.CheckCircle2"
            :class="{ 'tl-spin': saving }"
          />
          Save update
        </button>
      </div>
    </template>
  </BottomSheet>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed, ref, watch } from 'vue'

import {
  BottomSheet,
  Field,
  FormSelect,
  Icons,
  SectionTitle,
  StatusPill,
} from '../worker/_ui'
import {
  REPORT_REASONS,
  REPORT_STATUSES,
  formatDateTime,
  labelFor,
  updateReport,
  useToast,
  type ReportDTO,
} from '../worker/_lib'

const props = defineProps<{ report: ReportDTO | null }>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
  (e: 'view-user', userId: string): void
  (e: 'view-job', jobId: string): void
}>()

const { toast } = useToast()

const STATUS_OPTIONS = REPORT_STATUSES.map((s) => ({ value: s.value, label: s.label }))

const status = ref('open')
const note = ref('')
const saving = ref(false)

watch(
  () => props.report,
  (report) => {
    status.value = report?.status ?? 'open'
    note.value = report?.resolutionNote ?? ''
  },
  { immediate: true }
)

const reportTitle = computed(() =>
  props.report ? labelFor(props.report.reason, REPORT_REASONS) : 'Report'
)

function viewUser(): void {
  const id = props.report?.targetAccountId
  if (id) emit('view-user', id)
}

function viewJob(): void {
  const id = props.report?.targetJobId
  if (id) emit('view-job', id)
}

function successTitle(value: string): string {
  if (value === 'resolved') return 'Report resolved'
  if (value === 'dismissed') return 'Report dismissed'
  if (value === 'under_review') return 'Under review'
  return 'Report reopened'
}

async function save(): Promise<void> {
  const report = props.report
  if (!report || saving.value) return
  if ((status.value === 'resolved' || status.value === 'dismissed') && !note.value.trim()) {
    toast('Add a resolution note before resolving or dismissing.', 'danger')
    return
  }
  saving.value = true
  try {
    await updateReport(report.id, status.value, note.value.trim() || null)
    toast(`${successTitle(status.value)}. The reporter has been notified.`, 'success')
    emit('updated')
    emit('close')
  } catch (e: any) {
    toast(e?.message || 'Could not update report.', 'danger')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.reporter-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.row-icon {
  font-size: 20px;
  margin-top: 2px;
  flex: none;
}

.target-card {
  width: 100%;
  text-align: left;
  font: inherit;
  padding: 0;
  color: inherit;
}

.muted-card {
  background: #f9fafb;
}

.pre-line {
  white-space: pre-line;
}

.sheet-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 4px;
}
</style>
