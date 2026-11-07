
<template>
  <AppShell
    title="Skill Unlock"
    subtitle="Discover skills that can open more job opportunities"
    @back="$emit('back')"
  >
    <div class="space-y-4">

      <!-- Recommendation notice -->
      <IonCard class="notice-card">
        <IonCardContent>
          <div class="flex items-start gap-2">
            <IonIcon
              :icon="informationCircleOutline"
              class="notice-icon"
            />

            <div>
              <h2 class="font-semibold text-sm">
                Recommendation — not a verified qualification
              </h2>

              <p class="text-sm mt-2">
                These are skill suggestions based on jobs you almost qualify
                for. Completing a course here does not automatically verify
                the skill on TrabahoLokal — only completed employment can
                promote a skill level.
              </p>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      <!-- Refresh -->
      <div class="flex justify-end">
        <IonButton
          fill="outline"
          size="small"
          :disabled="loading || !!addingSkillId"
          @click="loadRecommendations"
        >
          <IonIcon
            :icon="refreshOutline"
            slot="start"
          />
          Refresh
        </IonButton>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <IonCard v-for="n in 3" :key="n">
          <IonCardContent>
            <IonSkeletonText
              animated
              style="width: 55%; height: 20px"
            />
            <IonSkeletonText
              animated
              style="width: 90%; height: 14px"
            />
            <IonSkeletonText
              animated
              style="width: 75%; height: 14px"
            />
          </IonCardContent>
        </IonCard>
      </div>

      <!-- Error -->
      <IonCard v-else-if="error">
        <IonCardContent>
          <IonText color="danger">
            <p>{{ error }}</p>
          </IonText>

          <IonButton
            expand="block"
            fill="outline"
            @click="loadRecommendations"
          >
            <IonIcon
              :icon="refreshOutline"
              slot="start"
            />
            Try Again
          </IonButton>
        </IonCardContent>
      </IonCard>

      <!-- Empty state -->
      <IonCard v-else-if="recommendations.length === 0">
        <IonCardContent class="text-center">
          <IonIcon
            :icon="bulbOutline"
            class="empty-icon"
          />

          <h2 class="font-semibold">
            No skill recommendations yet
          </h2>

          <p class="mt-2 text-sm">
            There are currently no published jobs where you are missing
            exactly one required skill. Check again when new jobs become
            available.
          </p>
        </IonCardContent>
      </IonCard>

      <!-- Recommendations -->
      <template v-else>
        <SectionTitle>
          Recommended Skills ({{ recommendations.length }})
        </SectionTitle>

        <IonCard
          v-for="recommendation in recommendations"
          :key="recommendation.recommendedSkillId"
          class="recommendation-card"
        >
          <IonCardContent>

            <!-- Skill information -->
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="font-semibold text-base">
                  {{ recommendation.recommendedSkillName }}
                </h2>

                <p
                  v-if="recommendation.categoryName"
                  class="text-xs text-medium mt-1"
                >
                  {{ recommendation.categoryName }}
                </p>
              </div>

              <IonBadge color="success">
                {{ recommendation.potentialCount }}
                {{ recommendation.potentialCount === 1 ? 'job' : 'jobs' }}
              </IonBadge>
            </div>

            <p class="mt-3 text-sm">
              {{ recommendation.reason }}
            </p>

            <!-- Add skill -->
            <div class="mt-4">
              <IonButton
                expand="block"
                :disabled="!!addingSkillId"
                @click="confirmAddSkill(recommendation)"
              >
                <IonSpinner
                  v-if="addingSkillId === recommendation.recommendedSkillId"
                  name="crescent"
                  class="mr-2"
                />

                <IonIcon
                  v-else
                  :icon="addCircleOutline"
                  slot="start"
                />

                {{
                  addingSkillId === recommendation.recommendedSkillId
                    ? 'Adding Skill...'
                    : 'Add to My Skills'
                }}
              </IonButton>

              <p class="text-xs text-medium mt-2">
                Adding this skill records it as self-declared.
                It does not verify your qualification.
              </p>
            </div>

            <!-- Potential jobs -->
            <div class="mt-5">
              <h3 class="font-semibold text-sm mb-2">
                Jobs you could potentially qualify for
              </h3>

              <IonList lines="none">
                <IonItem
                  v-for="job in recommendation.missedJobs"
                  :key="job.id"
                  class="job-item"
                >
                  <IonLabel>
                    <h3>{{ job.title }}</h3>

                    <p>
                      {{ job.employerName }}
                      <span v-if="job.municipalityName">
                        · {{ job.municipalityName }}
                      </span>
                    </p>
                  </IonLabel>
                </IonItem>
              </IonList>

              <p class="text-xs text-medium mt-2">
                These jobs have exactly one missing required skill.
                Adding the skill to your profile does not guarantee
                eligibility, selection, or employment.
              </p>
            </div>

            <!-- Learning resources -->
            <div class="mt-5 border-t pt-4">
              <h3 class="font-semibold text-sm mb-2">
                Learning Resources
              </h3>

              <p class="text-xs text-medium mb-3">
                Explore these resources to develop your skills.
                Opening or completing a course will not change your
                verification level. Skill-level promotion is handled
                separately through completed employment.
              </p>

              <p
                v-if="recommendation.resources.length === 0"
                class="text-sm text-medium"
              >
                No learning resources have been added for this skill yet.
              </p>

              <div
                v-for="resource in recommendation.resources"
                :key="resource.id"
                class="resource-item mb-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="font-medium text-sm">
                      {{ resource.title }}
                    </p>

                    <p class="text-xs text-medium mt-1">
                      {{ resource.provider }} · {{ resource.type }}
                    </p>
                  </div>

                  <IonBadge
                    :color="resource.accredited ? 'success' : 'medium'"
                  >
                    {{
                      resource.accredited
                        ? 'Recorded as accredited'
                        : 'Not recorded as accredited'
                    }}
                  </IonBadge>
                </div>

                <IonButton
                  v-if="isUsableResourceUrl(resource.url)"
                  :href="resource.url!"
                  target="_blank"
                  rel="noopener noreferrer"
                  fill="outline"
                  size="small"
                  class="mt-2"
                >
                  <IonIcon
                    :icon="openOutline"
                    slot="start"
                  />
                  Open Resource
                </IonButton>

                <p
                  v-else-if="resource.url"
                  class="text-xs mt-2 resource-warning"
                >
                  Resource link is unavailable or not verified.
                </p>

                <p
                  v-else
                  class="text-xs text-medium mt-2"
                >
                  No resource link provided.
                </p>
              </div>
            </div>

          </IonCardContent>
        </IonCard>
      </template>

    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner,
  IonSkeletonText,
  alertController,
  toastController,
} from '@ionic/vue'

import {
  informationCircleOutline,
  bulbOutline,
  refreshOutline,
  addCircleOutline,
  openOutline,
} from 'ionicons/icons'

import {
  AppShell,
  SectionTitle,
} from './_ui'

import {
  getSkillUnlock,
  addWorkerSkill,
} from './_lib'

import type { SkillUnlockDTO } from './_types'

defineEmits<{
  back: []
}>()

const loading = ref(true)
const error = ref('')
const addingSkillId = ref('')

const recommendations = ref<SkillUnlockDTO[]>([])

// Only allow valid HTTP and HTTPS resource links.
// Placeholder example.com links are deliberately excluded.
function isUsableResourceUrl(value?: string | null): boolean {
  if (!value) return false

  try {
    const url = new URL(value)

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return false
    }

    if (
      url.hostname === 'example.com' ||
      url.hostname.endsWith('.example.com')
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}

// Display Ionic notifications.
async function showToast(
  message: string,
  color: 'success' | 'danger' | 'warning' = 'success',
) {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'bottom',
    color,
  })

  await toast.present()
}

// Load recommendations from Supabase.
async function loadRecommendations() {
  loading.value = true
  error.value = ''

  try {
    recommendations.value = await getSkillUnlock()
  } catch (err) {
    console.error(
      'Failed to load skill recommendations:',
      err,
    )

    error.value =
      err instanceof Error
        ? err.message
        : 'Unable to load recommendations. Please try again.'
  } finally {
    loading.value = false
  }
}

// Ask for confirmation before adding a recommended skill.
async function confirmAddSkill(
  recommendation: SkillUnlockDTO,
) {
  if (addingSkillId.value) return

  const alert = await alertController.create({
    header: 'Add Skill to Your Profile?',
    message:
      `Add "${recommendation.recommendedSkillName}" to your skills profile? ` +
      'It will be recorded as self-declared. Completing a course does not ' +
      'verify this skill. Skill-level promotion is handled separately ' +
      'through completed employment.',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Add Skill',
        role: 'confirm',
      },
    ],
  })

  await alert.present()

  const result = await alert.onDidDismiss()

  if (result.role !== 'confirm') return

  await saveRecommendedSkill(recommendation)
}

// Save the skill using the existing Supabase helper.
// addWorkerSkill() assigns level: 'self_declared'.
async function saveRecommendedSkill(
  recommendation: SkillUnlockDTO,
) {
  if (addingSkillId.value) return

  addingSkillId.value = recommendation.recommendedSkillId

  try {
    await addWorkerSkill(
      recommendation.recommendedSkillId,
    )

    await showToast(
      `${recommendation.recommendedSkillName} was added to your profile as self-declared.`,
      'success',
    )

    // Reload recommendations after the profile changes.
    await loadRecommendations()
  } catch (err) {
    console.error(
      'Failed to add recommended skill:',
      err,
    )

    await showToast(
      err instanceof Error
        ? err.message
        : 'Unable to add this skill. Please try again.',
      'danger',
    )
  } finally {
    addingSkillId.value = ''
  }
}

onMounted(loadRecommendations)
</script>

<style scoped>
.notice-card {
  --background: #eff6ff;
  border: 1px solid #bfdbfe;
  box-shadow: none;
}

.notice-card ion-card-content {
  color: #1e40af;
}

.notice-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.recommendation-card {
  margin-left: 0;
  margin-right: 0;
}

.job-item {
  --padding-start: 0;
  --inner-padding-end: 0;
}

.resource-item {
  padding: 12px;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 12px;
}

.resource-warning {
  color: var(--ion-color-warning-shade);
}

.empty-icon {
  font-size: 42px;
  margin-bottom: 12px;
  color: var(--ion-color-primary);
}
</style>
