import { ref } from 'vue'
import { supabase } from './_supabase'
import type { AuthUser, Role } from './_types'

export const sessionUser = ref<AuthUser | null>(null)
export const sessionInitialized = ref(false)
export const sessionLoading = ref(false)
export const pendingJobId = ref<string | null>(null)

async function fetchAuthUser(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  const userId = session.user.id
  const { data: account } = await supabase
    .from('accounts')
    .select('id, email, role, status, suspend_reason')
    .eq('id', userId)
    .maybeSingle()
  if (!account) return null

  let fullName = 'User'
  let photoUrl: string | null = null
  let municipalityId: string | null = null
  let workerProfileId: string | undefined
  let employerProfileId: string | undefined
  let adminProfileId: string | undefined

  if (account.role === 'worker') {
    const { data: wp } = await supabase
      .from('worker_profiles')
      .select('id, full_name, photo_url, municipality_id')
      .eq('account_id', userId)
      .maybeSingle()
    if (wp) {
      fullName = wp.full_name
      photoUrl = wp.photo_url
      municipalityId = wp.municipality_id
      workerProfileId = wp.id
    }
  } else if (account.role === 'employer') {
    const { data: ep } = await supabase
      .from('employer_profiles')
      .select('id, business_name, logo_url, municipality_id')
      .eq('account_id', userId)
      .maybeSingle()
    if (ep) {
      fullName = ep.business_name
      photoUrl = ep.logo_url
      municipalityId = ep.municipality_id
      employerProfileId = ep.id
    }
  } else if (account.role === 'admin') {
    const { data: ap } = await supabase
      .from('admin_profiles')
      .select('id, full_name')
      .eq('account_id', userId)
      .maybeSingle()
    if (ap) {
      fullName = ap.full_name
      adminProfileId = ap.id
    }
  }

  if (account.status === 'suspended') {
    await supabase.auth.signOut()
    return null
  }

  return {
    id: userId,
    email: account.email,
    role: account.role as Role,
    status: account.status,
    suspendReason: account.suspend_reason,
    workerProfileId,
    employerProfileId,
    adminProfileId,
    fullName,
    photoUrl,
    municipalityId,
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw new Error(error.message)
  const user = await fetchAuthUser()
  if (!user) throw new Error('Account not found.')
  if (user.status === 'suspended') {
    throw new Error(user.suspendReason || 'Your account has been suspended.')
  }
  sessionUser.value = user
  return user
}

export async function register(payload: {
  role: Role
  email: string
  password: string
  fullName?: string
  businessName?: string
  mobileNumber?: string
  municipalityId?: string
  barangay?: string
  employerType?: string
  contactPerson?: string
  address?: string
  description?: string
  bio?: string
  education?: string
}): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    options: {
      data: {
        role: payload.role,
        full_name: payload.fullName,
        business_name: payload.businessName,
        mobile_number: payload.mobileNumber,
        municipality_id: payload.municipalityId,
        barangay: payload.barangay,
        employer_type: payload.employerType,
        contact_person: payload.contactPerson,
        address: payload.address,
        description: payload.description,
        bio: payload.bio,
        education: payload.education,
      },
    },
  })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Registration failed.')
  // handle_new_user trigger creates account + profile
  if (!data.session) {
    throw new Error('Account created. Check your email to confirm, then sign in.')
  }
  const user = await fetchAuthUser()
  if (!user) throw new Error('Account created but profile not found. Please sign in.')
  sessionUser.value = user
  return user
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut()
  sessionUser.value = null
}

export async function refreshSession(): Promise<AuthUser | null> {
  sessionLoading.value = true
  try {
    const user = await fetchAuthUser()
    sessionUser.value = user
    sessionInitialized.value = true
    return user
  } catch {
    sessionUser.value = null
    sessionInitialized.value = true
    return null
  } finally {
    sessionLoading.value = false
  }
}

export async function initializeSession(): Promise<AuthUser | null> {
  return refreshSession()
}

export function setPendingJob(id: string | null): void {
  pendingJobId.value = id
}

export function requireUser(): AuthUser {
  if (!sessionUser.value) throw new Error('You must be signed in.')
  return sessionUser.value
}

export function optionalUser(): AuthUser | null {
  return sessionUser.value
}

export function useSession() {
  return {
    user: sessionUser,
    sessionInitialized,
    sessionLoading,
    login,
    register,
    logout,
    refresh: refreshSession,
    initializeSession,
    pendingJobId,
    setPendingJob,
  }
}