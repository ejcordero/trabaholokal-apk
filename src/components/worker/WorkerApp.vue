<template>
  <div class="relative flex flex-col h-[100dvh]">
    <div class="flex-1 min-h-0">
      <!-- Full-screen sub-view -->
      <div v-if="view">
        <component 
          :is="currentViewComponent"
          :employment-id="view.employmentId"
          :worker-profile-id="user?.workerProfileId"
          @back="view = null"
          @navigate="handleNavigate"
        />
      </div>
      <!-- Main tab content -->
      <div v-else>
        <WorkerHome
          v-if="tab === 'home'"
          @open-jobs="tab = 'jobs'"
          @open-applications="tab = 'applications'"
          @open-skill-unlock="view = { name: 'skill-unlock' }"
          @open-skills-profile="view = { name: 'skills-profile' }"
          @open-job="(id) => { tab = 'jobs'; openJobId = id }"
        />
        <WorkerJobs
          v-if="tab === 'jobs'"
          :open-job-id="openJobId"
          @open-job-change="openJobId = $event"
        />
        <WorkerApplications
          v-if="tab === 'applications'"
          @open-job="(id) => { tab = 'jobs'; openJobId = id }"
        />
        <WorkerMyWork
          v-if="tab === 'work'"
          @open-employment="(id) => view = { name: 'employment-details', employmentId: id }"
        />
        <WorkerAccount
          v-if="tab === 'account'"
          :unread-notifications="unreadCount"
          @navigate="view = { name: $event }"
        />
      </div>
    </div>
    <BottomTabs 
      :items="tabs" 
      :active="tab" 
      @change="handleTabChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSession } from '../worker/_lib'
import { BottomTabs } from '../worker/_ui'
import WorkerHome from './WorkerHome.vue'
import WorkerJobs from './WorkerJobs.vue'
import WorkerApplications from './WorkerApplications.vue'
import WorkerMyWork from './WorkerMyWork.vue'
import WorkerAccount from './WorkerAccount.vue'
import WorkerSkillsProfile from './WorkerSkillsProfile.vue'
import WorkerSkillsPassport from './WorkerSkillsPassport.vue'
import WorkerSkillUnlock from './WorkerSkillUnlock.vue'
import WorkerEmploymentHistory from './WorkerEmploymentHistory.vue'
import WorkerProfile from './WorkerProfile.vue'
import WorkerNotifications from './WorkerNotifications.vue'
import WorkerEmploymentDetails from './WorkerEmploymentDetails.vue'

interface WorkerAppProps {
  initialJobId?: string
}

const props = defineProps<WorkerAppProps>()

const { user } = useSession()
const { t } = useI18n({ useScope: 'global' })
const tab = ref<'home' | 'jobs' | 'applications' | 'work' | 'account'>('home')
const handleTabChange = (
  nextTab: typeof tab.value
) => {
  // Close the currently displayed secondary page.
  view.value = null

  // Navigate to the selected bottom tab.
  tab.value = nextTab
}
const view = ref<{
  name:
    | 'skills-profile'
    | 'passport'
    | 'skill-unlock'
    | 'employment-history'
    | 'profile'
    | 'notifications'
    | 'employment-details'
  employmentId?: string
} | null>(null)
const openJobId = ref<string | null>(props.initialJobId ?? null)

// Notifications unread count
const unreadCount = ref(0)

// Auto-open job detail when initialJobId is provided
onMounted(() => {
  if (props.initialJobId) {
    tab.value = 'jobs'
    openJobId.value = props.initialJobId
  }
})

// Refresh notifications when notifications tab/view closes
watch([view, tab], () => {
  if (!view.value || view.value.name !== 'notifications') {
    // TODO: Implement refresh notifications
    // refreshNotifs()
  }
})

const tabs = computed(() => [
  { key: 'home', label: t('common.home'), icon: 'home' },
  { key: 'jobs', label: t('common.jobs'), icon: 'briefcase' },
  { key: 'applications', label: t('common.applications'), icon: 'clipboard-list' },
  { key: 'work', label: t('common.myWork'), icon: 'briefcase-business' },
  {
    key: 'account',
    label: t('common.account'),
    icon: 'user',
    badge: unreadCount.value
  },
])

const currentViewComponent = computed(() => {
  if (!view.value) return null
  switch (view.value.name) {
    case 'skills-profile':
      return WorkerSkillsProfile
    case 'passport':
      return WorkerSkillsPassport
    case 'skill-unlock':
      return WorkerSkillUnlock
    case 'employment-history':
      return WorkerEmploymentHistory
    case 'profile':
      return WorkerProfile
    case 'notifications':
      return WorkerNotifications
    case 'employment-details':
      return WorkerEmploymentDetails
    default:
      return null
  }
})

const handleNavigate = (name: string) => {
  view.value = { name } as any
}
</script>