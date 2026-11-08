
<template>
  <AppShell :title="employment?.jobTitle ?? 'Employment'" back @back="emit('back')">
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <LoadingCards v-if="loading" :count="3" />

      <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />

      <EmptyState
        v-else-if="!employment"
        :icon="Icons.BriefcaseBusiness"
        title="Employment not found"
        description="This employment may no longer be available."
      />

      <div v-else class="space-y-4">
        <!-- Employment overview -->
        <div class="tl-card">
          <div class="tl-card-body space-y-3">
            <div>
              <p class="font-semibold">{{ employment.jobTitle }}</p>
              <p class="text-xs tl-muted">{{ employment.employerName }}</p>

              <div class="flex flex-wrap items-center gap-2 mt-2">
                <StatusPill
                  :status="employment.status"
                  :list="EMPLOYMENT_STATUSES"
                />
                <span class="tl-caption">
                  {{ employment.employmentEvent.replace(/_/g, ' ') }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p class="tl-muted">Compensation</p>
                <p class="font-medium">
                  {{ formatCompensation(employment.agreedCompensation, employment.compensationType) }}
                </p>
              </div>

              <div>
                <p class="tl-muted">Location</p>
                <p class="font-medium">
                  {{ employment.municipalityName ?? 'Not specified' }}
                </p>
              </div>

              <div>
                <p class="tl-muted">Start date</p>
                <p class="font-medium">{{ formatDate(employment.startDate) }}</p>
              </div>

              <div>
                <p class="tl-muted">End date</p>
                <p class="font-medium">
                  {{ employment.endDate ? formatDate(employment.endDate) : 'Not specified' }}
                </p>
              </div>

              <div>
                <p class="tl-muted">Working hours</p>
                <p class="font-medium">
                  {{ employment.workingHours ?? 'Not specified' }}
                </p>
              </div>

              <div>
                <p class="tl-muted">Target workdays</p>
                <p class="font-medium">{{ employment.targetWorkdays }}</p>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="tl-muted">Approved workdays</span>
                <span class="font-medium">
                  {{ employment.approvedWorkdays }}/{{ employment.targetWorkdays }}
                  ({{ employment.progressPercent }}%)
                </span>
              </div>
              <ProgressBar :value="employment.progressPercent" />
              <p class="tl-caption mt-1">
                Only employer-approved reports count toward completed workdays.
              </p>
            </div>

            <div v-if="employment.pendingReports > 0" class="tl-safety">
              {{ employment.pendingReports }} report(s) are awaiting employer review.
            </div>

            <button
              v-if="canSubmitReport"
              type="button"
              class="tl-btn w-full"
              @click="reportOpen = true"
            >
              <ion-icon :icon="Icons.FileText" />
              Submit daily report
            </button>

            <p v-else-if="employment.status === 'completed'" class="tl-caption">
              This employment is completed. You can still view your work records.
            </p>

            <p v-else-if="employment.status === 'terminated'" class="tl-caption">
              This employment has been terminated. New reports cannot be submitted.
            </p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tl-chip-row">
          <button
            type="button"
            class="tl-chip"
            :class="{ on: tab === 'reports' }"
            @click="tab = 'reports'"
          >
            Reports ({{ employment.accomplishments.length }})
          </button>

          <button
            type="button"
            class="tl-chip"
            :class="{ on: tab === 'renewals' }"
            @click="tab = 'renewals'"
          >
            Renewals ({{ employment.renewals.length }})
          </button>

          <button
            type="button"
            class="tl-chip"
            :class="{ on: tab === 'evaluation' }"
            @click="tab = 'evaluation'"
          >
            Evaluation ({{ employment.evaluations.length }})
          </button>
        </div>

        <!-- Daily reports -->
        <div v-if="tab === 'reports'" class="space-y-3">
          <EmptyState
            v-if="employment.accomplishments.length === 0"
            :icon="Icons.FileText"
            title="No daily reports yet"
            description="Submit a report when you complete work for this employment."
          />

          <div
            v-for="report in employment.accomplishments"
            :key="report.id"
            class="tl-card"
          >
            <div class="tl-card-body space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="font-semibold text-sm">
                    {{ formatDate(report.workDate) }}
                  </p>
                  <p class="tl-caption">
                    Submitted {{ formatDate(report.createdAt) }}
                  </p>
                </div>

                <StatusPill
                  :status="report.status"
                  :list="ACCOMPLISHMENT_STATUSES"
                />
              </div>

              <div v-if="report.tasks.length" class="space-y-1">
                <p class="text-xs font-semibold">Tasks completed</p>
                <ul class="list-disc pl-5 text-sm space-y-1">
                  <li v-for="(task, index) in report.tasks" :key="index">
                    {{ task }}
                  </li>
                </ul>
              </div>

              <div>
                <p class="text-xs font-semibold">Work description</p>
                <p class="text-sm whitespace-pre-wrap">{{ report.description }}</p>
              </div>

              <div v-if="report.progressPercent > 0">
                <p class="text-xs tl-muted mb-1">
                  Reported progress: {{ report.progressPercent }}%
                </p>
                <ProgressBar :value="report.progressPercent" />
              </div>

              <div v-if="report.remarks">
                <p class="text-xs font-semibold">Remarks</p>
                <p class="text-sm">{{ report.remarks }}</p>
              </div>

              <div v-if="report.photos.length" class="space-y-2">
                <p class="text-xs font-semibold">Photo evidence</p>
                <div class="grid grid-cols-3 gap-2">
                  <a
                    v-for="photo in report.photos"
                    :key="photo.id"
                    :href="photo.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block"
                  >
                    <img
                      :src="photo.url"
                      alt="Accomplishment evidence"
                      class="w-full aspect-square object-cover rounded-lg"
                    />
                  </a>
                </div>
              </div>

              <div v-if="report.status === 'approved'" class="tl-safety">
                <p class="font-semibold text-sm">Report approved</p>
                <p class="text-xs mt-1">
                  This report has been approved by your employer.
                  It contributes to your approved workday count.
                </p>
                <p v-if="report.employerFeedback" class="text-sm mt-2">
                  {{ report.employerFeedback }}
                </p>
              </div>

              <div
                v-else-if="report.status === 'rejected'"
                class="rounded-lg border border-rose-200 bg-rose-50 p-3"
              >
                <p class="font-semibold text-sm text-rose-700">
                  Report needs correction
                </p>
                <p v-if="report.rejectionReason" class="text-sm mt-1 text-rose-700">
                  {{ report.rejectionReason }}
                </p>
                <p v-if="report.employerFeedback" class="text-sm mt-1 text-rose-700">
                  {{ report.employerFeedback }}
                </p>
                <p class="text-xs mt-2 text-rose-700">
                  You may submit a corrected report for this work date.
                </p>
              </div>

              <div v-else class="tl-caption">
                Waiting for your employer to review this report.
              </div>
            </div>
          </div>
        </div>

        <!-- Renewal requests -->
        <div v-else-if="tab === 'renewals'" class="space-y-3">
          <EmptyState
            v-if="employment.renewals.length === 0"
            :icon="Icons.CalendarDays"
            title="No renewal requests"
            description="Renewal requests from your employer will appear here."
          />

          <div
            v-for="renewal in employment.renewals"
            :key="renewal.id"
            class="tl-card"
          >
            <div class="tl-card-body space-y-3">
              <div class="flex items-center justify-between gap-2">
                <p class="font-semibold text-sm">
                  {{ renewal.proposedExtension.replace(/_/g, ' ') }}
                </p>

                <StatusPill
                  :status="renewal.status"
                  :list="RENEWAL_STATUSES"
                />
              </div>

              <div class="text-sm space-y-2">
                <p>
                  <span class="tl-muted">Proposed end date:</span>
                  {{ formatDate(renewal.newEndDate) }}
                </p>

                <p>
                  <span class="tl-muted">Compensation terms:</span>
                  {{ renewal.compensationTerms }}
                </p>

                <p v-if="renewal.reason">
                  <span class="tl-muted">Reason:</span>
                  {{ renewal.reason }}
                </p>

                <p class="tl-caption">
                  Requested {{ formatDate(renewal.createdAt) }}
                </p>
              </div>

              <div
                v-if="renewal.status === 'pending' && canRespondToRenewal"
                class="flex flex-wrap gap-2"
              >
                <button
                  type="button"
                  class="tl-btn"
                  :disabled="respondingRenewalId === renewal.id"
                  @click="respondToRenewal(renewal.id, 'accepted')"
                >
                  Accept
                </button>

                <button
                  type="button"
                  class="tl-btn outline"
                  :disabled="respondingRenewalId === renewal.id"
                  @click="respondToRenewal(renewal.id, 'declined')"
                >
                  Decline
                </button>
              </div>

              <p
                v-if="renewal.status === 'pending'"
                class="tl-caption"
              >
                Review the proposed extension and compensation terms before responding.
              </p>
            </div>
          </div>
        </div>

        <!-- Employer evaluation -->
        <div v-else class="space-y-3">
          <EmptyState
            v-if="employment.evaluations.length === 0"
            :icon="Icons.Star"
            title="No evaluation yet"
            description="Your employer has not submitted an evaluation for this employment."
          />

          <div
            v-for="evaluation in employment.evaluations"
            :key="evaluation.id"
            class="tl-card"
          >
            <div class="tl-card-body space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1">
                  <ion-icon
                    v-for="n in 5"
                    :key="n"
                    :icon="Icons.Star"
                    :style="{
                      color: n <= evaluation.rating ? '#d97706' : '#d1d5db',
                      fontSize: '18px'
                    }"
                  />
                </div>

                <span class="tl-caption">
                  {{ formatDate(evaluation.createdAt) }}
                </span>
              </div>

              <p v-if="evaluation.comment" class="text-sm whitespace-pre-wrap">
                {{ evaluation.comment }}
              </p>

              <div class="flex flex-wrap gap-3 text-xs tl-muted">
                <span v-if="evaluation.punctuality != null">
                  Punctuality: {{ evaluation.punctuality }}/5
                </span>
                <span v-if="evaluation.quality != null">
                  Quality: {{ evaluation.quality }}/5
                </span>
                <span v-if="evaluation.attitude != null">
                  Attitude: {{ evaluation.attitude }}/5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PullRefresh>

    <!-- Daily accomplishment form -->
    <WorkerAccomplishmentForm
      v-if="reportOpen"
      :employment-id="employmentId"
      @close="reportOpen = false"
      @saved="onReportSaved"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon } from '@ionic/vue'

import {
  ACCOMPLISHMENT_STATUSES,
  EMPLOYMENT_STATUSES,
  RENEWAL_STATUSES,
  getEmployment,
  respondRenewal,
  useAsync,
  useToast,
  type EmploymentDetailDTO,
} from './_lib'

import {
  AppShell,
  EmptyState,
  ErrorRetry,
  Icons,
  LoadingCards,
  ProgressBar,
  PullRefresh,
  RefreshHeader,
  StatusPill,
  formatCompensation,
  formatDate,
} from './_ui'

import WorkerAccomplishmentForm from './WorkerAccomplishmentForm.vue'

const props = defineProps<{ employmentId: string }>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const { toast } = useToast()

const tab = ref<'reports' | 'renewals' | 'evaluation'>('reports')
const reportOpen = ref(false)
const respondingRenewalId = ref<string | null>(null)

const {
  data: employment,
  loading,
  error,
  refresh,
} = useAsync<EmploymentDetailDTO>(
  () => getEmployment(props.employmentId),
  () => [props.employmentId]
)

const canSubmitReport = computed(() =>
  employment.value?.status === 'active'
)

const canRespondToRenewal = computed(() =>
  Boolean(
    employment.value &&
    ['pending_start', 'active', 'paused'].includes(employment.value.status)
  )
)

async function respondToRenewal(
  renewalId: string,
  decision: 'accepted' | 'declined'
) {
  respondingRenewalId.value = renewalId

  try {
    await respondRenewal(props.employmentId, renewalId, decision)

    await toast(
      decision === 'accepted'
        ? 'You accepted the renewal request.'
        : 'You declined the renewal request.',
      'success'
    )

    await refresh()
  } catch (e: any) {
    await toast(
      e?.message || 'Could not respond to the renewal request.',
      'danger'
    )
  } finally {
    respondingRenewalId.value = null
  }
}

async function onReportSaved() {
  reportOpen.value = false
  await refresh()
}
</script>
