<template>
  <div class="space-y-3">
    <EmptyState
      v-if="accomplishments.length === 0"
      :icon="Icons.ClipboardList"
      title="No daily reports yet"
      description="Workers submit daily accomplishment reports here. Approve them to count workdays."
    />

    <template v-else>
      <template v-if="pending.length">
        <SectionTitle>
          Awaiting review
          <template #action>
            <span class="tl-caption">{{ pending.length }}</span>
          </template>
        </SectionTitle>
        <div class="space-y-2">
          <div v-for="item in pending" :key="item.id" class="tl-card">
            <div class="tl-card-body space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-sm">{{ formatDate(item.workDate) }}</p>
                  <p class="text-[11px] tl-muted">Submitted {{ relativeTime(item.createdAt) }}</p>
                </div>
                <StatusPill :status="item.status" :list="ACCOMPLISHMENT_STATUSES" />
              </div>

              <div class="flex items-center justify-between text-xs">
                <span class="tl-muted">Progress</span>
                <span class="font-medium">{{ item.progressPercent }}%</span>
              </div>
              <ProgressBar :value="item.progressPercent" />

              <p v-if="item.description" class="text-sm">{{ item.description }}</p>

              <ul v-if="item.tasks.length" class="list-disc pl-5 text-sm space-y-0.5">
                <li v-for="(task, index) in item.tasks" :key="index">{{ task }}</li>
              </ul>

              <div v-if="item.photos.length" class="photo-grid">
                <img
                  v-for="photo in item.photos"
                  :key="photo.id"
                  :src="photo.url"
                  alt="Work photo"
                  loading="lazy"
                />
              </div>

              <p v-if="item.remarks" class="text-xs tl-muted">Remarks: {{ item.remarks }}</p>

              <button type="button" class="tl-btn sm" @click="emit('review', item)">
                <ion-icon :icon="Icons.CheckCircle2" /> Review report
              </button>
            </div>
          </div>
        </div>
      </template>

      <SectionTitle v-if="reviewed.length">
        Reviewed
        <template #action>
          <span class="tl-caption">{{ reviewed.length }}</span>
        </template>
      </SectionTitle>
      <div class="space-y-2">
        <div v-for="item in reviewed" :key="item.id" class="tl-card">
          <div class="tl-card-body space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-medium text-sm">{{ formatDate(item.workDate) }}</p>
                <p class="text-[11px] tl-muted">
                  Reviewed {{ item.reviewedAt ? formatDate(item.reviewedAt) : '' }}
                </p>
              </div>
              <StatusPill :status="item.status" :list="ACCOMPLISHMENT_STATUSES" />
            </div>

            <p v-if="item.description" class="text-sm">{{ item.description }}</p>

            <div v-if="item.photos.length" class="photo-grid">
              <img
                v-for="photo in item.photos"
                :key="photo.id"
                :src="photo.url"
                alt="Work photo"
                loading="lazy"
              />
            </div>

            <p v-if="item.employerFeedback" class="text-xs tl-muted">
              Feedback: {{ item.employerFeedback }}
            </p>
            <p v-if="item.status === 'rejected' && item.rejectionReason" class="text-xs" style="color: #b91c1c">
              Reason: {{ item.rejectionReason }}
            </p>

            <button type="button" class="tl-btn outline sm" @click="emit('review', item)">
              <ion-icon :icon="Icons.Eye" /> View details
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { ACCOMPLISHMENT_STATUSES, type AccomplishmentDTO } from '../worker/_lib'
import {
  EmptyState,
  formatDate,
  Icons,
  ProgressBar,
  relativeTime,
  SectionTitle,
  StatusPill,
} from '../worker/_ui'

const props = defineProps<{ accomplishments: AccomplishmentDTO[] }>()
const emit = defineEmits<{ (e: 'review', item: AccomplishmentDTO): void }>()

const pending = computed(() => props.accomplishments.filter((a) => a.status === 'pending'))
const reviewed = computed(() => props.accomplishments.filter((a) => a.status !== 'pending'))
</script>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.photo-grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--tl-border);
}
</style>
