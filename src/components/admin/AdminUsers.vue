<template>
  <AppShell title="Users" :subtitle="`${data?.length ?? 0} found`">
    <template #right>
      <RefreshHeader :refreshing="loading" @refresh="refresh" />
    </template>

    <PullRefresh :refreshing="loading" @refresh="refresh">
      <div class="filters">
        <div class="search-wrap">
          <IonIcon :icon="Icons.Search" class="search-icon text-muted-foreground" />
          <input v-model="q" type="text" class="tl-input search-input" placeholder="Search name or email…" />
        </div>
        <div class="filters-grid">
          <Field>
            <FormSelect v-model="role" :options="ROLE_OPTIONS" />
          </Field>
          <Field>
            <FormSelect v-model="status" :options="STATUS_OPTIONS" />
          </Field>
        </div>
      </div>

      <LoadingCards v-if="loading" :count="5" />
      <ErrorRetry v-else-if="error" :message="error ?? ''" @retry="refresh" />
      <EmptyState
        v-else-if="!data || data.length === 0"
        :icon="Icons.Users"
        title="No users found"
        description="Try adjusting your search or filters."
      />
      <div v-else class="tl-list">
        <button
          v-for="u in data"
          :key="u.id"
          type="button"
          class="tl-card clickable user-card"
          @click="emit('open-user', u.id)"
        >
          <div class="tl-card-body user-body">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm truncate">{{ u.name ?? u.email }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ u.email }}</p>
              </div>
              <StatusPill :status="u.status" />
            </div>

            <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground mt-2">
              <span class="tl-pill capitalize">{{ u.role }}</span>
              <VerifiedBadge
                v-if="u.role === 'employer' && u.verification"
                :verification="u.verification ?? 'unverified'"
              />
              <span v-if="u.municipality" class="inline-flex items-center gap-0.5 truncate">
                <IonIcon :icon="Icons.MapPin" class="tiny-icon" />
                {{ u.municipality }}
              </span>
              <span class="ml-auto">Joined {{ relativeTime(u.createdAt) }}</span>
            </div>
          </div>
        </button>
      </div>
    </PullRefresh>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { onUnmounted, ref, watch } from 'vue'

import {
  AppShell,
  EmptyState,
  ErrorRetry,
  Field,
  FormSelect,
  Icons,
  LoadingCards,
  PullRefresh,
  RefreshHeader,
  StatusPill,
  VerifiedBadge,
} from '../worker/_ui'
import {
  adminListUsers,
  relativeTime,
  useAsync,
  type AdminUserRow,
} from '../worker/_lib'

const emit = defineEmits<{
  (e: 'open-user', userId: string): void
}>()

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'worker', label: 'Workers' },
  { value: 'employer', label: 'Employers' },
  { value: 'admin', label: 'Admins' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

const q = ref('')
const debouncedQ = ref('')
const role = ref('all')
const status = ref('all')

let timer: ReturnType<typeof setTimeout> | undefined
watch(q, (value) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    debouncedQ.value = value.trim()
  }, 350)
})
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

const { data, loading, error, refresh } = useAsync<AdminUserRow[]>(
  () =>
    adminListUsers({
      q: debouncedQ.value || undefined,
      role: role.value === 'all' ? undefined : role.value,
      status: status.value === 'all' ? undefined : status.value,
    }),
  () => [debouncedQ.value, role.value, status.value]
)
</script>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
}

.search-input {
  padding-left: 36px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.user-card {
  width: 100%;
  text-align: left;
  font: inherit;
  padding: 0;
  color: inherit;
}

.user-body {
  display: flex;
  flex-direction: column;
}

.tiny-icon {
  font-size: 12px;
  vertical-align: -1px;
}
</style>
