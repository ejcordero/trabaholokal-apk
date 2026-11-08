const LEVEL_EXPERIENCE_FACTOR: Record<string, number> = {
  self_declared: 0.4,
  verified_experience: 0.7,
  repeatedly_demonstrated: 0.9,
  highly_rated: 1.0,
}

const EXPERIENCE_LEVEL_FACTOR: Record<string, number> = {
  beginner: 0.5,
  intermediate: 0.75,
  advanced: 1.0,
}

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function computeMatch(worker: any, job: any): any {
  const weights = {
    skillCoverage: 0.7,
    experienceRelevance: 0.15,
    locationSuitability: 0.1,
    availabilitySuitability: 0.05,
  }

  const workerSkills = worker.skills ?? []
  const workerPreferences = worker.preferences ?? {}

  const workerSkillIds = new Set(workerSkills.map((s: any) => s.skillId))
  const required = (job.requiredSkills ?? []).filter(
    (s: any) => s.importance === 'required'
  )
  const preferred = (job.requiredSkills ?? []).filter(
    (s: any) => s.importance === 'preferred'
  )

  const totalReqWeight =
    required.reduce((sum: number, s: any) => sum + s.weight, 0) || 1

  const matchedReq = required.filter((s: any) =>
    workerSkillIds.has(s.skillId)
  )
  const matchedReqWeight = matchedReq.reduce(
    (sum: number, s: any) => sum + s.weight,
    0
  )

  let coverage = required.length
  ? matchedReqWeight / totalReqWeight
  : 1

  const preferredMatched = preferred.filter((s: any) =>
    workerSkillIds.has(s.skillId)
  )
  
  const preferredBonus = preferred.length
    ? (preferredMatched.length / preferred.length) * 0.1
    : 0
  
  coverage = Math.min(1, coverage + preferredBonus)

  const matchingSkills = matchedReq.map((s: any) => s.skillId)
  const missingSkills = required
    .filter((s: any) => !workerSkillIds.has(s.skillId))
    .map((s: any) => s.skillId)
  const preferredSkills = preferredMatched.map((s: any) => s.skillId)

  let experience = required.length === 0 ? 1 : 0

  if (matchedReq.length) {
    const perSkill = matchedReq.map((s: any) => {
      const ws = workerSkills.find((w: any) => w.skillId === s.skillId)
      if (!ws) return 0
  
      const lvl = LEVEL_EXPERIENCE_FACTOR[ws.level] ?? 0.4
      const exp = ws.experienceLevel
        ? EXPERIENCE_LEVEL_FACTOR[ws.experienceLevel] ?? 0.6
        : 0.6
      const jobFactor = Math.min((ws.verifiedJobCount ?? 0) / 3, 1)
  
      return lvl * 0.4 + exp * 0.3 + jobFactor * 0.3
    })
  
    experience =
      perSkill.reduce((a: number, b: number) => a + b, 0) /
      perSkill.length
  }

  let location = 0.3

  if (worker.municipalityId && job.municipalityId) {
    location =
      worker.municipalityId === job.municipalityId ? 1 : 0.6
  }

  if (
    worker.latitude != null &&
    worker.longitude != null &&
    job.latitude != null &&
    job.longitude != null
  ) {
    const d = haversineKm(
      { lat: worker.latitude, lon: worker.longitude },
      { lat: job.latitude, lon: job.longitude }
    )

    if (d <= 5) location = Math.max(location, 1)
    else if (d <= 15) location = Math.max(location, 0.8)
    else if (d <= 30) location = Math.max(location, 0.6)
    else location = Math.max(location, 0.4)
  }

  // Availability and work preference compatibility share the existing 5%.
  const preferenceScores: number[] = []
  const preferenceMismatches: string[] = []

  const workerEmploymentTypes = workerPreferences.employmentTypes ?? []
  const workerSchedules = workerPreferences.workSchedules ?? []
  const workerArrangements = workerPreferences.workArrangements ?? []

  if (
    workerEmploymentTypes.length > 0 &&
    job.employmentType
  ) {
    const compatible = workerEmploymentTypes.includes(job.employmentType)
    preferenceScores.push(compatible ? 1 : 0)

    if (!compatible) {
      preferenceMismatches.push(
        'The job employment type does not match your selected preferences.'
      )
    }
  }

  const jobSchedules = job.workSchedules ?? []

  if (workerSchedules.length > 0 && jobSchedules.length > 0) {
    const compatible = workerSchedules.some((schedule: string) =>
      jobSchedules.includes(schedule)
    )

    preferenceScores.push(compatible ? 1 : 0)

    if (!compatible) {
      preferenceMismatches.push(
        'The job schedule does not match your selected preferences.'
      )
    }
  }

  const jobArrangements = job.workArrangements ?? []

  if (workerArrangements.length > 0 && jobArrangements.length > 0) {
    const compatible = workerArrangements.some((arrangement: string) =>
      jobArrangements.includes(arrangement)
    )

    preferenceScores.push(compatible ? 1 : 0)

    if (!compatible) {
      preferenceMismatches.push(
        'The work arrangement does not match your selected preferences.'
      )
    }
  }

  const earliestStartDate = workerPreferences.earliestStartDate
    ? String(workerPreferences.earliestStartDate).slice(0, 10)
    : null

  const jobStartDate = job.startDate
    ? String(job.startDate).slice(0, 10)
    : null

  if (
    earliestStartDate &&
    jobStartDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(earliestStartDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(jobStartDate)
  ) {
    const compatible = earliestStartDate <= jobStartDate
    preferenceScores.push(compatible ? 1 : 0)

    if (!compatible) {
      preferenceMismatches.push(
        'Your earliest available start date is later than this job’s start date.'
      )
    }
  }

  const preferenceCompatibility = preferenceScores.length
    ? preferenceScores.reduce((sum, value) => sum + value, 0) /
      preferenceScores.length
    : 1

  const availability = worker.available
    ? preferenceCompatibility
    : 0

  const score =
    (
      coverage * weights.skillCoverage +
      experience * weights.experienceRelevance +
      location * weights.locationSuitability +
      availability * weights.availabilitySuitability
    ) * 100

  const rounded = Math.round(score)

  const explanation: string[] = []

  if (required.length === 0) {
    explanation.push(
      'This job has no required skills. Your match score is not penalized for missing skill requirements.'
    )
  } else {
    explanation.push(
      `You cover ${matchedReq.length} of ${required.length} required skills (${Math.round(coverage * 100)}% weighted).`
    )
  }

  if (missingSkills.length) {
    explanation.push('Missing required skills lower your score.')
  }

  if (preferredMatched.length) {
    explanation.push(
      `You also meet ${preferredMatched.length} preferred skill(s), adding a small bonus.`
    )
  }

  explanation.push(`Experience relevance: ${Math.round(experience * 100)}%.`)
  explanation.push(`Location suitability: ${Math.round(location * 100)}%.`)

  if (!worker.available) {
    explanation.push('You are marked unavailable.')
  } else {
    explanation.push('You are marked available.')

    if (preferenceScores.length === 0) {
      explanation.push(
        'No comparable work preferences were specified, so no preference penalty was applied.'
      )
    } else if (preferenceMismatches.length === 0) {
      explanation.push(
        'Your work preferences are compatible with this job.'
      )
    } else {
      explanation.push(...preferenceMismatches)
    }
  }

  const grade =
    rounded >= 85
      ? 'Excellent'
      : rounded >= 70
        ? 'Strong'
        : rounded >= 50
          ? 'Fair'
          : 'Low'

  return {
    score: rounded,
    grade,
    breakdown: {
      skillCoverage: coverage,
      experienceRelevance: experience,
      locationSuitability: location,
      availabilitySuitability: availability,
      preferenceCompatibility,
      matchingSkills,
      missingSkills,
      preferredSkills,
      explanation,
      weights,
    },
  }
}

const SCAM_PATTERNS = [
  { re: /registration\s*fee|application\s*fee|processing\s*fee|placement\s*fee/i, flag: 'Requests an application/processing fee' },
  { re: /deposit|required\s*payment|send\s*money|gcash\s*payment|bank\s*deposit\s*(is|required)/i, flag: 'Requests a deposit or upfront payment' },
  { re: /\b(earn|salary|pay)\s+(₱|php|peso)?\s*(\d{4,})\s*(per\s*day|daily)\b/i, flag: 'Verify unusually high daily compensation' },
  { re: /(work\s*from\s*home|online\s*job).*(investment|capital|fee)/i, flag: 'Work-from-home offer requesting investment' },
  { re: /(paypal|western\s*union|moneygram|bitcoin|crypto)\s*required/i, flag: 'Suspicious payment method requested' },
]

export function detectScamFlags(job: { title: string; description: string; compensation: number; compensationType: string }): string[] {
  const flags: string[] = []
  const text = `${job.title}\n${job.description}`
  for (const { re, flag } of SCAM_PATTERNS) {
    if (re.test(text)) flags.push(flag)
  }
  if (job.compensationType === 'daily' && job.compensation > 5000) {
    flags.push('Daily compensation above typical reference range — please verify.')
  }
  return flags
}

export function classifyFairPay(
  compensation: number,
  compensationType: string,
  refs: { minRate: number; maxRate: number; compensationType: string }[]
): any {
  const match = refs.find((r) => r.compensationType === compensationType)
  if (!match) return { classification: 'insufficient_data', label: 'Insufficient Reference Data' }
  if (compensation < match.minRate) return { classification: 'below_reference', label: 'Below Reference Range', minRate: match.minRate, maxRate: match.maxRate }
  if (compensation > match.maxRate) return { classification: 'above_reference', label: 'Above Reference Range', minRate: match.minRate, maxRate: match.maxRate }
  return { classification: 'within_reference', label: 'Within Reference Range', minRate: match.minRate, maxRate: match.maxRate }
}