<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>TrabahoLokal</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Splash screen while checking auth -->
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="text-center">
          <IonIcon name="briefcase" class="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 class="text-xl font-semibold">TrabahoLokal</h1>
          <p class="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>

      <!-- Guest app when not authenticated -->
      <GuestApp 
        v-else-if="!user"
        @auth="handleAuth"
      />

      <!-- Worker app when authenticated as worker -->
      <WorkerApp 
        v-else-if="user?.role === 'worker'"
        :initial-job-id="pendingJobId ?? undefined"
      />

      <!-- Employer app when authenticated as employer -->
      <EmployerApp 
        v-else-if="user?.role === 'employer'"
      />

      <!-- Admin app when authenticated as admin -->
      <AdminApp 
        v-else-if="user?.role === 'admin'"
      />

      <!-- Auth sheet for guest login/register -->
      <AuthSheet 
        :open="authOpen" 
        @open-change="authOpen = $event"
        @authed="handleAuthed"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  IonPage,
  IonHeader,
  IonContent,
  IonTitle,
  IonToolbar,
  IonIcon
} from '@ionic/vue'
import {
  GuestApp,
  WorkerApp,
  EmployerApp,
  AdminApp,
  AuthSheet
} from '../components/worker'
import { 
  useSession,
  initializeSession
} from '../components/worker/_lib'

const { user, sessionInitialized, pendingJobId } = useSession()
const loading = ref(true)
const authOpen = ref(false)

onMounted(async () => {
  // Initialize session and check if user is authenticated
  await initializeSession()
  loading.value = false
  
  // If user is not authenticated and there's a pending job, show auth sheet
  if (!user.value && pendingJobId.value) {
    authOpen.value = true
  }
})

const handleAuth = (mode: 'login' | 'register', role: 'worker' | 'employer') => {
  authOpen.value = true
}

const handleAuthed = () => {
  authOpen.value = false
}
</script>

<style scoped>
/* Remove default container styling */
#container {
  display: none;
}
</style>