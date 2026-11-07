import { createClient } from '@supabase/supabase-js'
import type {
  JobDTO, JobWithMatch, JobRequiredSkillDTO, ApplicationDTO, EmploymentDTO, EmploymentDetailDTO,
  AccomplishmentDTO, RenewalDTO, NotificationDTO, ReportDTO, PassportDTO, SkillUnlockDTO,
  FairPayResult, MunicipalityDTO, SkillDTO, WorkerProfileDTO, EmployerProfileDTO,
  AdminUserRow, AdminUserDetail, AuditLogDTO, OverviewData, WorkerSkillDTO,
WorkerSkillTaskDTO, WorkerSkillEquipmentDTO, WorkerLanguageDTO,
EvaluationDTO, JobFilters,
} from './_types'
import { computeMatch, classifyFairPay, haversineKm } from './_match'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

async function uid(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new ApiError('You must be signed in.', 401)
  return session.user.id
}

function assertError(error: any, fallback: string): void {
  if (error) throw new ApiError(error.message || fallback)
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function mapRequiredSkill(s: any): JobRequiredSkillDTO {
  return {
    id: s.id,
    skillId: s.skillId ?? s.skill_id,
    skillName: s.skillName ?? s.skill_name,
    categoryName: s.categoryName ?? s.category_name ?? undefined,
    importance: s.importance,
    weight: s.weight,
  }
}

function mapJobView(r: any, workerLat?: number | null, workerLon?: number | null): JobDTO {
  let distanceKm: number | null = null
  if (workerLat != null && workerLon != null && r.latitude != null && r.longitude != null) {
    distanceKm = Math.round(haversineKm({ lat: workerLat, lon: workerLon }, { lat: r.latitude, lon: r.longitude }) * 10) / 10
  }
  return {
    id: r.id,
    employerId: r.employer_id,
    employerName: r.employer_name,
    employerVerification: r.employer_verification,
    employerLogoUrl: r.employer_logo_url ?? null,
    title: r.title,
    category: r.category,
    description: r.description,
    responsibilities: r.responsibilities ?? [],
    qualifications: r.qualifications ?? [],
    compensation: Number(r.compensation),
    compensationType: r.compensation_type,
    positions: r.positions,
    employmentType: r.employment_type,
    startDate: r.start_date ?? null,
    endDate: r.end_date ?? null,
    municipalityId: r.municipality_id ?? null,
    municipalityName: r.municipality_name ?? null,
    barangay: r.barangay ?? null,
    locationText: r.location_text ?? null,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    urgencyLevel: r.urgency_level,
    workingHours: r.working_hours ?? null,
    applicationDeadline: r.application_deadline ?? null,
    status: r.status,
    moderationStatus: r.moderation_status,
    scamFlags: r.scam_flags ?? [],
    createdAt: r.created_at,
    requiredSkills: (r.required_skills ?? []).map(mapRequiredSkill),
    distanceKm,
  }
}

function mapJobRow(r: any, employer?: any): JobDTO {
  return {
    id: r.id,
    employerId: r.employer_id,
    employerName: employer?.business_name ?? 'Employer',
    employerVerification: employer?.verification ?? 'unverified',
    employerLogoUrl: employer?.logo_url ?? null,
    title: r.title,
    category: r.category,
    description: r.description,
    responsibilities: r.responsibilities ?? [],
    qualifications: r.qualifications ?? [],
    compensation: Number(r.compensation),
    compensationType: r.compensation_type,
    positions: r.positions,
    employmentType: r.employment_type,
    startDate: r.start_date ?? null,
    endDate: r.end_date ?? null,
    municipalityId: r.municipality_id ?? null,
    municipalityName: r.municipality?.name ?? null,
    barangay: r.barangay ?? null,
    locationText: r.location_text ?? null,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    urgencyLevel: r.urgency_level,
    workingHours: r.working_hours ?? null,
    applicationDeadline: r.application_deadline ?? null,
    status: r.status,
    moderationStatus: r.moderation_status,
    scamFlags: r.scam_flags ?? [],
    createdAt: r.created_at,
    requiredSkills: (r.required_skills ?? []).map((s: any) => ({
      id: s.id,
      skillId: s.skill_id,
      skillName: s.skill?.name ?? '',
      categoryName: s.skill?.category?.name ?? undefined,
      importance: s.importance,
      weight: s.weight,
    })),
    distanceKm: null,
  }
}

async function fetchEmployerMap(ids: string[]): Promise<Map<string, any>> {
  const m = new Map<string, any>()
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return m
  const { data } = await supabase
    .from('employer_profiles')
    .select('account_id, business_name, verification, logo_url')
    .in('account_id', unique)
  for (const r of data ?? []) m.set(r.account_id, r)
  return m
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------
export async function listJobs(
  filters: JobFilters = {}
): Promise<{
  data: JobWithMatch[]
  hasMore: boolean
  nextOffset: number
}> {
  const limit = filters.limit ?? 20
  const offset = filters.offset ?? 0

  // Load the signed-in worker's matching information and preferences.
  let workerSkills: {
    skillId: string
    level: string
    experienceLevel?: string | null
    verifiedJobCount: number
  }[] = []

  let workerMuni: string | null = null
  let workerLat: number | null = null
  let workerLon: number | null = null
  let available = true
  let preferredCategories: string[] = []

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.user) {
    const { data: wp } = await supabase
      .from('worker_profiles')
      .select(`
        id,
        municipality_id,
        latitude,
        longitude,
        available,
        preferred_categories,
        preferred_distance_km,
        skills:worker_skills(
          skill_id,
          level,
          experience_level,
          verified_job_count
        )
      `)
      .eq('account_id', session.user.id)
      .maybeSingle()

    if (wp) {
      workerSkills = (wp.skills ?? []).map((s: any) => ({
        skillId: s.skill_id,
        level: s.level,
        experienceLevel: s.experience_level,
        verifiedJobCount: s.verified_job_count,
      }))

      workerMuni = wp.municipality_id
      workerLat = wp.latitude
      workerLon = wp.longitude
      available = wp.available
      preferredCategories = Array.isArray(wp.preferred_categories)
        ? wp.preferred_categories
        : []
    }
  }

  // Build the same job filters for every database batch.
  const buildQuery = () => {
    let query = supabase.from('jobs_public').select('*')

    if (filters.q) {
      query = query.ilike('title', `%${filters.q}%`)
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.municipalityId) {
      query = query.eq('municipality_id', filters.municipalityId)
    }

    if (filters.barangay) {
      query = query.eq('barangay', filters.barangay)
    }

    if (filters.employmentType) {
      query = query.eq('employment_type', filters.employmentType)
    }

    if (filters.urgencyLevel) {
      query = query.eq('urgency_level', filters.urgencyLevel)
    }

    if (filters.minCompensation != null) {
      query = query.gte('compensation', filters.minCompensation)
    }

    if (filters.maxCompensation != null) {
      query = query.lte('compensation', filters.maxCompensation)
    }

    return query.order('created_at', { ascending: false })
  }

  // Map job records and calculate their match information.
  const mapRows = (rows: any[]): JobWithMatch[] => {
    return rows.map((r) => {
      const job = mapJobView(
        r,
        filters.lat,
        filters.lon
      ) as JobWithMatch

      job.preferredCategoryMatch = preferredCategories.some(
        (preferred) =>
          String(preferred).trim().toLowerCase() ===
          String(r.category ?? '').trim().toLowerCase()
      )

      if (workerSkills.length) {
        const match = computeMatch(
          {
            skills: workerSkills,
            municipalityId: workerMuni,
            latitude: workerLat,
            longitude: workerLon,
            available,
          },
          {
            requiredSkills: (r.required_skills ?? []).map((s: any) => ({
              skillId: s.skillId,
              importance: s.importance,
              weight: s.weight,
            })),
            municipalityId: r.municipality_id,
            latitude: r.latitude,
            longitude: r.longitude,
          }
        )

        job.match = {
          score: match.score,
          grade: match.grade,
        }
      }

      return job
    })
  }

  // Apply radius filtering only when GPS coordinates and a radius exist.
  const radius = Number(filters.distanceKm)
  const useDistanceFilter =
    filters.lat != null &&
    filters.lon != null &&
    Number.isFinite(radius) &&
    radius > 0

  // Normal browsing: retain the existing page-size behavior.
  if (!useDistanceFilter) {
    const { data, error } = await buildQuery()
      .range(offset, offset + limit)

    assertError(error, 'Failed to load jobs.')

    const rows = (data ?? []) as any[]
    const mappedJobs = mapRows(rows)
    const page = mappedJobs.slice(0, limit)

    return {
      data: page,
      hasMore: mappedJobs.length > limit,
      nextOffset: offset + page.length,
    }
  }

  // GPS browsing: keep fetching database batches until we have
  // enough jobs inside the selected radius or reach the end.
  const batchSize = 100
  const matchingJobs: {
    job: JobWithMatch
    rawIndex: number
  }[] = []

  let rawOffset = offset
  let exhausted = false

  while (matchingJobs.length <= limit && !exhausted) {
    const { data, error } = await buildQuery()
      .range(rawOffset, rawOffset + batchSize - 1)

    assertError(error, 'Failed to load jobs.')

    const rows = (data ?? []) as any[]

    if (rows.length === 0) {
      exhausted = true
      break
    }

    const mappedJobs = mapRows(rows)

    for (let i = 0; i < mappedJobs.length; i++) {
      const job = mappedJobs[i]

      if (
        job.distanceKm != null &&
        job.distanceKm <= radius
      ) {
        matchingJobs.push({
          job,
          rawIndex: rawOffset + i,
        })

        // One extra matching job confirms another page exists.
        if (matchingJobs.length > limit) {
          break
        }
      }
    }

    if (matchingJobs.length > limit) {
      break
    }

    rawOffset += rows.length

    if (rows.length < batchSize) {
      exhausted = true
    }
  }

  const hasMore = matchingJobs.length > limit
  const page = matchingJobs.slice(0, limit)

  // Advance past the last displayed matching job.
  // Any rows after it are safely reconsidered on the next page.
  const nextOffset = hasMore
    ? page[page.length - 1].rawIndex + 1
    : rawOffset

  return {
    data: page.map((item) => item.job),
    hasMore,
    nextOffset,
  }
}

export async function getJob(jobId: string): Promise<JobWithMatch> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`*,
      municipality:municipalities(name),
      required_skills:job_required_skills(id, skill_id, importance, weight,
        skill:skills(name, category:skill_categories(name)))`)
    .eq('id', jobId)
    .maybeSingle()
  assertError(error, 'Failed to load job.')
  if (!data) throw new ApiError('Job not found.', 404)
  const employerMap = await fetchEmployerMap([data.employer_id])
  const job = mapJobRow(data, employerMap.get(data.employer_id)) as JobWithMatch

  // Match + applied (if worker)
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    const { data: wp } = await supabase
      .from('worker_profiles')
      .select('id, municipality_id, latitude, longitude, available, skills:worker_skills(skill_id, level, experience_level, verified_job_count)')
      .eq('account_id', session.user.id)
      .maybeSingle()
    if (wp) {
      const m = computeMatch(
        { skills: (wp.skills ?? []).map((s: any) => ({ skillId: s.skill_id, level: s.level, experienceLevel: s.experience_level, verifiedJobCount: s.verified_job_count })), municipalityId: wp.municipality_id, latitude: wp.latitude, longitude: wp.longitude, available: wp.available },
        { requiredSkills: (data.required_skills ?? []).map((s: any) => ({ skillId: s.skill_id, importance: s.importance, weight: s.weight })), municipalityId: data.municipality_id, latitude: data.latitude, longitude: data.longitude }
      )
      job.match = { score: m.score, grade: m.grade, breakdown: m.breakdown }
      const { data: app } = await supabase.from('job_applications').select('id').eq('job_id', jobId).eq('worker_id', wp.id).maybeSingle()
      job.applied = !!app
    }
  }
  return job
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------
export async function applyToJob(jobId: string, message?: string | null): Promise<ApplicationDTO> {
  const userId = await uid()
  const { data: wp } = await supabase.from('worker_profiles').select('id, municipality_id, latitude, longitude, available, skills:worker_skills(skill_id, level, experience_level, verified_job_count)').eq('account_id', userId).maybeSingle()
  if (!wp) throw new ApiError('Worker profile missing.', 400)
  const { data: jobRow } = await supabase.from('jobs').select('*, required_skills:job_required_skills(skill_id, importance, weight), municipality:municipalities(name), employer:employer_profiles!employer_profiles_account_id_fkey(business_name, verification)').eq('id', jobId).maybeSingle()
  if (!jobRow) throw new ApiError('Job not found.', 404)
  const match = computeMatch(
    { skills: (wp.skills ?? []).map((s: any) => ({ skillId: s.skill_id, level: s.level, experienceLevel: s.experience_level, verifiedJobCount: s.verified_job_count })), municipalityId: wp.municipality_id, latitude: wp.latitude, longitude: wp.longitude, available: wp.available },
    { requiredSkills: (jobRow.required_skills ?? []).map((s: any) => ({ skillId: s.skill_id, importance: s.importance, weight: s.weight })), municipalityId: jobRow.municipality_id, latitude: jobRow.latitude, longitude: jobRow.longitude }
  )
  const { data, error } = await supabase.rpc('apply_to_job', {
    p_job_id: jobId,
    p_message: message ?? null,
    p_match_score: match.score,
    p_match_details: match.breakdown as any,
  })
  if (error) {
    if (error.code === '23505') throw new ApiError('You have already applied to this job.', 409)
    throw new ApiError(error.message)
  }
  const employer = Array.isArray(jobRow.employer) ? jobRow.employer[0] : jobRow.employer
  return {
    id: data.id, jobId, jobTitle: jobRow.title, jobCategory: jobRow.category,
    employerName: employer?.business_name ?? 'Employer', employerVerification: employer?.verification ?? 'unverified',
    compensation: Number(jobRow.compensation), compensationType: jobRow.compensation_type,
    municipalityName: jobRow.municipality?.name ?? null, urgencyLevel: jobRow.urgency_level,
    status: data.status, message: data.message, matchScore: data.match_score, matchDetails: data.match_details,
    employerNote: data.employer_note, createdAt: data.created_at, workerId: wp.id, workerName: '', workerPhotoUrl: null, workerMunicipality: null,
  }
}

export async function getApplications(filters: { status?: string; jobId?: string } = {}): Promise<ApplicationDTO[]> {
  const userId = await uid()
  const { data: account } = await supabase.from('accounts').select('role').eq('id', userId).maybeSingle()
  const role = account?.role
  let jobIds: string[] | null = null
  if (role === 'employer') {
    const { data: myJobs } = await supabase.from('jobs').select('id').eq('employer_id', userId)
    jobIds = (myJobs ?? []).map((j) => j.id)
    if (!jobIds.length) return []
  }
  let q = supabase.from('job_applications').select(`*,
    job:jobs!job_applications_job_id_fkey(title, category, compensation, compensation_type, urgency_level, employer_id, municipality:municipalities(name)),
    worker:worker_profiles!job_applications_worker_id_fkey(full_name, photo_url, municipality:municipalities(name))`)
  if (role === 'worker') q = q.eq('account_id', userId)
  else if (role === 'employer' && jobIds) q = q.in('job_id', jobIds)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.jobId) q = q.eq('job_id', filters.jobId)
  q = q.order('match_score', { ascending: false }).order('created_at', { ascending: false })
  const { data, error } = await q
  assertError(error, 'Failed to load applications.')
  const employerIds = (data ?? []).map((r) => r.job?.employer_id).filter(Boolean)
  const employerMap = await fetchEmployerMap(employerIds)
  return (data ?? []).map((r) => ({
    id: r.id, jobId: r.job_id, jobTitle: r.job?.title ?? '', jobCategory: r.job?.category ?? '',
    employerName: employerMap.get(r.job?.employer_id)?.business_name ?? 'Employer',
    employerVerification: employerMap.get(r.job?.employer_id)?.verification ?? 'unverified',
    compensation: Number(r.job?.compensation ?? 0), compensationType: r.job?.compensation_type ?? 'daily',
    municipalityName: r.job?.municipality?.name ?? null, urgencyLevel: r.job?.urgency_level ?? 'normal',
    status: r.status, message: r.message, matchScore: r.match_score, matchDetails: r.match_details,
    employerNote: r.employer_note, createdAt: r.created_at, workerId: r.worker_id,
    workerName: r.worker?.full_name ?? '', workerPhotoUrl: r.worker?.photo_url ?? null,
    workerMunicipality: r.worker?.municipality?.name ?? null,
  }))
}

export async function updateApplicationStatus(applicationId: string, status: string, employerNote?: string | null): Promise<ApplicationDTO> {
  const { data, error } = await supabase.rpc('update_application_status', {
    p_application_id: applicationId, p_status: status, p_employer_note: employerNote ?? null,
  })
  if (error) throw new ApiError(error.message)
  return await getApplications({ jobId: data.job_id }).then((apps) => apps.find((a) => a.id === applicationId) ?? {
    id: data.id, jobId: data.job_id, jobTitle: '', jobCategory: '', employerName: 'Employer', employerVerification: 'unverified',
    compensation: 0, compensationType: 'daily', municipalityName: null, urgencyLevel: 'normal', status: data.status,
    message: data.message, matchScore: data.match_score, matchDetails: data.match_details, employerNote: data.employer_note,
    createdAt: data.created_at, workerId: data.worker_id, workerName: '', workerPhotoUrl: null, workerMunicipality: null,
  })
}

// ---------------------------------------------------------------------------
// Employments
// ---------------------------------------------------------------------------
async function computeEmploymentStats(employmentIds: string[]): Promise<Map<string, { approved: number; pending: number; rejected: number }>> {
  const m = new Map<string, { approved: number; pending: number; rejected: number }>()
  if (!employmentIds.length) return m
  const { data } = await supabase.from('daily_accomplishments').select('employment_id, status').in('employment_id', employmentIds)
  for (const r of data ?? []) {
    const cur = m.get(r.employment_id) ?? { approved: 0, pending: 0, rejected: 0 }
    if (r.status === 'approved') cur.approved++
    else if (r.status === 'pending') cur.pending++
    else if (r.status === 'rejected') cur.rejected++
    m.set(r.employment_id, cur)
  }
  return m
}

function mapEmployment(r: any, stats: Map<string, { approved: number; pending: number; rejected: number }>, employerMap: Map<string, any>): EmploymentDTO {
  const s = stats.get(r.id) ?? { approved: 0, pending: 0, rejected: 0 }
  const target = r.target_workdays || 1
  return {
    id: r.id, jobId: r.job_id, jobTitle: r.job?.title ?? '', jobCategory: r.job?.category ?? '',
    workerId: r.worker_id, workerName: r.worker?.full_name ?? '', workerPhotoUrl: r.worker?.photo_url ?? null,
    workerAccountId: r.worker_account_id, employerId: r.employer_id,
    employerName: employerMap.get(r.employer_id)?.business_name ?? 'Employer',
    employerVerification: employerMap.get(r.employer_id)?.verification ?? 'unverified',
    startDate: r.start_date, endDate: r.end_date, agreedCompensation: Number(r.agreed_compensation),
    compensationType: r.compensation_type, workingHours: r.working_hours, status: r.status,
    parentEmploymentId: r.parent_employment_id, employmentEvent: r.employment_event, targetWorkdays: target,
    approvedWorkdays: s.approved, pendingReports: s.pending, rejectedReports: s.rejected,
    progressPercent: Math.min(100, Math.round((s.approved / target) * 100)),
    municipalityName: r.worker?.municipality?.name ?? null, createdAt: r.created_at,
  }
}

export async function listEmployments(
  filters: { status?: string } | string = {}
): Promise<EmploymentDTO[]> {
  const status = typeof filters === 'string' ? filters : filters.status

  const userId = await uid()
  const { data: account } = await supabase.from('accounts').select('role').eq('id', userId).maybeSingle()
  let q = supabase.from('employments').select(`*,
    job:jobs!employments_job_id_fkey(title, category),
    worker:worker_profiles!employments_worker_id_fkey(full_name, photo_url, municipality:municipalities(name))`)
  if (account?.role === 'worker') q = q.eq('worker_account_id', userId)
  else if (account?.role === 'employer') q = q.eq('employer_id', userId)
    if (status) q = q.eq('status', status)
  q = q.order('created_at', { ascending: false })
  const { data, error } = await q
  assertError(error, 'Failed to load employments.')
  const ids = (data ?? []).map((r) => r.id)
  const [stats, employerMap] = await Promise.all([computeEmploymentStats(ids), fetchEmployerMap((data ?? []).map((r) => r.employer_id))])
  return (data ?? []).map((r) => mapEmployment(r, stats, employerMap))
}

export async function getEmployment(employmentId: string): Promise<EmploymentDetailDTO> {
  const { data, error } = await supabase
    .from('employments')
    .select(`*,
      job:jobs!employments_job_id_fkey(title, category),
      worker:worker_profiles!employments_worker_id_fkey(full_name, photo_url, municipality:municipalities(name))`)
    .eq('id', employmentId)
    .maybeSingle()
  assertError(error, 'Failed to load employment.')
  if (!data) throw new ApiError('Employment not found.', 404)
  const [stats, employerMap] = await Promise.all([computeEmploymentStats([employmentId]), fetchEmployerMap([data.employer_id])])
  const base = mapEmployment(data, stats, employerMap)
  const [renewals, accs, evals] = await Promise.all([
    supabase.from('employment_renewals').select('*').eq('employment_id', employmentId).order('created_at', { ascending: false }),
    supabase.from('daily_accomplishments').select('*, photos:accomplishment_photos(id, url)').eq('employment_id', employmentId).order('work_date', { ascending: false }),
    supabase.from('employment_evaluations').select('*').eq('employment_id', employmentId),
  ])
  return {
    ...base,
    renewals: (renewals.data ?? []).map((r) => ({
      id: r.id, employmentId: r.employment_id, requesterAccountId: r.requester_account_id,
      proposedExtension: r.proposed_extension, newEndDate: r.new_end_date, compensationTerms: r.compensation_terms,
      reason: r.reason, status: r.status, createdAt: r.created_at, respondedAt: r.responded_at ?? null,
    })),
    accomplishments: (accs.data ?? []).map((r) => ({
      id: r.id, employmentId: r.employment_id, workDate: r.work_date, tasks: r.tasks ?? [],
      description: r.description, progressPercent: r.progress_percent, remarks: r.remarks,
      status: r.status, employerFeedback: r.employer_feedback, rejectionReason: r.rejection_reason,
      reviewedAt: r.reviewed_at, createdAt: r.created_at, photos: (r.photos ?? []).map((p: any) => ({ id: p.id, url: p.url })),
    })),
    evaluations: (evals.data ?? []).map((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, punctuality: r.punctuality, quality: r.quality, attitude: r.attitude, createdAt: r.created_at,
    })),
  }
}

export async function updateEmployment(
  employmentId: string,
  payload: { status?: string; end_date?: string | null }
): Promise<EmploymentDetailDTO> {
  const update: Record<string, any> = {}

  if (payload.status !== undefined) {
    update.status = payload.status
  }

  if (payload.end_date !== undefined) {
    update.end_date = payload.end_date
  }

  const { error } = await supabase
    .from('employments')
    .update(update)
    .eq('id', employmentId)

  assertError(error, 'Failed to update employment.')

  return getEmployment(employmentId)
}

export async function submitAccomplishment(employmentId: string, payload: { workDate: string; tasks: string[]; description: string; progressPercent: number; remarks?: string | null; photoUrls?: string[] }): Promise<AccomplishmentDTO> {
  const { data, error } = await supabase.rpc('create_accomplishment', {
    p_employment_id: employmentId,
    p_work_date: payload.workDate,
    p_tasks: payload.tasks as any,
    p_description: payload.description,
    p_progress_percent: payload.progressPercent,
    p_remarks: payload.remarks ?? null,
    p_photo_urls: (payload.photoUrls ?? []) as any,
  })
  if (error) {
    if (error.code === '23505') throw new ApiError('You already have a pending report for this date.', 409)
    throw new ApiError(error.message)
  }
  return {
    id: data.id, employmentId: data.employment_id, workDate: data.work_date, tasks: data.tasks ?? [],
    description: data.description, progressPercent: data.progress_percent, remarks: data.remarks,
    status: data.status, employerFeedback: data.employer_feedback, rejectionReason: data.rejection_reason,
    reviewedAt: data.reviewed_at, createdAt: data.created_at, photos: data.photos ?? [],
  }
}

export const createAccomplishment = submitAccomplishment

export async function reviewAccomplishment(accomplishmentId: string, decision: string, feedback?: string | null, rejectionReason?: string | null): Promise<AccomplishmentDTO> {
  const { data, error } = await supabase.rpc('review_accomplishment', {
    p_accomplishment_id: accomplishmentId, p_decision: decision,
    p_feedback: feedback ?? null, p_rejection_reason: rejectionReason ?? null,
  })
  if (error) throw new ApiError(error.message)
  return {
    id: data.id, employmentId: data.employment_id, workDate: data.work_date, tasks: data.tasks ?? [],
    description: data.description, progressPercent: data.progress_percent, remarks: data.remarks,
    status: data.status, employerFeedback: data.employer_feedback, rejectionReason: data.rejection_reason,
    reviewedAt: data.reviewed_at, createdAt: data.created_at, photos: data.photos ?? [],
  }
}

export async function createEvaluation(payload: { employmentId: string; rating: number; comment?: string | null; punctuality?: number; quality?: number; attitude?: number }): Promise<EvaluationDTO> {
  const { data, error } = await supabase.rpc('create_evaluation', {
    p_employment_id: payload.employmentId, p_rating: payload.rating, p_comment: payload.comment ?? null,
    p_punctuality: payload.punctuality ?? null, p_quality: payload.quality ?? null, p_attitude: payload.attitude ?? null,
  })
  if (error) {
    if (error.code === '23505') throw new ApiError('You have already evaluated this employment.', 409)
    throw new ApiError(error.message)
  }
  return { id: data.id, rating: data.rating, comment: data.comment, punctuality: data.punctuality, quality: data.quality, attitude: data.attitude, createdAt: data.created_at }
}

export async function createRenewal(employmentId: string, payload: { proposedExtension: string; newEndDate: string; compensationTerms: string; reason?: string | null }): Promise<RenewalDTO> {
  const { data, error } = await supabase.rpc('create_renewal', {
    p_employment_id: employmentId, p_proposed_extension: payload.proposedExtension,
    p_new_end_date: payload.newEndDate, p_compensation_terms: payload.compensationTerms, p_reason: payload.reason ?? null,
  })
  if (error) {
    if (error.code === '23505') throw new ApiError('There is already a pending renewal request.', 409)
    throw new ApiError(error.message)
  }
  return {
    id: data.id, employmentId: data.employment_id, requesterAccountId: data.requester_account_id,
    proposedExtension: data.proposed_extension, newEndDate: data.new_end_date, compensationTerms: data.compensation_terms,
    reason: data.reason, status: data.status, createdAt: data.created_at, respondedAt: data.responded_at ?? null,
  }
}

export async function listRenewals(employmentId: string): Promise<RenewalDTO[]> {
  const { data, error } = await supabase
    .from('employment_renewals')
    .select('*')
    .eq('employment_id', employmentId)
    .order('created_at', { ascending: false })

  assertError(error, 'Failed to load renewal requests.')

  return (data ?? []).map((r) => ({
    id: r.id,
    employmentId: r.employment_id,
    requesterAccountId: r.requester_account_id,
    proposedExtension: r.proposed_extension,
    newEndDate: r.new_end_date,
    compensationTerms: r.compensation_terms,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    respondedAt: r.responded_at ?? null,
  }))
}

export async function respondRenewal(employmentId: string, renewalId: string, decision: string): Promise<void> {
  const { error } = await supabase.rpc('respond_renewal', { p_employment_id: employmentId, p_renewal_id: renewalId, p_decision: decision })
  if (error) throw new ApiError(error.message)
}

// ---------------------------------------------------------------------------
// Passport + Skill Unlock
// ---------------------------------------------------------------------------
export async function getPassport(workerId: string): Promise<PassportDTO> {
  const { data, error } = await supabase.rpc('get_passport', { p_worker_id: workerId })
  assertError(error, 'Failed to load passport.')
  return data as PassportDTO
}


export async function getSkillUnlock(): Promise<SkillUnlockDTO[]> {
  const userId = await uid()

  // Get the worker's profile and existing skills.
  const { data: wp, error: profileError } = await supabase
    .from('worker_profiles')
    .select('id, skills:worker_skills(skill_id)')
    .eq('account_id', userId)
    .maybeSingle()

  assertError(profileError, 'Failed to load worker skills.')

  if (!wp) return []

  const workerSkillIds = new Set(
    (wp.skills ?? []).map((s: any) => s.skill_id)
  )

  // Get published jobs and their skill requirements.
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs_public')
    .select('id, title, employer_name, municipality_name, required_skills')

  assertError(jobsError, 'Failed to load published jobs.')

  const recs = new Map<string, SkillUnlockDTO>()

  for (const job of jobs ?? []) {
    const requiredSkills = (job.required_skills ?? []).filter(
      (skill: any) => skill.importance === 'required' && skill.skillId
    )

    // Only recommend a skill when exactly one required skill is missing.
    const missing = requiredSkills.filter(
      (skill: any) => !workerSkillIds.has(skill.skillId)
    )

    if (missing.length !== 1) continue

    const missingSkill = missing[0]
    const missingSkillId = missingSkill.skillId

    let existing = recs.get(missingSkillId)

    if (!existing) {
      existing = {
        recommendedSkillId: missingSkillId,
        recommendedSkillName: missingSkill.skillName ?? 'Skill',
        categoryName: missingSkill.categoryName ?? undefined,
        reason: `Learning ${missingSkill.skillName ?? 'this skill'} could help you qualify for published jobs where it is the only missing required skill.`,
        missedJobs: [],
        potentialCount: 0,
        resources: [],
      }

      recs.set(missingSkillId, existing)
    }

    if (!existing.missedJobs.some((j) => j.id === job.id)) {
      existing.missedJobs.push({
        id: job.id,
        title: job.title,
        employerName: job.employer_name ?? 'Employer',
        municipalityName: job.municipality_name ?? null,
      })

      existing.potentialCount = existing.missedJobs.length
    }
  }

  // Retrieve real resource records for recommended skills.
  const skillIds = [...recs.keys()]

  if (skillIds.length > 0) {
    const { data: resources, error: resourcesError } = await supabase
      .from('learning_resources')
      .select('id, title, provider, url, type, accredited, skill_id')
      .in('skill_id', skillIds)

    assertError(resourcesError, 'Failed to load learning resources.')

    for (const resource of resources ?? []) {
      recs.get(resource.skill_id)?.resources.push({
        id: resource.id,
        title: resource.title,
        provider: resource.provider,
        url: resource.url,
        type: resource.type,
        accredited: resource.accredited,
      })
    }
  }

  return [...recs.values()]
    .sort((a, b) => b.potentialCount - a.potentialCount)
    .slice(0, 6)
}


// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function getNotifications(): Promise<NotificationDTO[]> {
  const userId = await uid()
  const { data, error } = await supabase.from('notifications').select('*').eq('account_id', userId).order('created_at', { ascending: false }).limit(50)
  assertError(error, 'Failed to load notifications.')
  return (data ?? []).map((r) => ({
    id: r.id, type: r.type, title: r.title, body: r.body, linkType: r.link_type ?? null,
    linkId: r.link_id ?? null, read: r.is_read, createdAt: r.created_at,
  }))
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  assertError(error, 'Failed to update notification.')
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = await uid()
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('account_id', userId).eq('is_read', false)
  assertError(error, 'Failed to update notifications.')
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------
export async function listMunicipalities(): Promise<MunicipalityDTO[]> {
  const { data, error } = await supabase.from('municipalities').select('id, name, province').order('name')
  assertError(error, 'Failed to load municipalities.')
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, province: r.province }))
}

export async function listSkills(q?: string, categoryId?: string): Promise<{ data: SkillDTO[]; categories: { id: string; name: string; icon?: string | null }[] }> {
  let query = supabase.from('skills').select('id, name, category_id, category:skill_categories(name)').order('name')
  if (categoryId) query = query.eq('category_id', categoryId)
  if (q) query = query.ilike('name', `%${q}%`)
  const { data, error } = await query
  assertError(error, 'Failed to load skills.')
  const { data: cats } = await supabase.from('skill_categories').select('id, name, icon').order('name')
  return {
    data: (data ?? []).map((r: any) => ({ id: r.id, name: r.name, categoryId: r.category_id, categoryName: r.category?.name ?? undefined })),
    categories: (cats ?? []).map((c) => ({ id: c.id, name: c.name, icon: c.icon ?? null })),
  }
}

export async function listSkillCategories(): Promise<{ id: string; name: string; icon?: string | null }[]> {
  const { data, error } = await supabase.from('skill_categories').select('id, name, icon').order('name')
  assertError(error, 'Failed to load categories.')
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, icon: c.icon ?? null }))
}

export async function getFairPay(params: { category: string; compensationType: string; compensation: number; municipalityId?: string | null }): Promise<FairPayResult> {
  let q = supabase.from('fair_pay_references').select('min_rate, max_rate, compensation_type, source').eq('category', params.category).eq('compensation_type', params.compensationType)
  if (params.municipalityId) {
    q = q.or(`municipality_id.eq.${params.municipalityId},municipality_id.is.null`)
  } else {
    q = q.is('municipality_id', null)
  }
  const { data, error } = await q
  assertError(error, 'Failed to load fair-pay reference.')
  const refs = (data ?? []).map((r) => ({ minRate: r.min_rate, maxRate: r.max_rate, compensationType: r.compensation_type }))
  const specific = refs
  const result = classifyFairPay(params.compensation, params.compensationType, specific.length ? specific : refs)
  if (result.minRate != null && result.maxRate != null) {
    const ref = data?.find((r) => r.min_rate === result.minRate)
    result.source = ref?.source ?? null
  }
  return result
}

// ---------------------------------------------------------------------------
// Worker profile
// ---------------------------------------------------------------------------

export async function getWorkerProfile(): Promise<WorkerProfileDTO> {
  const userId = await uid()

  const { data: wp, error } = await supabase
    .from('worker_profiles')
    .select(`
      *,
      municipality:municipalities(name),
      skills:worker_skills(
        *,
        skill:skills(name, category:skill_categories(name)),
        tasks:worker_skill_tasks(id, task_name),
        equipment:worker_skill_equipment(id, equipment_name, relationship)
      ),
      badges:skill_badges(id, badge, earned_at, skill:skills(name)),
      languages:worker_languages(id, language_name, proficiency)
    `)
    .eq('account_id', userId)
    .maybeSingle()

  assertError(error, 'Failed to load profile.')

  if (!wp) {
    throw new ApiError('Worker profile missing.', 400)
  }

  return {
    id: wp.id,
    accountId: userId,
    fullName: wp.full_name,
    email: '',
    mobileNumber: wp.mobile_number,
    municipalityId: wp.municipality_id,
    municipalityName: wp.municipality?.name ?? null,
    barangay: wp.barangay,
    latitude: wp.latitude,
    longitude: wp.longitude,
    photoUrl: wp.photo_url,
    bio: wp.bio,
    education: wp.education,
    preferredCategories: wp.preferred_categories ?? [],
    preferredDistanceKm: wp.preferred_distance_km,
    available: wp.available,

    skills: (wp.skills ?? []).map((s: any): WorkerSkillDTO => ({
      id: s.id,
      skillId: s.skill_id,
      skillName: s.skill?.name ?? '',
      categoryName: s.skill?.category?.name,
      level: s.level,
      yearsExperience: s.years_experience,
      experienceLevel: s.experience_level,
      notes: s.notes,
      verifiedJobCount: s.verified_job_count,
      totalRatingCount: s.total_rating_count,
      avgRating:
        s.total_rating_count > 0
          ? Math.round((s.total_rating_sum / s.total_rating_count) * 10) / 10
          : null,

      tasks: (s.tasks ?? []).map((t: any) => ({
        id: t.id,
        taskName: t.task_name,
      })),

      equipment: (s.equipment ?? []).map((e: any) => ({
        id: e.id,
        equipmentName: e.equipment_name,
        relationship: e.relationship,
      })),
    })),

    badges: (wp.badges ?? []).map((b: any) => ({
      id: b.id,
      skillName: b.skill?.name ?? '',
      badge: b.badge,
      earnedAt: b.earned_at,
    })),

    languages: (wp.languages ?? []).map((l: any) => ({
      id: l.id,
      languageName: l.language_name,
      proficiency: l.proficiency,
    })),
  }
}


export async function updateWorkerMe(payload: Partial<{ fullName: string; mobileNumber: string; barangay: string; bio: string; education: string; municipalityId: string; latitude: number; longitude: number; photoUrl: string; preferredDistanceKm: number; available: boolean; preferredCategories: string[] }>): Promise<WorkerProfileDTO> {
  const userId = await uid()
  const update: Record<string, any> = {}
  if (payload.fullName !== undefined) update.full_name = payload.fullName
  if (payload.mobileNumber !== undefined) update.mobile_number = payload.mobileNumber
  if (payload.barangay !== undefined) update.barangay = payload.barangay
  if (payload.bio !== undefined) update.bio = payload.bio
  if (payload.education !== undefined) update.education = payload.education
  if (payload.municipalityId !== undefined) update.municipality_id = payload.municipalityId || null
  if (payload.latitude !== undefined) update.latitude = payload.latitude
  if (payload.longitude !== undefined) update.longitude = payload.longitude
  if (payload.photoUrl !== undefined) update.photo_url = payload.photoUrl
  if (payload.preferredDistanceKm !== undefined) update.preferred_distance_km = payload.preferredDistanceKm
  if (payload.available !== undefined) update.available = payload.available
  if (payload.preferredCategories !== undefined) update.preferred_categories = payload.preferredCategories
  const { error } = await supabase.from('worker_profiles').update(update).eq('account_id', userId)
  assertError(error, 'Failed to update profile.')
  return getWorkerProfile()
}


// ---------------------------------------------------------------------------
// Worker skill tasks
// ---------------------------------------------------------------------------

export async function addWorkerSkillTask(
  workerSkillId: string,
  taskName: string
): Promise<WorkerSkillTaskDTO> {
  const cleanName = taskName.trim()

  if (!cleanName) {
    throw new ApiError('Please enter a task name.')
  }

  const { data, error } = await supabase
    .from('worker_skill_tasks')
    .insert({
      worker_skill_id: workerSkillId,
      task_name: cleanName,
    })
    .select('id, task_name')
    .single()

    assertError(error, 'Failed to add skill task.')

    if (!data) {
      throw new ApiError('Failed to retrieve the saved skill task.')
    }
    
    return {
      id: data.id,
      taskName: data.task_name,
    }
  }
  
  export async function removeWorkerSkillTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('worker_skill_tasks')
    .delete()
    .eq('id', taskId)

  assertError(error, 'Failed to remove skill task.')
}

// ---------------------------------------------------------------------------
// Worker skill equipment
// ---------------------------------------------------------------------------

export async function addWorkerSkillEquipment(
  workerSkillId: string,
  equipmentName: string,
  relationship: 'operates' | 'owns'
): Promise<WorkerSkillEquipmentDTO> {
  const cleanName = equipmentName.trim()

  if (!cleanName) {
    throw new ApiError('Please enter an equipment name.')
  }

  const { data, error } = await supabase
    .from('worker_skill_equipment')
    .insert({
      worker_skill_id: workerSkillId,
      equipment_name: cleanName,
      relationship,
    })
    .select('id, equipment_name, relationship')
    .single()

assertError(error, 'Failed to add equipment.')

if (!data) {
  throw new ApiError('Failed to retrieve the saved equipment.')
}

return {
  id: data.id,
  equipmentName: data.equipment_name,
  relationship: data.relationship,
}
}

export async function removeWorkerSkillEquipment(
  equipmentId: string
): Promise<void> {
  const { error } = await supabase
    .from('worker_skill_equipment')
    .delete()
    .eq('id', equipmentId)

  assertError(error, 'Failed to remove equipment.')
}

// ---------------------------------------------------------------------------
// Worker languages
// ---------------------------------------------------------------------------

export async function addWorkerLanguage(
  languageName: string,
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native'
): Promise<WorkerLanguageDTO> {
  const userId = await uid()
  const cleanName = languageName.trim()

  if (!cleanName) {
    throw new ApiError('Please enter a language.')
  }

  const { data: wp, error: profileError } = await supabase
    .from('worker_profiles')
    .select('id')
    .eq('account_id', userId)
    .maybeSingle()

  assertError(profileError, 'Failed to load worker profile.')

  if (!wp) {
    throw new ApiError('Worker profile missing.', 400)
  }

  const { data, error } = await supabase
    .from('worker_languages')
    .upsert(
      {
        worker_id: wp.id,
        language_name: cleanName,
        proficiency,
      },
      { onConflict: 'worker_id,language_name' }
    )
    .select('id, language_name, proficiency')
    .single()

assertError(error, 'Failed to save language.')

if (!data) {
  throw new ApiError('Failed to retrieve the saved language.')
}

return {
  id: data.id,
  languageName: data.language_name,
  proficiency: data.proficiency,
}
}

export async function removeWorkerLanguage(languageId: string): Promise<void> {
  const { error } = await supabase
    .from('worker_languages')
    .delete()
    .eq('id', languageId)

  assertError(error, 'Failed to remove language.')
}



export async function addWorkerSkill(
  skillId: string,
  payload?: {
    yearsExperience?: number
    experienceLevel?: string
    notes?: string
  }
): Promise<WorkerSkillDTO> {
  const userId = await uid()

  const { data: wp, error: profileError } = await supabase
    .from('worker_profiles')
    .select('id')
    .eq('account_id', userId)
    .maybeSingle()

  assertError(profileError, 'Failed to load worker profile.')

  if (!wp) {
    throw new ApiError('Worker profile missing.', 400)
  }

  // Check whether this skill is already in the worker's profile.
  const { data: existing, error: existingError } = await supabase
    .from('worker_skills')
    .select('id')
    .eq('worker_id', wp.id)
    .eq('skill_id', skillId)
    .maybeSingle()

  assertError(existingError, 'Failed to check existing skill.')

  let workerSkillId: string

  if (existing) {
    // Update only worker-editable information.
    // Never overwrite the verification level or rating counters.
    const update: Record<string, any> = {}

    if (payload?.yearsExperience !== undefined) {
      update.years_experience = payload.yearsExperience
    }

    if (payload?.experienceLevel !== undefined) {
      update.experience_level = payload.experienceLevel
    }

    if (payload?.notes !== undefined) {
      update.notes = payload.notes
    }

    if (Object.keys(update).length > 0) {
      const { error: updateError } = await supabase
        .from('worker_skills')
        .update(update)
        .eq('id', existing.id)
        .eq('worker_id', wp.id)

      assertError(updateError, 'Failed to update skill.')
    }

    workerSkillId = existing.id
  } else {
    // Only a genuinely new skill starts as self-declared.
    const { data: inserted, error: insertError } = await supabase
      .from('worker_skills')
      .insert({
        worker_id: wp.id,
        skill_id: skillId,
        level: 'self_declared',
        years_experience: payload?.yearsExperience ?? null,
        experience_level: payload?.experienceLevel ?? null,
        notes: payload?.notes ?? null,
      })
      .select('id')
      .single()

    assertError(insertError, 'Failed to add skill.')

    assertError(insertError, 'Failed to add skill.')

if (!inserted) {
  throw new ApiError('Failed to retrieve the newly added skill.')
}

workerSkillId = inserted.id
  }

  // Return the complete skill record.
  const { data, error } = await supabase
    .from('worker_skills')
    .select('*, skill:skills(name, category:skill_categories(name))')
    .eq('id', workerSkillId)
    .single()

  assertError(error, 'Failed to load saved skill.')

  return {
    id: data.id,
    skillId: data.skill_id,
    skillName: data.skill?.name ?? '',
    categoryName: data.skill?.category?.name,
    level: data.level,
    yearsExperience: data.years_experience,
    experienceLevel: data.experience_level,
    notes: data.notes,
    verifiedJobCount: data.verified_job_count,
    totalRatingCount: data.total_rating_count,
    avgRating:
      data.total_rating_count > 0
        ? Math.round(
            (data.total_rating_sum / data.total_rating_count) * 10
          ) / 10
        : null,
  }
}


export async function removeWorkerSkill(skillId: string): Promise<void> {
  const userId = await uid()
  const { data: wp } = await supabase.from('worker_profiles').select('id').eq('account_id', userId).maybeSingle()
  if (!wp) return
  const { error } = await supabase.from('worker_skills').delete().eq('worker_id', wp.id).eq('skill_id', skillId)
  assertError(error, 'Failed to remove skill.')
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------
export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('uploads').upload(path, file, { contentType: file.type })
  if (error) throw new ApiError(error.message)
  return supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export async function submitReport(payload: {
  reason: string
  description: string
  targetAccountId?: string | null
  targetJobId?: string | null
}): Promise<ReportDTO> {
  const { data, error } = await supabase.rpc('create_report', {
    p_reason: payload.reason, p_description: payload.description,
    p_target_account_id: payload.targetAccountId ?? null, p_target_job_id: payload.targetJobId ?? null,
  })
  if (error) throw new ApiError(error.message)
  return { id: data.id, reporterAccountId: data.reporter_account_id, reporterName: '', reporterRole: '', targetAccountId: data.target_account_id, targetName: null, targetJobId: data.target_job_id, targetJobTitle: null, reason: data.reason, description: data.description, status: data.status, resolutionNote: data.resolution_note, createdAt: data.created_at }
}

export const createReport = submitReport

export async function listReports(): Promise<ReportDTO[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(`*, reporter:accounts!reports_reporter_account_id_fkey(email, role, worker_profiles:worker_profiles(full_name), employer_profiles:employer_profiles(business_name), admin_profiles:admin_profiles(full_name)),
      target:accounts!reports_target_account_id_fkey(worker_profiles:worker_profiles(full_name), employer_profiles:employer_profiles(business_name)),
      target_job:jobs!reports_target_job_id_fkey(title)`)
    .order('created_at', { ascending: false })
    .limit(100)
  assertError(error, 'Failed to load reports.')
  return (data ?? []).map((r) => {
    const reporter = r.reporter
    const target = r.target
    return {
      id: r.id, reporterAccountId: r.reporter_account_id,
      reporterName: reporter?.worker_profiles?.[0]?.full_name ?? reporter?.employer_profiles?.[0]?.business_name ?? reporter?.admin_profiles?.[0]?.full_name ?? 'User',
      reporterRole: reporter?.role ?? 'worker',
      targetAccountId: r.target_account_id, targetName: target?.worker_profiles?.[0]?.full_name ?? target?.employer_profiles?.[0]?.business_name ?? null,
      targetJobId: r.target_job_id, targetJobTitle: r.target_job?.title ?? null,
      reason: r.reason, description: r.description, status: r.status, resolutionNote: r.resolution_note, createdAt: r.created_at,
    }
  })
}

export async function updateReport(reportId: string, status: string, note?: string | null): Promise<ReportDTO> {
  const { data, error } = await supabase.rpc('review_report', { p_report_id: reportId, p_status: status, p_resolution_note: note ?? null })
  if (error) throw new ApiError(error.message)
  return { id: data.id, reporterAccountId: data.reporter_account_id, reporterName: '', reporterRole: '', targetAccountId: data.target_account_id, targetName: null, targetJobId: data.target_job_id, targetJobTitle: null, reason: data.reason, description: data.description, status: data.status, resolutionNote: data.resolution_note, createdAt: data.created_at }
}

// ---------------------------------------------------------------------------
// Employer
// ---------------------------------------------------------------------------
export async function listEmployerJobs(): Promise<JobDTO[]> {
  const userId = await uid()
  const { data, error } = await supabase
    .from('jobs')
    .select(`*, municipality:municipalities(name), required_skills:job_required_skills(id, skill_id, importance, weight, skill:skills(name, category:skill_categories(name)))`)
    .eq('employer_id', userId)
    .order('created_at', { ascending: false })
  assertError(error, 'Failed to load jobs.')
  const { data: ep } = await supabase.from('employer_profiles').select('business_name, verification, logo_url').eq('account_id', userId).maybeSingle()
  return (data ?? []).map((r) => mapJobRow(r, ep))
}

export async function createJob(payload: any): Promise<JobDTO> {
  const { data, error } = await supabase.rpc('create_job', { p_payload: payload })
  if (error) throw new ApiError(error.message)
  // refetch with joins
  return (await listEmployerJobs()).find((j) => j.id === data.id) ?? mapJobRow(data)
}

export async function updateJob(jobId: string, payload: any): Promise<JobDTO> {
  const { data, error } = await supabase.rpc('update_job', { p_job_id: jobId, p_payload: payload })
  if (error) throw new ApiError(error.message)
  return (await listEmployerJobs()).find((j) => j.id === jobId) ?? mapJobRow(data)
}

export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase.from('jobs').update({ status: 'archived' }).eq('id', jobId)
  assertError(error, 'Failed to archive job.')
}

export async function getEmployerProfile(): Promise<EmployerProfileDTO | null> {
  const userId = await uid()
  const { data, error } = await supabase.from('employer_profiles').select('*, municipality:municipalities(name)').eq('account_id', userId).maybeSingle()
  assertError(error, 'Failed to load profile.')
  if (!data) return null
  return {
    id: data.id, accountId: userId, email: '', businessName: data.business_name, employerType: data.employer_type,
    contactPerson: data.contact_person, mobileNumber: data.mobile_number, municipalityId: data.municipality_id,
    municipalityName: data.municipality?.name ?? null, barangay: data.barangay, address: data.address,
    description: data.description, logoUrl: data.logo_url, verification: data.verification,
    verificationNote: data.verification_note, documentUrls: data.document_urls ?? [], createdAt: data.created_at, updatedAt: data.updated_at,
  }
}

export async function updateEmployerMe(
  payload: Partial<{
    businessName: string
    employerType: string
    contactPerson: string | null
    mobileNumber: string | null
    barangay: string | null
    address: string | null
    description: string | null
    municipalityId: string | null
    logoUrl: string | null
    documentUrls: string[]
  }>
): Promise<EmployerProfileDTO> {
  const userId = await uid()
  const update: Record<string, any> = {}
  for (const [k, v] of Object.entries(payload)) {
    const map: Record<string, string> = { businessName: 'business_name', employerType: 'employer_type', contactPerson: 'contact_person', mobileNumber: 'mobile_number', municipalityId: 'municipality_id', logoUrl: 'logo_url', documentUrls: 'document_urls' }
    update[map[k] ?? k] = v
  }
  const { error } = await supabase.from('employer_profiles').update(update).eq('account_id', userId)
  assertError(error, 'Failed to update profile.')
  return (await getEmployerProfile())!
}

export async function submitVerification(documentUrls: string[], note?: string | null): Promise<void> {
  const { error } = await supabase.rpc('submit_verification', { p_document_urls: documentUrls as any, p_note: note ?? null })
  if (error) {
    if (error.code === '23505') throw new ApiError('Your verification request is already under review.', 409)
    throw new ApiError(error.message)
  }
}

export async function getEmploymentHistory(): Promise<EmploymentDTO[]> {
  return listEmployments({ status: 'completed' })
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export async function adminOverview(): Promise<OverviewData> {
  const { data, error } = await supabase.rpc('admin_overview')
  assertError(error, 'Failed to load overview.')
  return data as OverviewData
}

export async function adminListUsers(filters: { q?: string; role?: string; status?: string } = {}): Promise<AdminUserRow[]> {
  let q = supabase.from('accounts').select('*, worker:worker_profiles(full_name, municipality:municipalities(name)), employer:employer_profiles(business_name, verification, municipality:municipalities(name)), admin:admin_profiles(full_name)')
  if (filters.role) q = q.eq('role', filters.role)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.q) q = q.or(`email.ilike.%${filters.q}%,worker.full_name.ilike.%${filters.q}%,employer.business_name.ilike.%${filters.q}%`)
  q = q.order('created_at', { ascending: false }).limit(100)
  const { data, error } = await q
  assertError(error, 'Failed to load users.')
  return (data ?? []).map((r) => ({
    id: r.id, email: r.email, role: r.role, status: r.status, suspendReason: r.suspend_reason,
    createdAt: r.created_at,
    name: r.role === 'worker' ? r.worker?.full_name : r.role === 'employer' ? r.employer?.business_name : r.admin?.full_name,
    verification: r.role === 'employer' ? r.employer?.verification : null,
    municipality: r.role === 'worker' ? r.worker?.municipality?.name : r.employer?.municipality?.name ?? null,
  }))
}


export async function adminGetUser(userId: string): Promise<AdminUserDetail> {
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select(`
      *,
      worker:worker_profiles(
        *,
        municipality:municipalities(name),
        skills:worker_skills(
          *,
          skill:skills(name, category:skill_categories(name))
        )
      ),
      employer:employer_profiles(
        *,
        municipality:municipalities(name)
      ),
      admin:admin_profiles(*)
    `)
    .eq('id', userId)
    .maybeSingle()

  assertError(accountError, 'Failed to load user details.')

  if (!account) {
    throw new ApiError('User not found.', 404)
  }

  const [jobsResult, logsResult] = await Promise.all([
    supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', userId)
      .order('created_at', { ascending: false }),

    supabase
      .from('audit_logs')
      .select('*')
      .eq('target_id', userId)
      .order('created_at', { ascending: false }),
  ])

  assertError(jobsResult.error, 'Failed to load user jobs.')
  assertError(logsResult.error, 'Failed to load moderation history.')

  const worker = account.worker
  const employer = account.employer
  const admin = account.admin

  return {
    id: account.id,
    email: account.email,
    role: account.role,
    status: account.status,
    suspendReason: account.suspend_reason ?? null,
    createdAt: account.created_at,

    workerProfile: worker
      ? {
          ...worker,
          municipalityName: worker.municipality?.name ?? null,
          skills: (worker.skills ?? []).map((s: any) => ({
            ...s,
            skillName: s.skill?.name ?? '',
            categoryName: s.skill?.category?.name ?? '',
          })),
        }
      : null,

    employerProfile: employer
      ? {
          ...employer,
          businessName: employer.business_name,
          employerType: employer.employer_type,
          municipalityName: employer.municipality?.name ?? null,
          verificationNote: employer.verification_note ?? null,
        }
      : null,

    adminProfile: admin
      ? {
          id: admin.id,
          fullName: admin.full_name,
        }
      : null,

    moderationActions: logsResult.data ?? [],

    jobs: (jobsResult.data ?? []).map((job) => ({
      ...job,
      moderationStatus: job.moderation_status,
    })),
  }
}


export async function adminUserAction(userId: string, action: string, reason?: string | null): Promise<void> {
  const { error } = await supabase.rpc('admin_user_action', { p_user_id: userId, p_action: action, p_reason: reason ?? null })
  if (error) throw new ApiError(error.message)
}

export async function adminListJobs(filters: { q?: string; status?: string; moderationStatus?: string; suspicious?: boolean } = {}): Promise<JobDTO[]> {
  let q = supabase.from('jobs').select(`*, municipality:municipalities(name), required_skills:job_required_skills(id, skill_id, importance, weight, skill:skills(name, category:skill_categories(name)))`)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.moderationStatus) q = q.eq('moderation_status', filters.moderationStatus)
  if (filters.q) q = q.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`)
  q = q.order('created_at', { ascending: false }).limit(100)
  const { data, error } = await q
  assertError(error, 'Failed to load jobs.')
  let rows = data ?? []
  if (filters.suspicious) {
    rows = rows.filter((r) => (r.scam_flags?.length > 0) || r.moderation_status === 'flagged')
  }
  const employerMap = await fetchEmployerMap(rows.map((r) => r.employer_id))
  return rows.map((r) => mapJobRow(r, employerMap.get(r.employer_id)))
}

export async function adminJobAction(jobId: string, action: string, reason?: string | null): Promise<void> {
  const { error } = await supabase.rpc('admin_job_action', { p_job_id: jobId, p_action: action, p_reason: reason ?? null })
  if (error) throw new ApiError(error.message)
}

export async function adminAuditLogs(limit = 100): Promise<AuditLogDTO[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, admin:accounts!audit_logs_admin_account_id_fkey(email, admin_profiles:admin_profiles(full_name))')
    .order('created_at', { ascending: false })
    .limit(limit)
  assertError(error, 'Failed to load audit logs.')
  return (data ?? []).map((r) => ({
    id: r.id,
    adminName: r.admin?.admin_profiles?.[0]?.full_name ?? r.admin?.email ?? 'Admin',
    action: r.action, targetType: r.target_type, targetId: r.target_id, reason: r.reason,
    metadata: r.metadata, createdAt: r.created_at,
  }))
}

export const listApplications = getApplications
export const listNotifications = getNotifications
export const getMunicipalities = listMunicipalities
export const getSkillCategories = listSkillCategories

export const getWorkerMe = getWorkerProfile
export const getEmployerMe = getEmployerProfile

export const archiveJob = deleteJob