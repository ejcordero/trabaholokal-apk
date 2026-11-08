
<template>
  <IonModal
    :is-open="open"
    :breakpoints="[0, 0.75, 1]"
    :initial-breakpoint="0.75"
    @will-dismiss="handleDismiss"
  >
    <IonHeader>
      <IonToolbar>
        <IonTitle class="truncate">
          {{ job?.title || 'Job details' }}
        </IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding">

      <!-- Loading -->
      <div
        v-if="loading"
        class="py-8 flex items-center justify-center"
      >
        <IonIcon
          name="refresh"
          class="h-6 w-6 animate-spin text-muted-foreground"
        />
      </div>

      <!-- Error -->
      <div v-else-if="error">
        <ErrorRetry
          :message="error"
          @retry="loadJob"
        />
      </div>

      <!-- Not found -->
      <div v-else-if="!job">
        <EmptyState
          title="Job not found"
          description="This job may have been removed or is no longer available."
        />
      </div>

      <!-- Job details -->
      <div v-else class="space-y-4">

        <!-- Header -->
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">

            <div class="flex items-center gap-1.5 flex-wrap">
              <UrgencyTag :level="job.urgencyLevel" />

              <StatusPill :status="job.category" />

              <StatusPill :status="job.employmentType" />
            </div>

            <h2 class="font-semibold text-lg mt-2">
              {{ job.title }}
            </h2>

            <p class="text-xs text-muted-foreground flex items-center gap-1 mt-1 flex-wrap">
              <IonIcon
                name="business"
                class="h-3.5 w-3.5"
              />

              {{ job.employerName || 'Employer' }}

              <VerifiedBadge
                :verification="job.employerVerification"
              />
            </p>
          </div>

          <MatchRing
            v-if="job.match"
            :score="job.match.score"
            :grade="job.match.grade"
            :size="56"
          />
        </div>

        <!-- Application status -->
        <div
          v-if="applied"
          class="rounded-lg border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30"
        >
          <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <IonIcon
              name="checkmark-circle"
              class="h-5 w-5"
            />

            <span class="font-semibold text-sm">
              Application submitted
            </span>
          </div>

          <p class="text-xs mt-1 text-emerald-700 dark:text-emerald-400">
            Your application was successfully submitted to the employer.
          </p>
        </div>

        <div
          v-else-if="queuedOffline"
          class="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"
        >
          <div class="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <IonIcon
              name="cloud-upload"
              class="h-5 w-5"
            />

            <span class="font-semibold text-sm">
              Saved offline — pending sync
            </span>
          </div>

          <p class="text-xs mt-1 text-amber-700 dark:text-amber-400">
            Your application is saved on this device. It has not yet been
            submitted to the employer. Reconnect to the internet to sync it.
          </p>
        </div>

        <!-- Quick facts -->
        <div class="grid grid-cols-2 gap-2 text-xs">

          <!-- Compensation -->
          <div class="rounded-md bg-muted/50 p-2">
            <p class="text-muted-foreground">
              Compensation
            </p>

            <p class="font-semibold text-sm">
              {{ formatCompensation(job.compensation, job.compensationType) }}
            </p>

            <div class="mt-1">
              <FairPayChip :fair="fair" />
            </div>
          </div>

          <!-- Location -->
          <div class="rounded-md bg-muted/50 p-2">
            <p class="text-muted-foreground">
              Location
            </p>

            <p class="font-semibold text-sm">
              {{ job.municipalityName || job.barangay || 'N/A' }}
            </p>

            <p
              v-if="job.distanceKm != null"
              class="text-[11px] text-muted-foreground"
            >
              {{ job.distanceKm.toFixed(1) }} km away
            </p>

            <p
              v-if="job.locationText"
              class="text-[11px] text-muted-foreground truncate"
            >
              {{ job.locationText }}
            </p>
          </div>

          <!-- Duration -->
          <div class="rounded-md bg-muted/50 p-2">
            <p class="text-muted-foreground">
              Duration
            </p>

            <p class="font-semibold text-sm">
              {{ formatRange(job.startDate, job.endDate) }}
            </p>
          </div>

          <!-- Working hours -->
          <div class="rounded-md bg-muted/50 p-2">
            <p class="text-muted-foreground">
              Working hours
            </p>

            <p class="font-semibold text-sm">
              {{ job.workingHours || 'Not specified' }}
            </p>
          </div>

          <!-- Application deadline -->
          <div
            v-if="job.applicationDeadline"
            class="rounded-md bg-muted/50 p-2 col-span-2"
          >
            <p class="text-muted-foreground">
              Apply before
            </p>

            <p class="font-semibold text-sm">
              {{ formatDate(job.applicationDeadline) }}
            </p>
          </div>

        </div>

        <!-- Scam warnings -->
        <ScamFlags :flags="job.scamFlags || []" />

        <!-- Description -->
        <div>
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Description
          </p>

          <p class="text-sm whitespace-pre-line">
            {{ job.description || 'No description provided.' }}
          </p>
        </div>

        <!-- Responsibilities -->
        <div v-if="job.responsibilities?.length">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Responsibilities
          </p>

          <ul class="text-sm list-disc pl-5 space-y-1">
            <li
              v-for="(item, index) in job.responsibilities"
              :key="index"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Qualifications -->
        <div v-if="job.qualifications?.length">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Qualifications
          </p>

          <ul class="text-sm list-disc pl-5 space-y-1">
            <li
              v-for="(item, index) in job.qualifications"
              :key="index"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Required skills -->
        <div v-if="job.requiredSkills?.length">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Required skills
          </p>

          <div
            v-if="job.requiredSkills.some(s => s.importance === 'required')"
            class="flex flex-wrap gap-1.5"
          >
            <StatusPill
              v-for="skill in job.requiredSkills.filter(s => s.importance === 'required')"
              :key="skill.id"
              :status="skill.skillName"
            />
          </div>

          <div
            v-if="job.requiredSkills.some(s => s.importance === 'preferred')"
            class="mt-2"
          >
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Preferred skills
            </p>

            <div class="flex flex-wrap gap-1.5">
              <StatusPill
                v-for="skill in job.requiredSkills.filter(s => s.importance === 'preferred')"
                :key="skill.id"
                :status="skill.skillName"
                variant="outline"
              />
            </div>
          </div>
        </div>

        <!-- Work schedules -->
        <div v-if="job.workSchedules?.length">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Work schedules
          </p>

          <div class="flex flex-wrap gap-1.5">
            <StatusPill
              v-for="schedule in job.workSchedules"
              :key="schedule"
              :status="schedule"
            />
          </div>
        </div>

        <!-- Work arrangements -->
        <div v-if="job.workArrangements?.length">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Work arrangements
          </p>

          <div class="flex flex-wrap gap-1.5">
            <StatusPill
              v-for="arrangement in job.workArrangements"
              :key="arrangement"
              :status="arrangement"
            />
          </div>
        </div>

        <Separator />

        <p class="text-[11px] text-muted-foreground">
          Posted {{ relativeTime(job.createdAt) }}
        </p>

      </div>
    </IonContent>

    <!-- Application footer -->
    <IonFooter v-if="!loading && !error && job">
      <div class="ion-padding flex flex-col gap-2">

        <!-- Already submitted -->
        <div v-if="applied">
          <IonButton
            disabled
            expand="block"
            class="w-full"
          >
            <IonIcon
              name="checkmark-circle"
              slot="start"
            />

            Application submitted
          </IonButton>
        </div>

        <!-- Saved offline -->
        <div v-else-if="queuedOffline">
          <IonButton
            disabled
            expand="block"
            class="w-full"
          >
            <IonIcon
              name="cloud-upload"
              slot="start"
            />

            Saved offline — pending sync
          </IonButton>
        </div>

        <!-- Apply -->
        <div v-else>
          <IonTextarea
            v-model="message"
            placeholder="Optional message to the employer (e.g. your relevant experience)"
            :rows="2"
            :maxlength="1000"
            :disabled="applying"
            class="border rounded-lg p-2"
          />

          <IonButton
            expand="block"
            class="w-full"
            :disabled="applying"
            @click="apply"
          >
            <IonIcon
              v-if="applying"
              name="refresh"
              slot="start"
              class="animate-spin"
            />

            <IonIcon
              v-else
              name="send"
              slot="start"
            />

            {{ applying ? 'Processing...' : 'Apply now' }}
          </IonButton>
        </div>

      </div>
    </IonFooter>

  </IonModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

import {
  IonModal,
  IonIcon,
  IonTextarea,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter
} from '@ionic/vue'

import {
  Separator,
  StatusPill,
  MatchRing,
  VerifiedBadge,
  UrgencyTag,
  ScamFlags,
  FairPayChip,
  EmptyState,
  ErrorRetry
} from '../worker/_ui'

import {
  applyToJob,
  getJob,
  getFairPay,
  saveOfflineApplication,
  useToast,
  type JobWithMatch,
  type FairPayResult,
  formatCompensation,
  formatRange,
  formatDate,
  relativeTime
} from '../worker/_lib'

interface JobDetailSheetProps {
  jobId: string | null
  job: JobWithMatch | null
}

const props = defineProps<JobDetailSheetProps>()

const emit = defineEmits<{
  'open-change': [id: string | null]
  applied: []
}>()

const { toast } = useToast()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const open = computed(() => !!props.jobId)

const loading = ref(false)
const applying = ref(false)

const error = ref<string | null>(null)
const message = ref('')

const applied = ref(false)
const queuedOffline = ref(false)

const fair = ref<FairPayResult | null>(null)

const detailJob = ref<JobWithMatch | null>(null)

const job = computed(() => {
  return detailJob.value ?? props.job
})

// Prevent an older request from replacing the currently selected job.
let requestVersion = 0

// ---------------------------------------------------------------------------
// Modal handling
// ---------------------------------------------------------------------------

const handleDismiss = () => {
  emit('open-change', null)
}

// ---------------------------------------------------------------------------
// Load job details
// ---------------------------------------------------------------------------

const loadJob = async () => {
  const jobId = props.jobId

  if (!jobId) {
    loading.value = false
    error.value = null
    detailJob.value = null
    applied.value = false
    queuedOffline.value = false
    fair.value = null
    return
  }

  const currentRequest = ++requestVersion

  loading.value = true
  error.value = null
  detailJob.value = null
  fair.value = null

  applied.value = false
  queuedOffline.value = false

  try {
    // Fetch the complete job and application status.
    const jobData = await getJob(jobId)

    // Ignore a response belonging to a previously selected job.
    if (currentRequest !== requestVersion) return

    detailJob.value = jobData
    applied.value = !!jobData.applied

    // Load fair-pay information separately.
    // A fair-pay error must not prevent job details from appearing.
    try {
      const fairResult = await getFairPay({
        category: jobData.category,
        compensationType: jobData.compensationType,
        compensation: jobData.compensation,
        municipalityId: jobData.municipalityId
      })

      if (currentRequest === requestVersion) {
        fair.value = fairResult
      }
    } catch (fairError) {
      console.warn('Fair-pay information unavailable:', fairError)

      if (currentRequest === requestVersion) {
        fair.value = null
      }
    }

  } catch (e: any) {
    if (currentRequest !== requestVersion) return

    console.error('Failed to load job details:', e)

    // Use listing data only as a fallback when offline.
    if (!navigator.onLine && props.job?.id === jobId) {
      detailJob.value = props.job
      error.value = null
    } else {
      error.value = e?.message || 'Failed to load job details.'
    }

  } finally {
    if (currentRequest === requestVersion) {
      loading.value = false
    }
  }
}

// ---------------------------------------------------------------------------
// Apply to job
// ---------------------------------------------------------------------------

const apply = async () => {
  const currentJob = job.value

  if (!currentJob || applying.value || applied.value || queuedOffline.value) {
    return
  }

  applying.value = true

  try {
    const applicationMessage = message.value.trim()

    // Offline application: save locally, not as submitted.
    if (!navigator.onLine) {
      await Promise.resolve(
        saveOfflineApplication({
          clientId:
            Date.now().toString() +
            '-' +
            Math.random().toString(36).slice(2),

          jobId: currentJob.id,
          message: applicationMessage,
          status: 'saved_offline',
          savedAt: new Date().toISOString(),
          lastError: null
        })
      )

      queuedOffline.value = true
      applied.value = false

      toast({
        message: 'Application saved offline. It is waiting to sync.',
        duration: 3500,
        color: 'warning'
      })

      return
    }

    // Online application: wait for server confirmation.
    await applyToJob(
      currentJob.id,
      applicationMessage || ''
    )

    applied.value = true
    queuedOffline.value = false

    toast({
      message: 'Application successfully submitted.',
      duration: 3000,
      color: 'success'
    })

    // Refresh the parent job list only after server confirmation.
    emit('applied')

  } catch (e: any) {
    console.error('Application failed:', e)

    const status = e?.status || 0
    const errorMessage = e?.message || 'Could not submit your application.'

    if (status === 409) {
      applied.value = true

      toast({
        message: 'You have already applied for this job.',
        duration: 3000,
        color: 'warning'
      })

    } else if (status === 400) {
      toast({
        message: 'Cannot apply: ' + errorMessage,
        duration: 3500,
        color: 'danger'
      })

    } else {
      toast({
        message: errorMessage,
        duration: 3500,
        color: 'danger'
      })
    }

  } finally {
    applying.value = false
  }
}

// ---------------------------------------------------------------------------
// Watch selected job
// ---------------------------------------------------------------------------

watch(
  () => props.jobId,
  () => {
    // Invalidate previous requests immediately.
    requestVersion++

    applied.value = false
    queuedOffline.value = false

    message.value = ''
    detailJob.value = null
    fair.value = null
    error.value = null

    if (props.jobId) {
      loadJob()
    } else {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
