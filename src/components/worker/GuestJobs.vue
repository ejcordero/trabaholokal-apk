<template>
  <AppShell
    title="Jobs"
    subtitle="Skills. Opportunities. Local Progress."
    :right="refreshHeader"
  >
    <PullRefresh @refresh="refresh" :refreshing="loading">
      <div class="space-y-3">
        <!-- Search -->
        <div class="relative">
          <IonIcon name="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <IonInput
            v-model="q"
            placeholder="Search jobs, skills, employers…"
            class="pr-9"
          />
          <button 
            v-if="q" 
            @click="q = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <IonIcon name="close-circle" />
          </button>
        </div>

        <!-- Active filters -->
        <div v-if="category || municipalityId" class="flex flex-wrap gap-1.5">
          <StatusPill 
            v-if="category" 
            :status="category" 
            @click="category = ''"
            closable
          >
            {{ labelFor(category, JOB_CATEGORIES) }}
          </StatusPill>
          <StatusPill 
            v-if="municipalityId" 
            :status="municipalities.find(m => m.id === municipalityId)?.name || municipalityId"
            @click="municipalityId = ''"
            closable
          >
            {{ municipalities.find(m => m.id === municipalityId)?.name || municipalityId }}
          </StatusPill>
        </div>

        <!-- Job list -->
        <div v-if="loading">
          <LoadingCards :count="3" />
        </div>
        <div v-else-if="error">
          <ErrorRetry :message="error" @retry="refresh" />
        </div>
        <div v-else-if="!data || data.length === 0">
          <EmptyState
            icon="briefcase"
            title="No jobs found"
            description="Try adjusting your search or filters."
          />
        </div>
        <div v-else class="space-y-3">
          <JobCard
            v-for="job in data"
            :key="job.id"
            :job="job"
            @click="selectedJob = job"
          />
        </div>
      </div>
    </PullRefresh>

    <!-- Filters sheet -->
    <ion-modal 
      :is-open="showFilters" 
      @will-dismiss="showFilters = false"
      :breakpoints="[0, 0.75, 1]"
      :initial-breakpoint="0.75"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Filters</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="space-y-4">
          <Field label="Category">
            <FormSelect 
              :value="category" 
              @update:value="category = $event"
              :options="[{ value: '', label: 'All categories' }, ...JOB_CATEGORIES.map(c => ({ value: c.value, label: c.label }))]"
            />
          </Field>
          <Field label="Municipality">
            <FormSelect 
              :value="municipalityId" 
              @update:value="municipalityId = $event"
              :options="[{ value: '', label: 'All municipalities' }, ...municipalities.map(m => ({ value: m.id, label: m.name }))]"
            />
          </Field>
        </div>
      </ion-content>
      <ion-footer>
        <div class="ion-padding">
          <IonButton @click="showFilters = false">
            Show jobs
          </IonButton>
        </div>
      </ion-footer>
    </ion-modal>

    <!-- Job detail sheet -->
    <JobDetailSheet
      :job="selectedJob"
      :open="!!selectedJob"
      @open-change="selectedJob = null"
      @apply="handleApply"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  IonModal,
  IonIcon,
  IonInput,
  IonButton
} from '@ionic/vue'
import { 
  AppShell, 
  Field, 
  FormSelect, 
  LoadingCards, 
  ErrorRetry, 
  EmptyState, 
  PullRefresh,
  JobCard,
  StatusPill,
  JobDetailSheet
} from '../worker/_ui'
import { 
  listJobs, 
  getMunicipalities
} from '../worker/_lib'
import { type JobDTO, type MunicipalityDTO } from '../worker/_lib'
import { JOB_CATEGORIES, labelFor } from '../worker/_lib'

interface GuestJobsProps {
  onApply: (job: JobDTO) => void
}

defineProps<GuestJobsProps>()
const emit = defineEmits<{
  apply: [job: JobDTO]
}>()

const q = ref('')
const category = ref('')
const municipalityId = ref('')
const showFilters = ref(false)
const selectedJob = ref<JobDTO | null>(null)
const data = ref<JobDTO[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const municipalities = ref<MunicipalityDTO[]>([])

const refreshHeader = computed(() => {
  return '<RefreshHeader @refresh="refresh" :refreshing="loading" />'
})

onMounted(async () => {
  // Load municipalities
  try {
    const munis = await getMunicipalities()
    municipalities.value = munis
  } catch (e) {
    console.error('Failed to load municipalities:', e)
  }

  // Load initial jobs
  refresh()
})

const refresh = async () => {
  loading.value = true
  error.value = null
  
  try {
    const params: any = {
      limit: 30
    }
    
    if (q.value) params.q = q.value
    if (category.value) params.category = category.value
    if (municipalityId.value) params.municipalityId = municipalityId.value
    
    const res = await listJobs(params)
    data.value = res.data
  } catch (e: any) {
    error.value = e?.message || 'Failed to load jobs.'
  } finally {
    loading.value = false
  }
}

const handleApply = (job: JobDTO) => {
  emit('apply', job)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>