<template>
  <Card class="bg-muted/30">
    <CardContent class="p-3 space-y-2">
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Match breakdown</p>
      <div v-for="bar in bars" :key="bar.label">
        <div class="flex items-center justify-between text-xs mb-0.5">
          <span>{{ bar.label }}</span>
          <span class="font-medium">{{ Math.round(bar.value * 100) }}%</span>
        </div>
        <div class="h-1.5 rounded-full bg-muted overflow-hidden">
          <div 
            class="h-full bg-primary" 
            :style="{ width: `${Math.round(bar.value * 100)}%` }"
          />
        </div>
      </div>
      <ul v-if="match.explanation.length > 0" class="text-xs text-muted-foreground list-disc pl-5 space-y-0.5 pt-1">
        <li v-for="(e, i) in match.explanation.slice(0, 4)" :key="i">{{ e }}</li>
      </ul>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '../worker/_ui'

interface MatchBreakdown {
  skillCoverage: number
  experienceRelevance: number
  locationSuitability: number
  availabilitySuitability: number
  explanation: string[]
}

interface MatchBreakdownCardProps {
  match: MatchBreakdown
}

const props = defineProps<MatchBreakdownCardProps>()

const bars = [
  { label: 'Skill coverage', value: props.match.skillCoverage },
  { label: 'Experience', value: props.match.experienceRelevance },
  { label: 'Location', value: props.match.locationSuitability },
  { label: 'Availability', value: props.match.availabilitySuitability },
]
</script>