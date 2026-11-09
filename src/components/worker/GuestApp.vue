
<template>
  <div class="flex flex-col h-[100dvh]">
    <div class="flex-1 min-h-0">
      <GuestJobs v-if="tab === 'jobs'" @apply="handleApply" />
      <GuestAccount v-else @auth="openAuth" />
    </div>

    <BottomTabs
      :active="tab"
      @change="tab = $event"
      :items="guestTabs"
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { BottomTabs } from '../worker/_ui'
import GuestJobs from './GuestJobs.vue'
import GuestAccount from './GuestAccount.vue'
import AuthSheet from './AuthSheet.vue'

import { useSession } from '../worker/_lib'
import type { JobDTO } from '../worker/_lib'

const { t } = useI18n({ useScope: 'global' })

const tab = ref<'jobs' | 'account'>('jobs')

const guestTabs = computed(() => [
  { key: 'jobs', label: t('common.jobs'), icon: 'briefcase' },
  { key: 'account', label: t('common.account'), icon: 'user' },
])

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
