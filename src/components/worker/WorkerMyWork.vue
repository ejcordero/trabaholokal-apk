<template>
  <AppShell
    title="My Work"
    subtitle="Employments & reports"
    :right="refreshHeader"
  >
    <PullRefresh @refresh="refresh" :refreshing="loading">
      <div class="space-y-4">
        <!-- Stats -->
        <div class="grid grid-cols-3 gap-2">
          <StatCard 
            label="Active" 
            :value="active.length" 
            icon="briefcase-business" 
          />
          <StatCard 
            label="Pending reports" 
            :value="pendingReports" 
            icon="document-text"
            :accent="pendingReports > 0 ? 'border-amber-300' : undefined"
          />
          <StatCard 
            label="Completed" 
            :value="completedJobs" 
            icon="checkmark-circle" 
          />
        </div>

        <!-- Content -->
        <div v-if="error">
          <ErrorRetry :message="error" @retry="refresh" />
        </div>
        <div v-else-if="loading">
          <LoadingCards :count="3" />
        </div>
        <div v-else-if="!data || data.length === 0">
          <EmptyState
            icon="briefcase-business"
            title="No employments yet"
            description="When an employer accepts your application, your active work will appear here."
          />
        </div>
        <div v-else>
          <!-- Active employments -->
          <SectionTitle>Active</SectionTitle>
          <div v-if="active.length === 0">
            <EmptyState
              icon="briefcase-business"
              title="No active work"
              description="Apply and get accepted to start working."
            />
          </div>
          <div v-else class="space-y-2">
            <EmploymentCard
              v-for="emp in active"
              :key="emp.id"
              :emp="emp"
              @click="$emit('open-employment', emp.id)"
            />
          </div>

          <!-- Completed employments -->
          <div v-if="completed.length > 0">
            <SectionTitle>Completed &amp; past</SectionTitle>
            <div class="space-y-2">
              <EmploymentCard
                v-for="emp in completed"
                :key="emp.id"
                :emp="emp"
                @click="$emit('open-employment', emp.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  AppShell, 
  LoadingCards, 
  ErrorRetry, 
  EmptyState, 
  PullRefresh,
  SectionTitle,
  StatCard,
  EmploymentCard
} from '../worker/_ui'
import { 
  listEmployments
} from '../worker/_lib'
import { type EmploymentDTO } from '../worker/_lib'

interface WorkerMyWorkProps {
  onOpenEmployment: (id: string) => void
}

defineProps<WorkerMyWorkProps>()
const data = ref<EmploymentDTO[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const refreshHeader = computed(() => {
  return '<RefreshHeader @refresh="refresh" :refreshing="loading" />'
})

const active = computed(() => 
  (data.value ?? []).filter((e) => ['pending_start', 'active', 'paused'].includes(e.status))
)

const completed = computed(() => 
  (data.value ?? []).filter((e) => ['completed', 'terminated'].includes(e.status))
)

const pendingReports = computed(() => 
  active.value.reduce((s, e) => s + e.pendingReports, 0)
)

const completedJobs = computed(() => 
  completed.value.filter((e) => e.status === 'completed').length
)

onMounted(() => {
  refresh()
})

const refresh = async () => {
  loading.value = true
  error.value = null
  
  try {
    const employments = await listEmployments()
    data.value = employments
  } catch (e: any) {
    error.value = e?.message || 'Failed to load employments.'
  } finally {
    loading.value = false
  }
}
</script>