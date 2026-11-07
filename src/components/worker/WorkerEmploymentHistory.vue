<template>
  <AppShell title="Employment History" @back="$emit('back')">
    <div class="space-y-4">
      <p>Your employment history will be displayed here.</p>
      <p>This will show all your past employments with dates and details.</p>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
interface WorkerEmploymentHistoryProps {
  onBack: () => void
}

defineProps<WorkerEmploymentHistoryProps>()
const emit = defineEmits<{
  back: []
}>()
</script>