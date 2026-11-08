export const JOB_CATEGORIES = [
  { value: 'skilled_labor', label: 'Skilled Labor' },
  { value: 'general_labor', label: 'General Labor' },
  { value: 'construction', label: 'Construction' },
  { value: 'agriculture', label: 'Agriculture & Farming' },
  { value: 'service', label: 'Service' },
  { value: 'office', label: 'Office' },
  { value: 'technical', label: 'Technical' },
  { value: 'daily_wage', label: 'Daily Wage' },
  { value: 'urgent', label: 'Urgent Employment' },
  { value: 'contractual', label: 'Contractual' },
  { value: 'household_services', label: 'Household Services' },
{ value: 'cleaning_maintenance', label: 'Cleaning & Maintenance' },
{ value: 'caregiving', label: 'Caregiving' },
{ value: 'transportation', label: 'Transportation & Delivery' },
] as const

export const EMPLOYMENT_TYPES = [
  { value: 'regular', label: 'Regular' },
  { value: 'contractual', label: 'Contractual' },
  { value: 'job_order', label: 'Job Order (JO)' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const

export const COMPENSATION_TYPES = [
  { value: 'daily', label: 'Per Day' },
  { value: 'weekly', label: 'Per Week' },
  { value: 'monthly', label: 'Per Month' },
  { value: 'fixed', label: 'Fixed / Project' },
  { value: 'hourly', label: 'Per Hour' },
] as const

export const URGENCY_LEVELS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
] as const

export const SKILL_CATEGORIES_LIST = [
  'Construction',
  'Agriculture',
  'Electrical',
  'Plumbing',
  'Automotive',
  'Domestic Services',
  'Food and Hospitality',
  'Retail',
  'Office and Administration',
  'Technology',
  'General Labor',
  'Other',
] as const

export const SKILL_LEVELS = [
  { value: 'self_declared', label: 'Self-Declared', desc: 'Claimed by worker, not yet verified.' },
  { value: 'verified_experience', label: 'Verified Work Experience', desc: 'Earned through completed employment.' },
  { value: 'repeatedly_demonstrated', label: 'Repeatedly Demonstrated', desc: 'Demonstrated across multiple employments.' },
  { value: 'highly_rated', label: 'Highly Rated', desc: 'Consistently strong employer evaluations.' },
] as const

export const APPLICATION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
] as const

export const EMPLOYMENT_STATUSES = [
  { value: 'pending_start', label: 'Pending Start' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'terminated', label: 'Terminated' },
] as const

export const ACCOMPLISHMENT_STATUSES = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const

export const RENEWAL_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
] as const

export const RENEWAL_EXTENSIONS = [
  { value: '1_day', label: 'One Additional Day' },
  { value: 'several_days', label: 'Several Days' },
  { value: '1_month', label: 'One Month' },
  { value: 'contractual', label: 'Contractual Period' },
  { value: 'job_order', label: 'Job Order Period' },
] as const

export const EMPLOYER_TYPES = [
  { value: 'individual', label: 'Individual / Household' },
  { value: 'business', label: 'Business / Company' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'government', label: 'Government' },
  { value: 'ngo', label: 'NGO / Organization' },
] as const

export const EMPLOYER_VERIFICATION = [
  { value: 'unverified', label: 'Unverified' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'verified', label: 'Verified' },
  { value: 'suspended', label: 'Suspended' },
] as const

export const REPORT_REASONS = [
  { value: 'scam', label: 'Scam / Fraud' },
  { value: 'fake_employer', label: 'Fake Employer' },
  { value: 'illegal_payment', label: 'Illegal Payment Request' },
  { value: 'misleading', label: 'Misleading Description' },
  { value: 'abusive', label: 'Abusive Behavior' },
  { value: 'other', label: 'Other' },
] as const

export const REPORT_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
] as const

export const JOB_STATUS_VALUES = ['draft', 'published', 'paused', 'closed', 'archived', 'removed'] as const