<template>
  <AppShell title="Notifications" back @back="$emit('back')">
    <div class="space-y-2">
      <IonButton 
        v-if="unreadCount > 0"
        expand="block"
        @click="markAllAsRead"
      >
        Mark all as read
      </IonButton>

      <div v-if="loading">
        <LoadingCards :count="3" />
      </div>
      <div v-else-if="error">
        <ErrorRetry :message="error" @retry="loadNotifications" />
      </div>
      <div v-else-if="notifications.length === 0">
        <EmptyState
          icon="notifications"
          title="No notifications"
          description="You'll see updates about your applications and work here."
        />
      </div>
      <div v-else class="space-y-2">
        <Card
          v-for="notification in notifications"
          :key="notification.id"
          :class="!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''"
          @click="markAsRead(notification.id)"
        >
          <CardContent class="p-4">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <IonIcon 
                  :name="getNotificationIcon(notification.type)" 
                  :class="!notification.read ? 'text-blue-600' : 'text-muted-foreground'"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm">{{ notification.title }}</p>
                <p class="text-sm text-muted-foreground">{{ notification.body }}</p>
                <p class="text-xs text-muted-foreground mt-1">{{ relativeTime(notification.createdAt) }}</p>
              </div>
              <div v-if="!notification.read" class="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import type { NotificationDTO } from '../worker/_lib'
import { 
  IonIcon,
  IonButton
} from '@ionic/vue'
import { 
  AppShell, 
  LoadingCards, 
  ErrorRetry, 
  EmptyState,
  Card,
  CardContent
} from '../worker/_ui'
import { 
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  relativeTime,
  useToast
} from '../worker/_lib'

interface WorkerNotificationsProps {
  onBack: () => void
}

defineProps<WorkerNotificationsProps>()

const { toast } = useToast()
const notifications = ref<NotificationDTO[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

onMounted(() => {
  loadNotifications()
})

const loadNotifications = async () => {
  loading.value = true
  error.value = null
  
  try {
    const data = await listNotifications()
    notifications.value = data
  } catch (e: any) {
    error.value = e?.message || 'Failed to load notifications.'
  } finally {
    loading.value = false
  }
}

const markAsRead = async (notificationId: string) => {
  try {
    await markNotificationRead(notificationId)
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  } catch (e: any) {
    toast({
      message: 'Failed to mark as read',
      duration: 3000,
      color: 'danger'
    })
  }
}

const markAllAsRead = async () => {
  try {
    await markAllNotificationsRead()
    notifications.value.forEach(n => n.read = true)
    toast({
      message: 'All notifications marked as read',
      duration: 3000
    })
  } catch (e: any) {
    toast({
      message: 'Failed to mark all as read',
      duration: 3000,
      color: 'danger'
    })
  }
}

const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    application: 'document-text',
    employment: 'briefcase',
    accomplishment: 'checkmark-circle',
    renewal: 'refresh',
    report: 'warning',
    system: 'information-circle'
  }
  return iconMap[type] || 'notifications'
}
</script>