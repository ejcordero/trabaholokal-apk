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
  const weights = { skillCoverage: 0.7, experienceRelevance: 0.15, locationSuitability: 0.1, availabilitySuitability: 0.05 }

  const workerSkillIds = new Set(worker.skills.map((s: any) => s.skillId))
  const required = job.requiredSkills.filter((s: any) => s.importance === 'required')
  const preferred = job.requiredSkills.filter((s: any) => s.importance === 'preferred')

  const totalReqWeight = required.reduce((sum: number, s: any) => sum + s.weight, 0) || 1
  const matchedReq = required.filter((s: any) => workerSkillIds.has(s.skillId))
  const matchedReqWeight = matchedReq.reduce((sum: number, s: any) => sum + s.weight, 0)
  let coverage = matchedReqWeight / totalReqWeight

  const preferredMatched = preferred.filter((s: any) => workerSkillIds.has(s.skillId))
  const preferredBonus = preferred.length ? (preferredMatched.length / preferred.length) * 0.1 : 0
  coverage = Math.min(1, coverage + preferredBonus)

  const matchingSkills = matchedReq.map((s: any) => s.skillId)
  const missingSkills = required.filter((s: any) => !workerSkillIds.has(s.skillId)).map((s: any) => s.skillId)
  const preferredSkills = preferredMatched.map((s: any) => s.skillId)

  let experience = 0
  if (matchedReq.length) {
    const perSkill = matchedReq.map((s: any) => {
      const ws = worker.skills.find((w: any) => w.skillId === s.skillId)
      if (!ws) return 0
      const lvl = LEVEL_EXPERIENCE_FACTOR[ws.level] ?? 0.4
      const exp = ws.experienceLevel ? EXPERIENCE_LEVEL_FACTOR[ws.experienceLevel] ?? 0.6 : 0.6
      const jobFactor = Math.min(ws.verifiedJobCount / 3, 1)
      return lvl * 0.4 + exp * 0.3 + jobFactor * 0.3
    })
    experience = perSkill.reduce((a: number, b: number) => a + b, 0) / perSkill.length
  }

  let location = 0.3
  if (worker.municipalityId && job.municipalityId) {
    location = worker.municipalityId === job.municipalityId ? 1 : 0.6
  }
  if (worker.latitude != null && worker.longitude != null && job.latitude != null && job.longitude != null) {
    const d = haversineKm({ lat: worker.latitude, lon: worker.longitude }, { lat: job.latitude, lon: job.longitude })
    if (d <= 5) location = Math.max(location, 1)
    else if (d <= 15) location = Math.max(location, 0.8)
    else if (d <= 30) location = Math.max(location, 0.6)
    else location = Math.max(location, 0.4)
  }

  const availability = worker.available ? 1 : 0
  const score = (coverage * weights.skillCoverage + experience * weights.experienceRelevance + location * weights.locationSuitability + availability * weights.availabilitySuitability) * 100
  const rounded = Math.round(score)

  const explanation: string[] = []
  explanation.push(`You cover ${matchedReq.length} of ${required.length} required skills (${Math.round(coverage * 100)}% weighted).`)
  if (missingSkills.length) explanation.push('Missing required skills lower your score.')
  if (preferredMatched.length) explanation.push(`You also meet ${preferredMatched.length} preferred skill(s), adding a small bonus.`)
  explanation.push(`Experience relevance: ${Math.round(experience * 100)}%.`)
  explanation.push(`Location suitability: ${Math.round(location * 100)}%.`)
  explanation.push(worker.available ? 'You are marked available.' : 'You are marked unavailable.')

  const grade = rounded >= 85 ? 'Excellent' : rounded >= 70 ? 'Strong' : rounded >= 50 ? 'Fair' : 'Low'

  return {
    score: rounded,
    grade,
    breakdown: {
      skillCoverage: coverage,
      experienceRelevance: experience,
      locationSuitability: location,
      availabilitySuitability: availability,
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