<template>
  <AppShell title="Account" subtitle="TrabahoLokal">
    <div class="space-y-4">
      <!-- Brand card -->
      <Card class="bg-primary text-primary-foreground border-0">
        <CardContent class="p-6 text-center">
          <div class="mx-auto mb-3 h-14 w-14 rounded-2xl bg-white/15 flex items-center justify-center">
            <IonIcon name="briefcase" />
          </div>
          <h2 class="text-xl font-bold">TrabahoLokal</h2>
          <p class="text-sm text-primary-foreground/80 mt-1">Skills. Opportunities. Local Progress.</p>
        </CardContent>
      </Card>

      <!-- Language settings -->
<LanguageSelector />

      <!-- Description card -->
      <Card>
        <CardContent class="p-4 space-y-3">
          <p class="text-sm text-muted-foreground">
            A skills-based employment platform connecting local workers with nearby opportunities — no degree required.
          </p>
          <ul class="text-sm space-y-2">
            <li class="flex items-start gap-2">
              <IonIcon name="shield-checkmark" class="h-4 w-4 text-emerald-600 mt-0.5" />
              <span>Verified employers and a shareable Skills Passport</span>
            </li>
            <li class="flex items-start gap-2">
              <IonIcon name="wallet" class="h-4 w-4 text-emerald-600 mt-0.5" />
              <span>Transparent fair-pay indicators and urgent daily work</span>
            </li>
            <li class="flex items-start gap-2">
              <IonIcon name="location" class="h-4 w-4 text-emerald-600 mt-0.5" />
              <span>Find nearby jobs by municipality and distance</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- Action buttons -->
      <div class="space-y-2">
        <IonButton 
          size="large" 
          expand="block"
          @click="$emit('auth', 'login', 'worker')"
        >
          <IonIcon name="log-in" slot="start" />
          Sign in
        </IonButton>
        <IonButton 
          size="large" 
          fill="outline"
          expand="block"
          @click="$emit('auth', 'register', 'worker')"
        >
          <IonIcon name="person-add" slot="start" />
          Create account
        </IonButton>
      </div>

      <!-- Demo accounts info -->
      <p class="text-center text-xs text-muted-foreground">
        Demo accounts are available. Sign in with juan@trabaho.lokal / worker123 (worker), 
        builds@trabaho.lokal / employer123 (employer), or admin@trabaho.lokal / admin123 (admin).
      </p>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { 
  IonIcon,
  IonButton
} from '@ionic/vue'

import LanguageSelector from '../shared/LanguageSelector.vue'
import { 
  AppShell, 
  Card,
  CardContent
} from '../worker/_ui'


interface GuestAccountProps {
  onAuth: (mode: 'login' | 'register', role: 'worker' | 'employer') => void
}

defineProps<GuestAccountProps>()
const emit = defineEmits<{
  auth: [mode: 'login' | 'register', role: 'worker' | 'employer']
}>()
</script>