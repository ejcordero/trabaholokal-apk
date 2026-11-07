<template>
  <BottomSheet
    :open="!!application"
    :title="application?.workerName ?? 'Applicant'"
    @close="emit('close')"
  >
    <div v-if="application" class="space-y-4">
      <div class="flex items-center gap-3">
        <Avatar :name="application.workerName ?? '?'" :src="application.workerPhotoUrl ?? ''" size="lg" />
        <div class="min-w-0 flex-1">
          <p class="font-semibold">{{ application.workerName || 'Anonymous' }}</p>
          <p class="text-xs tl-muted">{{ application.workerMunicipality ?? 'Location N/A' }}</p>
          <div class="mt-1">
            <StatusPill :status="application.status" :list="APPLICATION_STATUSES" />
          </div>
        </div>
        <MatchRing :score="application.matchScore" :size="54" />
      </div>

      <div class="tl-card" style="background: var(--tl-bg)">
        <div class="tl-card-body">
          <p class="text-xs uppercase tl-muted">Applied for</p>
          <p class="font-medium text-sm mt-0.5">{{ application.jobTitle }}</p>
          <p class="text-xs tl-muted mt-1">
            {{ formatCompensation(application.compensation, application.compensationType) }} ·
            {{ relativeTime(application.createdAt) }}
          </p>
          <p v-if="application.message" class="text-sm mt-2">“{{ application.message }}”</p>
        </div>
      </div>

      <div v-if="application.matchDetails" class="tl-card" style="background: var(--tl-bg)">
        <div class="tl-card-body space-y-2">
          <p class="text-xs font-semibold uppercase tl-muted">Match breakdown</p>
          <div class="space-y-1.5">
            <div>
              <div class="flex items-center justify-between text-xs">
                <span>Skill coverage</span>
                <span class="font-medium">{{ Math.round(application.matchDetails.skillCoverage * 100) }}%</span>
              </div>
              <ProgressBar :value="application.matchDetails.skillCoverage * 100" />
            </div>
            <div>
              <div class="flex items-center justify-between text-xs">
                <span>Experience relevance</span>
                <span class="font-medium">{{ Math.round(application.matchDetails.experienceRelevance * 100) }}%</span>
              </div>
              <ProgressBar :value="application.matchDetails.experienceRelevance * 100" />
            </div>
            <div>
              <div class="flex items-center justify-between text-xs">
                <span>Location suitability</span>
                <span class="font-medium">{{ Math.round(application.matchDetails.locationSuitability * 100) }}%</span>
              </div>
              <ProgressBar :value="application.matchDetails.locationSuitability * 100" />
            </div>
          </div>
          <div v-if="application.matchDetails.matchingSkills.length" class="flex flex-wrap gap-1">
            <span
              v-for="skill in application.matchDetails.matchingSkills"
              :key="skill"
              class="tl-pill approved"
            >
              {{ skill }}
            </span>
          </div>
          <div v-if="application.matchDetails.missingSkills.length">
            <p class="text-xs tl-muted">Missing skills</p>
            <div class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="skill in application.matchDetails.missingSkills"
                :key="skill"
                class="tl-pill pending"
              >
                {{ skill }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>
          Worker passport
          <template #action>
            <RefreshHeader :refreshing="passLoading" @refresh="refreshPassport" />
          </template>
        </SectionTitle>
        <LoadingCards v-if="passLoading" :count="2" />
        <ErrorRetry v-else-if="passError" :message="passError" @retry="refreshPassport" />
        <p v-else-if="!passport" class="text-xs tl-muted">No passport details are available yet.</p>
        <div v-else class="space-y-3">
          <p v-if="passport.bio" class="text-sm">{{ passport.bio }}</p>

          <div class="grid grid-cols-2 gap-2">
            <StatCard label="Completed jobs" :value="passport.completedJobs" :icon="Icons.CheckCircle2" />
            <StatCard label="Workdays" :value="passport.totalWorkdays" :icon="Icons.CalendarDays" />
          </div>


          <div v-if="passport.skills.length">
  <p class="text-xs font-semibold uppercase tl-muted mb-2">Skills and experience</p>

  <div class="space-y-3">
    <div
      v-for="skill in passport.skills"
      :key="skill.id"
      class="tl-card"
      style="background: var(--tl-bg)"
    >
      <div class="tl-card-body space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold">{{ skill.skillName }}</p>
            <p class="text-[11px] tl-muted">
              {{ skill.categoryName || 'Other skills' }}
            </p>
          </div>
          <SkillLevelBadge :level="skill.level" />
        </div>

        <div class="flex flex-wrap gap-2 text-xs tl-muted">
          <span>{{ skill.verifiedJobCount }} verified job(s)</span>
          <span>{{ skill.yearsExperience ?? 0 }} year(s) experience</span>
          <span v-if="skill.experienceLevel">
            {{ skill.experienceLevel.replace(/_/g, ' ') }}
          </span>
        </div>

        <p v-if="skill.notes" class="text-xs">
          {{ skill.notes }}
        </p>

        <!-- Specific tasks -->
        <div v-if="skill.tasks?.length" class="pt-2 border-t">
          <p class="text-xs font-semibold mb-2">Tasks they can perform</p>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="task in skill.tasks"
              :key="task.id"
              class="tl-pill approved"
            >
              {{ task.taskName }}
            </span>
          </div>
        </div>

        <!-- Tools and equipment -->
        <div v-if="skill.equipment?.length" class="pt-2 border-t">
          <p class="text-xs font-semibold mb-2">Tools and equipment</p>
          <div class="space-y-1">
            <div
              v-for="equipment in skill.equipment"
              :key="equipment.id"
              class="flex items-center justify-between gap-2 text-xs"
            >
              <span>{{ equipment.equipmentName }}</span>
              <span class="tl-muted">
                {{ equipment.relationship === 'owns' ? 'Owns' : 'Can operate' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>


<!-- Languages -->
<div>
  <p class="text-xs font-semibold uppercase tl-muted mb-2">Languages</p>

  <p
    v-if="!passport.languages?.length"
    class="text-xs tl-muted"
  >
    No languages listed.
  </p>

  <div v-else class="flex flex-wrap gap-1">
    <span
      v-for="language in passport.languages"
      :key="language.id"
      class="tl-pill approved"
    >
      {{ language.languageName }} ·
      {{ language.proficiency.replace(/_/g, ' ') }}
    </span>
  </div>
</div>



          <div v-if="passport.badges.length">
            <p class="text-xs font-semibold uppercase tl-muted mb-1">Badges</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="(badge, index) in passport.badges" :key="index" class="tl-pill shortlisted">
                <ion-icon :icon="Icons.Award" /> {{ badge.skillName }} · {{ badge.badge }}
              </span>
            </div>
          </div>

          <div v-if="passport.evaluations.length">
            <p class="text-xs font-semibold uppercase tl-muted mb-1">Recent evaluations</p>
            <div class="space-y-2">
              <div
                v-for="evaluation in passport.evaluations.slice(0, 3)"
                :key="evaluation.id"
                class="tl-card"
                style="background: var(--tl-bg)"
              >
                <div class="tl-card-body p-2.5">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-xs font-medium truncate">{{ evaluation.employerName }}</p>
                    <div class="flex items-center gap-0.5">
                      <ion-icon
                        v-for="n in 5"
                        :key="n"
                        :icon="Icons.Star"
                        :style="{ color: n <= evaluation.rating ? '#d97706' : '#d1d5db', fontSize: '12px' }"
                      />
                    </div>
                  </div>
                  <p v-if="evaluation.comment" class="text-xs tl-muted mt-1">
                    “{{ evaluation.comment }}”
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="passport.employmentHistory.length">
            <p class="text-xs font-semibold uppercase tl-muted mb-1">Employment history</p>
            <div class="space-y-1.5">
              <div
                v-for="entry in passport.employmentHistory.slice(0, 4)"
                :key="entry.id"
                class="flex items-center justify-between gap-2 text-xs"
              >
                <div class="min-w-0">
                  <p class="font-medium truncate">{{ entry.jobTitle }}</p>
                  <p class="tl-muted">{{ entry.employerName }} · {{ formatDate(entry.startDate) }}</p>
                </div>
                <StatusPill :status="entry.status" :list="EMPLOYMENT_STATUSES" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="application.employerNote" class="tl-card" style="background: var(--tl-bg)">
        <div class="tl-card-body">
          <p class="text-xs uppercase tl-muted">Your note</p>
          <p class="text-sm mt-0.5">{{ application.employerNote }}</p>
        </div>
      </div>

      <div v-if="canAct" class="space-y-3">
        <Field label="Note to worker" hint="Optional. Shared with the worker when you update their status.">
          <textarea v-model="note" class="tl-textarea" rows="2" placeholder="Add a short note" />
        </Field>

        <div class="flex flex-wrap gap-2">
          <button
            v-if="application.status !== 'shortlisted'"
            type="button"
            class="tl-btn outline"
            :disabled="acting"
            @click="shortlist"
          >
            <ion-icon :icon="acting ? Icons.Loader2 : Icons.Star" :class="{ 'tl-spin': acting }" />
            Shortlist
          </button>
          <button type="button" class="tl-btn" :disabled="acting" @click="confirm = 'accepted'">
            <ion-icon :icon="Icons.Check" /> Accept
          </button>
          <button
            type="button"
            class="tl-btn danger"
            :disabled="acting"
            @click="confirm = 'rejected'"
          >
            <ion-icon :icon="Icons.Close" /> Reject
          </button>
        </div>
      </div>
      <p v-if="formError" class="tl-error">{{ formError }}</p>
    </div>

    <ConfirmDialog
      :open="!!confirm"
      :title="confirm === 'accepted' ? 'Accept this worker?' : 'Reject this applicant?'"
      :message="
        confirm === 'accepted'
          ? 'This marks the application as accepted. Make sure you have completed your hiring checks.'
          : 'Rejecting closes this application. You can add a reason in the note field.'
      "
      :confirm-label="confirm === 'accepted' ? 'Accept' : 'Reject'"
      :danger="confirm === 'rejected'"
      @cancel="confirm = null"
      @confirm="submitConfirmed"
    />
  </BottomSheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  APPLICATION_STATUSES,
  EMPLOYMENT_STATUSES,
  getPassport,
  updateApplicationStatus,
  useAsync,
  useToast,
  type ApplicationDTO,
  type PassportDTO,
} from '../worker/_lib'
import {
  Avatar,
  BottomSheet,
  ConfirmDialog,
  ErrorRetry,
  Field,
  formatCompensation,
  formatDate,
  Icons,
  LoadingCards,
  MatchRing,
  ProgressBar,
  RefreshHeader,
  relativeTime,
  SectionTitle,
  SkillLevelBadge,
  StatCard,
  StatusPill,
} from '../worker/_ui'

const props = defineProps<{ application: ApplicationDTO | null }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', application: ApplicationDTO): void
}>()

const { toast } = useToast()
const note = ref('')
const acting = ref(false)
const confirm = ref<'accepted' | 'rejected' | null>(null)
const formError = ref('')

const {
  data: passport,
  loading: passLoading,
  error: passError,
  refresh: refreshPassport,
} = useAsync<PassportDTO | null>(
  async () => {
    const app = props.application
    if (!app?.workerId) return null
    return getPassport(app.workerId)
  },
  () => [props.application?.workerId]
)

const canAct = computed(() => {
  const status = props.application?.status
  return Boolean(status && !['accepted', 'rejected', 'withdrawn'].includes(status))
})

watch(
  () => props.application?.id,
  () => {
    note.value = props.application?.employerNote ?? ''
    confirm.value = null
    formError.value = ''
  }
)

async function patch(status: string, employerNote: string | null) {
  const app = props.application
  if (!app) return
  acting.value = true
  formError.value = ''
  try {
    const updated = await updateApplicationStatus(app.id, status, employerNote)
    await toast(`Application ${status.replace(/_/g, ' ')}.`)
    emit('updated', updated)
  } catch (e: any) {
    formError.value = e?.message || 'Could not update the application.'
    await toast(formError.value, 'danger')
  } finally {
    acting.value = false
  }
}

function shortlist() {
  void patch('shortlisted', note.value.trim() || null)
}

function submitConfirmed() {
  const decision = confirm.value
  if (!decision) return
  if (decision === 'rejected' && !note.value.trim()) {
    confirm.value = null
    formError.value = 'Add a short reason before rejecting this applicant.'
    void toast(formError.value, 'warning')
    return
  }
  confirm.value = null
  void patch(decision, note.value.trim() || null)
}
</script>
