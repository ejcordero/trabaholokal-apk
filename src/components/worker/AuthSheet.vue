<template>
  <ion-modal 
    :is-open="open" 
    @will-dismiss="$emit('open-change', false)"
    :breakpoints="[0, 0.75, 1]"
    :initial-breakpoint="0.75"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ mode === 'login' ? 'Sign in to TrabahoLokal' : 'Create your account' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="space-y-4">
        <!-- Role selection for register -->
        <div v-if="mode === 'register'">
          <ion-label class="ion-text-wrap">I am registering as</ion-label>
          <ion-row class="ion-margin-top">
            <ion-col size="6">
              <ion-button 
                expand="block" 
                fill="outline"
                :color="role === 'worker' ? 'primary' : 'medium'"
                @click="role = 'worker'"
              >
                <ion-icon slot="start" name="briefcase"></ion-icon>
                <div>
                  <div>Worker</div>
                  <div class="ion-text-small">Find jobs & work</div>
                </div>
              </ion-button>
            </ion-col>
            <ion-col size="6">
              <ion-button 
                expand="block" 
                fill="outline"
                :color="role === 'employer' ? 'primary' : 'medium'"
                @click="role = 'employer'"
              >
                <ion-icon slot="start" name="person"></ion-icon>
                <div>
                  <div>Employer</div>
                  <div class="ion-text-small">Post jobs & hire</div>
                </div>
              </ion-button>
            </ion-col>
          </ion-row>
        </div>

        <!-- Form fields -->
        <div v-if="mode === 'register' && role === 'worker'">
          <ion-item>
            <ion-label position="stacked">Full name *</ion-label>
            <ion-input 
              v-model="form.fullName" 
              placeholder="Juan dela Cruz"
              required
            ></ion-input>
          </ion-item>
        </div>

        <div v-if="mode === 'register' && role === 'employer'">
          <ion-item>
            <ion-label position="stacked">Business / employer name *</ion-label>
            <ion-input 
              v-model="form.businessName" 
              placeholder="BuildRight Construction"
              required
            ></ion-input>
          </ion-item>
        </div>

        <ion-item>
          <ion-label position="stacked">Email *</ion-label>
          <ion-input 
            v-model="form.email" 
            type="email"
            placeholder="you@example.com"
            required
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Password *</ion-label>
          <ion-input 
            v-model="form.password" 
            type="password"
            :placeholder="mode === 'login' ? 'At least 6 characters' : 'At least 6 characters'"
            required
          ></ion-input>
        </ion-item>

        <ion-item v-if="mode === 'register'">
          <ion-label position="stacked">Confirm password *</ion-label>
          <ion-input 
            v-model="form.confirmPassword" 
            type="password"
            required
          ></ion-input>
        </ion-item>

        <ion-item v-if="mode === 'register'">
          <ion-label position="stacked">Mobile number</ion-label>
          <ion-input 
            v-model="form.mobileNumber" 
            placeholder="0917xxxxxxx"
          ></ion-input>
        </ion-item>

        <div v-if="mode === 'register' && role === 'worker'" class="ion-text-small ion-text-muted">
          You can complete your profile, skills, and municipality after registration.
        </div>

        <div v-if="error" class="ion-text-danger ion-text-center">
          {{ error }}
        </div>
      </div>
    </ion-content>
    <ion-footer>
      <div class="ion-padding">
        <ion-button 
          expand="block" 
          @click="submit"
          :disabled="loading"
        >
          <ion-icon v-if="loading" name="refresh" slot="start"></ion-icon>
          {{ mode === 'login' ? 'Sign in' : `Create ${role} account` }}
        </ion-button>
        <div class="ion-text-center ion-margin-top">
          <button 
            class="ion-text ion-no-padding"
            @click="mode = mode === 'login' ? 'register' : 'login'"
          >
            {{ mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in' }}
          </button>
        </div>
      </div>
    </ion-footer>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonFooter,
  IonButton,
  IonIcon,
  IonItem,
  IonInput,
  IonLabel,
  IonRow,
  IonCol
} from '@ionic/vue'
import { useSession } from '../worker/_lib'
import { useToast } from '../worker/_lib'
import { Role } from '../worker/_lib'

interface AuthSheetProps {
  open: boolean
  initialMode?: 'login' | 'register'
  initialRole?: Role
}

const props = defineProps<AuthSheetProps>()
const emit = defineEmits<{
  'open-change': [value: boolean]
  'authed': []
}>()

const { login, register, setPendingJob } = useSession()
const { toast } = useToast()

const mode = ref<'login' | 'register'>(props.initialMode || 'login')
const role = ref<Role>(props.initialRole || 'worker')
const loading = ref(false)
const error = ref<string | null>(null)
const form = ref<any>({})

// Reset form when modal opens
watch(() => props.open, (open) => {
  if (open) {
    mode.value = props.initialMode || 'login'
    role.value = props.initialRole || 'worker'
    error.value = null
    form.value = {}
  }
})

const set = (key: string, value: any) => {
  form.value = { ...form.value, [key]: value }
}

const submit = async () => {
  error.value = null
  loading.value = true
  try {
    if (mode.value === 'login') {
      if (!form.value.email || !form.value.password) {
        throw new Error('Enter your email and password.')
      }
      const user = await login(form.value.email, form.value.password)
      toast({
        message: `Welcome back, ${user.fullName}`,
        duration: 3000
      })
      emit('open-change', false)
      emit('authed')
    } else {
      if (role.value === 'worker') {
        if (!form.value.fullName) throw new Error('Full name is required.')
        if (!form.value.email || !form.value.password) throw new Error('Email and password are required.')
        if (form.value.password.length < 6) throw new Error('Password must be at least 6 characters.')
        if (form.value.password !== form.value.confirmPassword) throw new Error('Passwords do not match.')
      } else {
        if (!form.value.businessName) throw new Error('Business/employer name is required.')
        if (!form.value.email || !form.value.password) throw new Error('Email and password are required.')
        if (form.value.password.length < 6) throw new Error('Password must be at least 6 characters.')
        if (form.value.password !== form.value.confirmPassword) throw new Error('Passwords do not match.')
      }
      const user = await register({ ...form.value, role: role.value })
      toast({
        message: `Welcome to TrabahoLokal, ${user.fullName}`,
        duration: 3000
      })
      emit('open-change', false)
      emit('authed')
    }
  } catch (e: any) {
    error.value = e?.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>