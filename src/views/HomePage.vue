
<template>
  <ion-page>
    <!-- Hide the toolbar while the startup splash is visible -->
    <ion-header v-if="!loading" :translucent="true">
      <ion-toolbar>
        <ion-title>TrabahoLokal</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Branded startup splash -->
      <div v-if="loading" class="tl-splash">
        <div class="tl-splash-decoration tl-splash-decoration-one"></div>
        <div class="tl-splash-decoration tl-splash-decoration-two"></div>

        <div class="tl-splash-content">
          <div class="tl-logo-container">
            <img
              src="/trabaho-lokal.png"
              alt="TrabahoLokal logo"
              class="tl-splash-logo"
            />
          </div>

          <h1 class="tl-splash-title">TrabahoLokal</h1>

          <p class="tl-splash-tagline">
            Your skills. Your opportunities.
          </p>

          <p class="tl-splash-description">
            Connecting local talent with local opportunities.
          </p>

          <div class="tl-splash-loader">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <p class="tl-splash-loading-text">
            Preparing your opportunities...
          </p>
        </div>

        <div class="tl-splash-footer">
          <span>LOCAL TALENT. LOCAL OPPORTUNITIES.</span>
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
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'

import {
  IonPage,
  IonHeader,
  IonContent,
  IonTitle,
  IonToolbar
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

const { user, pendingJobId } = useSession()

const loading = ref(true)
const authOpen = ref(false)

onMounted(async () => {
  const splashStartTime = Date.now()
  const minimumSplashDuration = 1400

  try {
    // Hide the native Android splash after the Vue screen is mounted.
    // The branded in-app splash will remain visible during session checking.
    if (Capacitor.isNativePlatform()) {
      try {
        await SplashScreen.hide({
          fadeOutDuration: 250
        })
      } catch (error) {
        console.warn('Unable to hide native splash screen:', error)
      }
    }

    // Check the existing Supabase session.
    await initializeSession()
  } finally {
    // Keep the branded splash visible briefly for a smooth transition.
    const elapsed = Date.now() - splashStartTime
    const remaining = minimumSplashDuration - elapsed

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining))
    }

    loading.value = false

    // If the user has a pending job but is not authenticated,
    // open the authentication sheet.
    if (!user.value && pendingJobId.value) {
      authOpen.value = true
    }
  }
})

const handleAuth = (
  mode: 'login' | 'register',
  role: 'worker' | 'employer'
) => {
  authOpen.value = true
}

const handleAuthed = () => {
  authOpen.value = false
}
</script>

<style scoped>
.tl-splash {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 100%;
  height: 100%;
  padding: 32px 24px;
  overflow: hidden;
  background: #F5F3EC;
  color: #343A35;
}

.tl-splash-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 360px;
  text-align: center;
  animation: tl-splash-appear 700ms ease-out both;
}

.tl-logo-container {
  display: grid;
  place-items: center;
  width: 174px;
  height: 174px;
  margin-bottom: 22px;
  border-radius: 38px;
  background: #FFFFFF;
  box-shadow:
    10px 10px 25px rgba(92, 105, 87, 0.10),
    -8px -8px 22px rgba(255, 255, 255, 0.85);
}

.tl-splash-logo {
  display: block;
  width: 138px;
  height: 138px;
  object-fit: contain;
}

.tl-splash-title {
  margin: 0;
  color: #52664F;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.8px;
}

.tl-splash-tagline {
  margin: 10px 0 0;
  color: #52664F;
  font-size: 16px;
  font-weight: 600;
}

.tl-splash-description {
  max-width: 290px;
  margin: 10px 0 0;
  color: #737B73;
  font-size: 13px;
  line-height: 1.6;
}

.tl-splash-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 42px;
}

.tl-splash-loader span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #71866D;
  animation: tl-splash-pulse 1.1s ease-in-out infinite;
}

.tl-splash-loader span:nth-child(2) {
  animation-delay: 150ms;
}

.tl-splash-loader span:nth-child(3) {
  animation-delay: 300ms;
}

.tl-splash-loading-text {
  margin: 13px 0 0;
  color: #929990;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.tl-splash-decoration {
  position: absolute;
  z-index: 1;
  border-radius: 50%;
  pointer-events: none;
}

.tl-splash-decoration-one {
  top: -110px;
  right: -100px;
  width: 280px;
  height: 280px;
  background: rgba(168, 185, 160, 0.16);
}

.tl-splash-decoration-two {
  bottom: -140px;
  left: -110px;
  width: 320px;
  height: 320px;
  background: rgba(214, 221, 205, 0.35);
}

.tl-splash-footer {
  position: absolute;
  z-index: 2;
  bottom: max(24px, env(safe-area-inset-bottom));
  left: 0;
  width: 100%;
  padding: 0 16px;
  color: #929990;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  text-align: center;
}

@keyframes tl-splash-pulse {
  0%, 80%, 100% {
    opacity: 0.35;
    transform: scale(0.75);
  }

  40% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@keyframes tl-splash-appear {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tl-splash-content,
  .tl-splash-loader span {
    animation: none;
  }
}
</style>
