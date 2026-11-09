import { type Ref } from 'vue'

export type Role = 'worker' | 'employer' | 'admin'

export interface AuthUser {
  id: string
  email: string
  role: Role
  status: string
  suspendReason?: string | null
  workerProfileId?: string
  employerProfileId?: string
  adminProfileId?: string
  fullName: string
  photoUrl?: string | null
  municipalityId?: string | null
}

export interface MunicipalityDTO { id: string; name: string; province?: string | null }

export interface SkillDTO {
  id: string
  name: string
  categoryId: string
  categoryName?: string
}

export interface JobRequiredSkillDTO {
  id: string
  skillId: string
  skillName: string
  categoryName?: string
  importance: 'required' | 'preferred'
  weight: number
}

export interface JobDTO {
  id: string
  employerId: string
  employerName: string
  employerVerification: string
  employerLogoUrl?: string | null
  title: string
  category: string
  description: string
  responsibilities: string[]
  qualifications: string[]
  compensation: number
  compensationType: string
  positions: number
  employmentType: string
  workSchedules: string[]
  workArrangements: string[]
  startDate?: string | null
  endDate?: string | null
  municipalityId?: string | null
  municipalityName?: string | null
  barangay?: string | null
  locationText?: string | null
  latitude?: number | null
  longitude?: number | null
  urgencyLevel: string
  workingHours?: string | null
  applicationDeadline?: string | null
  status: string
  moderationStatus: string
  scamFlags: string[]
  createdAt: string
  requiredSkills: JobRequiredSkillDTO[]
  distanceKm?: number | null
  preferredCategoryMatch?: boolean
}

export interface WorkerWorkHistoryDTO {
  id: string
  workerId: string
  jobTitle: string
  employerName?: string | null
  employerType?: string | null
  startDate: string
  endDate?: string | null
  isCurrent: boolean
  description?: string | null
  tasks: string[]
  referenceName?: string | null
  referenceContact?: string | null
  createdAt: string
  updatedAt: string
}

export interface JobWithMatch extends JobDTO {
  match?: { score: number; grade: string; breakdown?: MatchBreakdown } | null
  applied?: boolean
}

export interface WorkerSkillTaskDTO {
  id: string
  taskName: string
}

export interface WorkerSkillEquipmentDTO {
  id: string
  equipmentName: string
  relationship: 'operates' | 'owns'
}

export interface WorkerLanguageDTO {
  id: string
  languageName: string
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native'
}

export interface WorkerSkillDTO {
  id: string
  skillId: string
  skillName: string
  categoryName?: string
  level: string
  yearsExperience?: number | null
  experienceLevel?: string | null
  notes?: string | null
  verifiedJobCount: number
  totalRatingCount: number
  avgRating?: number | null
  tasks?: WorkerSkillTaskDTO[]
  equipment?: WorkerSkillEquipmentDTO[]
}



export interface MatchBreakdown {
  skillCoverage: number
  experienceRelevance: number
  locationSuitability: number
  availabilitySuitability: number
  matchingSkills: string[]
  missingSkills: string[]
  preferredSkills: string[]
  explanation: string[]
  weights: { skillCoverage: number; experienceRelevance: number; locationSuitability: number; availabilitySuitability: number }
}

export interface MatchResult {
  score: number
  grade: string
  breakdown: MatchBreakdown
}

export interface ApplicationDTO {
  id: string
  jobId: string
  jobTitle: string
  jobCategory: string
  employerName: string
  employerVerification: string
  compensation: number
  compensationType: string
  municipalityName?: string | null
  urgencyLevel: string
  status: string
  message?: string | null
  matchScore: number
  matchDetails?: MatchBreakdown | null
  employerNote?: string | null
  createdAt: string
  workerId: string
  workerName?: string
  workerPhotoUrl?: string | null
  workerMunicipality?: string | null
}

export interface AccomplishmentPhotoDTO { id: string; url: string }

export interface AccomplishmentDTO {
  id: string
  employmentId: string
  workDate: string
  tasks: string[]
  description: string
  progressPercent: number
  remarks?: string | null
  status: string
  employerFeedback?: string | null
  rejectionReason?: string | null
  reviewedAt?: string | null
  createdAt: string
  photos: AccomplishmentPhotoDTO[]
}

export interface RenewalDTO {
  id: string
  employmentId: string
  requesterAccountId: string
  proposedExtension: string
  newEndDate: string
  compensationTerms: string
  reason?: string | null
  status: string
  createdAt: string
  respondedAt?: string | null
}

export interface EmploymentDTO {
  id: string
  jobId: string
  jobTitle: string
  jobCategory: string
  workerId: string
  workerName: string
  workerPhotoUrl?: string | null
  workerAccountId: string
  employerId: string
  employerName: string
  employerVerification: string
  startDate: string
  endDate?: string | null
  agreedCompensation: number
  compensationType: string
  workingHours?: string | null
  status: string
  parentEmploymentId?: string | null
  employmentEvent: string
  targetWorkdays: number
  approvedWorkdays: number
  pendingReports: number
  rejectedReports: number
  progressPercent: number
  municipalityName?: string | null
  createdAt: string
}

export interface EvaluationDTO {
  id: string
  rating: number
  comment?: string | null
  punctuality?: number | null
  quality?: number | null
  attitude?: number | null
  createdAt: string
}

export interface EmploymentDetailDTO extends EmploymentDTO {
  renewals: RenewalDTO[]
  accomplishments: AccomplishmentDTO[]
  evaluations: EvaluationDTO[]
}

export interface NotificationDTO {
  id: string
  type: string
  title: string
  body: string
  linkType?: string | null
  linkId?: string | null
  read: boolean
  createdAt: string
}

export interface ReportDTO {
  id: string
  reporterAccountId: string
  reporterName: string
  reporterRole: string
  targetAccountId?: string | null
  targetName?: string | null
  targetJobId?: string | null
  targetJobTitle?: string | null
  reason: string
  description: string
  status: string
  resolutionNote?: string | null
  createdAt: string
}

export interface PassportDTO {
  workerId: string
  workerName: string
  photoUrl?: string | null
  municipalityName?: string | null
  barangay?: string | null
  bio?: string | null
  skills: (WorkerSkillDTO & { badges: string[] })[]
  languages?: WorkerLanguageDTO[]
  completedJobs: number
  totalWorkdays: number
  evaluations: {
    id: string
    employerName: string
    rating: number
    comment?: string | null
    jobTitle: string
    createdAt: string
  }[]
  employmentHistory: {
    id: string
    employerName: string
    jobTitle: string
    startDate: string
    endDate?: string | null
    status: string
    employmentEvent: string
    approvedWorkdays: number
  }[]
  badges: { skillName: string; badge: string; earnedAt: string }[]
}

export interface SkillUnlockDTO {
  recommendedSkillId: string
  recommendedSkillName: string
  categoryName?: string
  reason: string
  missedJobs: { id: string; title: string; employerName: string; municipalityName?: string | null }[]
  potentialCount: number
  resources: { id: string; title: string; provider: string; url?: string | null; type: string; accredited: boolean }[]
}

export interface FairPayResult {
  classification: 'below_reference' | 'within_reference' | 'above_reference' | 'insufficient_data'
  label: string
  minRate?: number
  maxRate?: number
  source?: string | null
}

export interface WorkerBadgeDTO {
  id: string
  skillName: string
  badge: string
  earnedAt: string
}

export interface WorkerProfileDTO {
  id: string
  accountId: string
  fullName: string
  email: string
  mobileNumber?: string | null
  municipalityId?: string | null
  municipalityName?: string | null
  barangay?: string | null
  latitude?: number | null
  longitude?: number | null
  photoUrl?: string | null
  bio?: string | null
  education?: string | null
  preferredCategories: string[]
  preferredDistanceKm?: number | null
  available: boolean
  skills: WorkerSkillDTO[]
  badges: WorkerBadgeDTO[]
  languages?: WorkerLanguageDTO[]
}

export interface WorkerWorkPreferencesDTO {
  id?: string
  workerId: string
  employmentTypes: string[]
  workSchedules: string[]
  workArrangements: string[]
  earliestStartDate?: string | null
  willingToRelocate?: boolean | null
  willingToLiveIn?: boolean | null
  expectedMinCompensation?: number | null
  compensationType?: string | null
}

export interface WorkerWorkPreferencesInput {
  employmentTypes: string[]
  workSchedules: string[]
  workArrangements: string[]
  earliestStartDate?: string | null
  willingToRelocate?: boolean | null
  willingToLiveIn?: boolean | null
  expectedMinCompensation?: number | null
  compensationType?: string | null
}

export interface EmployerProfileDTO {
  id: string
  accountId: string
  email: string
  businessName: string
  employerType: string
  contactPerson?: string | null
  mobileNumber?: string | null
  municipalityId?: string | null
  municipalityName?: string | null
  barangay?: string | null
  address?: string | null
  latitude?: number | null
longitude?: number | null
  description?: string | null
  logoUrl?: string | null
  verification: string
  verificationNote?: string | null
  documentUrls: string[]
  createdAt?: string
  updatedAt?: string
}

export interface AdminUserRow {
  id: string
  email: string
  role: string
  status: string
  suspendReason?: string | null
  createdAt: string
  name?: string | null
  verification?: string | null
  municipality?: string | null
}

export interface AdminUserDetail {
  id: string
  email: string
  role: string
  status: string
  suspendReason?: string | null
  createdAt: string
  workerProfile?: Record<string, any> | null
  employerProfile?: Record<string, any> | null
  adminProfile?: { id: string; fullName: string } | null
  moderationActions: Record<string, any>[]
  jobs: Record<string, any>[]
}

export interface AuditLogDTO {
  id: string
  adminName: string
  action: string
  targetType: string
  targetId?: string | null
  reason?: string | null
  metadata?: any
  createdAt: string
}

export interface OverviewData {
  workers: number
  employers: number
  admins: number
  publishedJobs: number
  applications: number
  pendingReports: number
  suspendedAccounts: number
  completedEmployments: number
}

export interface MatchInputWorker {
  skills: { skillId: string; level: string; experienceLevel?: string | null; verifiedJobCount: number }[]
  municipalityId?: string | null
  latitude?: number | null
  longitude?: number | null
  available: boolean
}

export interface MatchInputJob {
  requiredSkills: { skillId: string; importance: 'required' | 'preferred'; weight: number }[]
  municipalityId?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface UseAsyncResult<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  refresh: () => Promise<void>
  setData: (value: T | null) => void
}



export interface JobFilters {
  q?: string
  category?: string
  municipalityId?: string
  barangay?: string
  employmentType?: string
  urgencyLevel?: string
  minCompensation?: number
  maxCompensation?: number
  requiredSkillId?: string
  mine?: boolean
  limit?: number
  offset?: number
  lat?: number | null
  lon?: number | null
  distanceKm?: number | null
}

export type OfflineAppStatus = 'saved_offline' | 'waiting' | 'syncing' | 'submitted' | 'sync_failed'

export interface OfflineApplication {
  clientId: string
  jobId: string
  message: string
  status: OfflineAppStatus
  savedAt: string
  lastError?: string | null
}