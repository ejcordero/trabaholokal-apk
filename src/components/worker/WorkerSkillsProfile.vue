
<template>
  <AppShell title="Skills Profile" back @back="emit('back')">
    <div class="space-y-4">
      <!-- Profile summary -->
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-4">
            <Avatar :src="profile?.photoUrl ?? undefined" :alt="profile?.fullName ?? ''">
              <template #fallback>
                {{ initials(profile?.fullName || '?') }}
              </template>
            </Avatar>
            <div class="min-w-0 flex-1">
              <h2 class="font-semibold text-lg">{{ profile?.fullName }}</h2>
              <p class="text-sm text-muted-foreground">
                {{ profile?.municipalityName }}
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                {{ profile?.bio || 'No bio yet' }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Languages -->
      <Card>
        <CardContent class="p-4 space-y-3">
          <div>
            <h2 class="font-semibold">Languages</h2>
            <p class="text-xs text-muted-foreground">
              Add the languages you can communicate in.
            </p>
          </div>

          <div
            v-if="profile?.languages?.length"
            class="space-y-2"
          >
            <div
              v-for="language in profile.languages"
              :key="language.id"
              class="flex items-center justify-between gap-2 border rounded-lg p-3"
            >
              <div>
                <p class="font-medium text-sm">{{ language.languageName }}</p>
                <p class="text-xs text-muted-foreground capitalize">
                  {{ language.proficiency }}
                </p>
              </div>
              <IonButton
                size="small"
                fill="outline"
                color="danger"
                :disabled="busy"
                @click="removeLanguage(language.id)"
              >
                Remove
              </IonButton>
            </div>
          </div>

          <p
            v-else
            class="text-sm text-muted-foreground"
          >
            No languages added yet.
          </p>

          <div class="space-y-2">
            <IonInput
              v-model="languageDraft"
              label="Language"
              label-placement="stacked"
              placeholder="e.g. Filipino, English, Iraya"
              fill="outline"
            />

            <IonSelect
              v-model="languageProficiency"
              label="Proficiency"
              label-placement="stacked"
              interface="popover"
              fill="outline"
            >
              <IonSelectOption value="basic">Basic</IonSelectOption>
              <IonSelectOption value="conversational">Conversational</IonSelectOption>
              <IonSelectOption value="fluent">Fluent</IonSelectOption>
              <IonSelectOption value="native">Native</IonSelectOption>
            </IonSelect>

            <IonButton
              expand="block"
              :disabled="busy || !languageDraft.trim()"
              @click="addLanguage"
            >
              <IonIcon name="add" slot="start" />
              Add Language
            </IonButton>
          </div>
        </CardContent>
      </Card>

      <!-- Skills by category -->
      <div v-if="skillsByCategory.length > 0">
        <div
          v-for="category in skillsByCategory"
          :key="category.name"
          class="mb-4"
        >
          <SectionTitle>{{ category.name }}</SectionTitle>

          <div class="space-y-3">
            <Card
              v-for="skill in category.skills"
              :key="skill.id"
            >
              <CardContent class="p-4 space-y-3">
                <!-- Skill heading -->
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="font-semibold">{{ skill.skillName }}</p>
                    <p class="text-xs text-muted-foreground capitalize">
                      {{ formatLevel(skill.level) }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{ skill.verifiedJobCount }} verified jobs
                      <span v-if="skill.avgRating !== null && skill.avgRating !== undefined">
                        · {{ skill.avgRating }} rating
                      </span>
                    </p>
                  </div>

                  <IonButton
                    size="small"
                    fill="outline"
                    color="danger"
                    :disabled="busy"
                    @click="removeSkill(skill.skillId)"
                  >
                    Remove
                  </IonButton>
                </div>

                <!-- Experience details -->
                <div class="space-y-2 border-t pt-3">
                  <h3 class="text-sm font-semibold">Experience Details</h3>

                  <IonSelect
                    v-model="experienceDraft[skill.id]"
                    label="Experience level"
                    label-placement="stacked"
                    interface="popover"
                    fill="outline"
                  >
                    <IonSelectOption value="beginner">Beginner</IonSelectOption>
                    <IonSelectOption value="intermediate">Intermediate</IonSelectOption>
                    <IonSelectOption value="advanced">Advanced</IonSelectOption>
                  </IonSelect>

                  <IonInput
                    v-model="yearsDraft[skill.id]"
                    type="number"
                    min="0"
                    label="Years of experience"
                    label-placement="stacked"
                    placeholder="e.g. 2"
                    fill="outline"
                  />

                  <IonTextarea
                    v-model="notesDraft[skill.id]"
                    label="Additional details"
                    label-placement="stacked"
                    placeholder="Describe your experience with this skill..."
                    :auto-grow="true"
                    fill="outline"
                  />

                  <IonButton
                    expand="block"
                    fill="outline"
                    :disabled="busy"
                    @click="saveSkillDetails(skill)"
                  >
                    Save Experience Details
                  </IonButton>
                </div>

                <!-- Tasks -->
                <div class="space-y-2 border-t pt-3">
                  <h3 class="text-sm font-semibold">Specific Tasks</h3>
                  <p class="text-xs text-muted-foreground">
                    What tasks can you perform using this skill?
                  </p>

                  <div
                    v-if="skill.tasks?.length"
                    class="space-y-2"
                  >
                    <div
                      v-for="task in skill.tasks"
                      :key="task.id"
                      class="flex items-center justify-between gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2"
                    >
                      <span class="text-sm">{{ task.taskName }}</span>
                      <IonButton
                        size="small"
                        fill="clear"
                        color="danger"
                        :disabled="busy"
                        @click="removeTask(task.id)"
                      >
                        Remove
                      </IonButton>
                    </div>
                  </div>

                  <IonInput
                    v-model="taskDraft[skill.id]"
                    placeholder="e.g. Furniture assembly"
                    fill="outline"
                  />

                  <IonButton
                    expand="block"
                    size="small"
                    fill="outline"
                    :disabled="busy || !taskDraft[skill.id]?.trim()"
                    @click="addTask(skill)"
                  >
                    Add Task
                  </IonButton>
                </div>

                <!-- Equipment -->
                <div class="space-y-2 border-t pt-3">
                  <h3 class="text-sm font-semibold">Tools and Equipment</h3>

                  <div
                    v-if="skill.equipment?.length"
                    class="space-y-2"
                  >
                    <div
                      v-for="equipment in skill.equipment"
                      :key="equipment.id"
                      class="flex items-center justify-between gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2"
                    >
                      <div>
                        <p class="text-sm font-medium">
                          {{ equipment.equipmentName }}
                        </p>
                        <p class="text-xs text-muted-foreground capitalize">
                          {{ equipment.relationship }}
                        </p>
                      </div>
                      <IonButton
                        size="small"
                        fill="clear"
                        color="danger"
                        :disabled="busy"
                        @click="removeEquipment(equipment.id)"
                      >
                        Remove
                      </IonButton>
                    </div>
                  </div>

                  <IonInput
                    v-model="equipmentDraft[skill.id]"
                    placeholder="e.g. Electric drill"
                    fill="outline"
                  />

                  <IonSelect
                    v-model="equipmentRelationship[skill.id]"
                    label="Equipment relationship"
                    label-placement="stacked"
                    interface="popover"
                    fill="outline"
                  >
                    <IonSelectOption value="operates">Can operate</IonSelectOption>
                    <IonSelectOption value="owns">Personally owns</IonSelectOption>
                  </IonSelect>

                  <IonButton
                    expand="block"
                    size="small"
                    fill="outline"
                    :disabled="busy || !equipmentDraft[skill.id]?.trim()"
                    @click="addEquipment(skill)"
                  >
                    Add Equipment
                  </IonButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Card v-else>
        <CardContent class="p-4 text-center">
          <p class="text-sm text-muted-foreground">
            You haven't added any skills yet.
          </p>
        </CardContent>
      </Card>

      <!-- Add skill button -->
      <IonButton
        expand="block"
        :disabled="busy"
        @click="showAddSkill = true"
      >
        <IonIcon name="add" slot="start" />
        Add Skill
      </IonButton>

      <!-- Add skill modal -->
      <ion-modal
        :is-open="showAddSkill"
        @will-dismiss="showAddSkill = false"
        :breakpoints="[0, 0.75, 1]"
        :initial-breakpoint="0.75"
      >
        <ion-header>
          <ion-toolbar>
            <ion-title>Add Skill</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div class="space-y-4">
            <Field label="Category">
              <FormSelect
                :value="selectedCategory"
                @update:value="selectedCategory = $event; searchSkills()"
                :options="categories.map(c => ({ value: c.id, label: c.name }))"
                placeholder="Select category"
              />
            </Field>

            <Field label="Skill">
              <IonInput
                v-model="selectedSkill"
                placeholder="Search skills..."
                @ionInput="searchSkills"
              />
            </Field>

            <div
              v-if="filteredSkills.length > 0"
              class="space-y-2"
            >
              <Card
                v-for="skill in filteredSkills"
                :key="skill.id"
                @click="addSkill(skill)"
                class="cursor-pointer"
              >
                <CardContent class="p-3">
                  <p class="font-medium text-sm">{{ skill.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ skill.categoryName }}
                  </p>
                </CardContent>
              </Card>
            </div>

            <p
              v-else-if="selectedSkill.trim()"
              class="text-sm text-muted-foreground"
            >
              No matching skills found.
            </p>
          </div>
        </ion-content>
      </ion-modal>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'

import type {
  WorkerSkillDTO,
  SkillDTO,
  WorkerProfileDTO,
} from './_lib'

import {
  IonModal,
  IonIcon,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/vue'

import {
  AppShell,
  Card,
  CardContent,
  SectionTitle,
  Avatar,
  Field,
  FormSelect,
} from './_ui'

import {
  getWorkerMe,
  addWorkerSkill,
  removeWorkerSkill,
  listSkills,
  initials,
  useToast,
  addWorkerSkillTask,
  removeWorkerSkillTask,
  addWorkerSkillEquipment,
  removeWorkerSkillEquipment,
  addWorkerLanguage,
  removeWorkerLanguage,
} from './_lib'

const emit = defineEmits<{
  (event: 'back'): void
}>()

interface SkillCategory {
  id: string
  name: string
  icon?: string | null
}

const { toast } = useToast()

const profile = ref<WorkerProfileDTO | null>(null)
const skills = ref<WorkerSkillDTO[]>([])
const availableSkills = ref<SkillDTO[]>([])
const categories = ref<SkillCategory[]>([])

const showAddSkill = ref(false)
const selectedCategory = ref('')
const selectedSkill = ref('')
const filteredSkills = ref<SkillDTO[]>([])
const busy = ref(false)

const taskDraft = reactive<Record<string, string>>({})
const equipmentDraft = reactive<Record<string, string>>({})
const equipmentRelationship = reactive<Record<string, 'operates' | 'owns'>>({})
const experienceDraft = reactive<Record<string, string>>({})
const yearsDraft = reactive<Record<string, string>>({})
const notesDraft = reactive<Record<string, string>>({})

const languageDraft = ref('')
const languageProficiency = ref<'basic' | 'conversational' | 'fluent' | 'native'>('conversational')

const skillsByCategory = computed(() => {
  return categories.value
    .map(category => ({
      name: category.name,
      skills: skills.value.filter(
        skill => skill.categoryName === category.name
      ),
    }))
    .filter(category => category.skills.length > 0)
})

onMounted(async () => {
  try {
    await Promise.all([loadProfile(), loadCategories()])
  } catch {
    toast({
      message: 'Failed to load skills profile.',
      duration: 3000,
      color: 'danger',
    })
  }
})

async function loadProfile(): Promise<void> {
  const result = await getWorkerMe()

  profile.value = result
  skills.value = result.skills ?? []

  for (const skill of skills.value) {
    experienceDraft[skill.id] = skill.experienceLevel || 'beginner'
    yearsDraft[skill.id] =
      skill.yearsExperience === null || skill.yearsExperience === undefined
        ? ''
        : String(skill.yearsExperience)
    notesDraft[skill.id] = skill.notes || ''
    taskDraft[skill.id] = taskDraft[skill.id] || ''
    equipmentDraft[skill.id] = equipmentDraft[skill.id] || ''
    equipmentRelationship[skill.id] =
      equipmentRelationship[skill.id] || 'operates'
  }
}

async function loadCategories(): Promise<void> {
  const result = await listSkills()

  availableSkills.value = result.data
  categories.value = result.categories
}

function searchSkills(): void {
  if (!selectedCategory.value || !selectedSkill.value.trim()) {
    filteredSkills.value = []
    return
  }

  filteredSkills.value = availableSkills.value.filter(skill =>
    skill.categoryId === selectedCategory.value &&
    skill.name.toLowerCase().includes(selectedSkill.value.toLowerCase())
  )
}

function formatLevel(level: string): string {
  return level.replaceAll('_', ' ')
}

async function addSkill(skill: SkillDTO): Promise<void> {
  if (busy.value) return

  busy.value = true

  try {
    await addWorkerSkill(skill.id)
    await loadProfile()

    showAddSkill.value = false
    selectedCategory.value = ''
    selectedSkill.value = ''
    filteredSkills.value = []

    toast({
      message: 'Skill added.',
      duration: 3000,
    })
  } catch (e: any) {
    toast({
      message: e?.message || 'Failed to add skill.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    busy.value = false
  }
}

async function removeSkill(skillId: string): Promise<void> {
  if (busy.value) return

  busy.value = true

  try {
    await removeWorkerSkill(skillId)
    await loadProfile()

    toast({
      message: 'Skill removed.',
      duration: 3000,
    })
  } catch (e: any) {
    toast({
      message: e?.message || 'Failed to remove skill.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    busy.value = false
  }
}

async function saveSkillDetails(skill: WorkerSkillDTO): Promise<void> {
  if (busy.value) return

  const rawYears = yearsDraft[skill.id]?.trim() ?? ''
  const years = rawYears === '' ? undefined : Number(rawYears)

  if (
    years !== undefined &&
    (!Number.isInteger(years) || years < 0)
  ) {
    toast({
      message: 'Enter a valid number of years.',
      duration: 3000,
      color: 'warning',
    })
    return
  }

  busy.value = true

  try {
    await addWorkerSkill(skill.skillId, {
      yearsExperience: years,
      experienceLevel: experienceDraft[skill.id],
      notes: notesDraft[skill.id],
    })

    await loadProfile()

    toast({
      message: 'Experience details saved.',
      duration: 3000,
    })
  } catch (e: any) {
    toast({
      message: e?.message || 'Failed to save experience details.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    busy.value = false
  }
}

async function addTask(skill: WorkerSkillDTO): Promise<void> {
  if (busy.value) return

  const name = taskDraft[skill.id]?.trim()

  if (!name) return

  busy.value = true

  try {
    await addWorkerSkillTask(skill.id, name)
    taskDraft[skill.id] = ''
    await loadProfile()

    toast({
      message: 'Task added.',
      duration: 3000,
    })
  } catch (e: any) {
    toast({
      message: e?.message || 'Failed to add task.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    busy.value = false
  }
}

async function removeTask(taskId: string): Promise<void> {
  if (busy.value) return

  busy.value = true

  try {
    await removeWorkerSkillTask(taskId)
    await loadProfile()

    toast({
      message: 'Task removed.',
      duration: 3000,
    })
  } catch (e: any) {
    toast({
      message: e?.message || 'Failed to remove task.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    busy.value = false
  }
}

async function addEquipment(skill: WorkerSkillDTO): Promise<void> {
  if (busy.value) return

  const name = equipmentDraft[skill.id]?.trim()

  if (!name) return

  busy.value = true

  try {
    await addWorkerSkillEquipment(
      skill.id,
      name,
      equipmentRelationship[skill.id] || 'operates'
    )

    equipmentDraft[skill.id] = ''
    await loadProfile()

    toast({
      message: 'Equipment added.',
      duration: 3000,
    })
  } catch (e: any) {
    toast({
      message: e?.message || 'Failed to add equipment.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    busy.value = false
  }
}

async function removeEquipment(equipmentId: string): Promise<void> {
  if (busy.value) return

  busy.value = true

  try {
    await removeWorkerSkillEquipment(equipmentId)
    await loadProfile()

    toast({
      message: 'Equipment removed.',
      duration: 3000,
    })
  } catch (e: any) {
    toast({
      message: e?.message || 'Failed to remove equipment.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    busy.value = false
  }
}

async function addLanguage(): Promise<void> {
  if (busy.value) return

  if (!languageDraft.value.trim()) {
    toast({
      message: 'Please enter a language.',
      duration: 3000,
      color: 'warning',
    })
    return
  }

  busy.value = true

  try {
    await addWorkerLanguage(
      languageDraft.value,
      languageProficiency.value
    )

    languageDraft.value = ''
    await loadProfile()

    toast({
      message: 'Language saved.',
      duration: 3000,
    })
  } catch (e: any) {
    toast({
      message: e?.message || 'Failed to save language.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    busy.value = false
  }
}

async function removeLanguage(languageId: string): Promise<void> {
  if (busy.value) return

  busy.value = true

  try {
    await removeWorkerLanguage(languageId)
    await loadProfile()

    toast({
      message: 'Language removed.',
      duration: 3000,
    })
  } catch (e: any) {
    toast({
      message: e?.message || 'Failed to remove language.',
      duration: 3000,
      color: 'danger',
    })
  } finally {
    busy.value = false
  }
}
</script>
