<template>
  <ion-modal 
    :is-open="open" 
    @will-dismiss="$emit('open-change', null)"
    :breakpoints="[0, 0.75, 1]"
    :initial-breakpoint="0.75"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title class="truncate">{{ job?.title || 'Job details' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="loading" class="py-8 flex items-center justify-center">
        <IonIcon name="refresh" class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="error">
        <ErrorRetry :message="error" @retry="$emit('open-change', jobId)" />
      </div>
      <div v-else-if="!job">
        <EmptyState title="Job not found" description="This job may have been removed." />
      </div>
      <div v-else class="space-y-4">
        <!-- Header -->
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <UrgencyTag :level="job.urgencyLevel" />
              <StatusPill :status="job.category" />
              <StatusPill :status="job.employmentType" />
            </div>
            <h2 class="font-semibold text-lg mt-1">{{ job.title }}</h2>
            <p class="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <IonIcon name="business" class="h-3.5 w-3.5" /> {{ job.employerName }}
              <VerifiedBadge :verification="job.employerVerification" />
            </p>
          </div>
          <MatchRing v-if="job.match" :score="job.match.score" :grade="job.match.grade" :size="56" />
        </div>

        <!-- Quick facts -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="rounded-md bg-muted/50 p-2">
            <p class="text-muted-foreground">Compensation</p>
            <p class="font-semibold text-sm">{{ formatCompensation(job.compensation, job.compensationType) }}</p>
            <div class="mt-1">
              <FairPayChip :fair="fair" />
            </div>
          </div>
          <div class="rounded-md bg-muted/50 p-2">
            <p class="text-muted-foreground">Location</p>
            <p class="font-semibold text-sm">{{ job.municipalityName || job.barangay || 'N/A' }}</p>
            <p v-if="job.distanceKm != null" class="text-[11px] text-muted-foreground">{{ job.distanceKm.toFixed(1) }} km away</p>
            <p v-if="job.locationText" class="text-[11px] text-muted-foreground truncate">{{ job.locationText }}</p>
          </div>
          <div class="rounded-md bg-muted/50 p-2">
            <p class="text-muted-foreground">Duration</p>
            <p class="font-semibold text-sm">{{ formatRange(job.startDate, job.endDate) }}</p>
          </div>
          <div class="rounded-md bg-muted/50 p-2">
            <p class="text-muted-foreground">Working hours</p>
            <p class="font-semibold text-sm">{{ job.workingHours || 'N/A' }}</p>
          </div>
          <div v-if="job.applicationDeadline" class="rounded-md bg-muted/50 p-2 col-span-2">
            <p class="text-muted-foreground">Apply before</p>
            <p class="font-semibold text-sm">{{ formatDate(job.applicationDeadline) }}</p>
          </div>
        </div>

        <ScamFlags :flags="job.scamFlags" />

        <!-- Description -->
        <div>
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
          <p class="text-sm whitespace-pre-line">{{ job.description }}</p>
        </div>

        <!-- Responsibilities -->
        <div v-if="job.responsibilities.length > 0">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Responsibilities</p>
          <ul class="text-sm list-disc pl-5 space-y-0.5">
            <li v-for="(r, i) in job.responsibilities" :key="i">{{ r }}</li>
          </ul>
        </div>

        <!-- Qualifications -->
        <div v-if="job.qualifications.length > 0">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Qualifications</p>
          <ul class="text-sm list-disc pl-5 space-y-0.5">
            <li v-for="(r, i) in job.qualifications" :key="i">{{ r }}</li>
          </ul>
        </div>

        <!-- Required skills -->
        <div v-if="job.requiredSkills.length > 0">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Required skills</p>
          <div class="flex flex-wrap gap-1.5">
            <StatusPill 
              v-for="skill in job.requiredSkills.filter(s => s.importance === 'required')"
              :key="skill.id"
              :status="skill.skillName"
            />
          </div>
          <div v-if="job.requiredSkills.some(s => s.importance === 'preferred')" class="mt-2">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Preferred</p>
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

        <!-- Match breakdown -->
        <div v-if="job.match?.breakdown">
          <MatchBreakdownView 
            :match="job.match.breakdown" 
            :score="job.match.score" 
            :grade="job.match.grade" 
            :skills="job.requiredSkills" 
          />
        </div>

        <Separator />
        <p class="text-[11px] text-muted-foreground">Posted {{ relativeTime(job.createdAt) }}</p>
      </div>
    </ion-content>
    <ion-footer v-if="!loading && job">
      <div class="ion-padding flex flex-col gap-2">
        <div v-if="applied" class="text-center">
          <IonButton disabled class="w-full">
            <IonIcon name="checkmark-circle" slot="start" />
            Application submitted
          </IonButton>
        </div>
        <div v-else>
          <IonTextarea
            v-model="message"
            placeholder="Optional message to the employer (e.g. your relevant experience)"
            :rows="2"
            :maxlength="1000"
          />
          <IonButton @click="apply" :disabled="applying" class="w-full">
            <IonIcon v-if="applying" name="refresh" slot="start" />
            <IonIcon v-else name="send" slot="start" />
            Apply now
          </IonButton>
        </div>
      </div>
    </ion-footer>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  IonModal,
  IonIcon,
  IonTextarea,
  IonButton,
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
  removeOfflineApplication,
  listOfflineApplications
} from '../worker/_lib'
import { useToast } from '../worker/_lib'
import {
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
  'applied': []
}>()

const { toast } = useToast()
const open = computed(() => !!props.jobId)
const loading = ref(false)
const error = ref<string | null>(null)
const message = ref('')
const applying = ref(false)
const applied = ref(false)
const fair = ref<FairPayResult | null>(null)

const loadJob = async () => {
  if (!props.jobId) {
    error.value = null
    applied.value = false
    return
  }

  loading.value = true
  error.value = null
  
  try {
    const jobData = await getJob(props.jobId)
    if (jobData) {
      // Fetch fair pay data
      const fairPayData = await getFairPay({
        category: jobData.category,
        compensationType: jobData.compensationType,
        compensation: jobData.compensation,
        municipalityId: jobData.municipalityId
      })
      fair.value = fairPayData
    }
  } catch (e: any) {
    // Offline fallback: show cached list data
    if (!navigator.onLine && props.job) {
      error.value = null
    } else {
      error.value = e?.message || 'Failed to load job.'
    }
  } finally {
    loading.value = false
  }
}

const apply = async () => {
  if (!props.job) return
  
  applying.value = true
  
  try {
    if (!navigator.onLine) {
      saveOfflineApplication({
        clientId: Date.now().toString() + '-' + Math.random().toString(36).slice(2),
        jobId: props.job.id,
        message: message.value.trim(),
        status: 'saved_offline',
        savedAt: new Date().toISOString(),
        lastError: null,
      })
      toast({
        message: 'Saved offline',
        duration: 3000
      })
      applied.value = true
      emit('applied')
      return
    }
    
    await applyToJob(props.job.id, message.value.trim() || '')
    toast({
      message: 'Application sent',
      duration: 3000
    })
    applied.value = true
    emit('applied')
  } catch (e: any) {
    const status = e?.status || 0
    const msg = e?.message || 'Could not apply.'
    
    if (status === 409) {
      toast({
        message: 'Already applied',
        duration: 3000,
        color: 'danger'
      })
      applied.value = true
    } else if (status === 400) {
      toast({
        message: 'Cannot apply: ' + msg,
        duration: 3000,
        color: 'danger'
      })
    } else {
      toast({
        message: 'Failed: ' + msg,
        duration: 3000,
        color: 'danger'
      })
    }
  } finally {
    applying.value = false
  }
}

watch(() => props.jobId, () => {
  if (props.jobId) {
    loadJob()
    applied.value = false
    message.value = ''
  }
})

// Load job when jobId changes
watch(() => props.jobId, loadJob)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>