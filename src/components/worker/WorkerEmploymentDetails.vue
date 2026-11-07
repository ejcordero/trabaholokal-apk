<template>
  <AppShell title="Employment Details" @back="$emit('back')">
    <div class="space-y-4">
      <p>Employment details for {{ employmentId }} will be displayed here.</p>
      <p>This will show tabs for reports, renewals, and evaluation forms.</p>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
interface WorkerEmploymentDetailsProps {
  employmentId: string
}

defineProps<WorkerEmploymentDetailsProps>()
const emit = defineEmits<{
  back: []
}>()
</script>