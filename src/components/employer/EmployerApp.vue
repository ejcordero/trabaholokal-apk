<template>
  <div class="tl-shell" style="height: 100dvh">
    <div class="flex-1 min-h-0" style="min-height: 0">
      <template v-if="view">
        <EmployerProfile v-if="view.name === 'profile'" @back="closeView" />
        <EmployerVerification v-else-if="view.name === 'verification'" @back="closeView" />
        <EmployerEmploymentHistory
          v-else-if="view.name === 'employment-history'"
          @back="closeView"
          @open-employment="openEmployment"
        />
        <EmployerNotifications v-else-if="view.name === 'notifications'" @back="closeNotifications" />
        <EmployerJobForm
          v-else-if="view.name === 'job-form'"
          :job-id="jobFormId || undefined"
          @close="closeView"
          @saved="onJobSaved"
        />
        <EmployerJobDetails
          v-else-if="view.name === 'job-details'"
          :job-id="jobDetailsId"
          @back="closeView"
          @edit="openJobForm(jobDetailsId)"
        />
        <EmployerEmploymentDetails
          v-else-if="view.name === 'employment-details'"
          :employment-id="employmentDetailsId"
          @back="closeView"
        />
        <EmployerShortlist v-else-if="view.name === 'shortlist'" @close="closeView" />
      </template>

      <template v-else>
        <EmployerHome
          v-if="tab === 'home'"
          @open-jobs="goTab('jobs')"
          @open-applicants="goTab('applicants')"
          @open-workforce="goTab('workforce')"
          @post-job="openJobForm()"
          @open-verification="openView('verification')"
          @open-applicant="openApplicant"
        />
        <EmployerJobs
          v-else-if="tab === 'jobs'"
          @open-job="openJobDetails"
          @new-job="openJobForm()"
        />
        <EmployerApplicants
          v-else-if="tab === 'applicants'"
          @open-shortlist="openView('shortlist')"
        />
        <EmployerWorkforce
          v-else-if="tab === 'workforce'"
          @open-employment="openEmployment"
        />
        <EmployerAccount
          v-else-if="tab === 'account'"
          :unread-notifications="unreadCount"
          @navigate="onAccountNavigate"
        />
      </template>
    </div>

    <EmployerApplicantDetails
      :application="applicantSheet"
      @close="applicantSheet = null"
      @updated="onApplicantUpdated"
    />

    <BottomTabs :items="tabs" :active="tab" @change="goTab" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  listNotifications,
  useAsync,
  type ApplicationDTO,
  type JobWithMatch,
  type NotificationDTO,
} from '../worker/_lib'
import { BottomTabs, Icons, type TabItem } from '../worker/_ui'

import EmployerAccount from './EmployerAccount.vue'
import EmployerApplicantDetails from './EmployerApplicantDetails.vue'
import EmployerApplicants from './EmployerApplicants.vue'
import EmployerEmploymentDetails from './EmployerEmploymentDetails.vue'
import EmployerEmploymentHistory from './EmployerEmploymentHistory.vue'
import EmployerHome from './EmployerHome.vue'
import EmployerJobDetails from './EmployerJobDetails.vue'
import EmployerJobForm from './EmployerJobForm.vue'
import EmployerJobs from './EmployerJobs.vue'
import EmployerNotifications from './EmployerNotifications.vue'
import EmployerProfile from './EmployerProfile.vue'
import EmployerShortlist from './EmployerShortlist.vue'
import EmployerVerification from './EmployerVerification.vue'
import EmployerWorkforce from './EmployerWorkforce.vue'

type TabKey = 'home' | 'jobs' | 'applicants' | 'workforce' | 'account'
type AccountView = 'profile' | 'verification' | 'employment-history' | 'notifications'

type SubView =
  | { name: 'profile' }
  | { name: 'verification' }
  | { name: 'employment-history' }
  | { name: 'notifications' }
  | { name: 'job-form'; jobId?: string }
  | { name: 'job-details'; jobId: string }
  | { name: 'employment-details'; employmentId: string }
  | { name: 'shortlist' }

const tab = ref<TabKey>('home')
const view = ref<SubView | null>(null)
const applicantSheet = ref<ApplicationDTO | null>(null)

const { data: notifData, refresh: refreshNotifs } = useAsync<NotificationDTO[]>(
  () => listNotifications(),
  []
)
const unreadCount = computed(() => (notifData.value ?? []).filter((n) => !n.read).length)

const jobFormId = computed(() => (view.value?.name === 'job-form' ? view.value.jobId ?? '' : ''))
const jobDetailsId = computed(() => (view.value?.name === 'job-details' ? view.value.jobId : ''))
const employmentDetailsId = computed(() =>
  view.value?.name === 'employment-details' ? view.value.employmentId : ''
)

const tabs = computed<TabItem[]>(() => [
  { key: 'home', label: 'Dashboard', icon: Icons.Home },
  { key: 'jobs', label: 'My Jobs', icon: Icons.Briefcase },
  { key: 'applicants', label: 'Applicants', icon: Icons.Users },
  { key: 'workforce', label: 'Workforce', icon: Icons.BriefcaseBusiness },
  { key: 'account', label: 'Account', icon: Icons.User, badge: unreadCount.value },
])

function goTab(next: string) {
  view.value = null
  tab.value = next as TabKey
}

function closeView() {
  view.value = null
}

function closeNotifications() {
  view.value = null
  void refreshNotifs()
}

function openView(name: SubView['name']) {
  view.value = { name } as SubView
}

function onAccountNavigate(name: string) {
  view.value = { name: name as AccountView } as SubView
}

function openJobForm(jobId?: string) {
  view.value = jobId ? { name: 'job-form', jobId } : { name: 'job-form' }
}

function openJobDetails(id: string) {
  view.value = { name: 'job-details', jobId: id }
}

function openEmployment(id: string) {
  view.value = { name: 'employment-details', employmentId: id }
}

function onJobSaved(job: JobWithMatch) {
  view.value = { name: 'job-details', jobId: job.id }
}

function openApplicant(app: ApplicationDTO) {
  applicantSheet.value = app
}

function onApplicantUpdated(next: ApplicationDTO) {
  applicantSheet.value = next
}
</script>
