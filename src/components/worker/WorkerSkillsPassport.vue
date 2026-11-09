
<template>
  <AppShell title="Skills Passport" back @back="emit('back')">
    <div class="space-y-4">
      <!-- Header actions -->
      <div class="flex justify-end gap-2">
        <IonButton
          fill="outline"
          size="small"
          :disabled="loading || !passport"
          @click="sharePassport"
        >
          <IonIcon slot="start" :icon="shareOutline" />
          Share
        </IonButton>

        <IonButton
          fill="clear"
          size="small"
          :disabled="loading"
          @click="loadPassport"
        >
          <IonIcon slot="start" :icon="refreshOutline" />
          Refresh
        </IonButton>
      </div>

      <!-- Error -->
      <ErrorRetry
        v-if="error"
        :message="error"
        @retry="loadPassport"
      />

      <!-- Loading -->
      <LoadingCards v-else-if="loading" :count="4" />

      <!-- Empty -->
      <EmptyState
        v-else-if="!passport"
        icon="person"
        title="Skills Passport unavailable"
        description="Your Skills Passport could not be loaded. Please try again."
      />

      <!-- Passport -->
      <template v-else>
        <!-- Worker profile -->
        <IonCard class="profile-card">
          <IonCardContent>
            <div class="flex items-center gap-4">
              <IonAvatar class="profile-avatar">
                <img
                  v-if="passport.photoUrl"
                  :src="passport.photoUrl"
                  :alt="passport.workerName"
                />
                <div v-else class="avatar-fallback">
                  {{ initials }}
                </div>
              </IonAvatar>

              <div class="min-w-0 flex-1">
                <h2 class="worker-name">{{ passport.workerName }}</h2>

                <p class="muted-text">
                  <IonIcon :icon="locationOutline" />
                  {{ locationText }}
                </p>

                <IonBadge color="success" class="mt-2">
                  Skills Passport
                </IonBadge>
              </div>
            </div>

            <p v-if="passport.bio" class="bio-text">
              {{ passport.bio }}
            </p>
          </IonCardContent>
        </IonCard>

        <!-- Statistics -->
        <div class="stats-grid">
          <IonCard class="stat-card">
            <IonCardContent>
              <IonIcon :icon="briefcaseOutline" color="success" />
              <strong>{{ passport.completedJobs }}</strong>
              <span>Completed jobs</span>
            </IonCardContent>
          </IonCard>

          <IonCard class="stat-card">
            <IonCardContent>
              <IonIcon :icon="timeOutline" color="success" />
              <strong>{{ passport.totalWorkdays }}</strong>
              <span>Approved workdays</span>
            </IonCardContent>
          </IonCard>

          <IonCard class="stat-card">
            <IonCardContent>
              <IonIcon :icon="constructOutline" color="success" />
              <strong>{{ passport.skills.length }}</strong>
              <span>Listed skills</span>
            </IonCardContent>
          </IonCard>
        </div>

        <!-- Skills -->
        <section>
          <SectionTitle>Skills and experience</SectionTitle>

          <EmptyState
            v-if="passport.skills.length === 0"
            icon="construct"
            title="No skills added yet"
            description="Add skills to your Skills Profile to display them here."
          />

          <IonCard
            v-for="skill in passport.skills"
            :key="skill.id"
            class="content-card"
          >
            <IonCardContent>
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="item-title">{{ skill.skillName }}</h3>
                  <p class="muted-text">
                    {{ skill.categoryName || 'Other skills' }}
                  </p>
                </div>

                <IonBadge :color="levelColor(skill.level)">
                  {{ levelLabel(skill.level) }}
                </IonBadge>
              </div>

              <div class="skill-details">
                <span v-if="skill.experienceLevel">
                  {{ formatLabel(skill.experienceLevel) }}
                </span>

                <span v-if="skill.yearsExperience != null">
                  {{ skill.yearsExperience }} year(s) experience
                </span>

                <span>
                  {{ skill.verifiedJobCount }} verified job(s)
                </span>

                <span>
                  {{ skill.totalRatingCount }} evaluation(s)
                </span>
              </div>

              <p v-if="skill.notes" class="notes-text">
                {{ skill.notes }}
              </p>

              <!-- Specific tasks -->
<div v-if="skill.tasks?.length" class="mt-3">
  <h4 class="text-sm font-semibold mb-2">Tasks you can perform</h4>
  <div class="flex flex-wrap gap-2">
    <IonChip
      v-for="task in skill.tasks"
      :key="task.id"
      color="primary"
    >
      <IonLabel>{{ task.taskName }}</IonLabel>
    </IonChip>
  </div>
</div>

<!-- Tools and equipment -->
<div v-if="skill.equipment?.length" class="mt-3">
  <h4 class="text-sm font-semibold mb-2">Tools and equipment</h4>
  <div class="space-y-2">
    <div
      v-for="equipment in skill.equipment"
      :key="equipment.id"
      class="flex items-center justify-between gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2"
    >
      <span class="text-sm">{{ equipment.equipmentName }}</span>
      <IonBadge color="medium">
        {{ equipment.relationship === 'owns' ? 'Owns' : 'Can operate' }}
      </IonBadge>
    </div>
  </div>
</div>

              <div
                v-if="skill.badges?.length"
                class="flex flex-wrap gap-2 mt-3"
              >
                <IonChip
                  v-for="badge in skill.badges"
                  :key="badge"
                  color="success"
                >
                  <IonIcon :icon="ribbonOutline" />
                  <IonLabel>{{ badge }}</IonLabel>
                </IonChip>
              </div>
            </IonCardContent>
          </IonCard>
        </section>

        <!-- Languages -->
<section>
  <SectionTitle>Languages</SectionTitle>

  <EmptyState
    v-if="!passport.languages?.length"
    icon="language"
    title="No languages listed"
    description="The worker has not added any languages yet."
  />

  <IonCard
    v-else
    class="content-card"
  >
    <IonCardContent>
      <div class="flex flex-wrap gap-2">
        <IonChip
          v-for="language in passport.languages"
          :key="language.id"
          color="primary"
        >
          <IonLabel>
            {{ language.languageName }} · {{ formatLabel(language.proficiency) }}
          </IonLabel>
        </IonChip>
      </div>
    </IonCardContent>
  </IonCard>
</section>

        <!-- Earned badges -->
        <section>
          <SectionTitle>Earned badges</SectionTitle>

          <EmptyState
            v-if="passport.badges.length === 0"
            icon="ribbon"
            title="No badges earned yet"
            description="Badges may be earned through qualifying verified work and evaluations."
          />

          <IonCard v-else class="content-card">
            <IonCardContent>
              <IonList lines="none">
                <IonItem
                  v-for="(badge, index) in passport.badges"
                  :key="`${badge.skillName}-${badge.badge}-${index}`"
                >
                  <IonIcon
                    slot="start"
                    :icon="ribbonOutline"
                    color="success"
                  />

                  <IonLabel>
                    <h3>{{ badge.badge }}</h3>
                    <p>{{ badge.skillName }}</p>
                    <p>Earned {{ formatDate(badge.earnedAt) }}</p>
                  </IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        </section>

        <!-- Employment history -->
        <section>
          <SectionTitle>Work history</SectionTitle>

          <EmptyState
            v-if="passport.employmentHistory.length === 0"
            icon="briefcase"
            title="No employment history yet"
            description="Your employment records will appear here when you begin working through TrabahoLokal."
          />

          <IonCard
            v-for="employment in passport.employmentHistory"
            :key="employment.id"
            class="content-card"
          >
            <IonCardContent>
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="item-title">{{ employment.jobTitle }}</h3>
                  <p class="muted-text">{{ employment.employerName }}</p>
                </div>

                <IonBadge :color="statusColor(employment.status)">
                  {{ formatLabel(employment.status) }}
                </IonBadge>
              </div>

              <div class="history-details">
                <p>
                  <IonIcon :icon="calendarOutline" />
                  {{ formatDate(employment.startDate) }}
                  –
                  {{ employment.endDate ? formatDate(employment.endDate) : 'Present' }}
                </p>

                <p>
                  <IonIcon :icon="timeOutline" />
                  {{ employment.approvedWorkdays }} approved workday(s)
                </p>

                <p>
                  <IonIcon :icon="documentTextOutline" />
                  {{ formatLabel(employment.employmentEvent) }}
                </p>
              </div>
            </IonCardContent>
          </IonCard>
        </section>

        <!-- Employer evaluations -->
        <section>
          <SectionTitle>Employer evaluations</SectionTitle>

          <EmptyState
            v-if="passport.evaluations.length === 0"
            icon="star"
            title="No evaluations yet"
            description="Employer evaluations will appear here after qualifying completed work."
          />

          <IonCard
            v-for="evaluation in passport.evaluations"
            :key="evaluation.id"
            class="content-card"
          >
            <IonCardContent>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="item-title">{{ evaluation.jobTitle }}</h3>
                  <p class="muted-text">{{ evaluation.employerName }}</p>
                </div>

                <IonBadge color="warning">
                  <IonIcon :icon="star" />
                  {{ evaluation.rating }}/5
                </IonBadge>
              </div>

              <p v-if="evaluation.comment" class="notes-text">
                "{{ evaluation.comment }}"
              </p>

              <p class="date-text">
                {{ formatDate(evaluation.createdAt) }}
              </p>
            </IonCardContent>
          </IonCard>
        </section>

        <p class="privacy-note">
          This passport displays skills and work achievements. Private contact
          information is not included in the shareable summary.
        </p>
      </template>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  IonAvatar,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonIcon,
  IonItem,
  IonLabel,
  IonList
} from '@ionic/vue'

import {
  briefcaseOutline,
  calendarOutline,
  constructOutline,
  documentTextOutline,
  locationOutline,
  refreshOutline,
  ribbonOutline,
  shareOutline,
  star,
  timeOutline
} from 'ionicons/icons'

import {
  AppShell,
  LoadingCards,
  ErrorRetry,
  EmptyState,
  SectionTitle
} from './_ui'

import { getPassport } from './_lib'
import type { PassportDTO } from './_types'

const props = defineProps<{
  workerProfileId?: string
}>()

const emit = defineEmits<{
  back: []
}>()

const passport = ref<PassportDTO | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const initials = computed(() => {
  const name = passport.value?.workerName?.trim()

  if (!name) return 'TL'

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
})

const locationText = computed(() => {
  if (!passport.value) return 'Location not provided'

  return [
    passport.value.barangay,
    passport.value.municipalityName
  ].filter(Boolean).join(', ') || 'Location not provided'
})

async function loadPassport() {
  if (loading.value) return

  if (!props.workerProfileId) {
    passport.value = null
    error.value = 'Your worker profile could not be identified. Please sign in again.'
    return
  }

  loading.value = true
  error.value = null

  try {
    passport.value = await getPassport(props.workerProfileId)

    if (!passport.value) {
      error.value = 'No Skills Passport information was returned.'
    }
  } catch (err) {
    console.error('Failed to load Skills Passport:', err)
    error.value = err instanceof Error
      ? err.message
      : 'Unable to load your Skills Passport. Please try again.'
  } finally {
    loading.value = false
  }
}

function levelLabel(level: string): string {
  const labels: Record<string, string> = {
    self_declared: 'Self-declared',
    verified_experience: 'Verified experience',
    repeatedly_demonstrated: 'Repeatedly demonstrated',
    highly_rated: 'Highly rated'
  }

  return labels[level] || formatLabel(level)
}

function levelColor(level: string): string {
  const colors: Record<string, string> = {
    self_declared: 'medium',
    verified_experience: 'success',
    repeatedly_demonstrated: 'tertiary',
    highly_rated: 'warning'
  }

  return colors[level] || 'medium'
}

function statusColor(status: string): string {
  const value = status.toLowerCase()

  if (value === 'completed') return 'success'
  if (value === 'active' || value === 'ongoing') return 'primary'
  if (value === 'pending') return 'warning'
  if (value === 'cancelled' || value === 'terminated') return 'danger'

  return 'medium'
}

function formatLabel(value: string): string {
  if (!value) return ''

  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function formatDate(value: string): string {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

async function sharePassport() {
  if (!passport.value) return

  const profile = passport.value

  const skillLines = profile.skills.map(skill => {
    return `- ${skill.skillName}: ${levelLabel(skill.level)}`
  })

  const shareText = [
    `TrabahoLokal Skills Passport`,
    `Worker: ${profile.workerName}`,
    `Location: ${locationText.value}`,
    '',
    `Completed jobs: ${profile.completedJobs}`,
    `Approved workdays: ${profile.totalWorkdays}`,
    '',
    'Skills:',
    ...(skillLines.length ? skillLines : ['- No skills listed yet']),
    '',
    'This summary reflects the Skills Passport information available in TrabahoLokal.'
  ].join('\n')

  try {
    if (navigator.share) {
      await navigator.share({
        title: `${profile.workerName} - Skills Passport`,
        text: shareText
      })
      return
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText)
      window.alert('Skills Passport summary copied.')
      return
    }

    window.alert('Sharing is not supported on this device.')
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return

    console.error('Unable to share Skills Passport:', err)
    window.alert('Unable to share the Skills Passport. Please try again.')
  }
}

onMounted(loadPassport)
</script>

<style scoped>
.profile-card,
.content-card,
.stat-card {
  margin: 0;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.045);
}

.profile-avatar {
  width: 68px;
  height: 68px;
  flex-shrink: 0;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-success);
  color: white;
  font-size: 22px;
  font-weight: 700;
}

.worker-name {
  margin: 0 0 6px;
  font-size: 19px;
  font-weight: 700;
  color: var(--ion-text-color);
}

.muted-text {
  margin: 4px 0 0;
  color: var(--ion-color-medium);
  font-size: 13px;
}

.muted-text ion-icon,
.history-details ion-icon {
  vertical-align: middle;
  margin-right: 4px;
}

.bio-text {
  margin: 16px 0 0;
  color: var(--ion-text-color);
  font-size: 14px;
  line-height: 1.5;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.stat-card ion-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  padding: 14px 6px;
}

.stat-card ion-icon {
  font-size: 21px;
}

.stat-card strong {
  font-size: 21px;
  color: var(--ion-text-color);
}

.stat-card span {
  color: var(--ion-color-medium);
  font-size: 11px;
}

.item-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--ion-text-color);
}

.skill-details,
.history-details {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 12px;
  color: var(--ion-color-medium);
  font-size: 12px;
}

.history-details p {
  margin: 0;
}

.notes-text {
  margin: 12px 0 0;
  color: var(--ion-color-dark);
  font-size: 13px;
  line-height: 1.5;
}

.date-text {
  margin: 12px 0 0;
  color: var(--ion-color-medium);
  font-size: 11px;
}

.privacy-note {
  padding: 12px;
  color: var(--ion-color-medium);
  font-size: 12px;
  text-align: center;
  line-height: 1.5;
}

@media (min-width: 600px) {
  .stats-grid {
    gap: 12px;
  }

  .stat-card span {
    font-size: 12px;
  }
}
</style>
