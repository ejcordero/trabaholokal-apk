<template>
  <div class="flex flex-col h-[100dvh]">
    <div class="flex-1 min-h-0">
      <GuestJobs v-if="tab === 'jobs'" @apply="handleApply" />
      <GuestAccount v-else @auth="openAuth" />
    </div>
    <BottomTabs
      :active="tab"
      @change="tab = $event"
      :items="[
        { key: 'jobs', label: 'Jobs', icon: 'briefcase' },
        { key: 'account', label: 'Account', icon: 'user' },
      ]"
    />
    <AuthSheet 
      :open="authOpen" 
      @open-change="authOpen = $event"
      :initial-mode="authMode"
      :initial-role="authRole"
      @authed="handleAuthed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BottomTabs } from '../worker/_ui'
import GuestJobs from './GuestJobs.vue'
import GuestAccount from './GuestAccount.vue'
import AuthSheet from './AuthSheet.vue'
import { useSession } from '../worker/_lib'
import { JobDTO } from '../worker/_lib'

const tab = ref<'jobs' | 'account'>('jobs')
const authOpen = ref(false)
const authMode = ref<'login' | 'register'>('login')
const authRole = ref<'worker' | 'employer'>('worker')
const { setPendingJob } = useSession()

const openAuth = (mode: 'login' | 'register', role: 'worker' | 'employer') => {
  authMode.value = mode
  authRole.value = role
  authOpen.value = true
}

const handleApply = (job: JobDTO) => {
  setPendingJob(job.id)
  authMode.value = 'login'
  authRole.value = 'worker'
  authOpen.value = true
}

const handleAuthed = () => {
  authOpen.value = false
}
</script>