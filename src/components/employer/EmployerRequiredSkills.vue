<template>
  <div class="space-y-3">
    <div v-if="modelValue.length" class="space-y-2">
      <div
        v-for="item in modelValue"
        :key="item.skillId"
        class="tl-card"
        style="background: var(--tl-bg)"
      >
        <div class="tl-card-body p-3 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <p class="font-medium text-sm truncate">{{ item.skillName }}</p>
            <button
              type="button"
              class="tl-btn ghost icon"
              style="color: #b91c1c"
              :aria-label="`Remove ${item.skillName}`"
              @click="removeSkill(item.skillId)"
            >
              <ion-icon :icon="Icons.Trash2" />
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <FormSelect
              :model-value="item.importance"
              :options="importanceOptions"
              @update:model-value="setImportance(item.skillId, $event)"
            />
            <input
              :value="item.weight"
              class="tl-input"
              type="number"
              min="0"
              max="1"
              step="0.05"
              inputmode="decimal"
              aria-label="Skill weight"
              @input="setWeight(item.skillId, $event)"
            />
          </div>
          <p class="tl-caption">Weight 0–1 controls how much this skill affects match scores.</p>
        </div>
      </div>
    </div>
    <p v-else class="text-xs tl-muted">
      No required skills yet. Search below to add the skills that matter most.
    </p>

    <Field label="Find a skill">
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <ion-icon
            :icon="Icons.Search"
            class="tl-muted"
            style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%)"
          />
          <input
            v-model="query"
            class="tl-input"
            style="padding-left: 32px"
            placeholder="Search skills, e.g. welding"
          />
        </div>
        <button v-if="query" type="button" class="tl-btn ghost icon" aria-label="Clear search" @click="query = ''">
          <ion-icon :icon="Icons.Close" />
        </button>
      </div>
    </Field>

    <FormSelect
      v-model="categoryId"
      :options="categoryOptions"
      placeholder="All skill categories"
    />

    <div v-if="searching" class="flex items-center gap-2 text-xs tl-muted">
      <ion-icon :icon="Icons.Loader2" class="tl-spin" /> Searching skills…
    </div>
    <ErrorRetry v-else-if="searchError" :message="searchError" @retry="runSearch" />
    <div v-else-if="showResults" class="space-y-2">
      <p v-if="results.length === 0" class="text-xs tl-muted">No matching skills found.</p>
      <button
        v-for="skill in results"
        :key="skill.id"
        type="button"
        class="tl-card clickable"
        style="width: 100%; text-align: left; background: var(--tl-bg)"
        @click="addSkill(skill)"
      >
        <div class="tl-card-body p-2.5 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-medium truncate">{{ skill.name }}</p>
            <p class="text-[11px] tl-muted">{{ skill.categoryName ?? 'Uncategorized' }}</p>
          </div>
          <ion-icon :icon="Icons.Plus" class="tl-primary" />
        </div>
      </button>
    </div>
    <p v-else class="tl-caption">Type a skill name or choose a category to see results.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { listSkills, type SkillDTO } from '../worker/_lib'
import { ErrorRetry, Field, FormSelect, Icons } from '../worker/_ui'

interface RequiredSkill {
  skillId: string
  skillName: string
  importance: 'required' | 'preferred'
  weight: number
}

const props = defineProps<{ modelValue: RequiredSkill[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: RequiredSkill[]): void }>()

const importanceOptions = [
  { value: 'required', label: 'Required' },
  { value: 'preferred', label: 'Preferred' },
]

const query = ref('')
const categoryId = ref('')
const categories = ref<{ id: string; name: string }[]>([])
const results = ref<SkillDTO[]>([])
const searching = ref(false)
const searchError = ref('')
const showResults = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const categoryOptions = computed(() => [
  { value: '', label: 'All skill categories' },
  ...categories.value.map((c) => ({ value: c.id, label: c.name })),
])

const selectedIds = computed(() => new Set(props.modelValue.map((s) => s.skillId)))

async function loadCategories() {
  try {
    const res = await listSkills()
    categories.value = res.categories.map((c) => ({ id: c.id, name: c.name }))
  } catch {
    categories.value = []
  }
}

async function runSearch() {
  const q = query.value.trim()
  if (!q && !categoryId.value) {
    showResults.value = false
    results.value = []
    return
  }
  searching.value = true
  searchError.value = ''
  try {
    const res = await listSkills(q || undefined, categoryId.value || undefined)
    results.value = res.data.filter((s) => !selectedIds.value.has(s.id))
    showResults.value = true
  } catch (e: any) {
    searchError.value = e?.message || 'Could not load skills.'
    showResults.value = true
  } finally {
    searching.value = false
  }
}

watch([query, categoryId], () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    void runSearch()
  }, 250)
})

onMounted(() => {
  void loadCategories()
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

function addSkill(skill: SkillDTO) {
  if (selectedIds.value.has(skill.id)) return
  emit('update:modelValue', [
    ...props.modelValue,
    { skillId: skill.id, skillName: skill.name, importance: 'required', weight: 1 },
  ])
  query.value = ''
  showResults.value = false
}

function removeSkill(skillId: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((s) => s.skillId !== skillId)
  )
}

function setImportance(skillId: string, value: string) {
  const importance = value === 'preferred' ? 'preferred' : 'required'
  emit(
    'update:modelValue',
    props.modelValue.map((s) => (s.skillId === skillId ? { ...s, importance } : s))
  )
}

function setWeight(skillId: string, event: Event) {
  const raw = Number((event.target as HTMLInputElement).value)
  const weight = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 1
  emit(
    'update:modelValue',
    props.modelValue.map((s) => (s.skillId === skillId ? { ...s, weight } : s))
  )
}
</script>
