<template>
  <AppShell title="Shortlist" :subtitle="`${applicants.length} candidate${applicants.length === 1 ? '' : 's'}`" back @back="emit('close')">
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <div class="space-y-3">
        <p class="text-xs tl-muted">
          Shortlisted workers are the candidates you want to revisit before deciding. Review their
          profile and match score, then accept or reject.
        </p>

        <LoadingCards v-if="loading" :count="3" />
        <ErrorRetry v-else-if="error" :message="error" @retry="refresh" />
        <EmptyState
          v-else-if="applicants.length === 0"
          :icon="Icons.Star"
          title="No shortlisted candidates"
          description="Shortlist promising applicants from the Applicants tab to compare them here."
        >
          <template #action>
            <button type="button" class="tl-btn sm" @click="emit('close')">
              <ion-icon :icon="Icons.ArrowBack" /> Back to applicants
            </button>
          </template>
        </EmptyState>
        <div v-else class="space-y-2">
          <ApplicationCard
            v-for="app in applicants"
            :key="app.id"
            :app="app"
            @open="openById"
          />
        </div>
      </div>
    </PullRefresh>

    <EmployerApplicantDetails
      :application="selected"
      @close="selected = null"
      @updated="onUpdated"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { listApplications, useAsync, type ApplicationDTO } from '../worker/_lib'
import {
  AppShell,
  ApplicationCard,
  EmptyState,
  ErrorRetry,
  Icons,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
} from '../worker/_ui'

import EmployerApplicantDetails from './EmployerApplicantDetails.vue'

const emit = defineEmits<{ (e: 'close'): void }>()
const selected = ref<ApplicationDTO | null>(null)

const { data, loading, error, refresh, setData } = useAsync<ApplicationDTO[]>(
  () => listApplications({ status: 'shortlisted' }),
  []
)

const applicants = computed(() => data.value ?? [])

function openById(id: string) {
  selected.value = applicants.value.find((a) => a.id === id) ?? null
}

function onUpdated(next: ApplicationDTO) {
  if (next.status === 'shortlisted') {
    setData(applicants.value.map((a) => (a.id === next.id ? next : a)))
    selected.value = next
  } else {
    setData(applicants.value.filter((a) => a.id !== next.id))
    selected.value = null
  }
}
</script>
