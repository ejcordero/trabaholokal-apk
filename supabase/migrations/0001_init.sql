create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'worker' check (role in ('worker', 'employer', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  suspend_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.municipalities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  province text,
  latitude double precision,
  longitude double precision
);

create table public.barangays (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete cascade,
  name text not null,
  unique (municipality_id, name)
);

create table public.worker_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  full_name text not null,
  mobile_number text,
  municipality_id uuid references public.municipalities(id),
  barangay text,
  latitude double precision,
  longitude double precision,
  photo_url text,
  bio text,
  education text,
  preferred_categories jsonb not null default '[]'::jsonb,
  preferred_distance_km integer,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  business_name text not null,
  employer_type text not null default 'individual' check (employer_type in ('individual', 'business', 'contractor', 'government', 'ngo')),
  contact_person text,
  mobile_number text,
  municipality_id uuid references public.municipalities(id),
  barangay text,
  address text,
  description text,
  logo_url text,
  verification text not null default 'unverified' check (verification in ('unverified', 'pending', 'verified', 'suspended')),
  verification_note text,
  document_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category_id uuid not null references public.skill_categories(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.worker_skills (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  level text not null default 'self_declared' check (level in ('self_declared', 'verified_experience', 'repeatedly_demonstrated', 'highly_rated')),
  years_experience integer,
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  notes text,
  verified_job_count integer not null default 0,
  total_rating_sum integer not null default 0,
  total_rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, skill_id)
);

create table public.skill_badges (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  badge text not null check (badge in ('verified_worker', 'mastery', 'reliable', 'top_rated')),
  earned_at timestamptz not null default now(),
  unique (worker_id, skill_id, badge)
);

create table public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  title text not null,
  provider text not null,
  url text,
  type text not null default 'course' check (type in ('course', 'video', 'article', 'workshop')),
  accredited boolean not null default false
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.accounts(id) on delete cascade,
  title text not null,
  category text not null check (category in ('skilled_labor', 'general_labor', 'construction', 'agriculture', 'service', 'office', 'technical', 'daily_wage', 'urgent', 'contractual')),
  description text not null,
  responsibilities jsonb not null default '[]'::jsonb,
  qualifications jsonb not null default '[]'::jsonb,
  compensation numeric(12, 2) not null,
  compensation_type text not null default 'daily' check (compensation_type in ('daily', 'weekly', 'monthly', 'fixed', 'hourly')),
  positions integer not null default 1,
  employment_type text not null default 'regular' check (employment_type in ('regular', 'contractual', 'job_order', 'daily', 'weekly', 'monthly')),
  start_date timestamptz,
  end_date timestamptz,
  municipality_id uuid references public.municipalities(id),
  barangay text,
  location_text text,
  latitude double precision,
  longitude double precision,
  urgency_level text not null default 'normal' check (urgency_level in ('normal', 'urgent', 'critical')),
  working_hours text,
  application_deadline timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'paused', 'closed', 'archived', 'removed')),
  moderation_status text not null default 'ok' check (moderation_status in ('ok', 'flagged', 'under_review', 'removed')),
  moderation_note text,
  scam_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_required_skills (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  importance text not null default 'required' check (importance in ('required', 'preferred')),
  weight double precision not null default 1.0,
  unique (job_id, skill_id)
);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  message text,
  match_score double precision not null default 0,
  match_details jsonb,
  status text not null default 'pending' check (status in ('pending', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  employer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, worker_id)
);

create table public.employments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete restrict,
  worker_id uuid not null references public.worker_profiles(id) on delete restrict,
  worker_account_id uuid not null references public.accounts(id) on delete restrict,
  employer_id uuid not null references public.accounts(id) on delete restrict,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  agreed_compensation numeric(12, 2) not null,
  compensation_type text not null default 'daily' check (compensation_type in ('daily', 'weekly', 'monthly', 'fixed', 'hourly')),
  working_hours text,
  status text not null default 'active' check (status in ('pending_start', 'active', 'paused', 'completed', 'terminated')),
  parent_employment_id uuid references public.employments(id) on delete set null,
  employment_event text not null default 'new_job' check (employment_event in ('new_job', 'extension', 'new_contract')),
  target_workdays integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employment_renewals (
  id uuid primary key default gen_random_uuid(),
  employment_id uuid not null references public.employments(id) on delete cascade,
  requester_account_id uuid not null references public.accounts(id) on delete cascade,
  proposed_extension text not null check (proposed_extension in ('1_day', 'several_days', '1_month', 'contractual', 'job_order')),
  new_end_date timestamptz not null,
  compensation_terms text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create table public.daily_accomplishments (
  id uuid primary key default gen_random_uuid(),
  employment_id uuid not null references public.employments(id) on delete cascade,
  worker_account_id uuid not null references public.accounts(id) on delete cascade,
  work_date date not null,
  tasks jsonb not null default '[]'::jsonb,
  description text not null,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  remarks text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  employer_feedback text,
  rejection_reason text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.accomplishment_photos (
  id uuid primary key default gen_random_uuid(),
  accomplishment_id uuid not null references public.daily_accomplishments(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

create table public.employment_evaluations (
  id uuid primary key default gen_random_uuid(),
  employment_id uuid not null references public.employments(id) on delete cascade,
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  employer_id uuid not null references public.accounts(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  punctuality integer,
  quality integer,
  attitude integer,
  created_at timestamptz not null default now(),
  unique (employment_id, employer_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  link_type text,
  link_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_account_id uuid not null references public.accounts(id) on delete cascade,
  target_account_id uuid references public.accounts(id) on delete set null,
  target_job_id uuid references public.jobs(id) on delete set null,
  reason text not null check (reason in ('scam', 'fake_employer', 'illegal_payment', 'misleading', 'abusive', 'other')),
  description text not null,
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'dismissed')),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_account_id uuid not null references public.accounts(id) on delete cascade,
  action text not null,
  target_type text not null check (target_type in ('account', 'job', 'report')),
  target_id uuid not null,
  reason text,
  previous_status text,
  new_status text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_account_id uuid not null references public.accounts(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.fair_pay_references (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid references public.municipalities(id) on delete cascade,
  category text not null,
  compensation_type text not null,
  min_rate numeric(12, 2) not null,
  max_rate numeric(12, 2) not null,
  source text,
  updated_at timestamptz not null default now()
);

create index jobs_employer_id_idx on public.jobs(employer_id);
create index jobs_status_idx on public.jobs(status);
create index jobs_created_at_idx on public.jobs(created_at desc);
create index jobs_municipality_id_idx on public.jobs(municipality_id);
create index job_applications_job_id_idx on public.job_applications(job_id);
create index job_applications_worker_id_idx on public.job_applications(worker_id);
create index employments_worker_id_idx on public.employments(worker_id);
create index employments_employer_id_idx on public.employments(employer_id);
create index employments_job_id_idx on public.employments(job_id);
create index daily_accomplishments_employment_id_idx on public.daily_accomplishments(employment_id);
create index notifications_account_id_idx on public.notifications(account_id, created_at desc);
create index reports_status_idx on public.reports(status);
create index worker_skills_worker_id_idx on public.worker_skills(worker_id);
create index employment_evaluations_worker_id_idx on public.employment_evaluations(worker_id);

create trigger accounts_updated_at before update on public.accounts for each row execute function public.set_updated_at();
create trigger worker_profiles_updated_at before update on public.worker_profiles for each row execute function public.set_updated_at();
create trigger employer_profiles_updated_at before update on public.employer_profiles for each row execute function public.set_updated_at();
create trigger admin_profiles_updated_at before update on public.admin_profiles for each row execute function public.set_updated_at();
create trigger worker_skills_updated_at before update on public.worker_skills for each row execute function public.set_updated_at();
create trigger jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger job_applications_updated_at before update on public.job_applications for each row execute function public.set_updated_at();
create trigger employments_updated_at before update on public.employments for each row execute function public.set_updated_at();
create trigger reports_updated_at before update on public.reports for each row execute function public.set_updated_at();

create or replace function public.current_account_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select a.role from public.accounts a where a.id = auth.uid()
$$;

create or replace function public.current_account_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select a.status from public.accounts a where a.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select a.role = 'admin' from public.accounts a where a.id = auth.uid()), false)
$$;

create or replace function public.my_worker_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select wp.id from public.worker_profiles wp where wp.account_id = auth.uid()
$$;

create or replace function public.my_employer_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ep.id from public.employer_profiles ep where ep.account_id = auth.uid()
$$;

create or replace function public.employer_related_to_worker(p_worker_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.job_applications ja
    join public.jobs j on j.id = ja.job_id
    where ja.worker_id = p_worker_id and j.employer_id = auth.uid()
  ) or exists (
    select 1 from public.employments e
    where e.worker_id = p_worker_id and e.employer_id = auth.uid()
  ) or exists (
    select 1 from public.employment_evaluations ev
    where ev.worker_id = p_worker_id and ev.employer_id = auth.uid()
  )
$$;

create or replace function public.can_view_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.job_applications a
    where a.job_id = p_job_id and a.account_id = auth.uid()
  ) or exists (
    select 1 from public.employments e
    where e.job_id = p_job_id and (e.worker_account_id = auth.uid() or e.employer_id = auth.uid())
  )
$$;

alter table public.accounts enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.municipalities enable row level security;
alter table public.barangays enable row level security;
alter table public.skill_categories enable row level security;
alter table public.skills enable row level security;
alter table public.worker_skills enable row level security;
alter table public.skill_badges enable row level security;
alter table public.learning_resources enable row level security;
alter table public.jobs enable row level security;
alter table public.job_required_skills enable row level security;
alter table public.job_applications enable row level security;
alter table public.employments enable row level security;
alter table public.employment_renewals enable row level security;
alter table public.daily_accomplishments enable row level security;
alter table public.accomplishment_photos enable row level security;
alter table public.employment_evaluations enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.fair_pay_references enable row level security;

create policy accounts_select on public.accounts for select to authenticated using (id = auth.uid() or public.is_admin());
create policy accounts_update_admin on public.accounts for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy worker_profiles_select on public.worker_profiles for select to authenticated using (
  account_id = auth.uid() or public.is_admin() or public.employer_related_to_worker(id)
);
create policy worker_profiles_update_self on public.worker_profiles for update to authenticated using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy employer_profiles_select on public.employer_profiles for select to authenticated using (account_id = auth.uid() or public.is_admin());
create policy employer_profiles_update_self on public.employer_profiles for update to authenticated using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy admin_profiles_select on public.admin_profiles for select to authenticated using (account_id = auth.uid() or public.is_admin());

create policy municipalities_select on public.municipalities for select to anon, authenticated using (true);
create policy barangays_select on public.barangays for select to anon, authenticated using (true);
create policy skill_categories_select on public.skill_categories for select to anon, authenticated using (true);
create policy skills_select on public.skills for select to anon, authenticated using (true);
create policy learning_resources_select on public.learning_resources for select to anon, authenticated using (true);
create policy fair_pay_references_select on public.fair_pay_references for select to anon, authenticated using (true);

create policy worker_skills_select on public.worker_skills for select to authenticated using (
  worker_id = public.my_worker_profile_id() or public.is_admin() or public.employer_related_to_worker(worker_id)
);
create policy worker_skills_insert_self on public.worker_skills for insert to authenticated with check (worker_id = public.my_worker_profile_id());
create policy worker_skills_update_self on public.worker_skills for update to authenticated using (worker_id = public.my_worker_profile_id()) with check (worker_id = public.my_worker_profile_id());
create policy worker_skills_delete_self on public.worker_skills for delete to authenticated using (worker_id = public.my_worker_profile_id());

create policy skill_badges_select on public.skill_badges for select to authenticated using (
  worker_id = public.my_worker_profile_id() or public.is_admin() or public.employer_related_to_worker(worker_id)
);

create policy jobs_select on public.jobs for select to anon, authenticated using (
  (status = 'published' and moderation_status in ('ok', 'under_review'))
  or employer_id = auth.uid()
  or public.is_admin()
  or public.can_view_job(id)
);
create policy jobs_insert_employer on public.jobs for insert to authenticated with check (
  employer_id = auth.uid() and public.current_account_role() = 'employer'
);
create policy jobs_update_owner on public.jobs for update to authenticated using (
  employer_id = auth.uid() or public.is_admin()
) with check (
  employer_id = auth.uid() or public.is_admin()
);

create policy job_required_skills_select on public.job_required_skills for select to anon, authenticated using (
  exists (
    select 1 from public.jobs j
    where j.id = job_id and (
      (j.status = 'published' and j.moderation_status in ('ok', 'under_review'))
      or j.employer_id = auth.uid()
      or public.is_admin()
      or public.can_view_job(j.id)
    )
  )
);
create policy job_required_skills_write_owner on public.job_required_skills for all to authenticated using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.employer_id = auth.uid() or public.is_admin()))
) with check (
  exists (select 1 from public.jobs j where j.id = job_id and (j.employer_id = auth.uid() or public.is_admin()))
);

create policy job_applications_select on public.job_applications for select to authenticated using (
  account_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
);

create policy employments_select on public.employments for select to authenticated using (
  worker_account_id = auth.uid() or employer_id = auth.uid() or public.is_admin()
);

create policy employment_renewals_select on public.employment_renewals for select to authenticated using (
  exists (
    select 1 from public.employments e
    where e.id = employment_id and (e.worker_account_id = auth.uid() or e.employer_id = auth.uid())
  ) or public.is_admin()
);

create policy daily_accomplishments_select on public.daily_accomplishments for select to authenticated using (
  exists (
    select 1 from public.employments e
    where e.id = employment_id and (e.worker_account_id = auth.uid() or e.employer_id = auth.uid())
  ) or public.is_admin()
);

create policy accomplishment_photos_select on public.accomplishment_photos for select to authenticated using (
  exists (
    select 1
    from public.daily_accomplishments da
    join public.employments e on e.id = da.employment_id
    where da.id = accomplishment_id and (e.worker_account_id = auth.uid() or e.employer_id = auth.uid())
  ) or public.is_admin()
);

create policy employment_evaluations_select on public.employment_evaluations for select to authenticated using (
  worker_id = public.my_worker_profile_id() or employer_id = auth.uid() or public.is_admin()
);

create policy notifications_select on public.notifications for select to authenticated using (account_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy reports_select on public.reports for select to authenticated using (reporter_account_id = auth.uid() or public.is_admin());

create policy moderation_actions_select on public.moderation_actions for select to authenticated using (public.is_admin());
create policy audit_logs_select on public.audit_logs for select to authenticated using (public.is_admin());

create or replace view public.jobs_public
with (security_invoker = false)
as
select
  j.id,
  j.employer_id,
  coalesce(ep.business_name, 'Employer') as employer_name,
  coalesce(ep.verification, 'unverified') as employer_verification,
  ep.logo_url as employer_logo_url,
  j.title,
  j.category,
  j.description,
  j.responsibilities,
  j.qualifications,
  j.compensation,
  j.compensation_type,
  j.positions,
  j.employment_type,
  j.start_date,
  j.end_date,
  j.municipality_id,
  m.name as municipality_name,
  j.barangay,
  j.location_text,
  j.latitude,
  j.longitude,
  j.urgency_level,
  j.working_hours,
  j.application_deadline,
  j.status,
  j.moderation_status,
  j.scam_flags,
  j.created_at,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', rs.id,
      'skillId', rs.skill_id,
      'skillName', s.name,
      'categoryName', sc.name,
      'importance', rs.importance,
      'weight', rs.weight
    ) order by case when rs.importance = 'required' then 0 else 1 end, s.name)
    from public.job_required_skills rs
    join public.skills s on s.id = rs.skill_id
    left join public.skill_categories sc on sc.id = s.category_id
    where rs.job_id = j.id
  ), '[]'::jsonb) as required_skills,
  coalesce((
    select array_agg(rs.skill_id)
    from public.job_required_skills rs
    where rs.job_id = j.id
  ), '{}'::uuid[]) as required_skill_ids
from public.jobs j
left join public.employer_profiles ep on ep.account_id = j.employer_id
left join public.municipalities m on m.id = j.municipality_id
where j.status = 'published' and j.moderation_status in ('ok', 'under_review');

create or replace view public.employer_directory
with (security_invoker = false)
as
select
  ep.id,
  ep.account_id,
  ep.business_name,
  ep.employer_type,
  ep.verification,
  ep.logo_url,
  ep.description,
  ep.municipality_id,
  m.name as municipality_name,
  ep.barangay,
  ep.created_at
from public.employer_profiles ep
left join public.municipalities m on m.id = ep.municipality_id;

grant usage on schema public to anon, authenticated;
grant select on public.jobs_public, public.employer_directory to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

create or replace function public._notify(
  p_account_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link_type text default null,
  p_link_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications(account_id, type, title, body, link_type, link_id)
  values (p_account_id, p_type, p_title, p_body, p_link_type, p_link_id);
exception when others then
  null;
end;
$$;

create or replace function public._audit(
  p_admin uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_reason text default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs(admin_account_id, action, target_type, target_id, reason, metadata)
  values (p_admin, p_action, p_target_type, p_target_id, p_reason, p_metadata);
exception when others then
  null;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'worker');
  v_full_name text := nullif(new.raw_user_meta_data->>'full_name', '');
  v_business_name text := nullif(new.raw_user_meta_data->>'business_name', '');
begin
  insert into public.accounts(id, email, role)
  values (new.id, coalesce(new.email, ''), v_role)
  on conflict (id) do nothing;

  if v_role = 'employer' then
    insert into public.employer_profiles(
      account_id, business_name, employer_type, contact_person, mobile_number,
      municipality_id, barangay, address, description
    )
    values (
      new.id,
      coalesce(v_business_name, 'Employer'),
      coalesce(nullif(new.raw_user_meta_data->>'employer_type', ''), 'individual'),
      nullif(new.raw_user_meta_data->>'contact_person', ''),
      nullif(new.raw_user_meta_data->>'mobile_number', ''),
      nullif(new.raw_user_meta_data->>'municipality_id', '')::uuid,
      nullif(new.raw_user_meta_data->>'barangay', ''),
      nullif(new.raw_user_meta_data->>'address', ''),
      nullif(new.raw_user_meta_data->>'description', '')
    )
    on conflict (account_id) do nothing;
  elsif v_role = 'admin' then
    insert into public.admin_profiles(account_id, full_name)
    values (new.id, coalesce(v_full_name, 'Administrator'))
    on conflict (account_id) do nothing;
  else
    insert into public.worker_profiles(
      account_id, full_name, mobile_number, municipality_id, barangay, bio, education
    )
    values (
      new.id,
      coalesce(v_full_name, 'Worker'),
      nullif(new.raw_user_meta_data->>'mobile_number', ''),
      nullif(new.raw_user_meta_data->>'municipality_id', '')::uuid,
      nullif(new.raw_user_meta_data->>'barangay', ''),
      nullif(new.raw_user_meta_data->>'bio', ''),
      nullif(new.raw_user_meta_data->>'education', '')
    )
    on conflict (account_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.apply_to_job(
  p_job_id uuid,
  p_message text default null,
  p_match_score double precision default 0,
  p_match_details jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_worker uuid;
  v_job public.jobs%rowtype;
  v_app public.job_applications%rowtype;
  v_name text;
begin
  if v_uid is null then
    raise exception 'You must be signed in.' using errcode = '28000';
  end if;
  select id into v_worker from public.worker_profiles where account_id = v_uid;
  if v_worker is null then
    raise exception 'Worker profile missing.';
  end if;
  select * into v_job from public.jobs where id = p_job_id;
  if not found then
    raise exception 'Job not found.';
  end if;
  if v_job.status <> 'published' or v_job.moderation_status = 'removed' then
    raise exception 'This job is no longer open for applications.';
  end if;
  if v_job.application_deadline is not null and v_job.application_deadline < now() then
    raise exception 'The application deadline for this job has passed.';
  end if;
  if exists (select 1 from public.job_applications where job_id = p_job_id and worker_id = v_worker) then
    raise exception 'You have already applied to this job.' using errcode = '23505';
  end if;

  insert into public.job_applications(job_id, worker_id, account_id, message, match_score, match_details, status)
  values (
    p_job_id,
    v_worker,
    v_uid,
    nullif(left(coalesce(p_message, ''), 1000), ''),
    coalesce(p_match_score, 0),
    p_match_details,
    'pending'
  )
  returning * into v_app;

  select full_name into v_name from public.worker_profiles where id = v_worker;
  perform public._notify(
    v_job.employer_id,
    'application_update',
    'New application received',
    format('%s applied to %s (%s%% match).', coalesce(v_name, 'A worker'), v_job.title, round(coalesce(p_match_score, 0))),
    'application',
    v_app.id::text
  );

  return to_jsonb(v_app);
end;
$$;

create or replace function public.update_application_status(
  p_application_id uuid,
  p_status text,
  p_employer_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_app public.job_applications%rowtype;
  v_job public.jobs%rowtype;
  v_emp public.employments%rowtype;
  v_start timestamptz;
  v_target integer;
  v_type text;
  v_title text;
begin
  if v_uid is null then
    raise exception 'You must be signed in.' using errcode = '28000';
  end if;
  select * into v_app from public.job_applications where id = p_application_id;
  if not found then
    raise exception 'Application not found.';
  end if;
  select * into v_job from public.jobs where id = v_app.job_id;

  if p_status = 'withdrawn' then
    if v_app.account_id <> v_uid then
      raise exception 'Forbidden.' using errcode = '42501';
    end if;
    if v_app.status = 'accepted' then
      raise exception 'Cannot withdraw an accepted application. Contact the employer.';
    end if;
    update public.job_applications set status = 'withdrawn' where id = p_application_id returning * into v_app;
    perform public._notify(v_job.employer_id, 'application_update', 'Application withdrawn', format('A worker withdrew their application for %s.', v_job.title), 'application', v_app.id::text);
    return to_jsonb(v_app);
  end if;

  if v_job.employer_id <> v_uid or public.current_account_role() <> 'employer' then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  if p_status not in ('under_review', 'shortlisted', 'accepted', 'rejected') then
    raise exception 'Invalid status.';
  end if;

  if p_status = 'accepted' and v_app.status <> 'accepted' then
    if exists (
      select 1 from public.employments
      where job_id = v_job.id and worker_id = v_app.worker_id and status in ('pending_start', 'active', 'completed')
    ) then
      raise exception 'This worker already has an active employment for this job.';
    end if;
    v_start := coalesce(v_job.start_date, now());
    v_target := case
      when v_job.end_date is null then 1
      else greatest(1, ceil(extract(epoch from (v_job.end_date - v_start)) / 86400.0)::integer)
    end;
    insert into public.employments(
      job_id, worker_id, worker_account_id, employer_id, start_date, end_date,
      agreed_compensation, compensation_type, working_hours, status, target_workdays, employment_event
    )
    values (
      v_job.id, v_app.worker_id, v_app.account_id, v_uid, v_start, v_job.end_date,
      v_job.compensation, v_job.compensation_type, v_job.working_hours, 'active', v_target, 'new_job'
    )
    returning * into v_emp;
    perform public._notify(v_app.account_id, 'offer', 'Employment offer accepted', format('You were accepted for %s. Employment is now active.', v_job.title), 'employment', v_emp.id::text);
  end if;

  update public.job_applications
  set status = p_status,
      employer_note = coalesce(p_employer_note, employer_note)
  where id = p_application_id
  returning * into v_app;

  v_type := case p_status
    when 'under_review' then 'application_update'
    when 'shortlisted' then 'shortlisted'
    when 'accepted' then 'offer'
    else 'application_update'
  end;
  v_title := case p_status
    when 'under_review' then 'Application under review'
    when 'shortlisted' then 'You were shortlisted!'
    when 'accepted' then 'Application accepted!'
    else 'Application not selected'
  end;
  perform public._notify(
    v_app.account_id,
    v_type,
    v_title,
    format('Update on your application for %s.%s', v_job.title, case when p_employer_note is null then '' else ' Note: ' || p_employer_note end),
    'application',
    v_app.id::text
  );

  return to_jsonb(v_app);
end;
$$;

create or replace function public.create_accomplishment(
  p_employment_id uuid,
  p_work_date date,
  p_tasks jsonb,
  p_description text,
  p_progress_percent integer,
  p_remarks text default null,
  p_photo_urls jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_emp public.employments%rowtype;
  v_acc public.daily_accomplishments%rowtype;
  v_photos jsonb;
begin
  select * into v_emp from public.employments where id = p_employment_id;
  if not found then
    raise exception 'Employment not found.';
  end if;
  if v_emp.worker_account_id <> v_uid then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  if v_emp.status <> 'active' then
    raise exception 'You can only submit reports for an active employment.';
  end if;
  if p_description is null or length(trim(p_description)) = 0 then
    raise exception 'A description of work is required.';
  end if;
  if p_work_date is null then
    raise exception 'Work date is required.';
  end if;
  if exists (
    select 1 from public.daily_accomplishments
    where employment_id = p_employment_id and work_date = p_work_date and status = 'pending'
  ) then
    raise exception 'You already have a pending report for this date. Wait for employer review or edit it.' using errcode = '23505';
  end if;

  insert into public.daily_accomplishments(
    employment_id, worker_account_id, work_date, tasks, description, progress_percent, remarks, status
  )
  values (
    p_employment_id,
    v_uid,
    p_work_date,
    coalesce(p_tasks, '[]'::jsonb),
    left(p_description, 2000),
    greatest(0, least(100, coalesce(p_progress_percent, 0))),
    nullif(left(coalesce(p_remarks, ''), 1000), ''),
    'pending'
  )
  returning * into v_acc;

  insert into public.accomplishment_photos(accomplishment_id, url)
  select v_acc.id, value
  from jsonb_array_elements_text(coalesce(p_photo_urls, '[]'::jsonb)) as value;

  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'url', p.url)), '[]'::jsonb)
  into v_photos
  from public.accomplishment_photos p
  where p.accomplishment_id = v_acc.id;

  return to_jsonb(v_acc) || jsonb_build_object('photos', v_photos);
end;
$$;

create or replace function public.review_accomplishment(
  p_accomplishment_id uuid,
  p_decision text,
  p_feedback text default null,
  p_rejection_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_acc public.daily_accomplishments%rowtype;
  v_emp public.employments%rowtype;
  v_rs public.job_required_skills%rowtype;
  v_ws public.worker_skills%rowtype;
  v_new_count integer;
  v_level text;
  v_approved integer;
  v_photos jsonb;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision.';
  end if;
  select * into v_acc from public.daily_accomplishments where id = p_accomplishment_id;
  if not found then
    raise exception 'Report not found.';
  end if;
  select * into v_emp from public.employments where id = v_acc.employment_id;
  if v_emp.employer_id <> v_uid then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  if v_acc.status <> 'pending' then
    raise exception 'This report has already been reviewed.';
  end if;
  if p_decision = 'rejected' and (p_rejection_reason is null or length(trim(p_rejection_reason)) = 0) then
    raise exception 'A rejection reason is required.';
  end if;

  update public.daily_accomplishments
  set status = p_decision,
      employer_feedback = nullif(left(coalesce(p_feedback, ''), 1000), ''),
      rejection_reason = case when p_decision = 'rejected' then left(p_rejection_reason, 1000) else null end,
      reviewed_at = now()
  where id = p_accomplishment_id
  returning * into v_acc;

  if p_decision = 'approved' then
    for v_rs in select * from public.job_required_skills where job_id = v_emp.job_id loop
      select * into v_ws from public.worker_skills where worker_id = v_emp.worker_id and skill_id = v_rs.skill_id;
      if found then
        v_new_count := v_ws.verified_job_count + 1;
        v_level := case
          when v_ws.level = 'self_declared' then 'verified_experience'
          when v_ws.level = 'verified_experience' and v_new_count >= 3 then 'repeatedly_demonstrated'
          else v_ws.level
        end;
        update public.worker_skills
        set verified_job_count = v_new_count, level = v_level
        where id = v_ws.id;
        if v_new_count >= 4 then
          insert into public.skill_badges(worker_id, skill_id, badge)
          values (v_emp.worker_id, v_rs.skill_id, 'mastery')
          on conflict (worker_id, skill_id, badge) do nothing;
        end if;
      else
        insert into public.worker_skills(worker_id, skill_id, level, verified_job_count, experience_level)
        values (v_emp.worker_id, v_rs.skill_id, 'verified_experience', 1, 'intermediate')
        on conflict (worker_id, skill_id) do nothing;
        insert into public.skill_badges(worker_id, skill_id, badge)
        values (v_emp.worker_id, v_rs.skill_id, 'verified_worker')
        on conflict (worker_id, skill_id, badge) do nothing;
      end if;
    end loop;

    select count(*) into v_approved
    from public.daily_accomplishments
    where employment_id = v_acc.employment_id and status = 'approved';

    select * into v_emp from public.employments where id = v_acc.employment_id;
    if v_approved >= v_emp.target_workdays and v_emp.status = 'active' then
      update public.employments set status = 'completed', end_date = now() where id = v_emp.id;
      perform public._notify(v_emp.worker_account_id, 'accomplishment_review', 'Employment completed', 'Your employment has reached its target workdays and is marked completed.', 'employment', v_emp.id::text);
    end if;
  end if;

  perform public._notify(
    v_emp.worker_account_id,
    'accomplishment_review',
    case when p_decision = 'approved' then 'Report approved' else 'Report rejected' end,
    case when p_decision = 'approved' then 'Your accomplishment report was approved by your employer.' else 'Your accomplishment report was rejected. Reason: ' || coalesce(p_rejection_reason, '') end,
    'employment',
    v_emp.id::text
  );

  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'url', p.url)), '[]'::jsonb)
  into v_photos
  from public.accomplishment_photos p
  where p.accomplishment_id = v_acc.id;

  return to_jsonb(v_acc) || jsonb_build_object('photos', v_photos);
end;
$$;

create or replace function public.create_renewal(
  p_employment_id uuid,
  p_proposed_extension text,
  p_new_end_date timestamptz,
  p_compensation_terms text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_emp public.employments%rowtype;
  v_job public.jobs%rowtype;
  v_renewal public.employment_renewals%rowtype;
begin
  select * into v_emp from public.employments where id = p_employment_id;
  if not found then
    raise exception 'Employment not found.';
  end if;
  if v_emp.employer_id <> v_uid then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  if v_emp.status in ('completed', 'terminated') then
    raise exception 'Cannot renew a completed or terminated employment.';
  end if;
  if p_proposed_extension not in ('1_day', 'several_days', '1_month', 'contractual', 'job_order') then
    raise exception 'Invalid extension type.';
  end if;
  if p_new_end_date is null then
    raise exception 'New end date is required.';
  end if;
  if p_compensation_terms is null or length(trim(p_compensation_terms)) = 0 then
    raise exception 'Compensation terms are required.';
  end if;
  if exists (select 1 from public.employment_renewals where employment_id = p_employment_id and status = 'pending') then
    raise exception 'There is already a pending renewal request for this employment.' using errcode = '23505';
  end if;

  insert into public.employment_renewals(
    employment_id, requester_account_id, proposed_extension, new_end_date, compensation_terms, reason, status
  )
  values (
    p_employment_id, v_uid, p_proposed_extension, p_new_end_date, p_compensation_terms,
    nullif(p_reason, ''), 'pending'
  )
  returning * into v_renewal;

  select * into v_job from public.jobs where id = v_emp.job_id;
  perform public._notify(
    v_emp.worker_account_id,
    'renewal_request',
    'Renewal request received',
    format('Your employer proposed an extension (%s) for %s.', replace(p_proposed_extension, '_', ' '), coalesce(v_job.title, 'your employment')),
    'employment',
    p_employment_id::text
  );

  return to_jsonb(v_renewal);
end;
$$;

create or replace function public.respond_renewal(
  p_employment_id uuid,
  p_renewal_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_renewal public.employment_renewals%rowtype;
  v_emp public.employments%rowtype;
  v_job public.jobs%rowtype;
  v_target integer;
begin
  if p_decision not in ('accepted', 'declined') then
    raise exception 'Invalid decision.';
  end if;
  select * into v_renewal from public.employment_renewals where id = p_renewal_id;
  if not found then
    raise exception 'Renewal request not found.';
  end if;
  if v_renewal.employment_id <> p_employment_id then
    raise exception 'Renewal does not belong to this employment.';
  end if;
  select * into v_emp from public.employments where id = p_employment_id;
  if v_emp.worker_account_id <> v_uid then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  if v_renewal.status <> 'pending' then
    raise exception 'This renewal request has already been resolved.';
  end if;

  update public.employment_renewals
  set status = p_decision, responded_at = now()
  where id = p_renewal_id
  returning * into v_renewal;

  select * into v_job from public.jobs where id = v_emp.job_id;

  if p_decision = 'accepted' then
    v_target := greatest(
      v_emp.target_workdays,
      ceil(extract(epoch from (v_renewal.new_end_date - v_emp.start_date)) / 86400.0)::integer
    );
    update public.employments
    set end_date = v_renewal.new_end_date, status = 'active', target_workdays = v_target
    where id = v_emp.id;
    perform public._notify(
      v_emp.employer_id,
      'renewal_request',
      'Renewal accepted',
      format('Your worker accepted the renewal for %s. Employment extended to %s.', coalesce(v_job.title, 'the employment'), to_char(v_renewal.new_end_date, 'Mon DD, YYYY')),
      'employment',
      v_emp.id::text
    );
  else
    perform public._notify(
      v_emp.employer_id,
      'renewal_request',
      'Renewal declined',
      format('Your worker declined the renewal for %s.', coalesce(v_job.title, 'the employment')),
      'employment',
      v_emp.id::text
    );
  end if;

  return to_jsonb(v_renewal);
end;
$$;

create or replace function public.create_evaluation(
  p_employment_id uuid,
  p_rating integer,
  p_comment text default null,
  p_punctuality integer default null,
  p_quality integer default null,
  p_attitude integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_emp public.employments%rowtype;
  v_eval public.employment_evaluations%rowtype;
  v_rs public.job_required_skills%rowtype;
  v_ws public.worker_skills%rowtype;
  v_new_count integer;
  v_new_sum integer;
  v_level text;
begin
  select * into v_emp from public.employments where id = p_employment_id;
  if not found then
    raise exception 'Employment not found.';
  end if;
  if v_emp.employer_id <> v_uid then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5.';
  end if;
  if exists (select 1 from public.employment_evaluations where employment_id = p_employment_id and employer_id = v_uid) then
    raise exception 'You have already evaluated this employment.' using errcode = '23505';
  end if;

  insert into public.employment_evaluations(
    employment_id, worker_id, employer_id, rating, comment, punctuality, quality, attitude
  )
  values (
    p_employment_id, v_emp.worker_id, v_uid, p_rating,
    nullif(left(coalesce(p_comment, ''), 1000), ''), p_punctuality, p_quality, p_attitude
  )
  returning * into v_eval;

  for v_rs in select * from public.job_required_skills where job_id = v_emp.job_id loop
    select * into v_ws from public.worker_skills where worker_id = v_emp.worker_id and skill_id = v_rs.skill_id;
    if found then
      v_new_count := v_ws.total_rating_count + 1;
      v_new_sum := v_ws.total_rating_sum + p_rating;
      v_level := v_ws.level;
      if v_ws.level = 'repeatedly_demonstrated' and v_new_count >= 3 and (v_new_sum::numeric / v_new_count) >= 4.5 then
        v_level := 'highly_rated';
        insert into public.skill_badges(worker_id, skill_id, badge)
        values (v_emp.worker_id, v_rs.skill_id, 'top_rated')
        on conflict (worker_id, skill_id, badge) do nothing;
      end if;
      update public.worker_skills
      set total_rating_sum = v_new_sum, total_rating_count = v_new_count, level = v_level
      where id = v_ws.id;
    end if;
  end loop;

  perform public._notify(
    v_emp.worker_account_id,
    'report_update',
    'New employer evaluation',
    format('Your employer rated your work %s/5.', p_rating),
    'employment',
    v_emp.id::text
  );

  return to_jsonb(v_eval);
end;
$$;

create or replace function public.create_report(
  p_reason text,
  p_description text,
  p_target_account_id uuid default null,
  p_target_job_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_report public.reports%rowtype;
begin
  if v_uid is null then
    raise exception 'You must be signed in.' using errcode = '28000';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 or p_description is null or length(trim(p_description)) = 0 then
    raise exception 'Reason and description are required.';
  end if;
  if p_target_account_id is null and p_target_job_id is null then
    raise exception 'A target account or job is required.';
  end if;
  insert into public.reports(reporter_account_id, target_account_id, target_job_id, reason, description, status)
  values (v_uid, p_target_account_id, p_target_job_id, p_reason, left(p_description, 2000), 'open')
  returning * into v_report;
  return to_jsonb(v_report);
end;
$$;

create or replace function public.review_report(
  p_report_id uuid,
  p_status text,
  p_resolution_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_report public.reports%rowtype;
  v_prev text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  if p_status not in ('open', 'under_review', 'resolved', 'dismissed') then
    raise exception 'Invalid status.';
  end if;
  select * into v_report from public.reports where id = p_report_id;
  if not found then
    raise exception 'Report not found.';
  end if;
  v_prev := v_report.status;
  update public.reports
  set status = p_status, resolution_note = coalesce(p_resolution_note, resolution_note)
  where id = p_report_id
  returning * into v_report;

  insert into public.moderation_actions(admin_account_id, action, target_type, target_id, reason, previous_status, new_status)
  values (
    v_uid,
    case when p_status = 'resolved' then 'resolve_report' when p_status = 'dismissed' then 'dismiss_report' else 'review_report' end,
    'report', p_report_id, p_resolution_note, v_prev, p_status
  );
  perform public._audit(v_uid, 'update_report', 'report', p_report_id, p_resolution_note, jsonb_build_object('from', v_prev, 'to', p_status));
  perform public._notify(
    v_report.reporter_account_id,
    'report_update',
    'Report update',
    format('Your report was marked as %s.%s', p_status, case when p_resolution_note is null then '' else ' ' || p_resolution_note end),
    'report',
    p_report_id::text
  );

  return to_jsonb(v_report);
end;
$$;

create or replace function public.admin_job_action(
  p_job_id uuid,
  p_action text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_job public.jobs%rowtype;
  v_prev text;
  v_new text;
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  select * into v_job from public.jobs where id = p_job_id;
  if not found then
    raise exception 'Job not found.';
  end if;
  v_prev := v_job.moderation_status;
  v_new := case p_action
    when 'remove' then 'removed'
    when 'flag' then 'flagged'
    when 'under_review' then 'under_review'
    when 'restore' then 'ok'
    else null
  end;
  if v_new is null then
    raise exception 'Invalid action.';
  end if;
  v_status := case
    when p_action = 'remove' then 'removed'
    when v_job.status = 'removed' then 'published'
    else v_job.status
  end;

  update public.jobs
  set moderation_status = v_new, moderation_note = p_reason, status = v_status
  where id = p_job_id
  returning * into v_job;

  insert into public.moderation_actions(admin_account_id, action, target_type, target_id, reason, previous_status, new_status)
  values (
    v_uid,
    case when p_action = 'remove' then 'remove_job' when p_action = 'restore' then 'restore_job' else 'flag_job' end,
    'job', p_job_id, p_reason, v_prev, v_new
  );
  perform public._audit(v_uid, p_action, 'job', p_job_id, p_reason, jsonb_build_object('from', v_prev, 'to', v_new));
  perform public._notify(
    v_job.employer_id,
    'report_update',
    case when p_action = 'remove' then 'Job removed by moderation' when p_action = 'restore' then 'Job restored' else 'Job flagged for review' end,
    case when p_reason is null then 'Your job was reviewed by moderators.' else 'Reason: ' || p_reason end,
    'job',
    p_job_id::text
  );

  return to_jsonb(v_job);
end;
$$;

create or replace function public.admin_user_action(
  p_user_id uuid,
  p_action text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_target public.accounts%rowtype;
  v_ep public.employer_profiles%rowtype;
  v_prev text;
  v_new text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  select * into v_target from public.accounts where id = p_user_id;
  if not found then
    raise exception 'User not found.';
  end if;
  if v_target.role = 'admin' then
    raise exception 'Cannot moderate administrator accounts.';
  end if;
  select * into v_ep from public.employer_profiles where account_id = p_user_id;
  v_prev := v_target.status;
  v_new := v_target.status;

  if p_action = 'suspend' then
    v_new := 'suspended';
    update public.accounts set status = 'suspended', suspend_reason = nullif(left(coalesce(p_reason, ''), 1000), '') where id = p_user_id;
    if found and v_ep.id is not null then
      update public.employer_profiles set verification = 'suspended' where id = v_ep.id;
    end if;
  elsif p_action = 'restore' then
    v_new := 'active';
    update public.accounts set status = 'active', suspend_reason = null where id = p_user_id;
    if v_ep.id is not null and v_ep.verification = 'suspended' then
      update public.employer_profiles set verification = 'unverified' where id = v_ep.id;
    end if;
  elsif p_action = 'verify' and v_ep.id is not null then
    update public.employer_profiles set verification = 'verified', verification_note = p_reason where id = v_ep.id;
    perform public._notify(p_user_id, 'report_update', 'Verification approved', 'Your employer account has been verified.', 'account', p_user_id::text);
  elsif p_action = 'unverify' and v_ep.id is not null then
    update public.employer_profiles set verification = 'unverified' where id = v_ep.id;
  else
    raise exception 'Invalid action.';
  end if;

  insert into public.moderation_actions(admin_account_id, action, target_type, target_id, reason, previous_status, new_status)
  values (v_uid, p_action, 'account', p_user_id, p_reason, v_prev, v_new);
  perform public._audit(v_uid, p_action, 'account', p_user_id, p_reason, jsonb_build_object('from', v_prev, 'to', v_new));

  if p_action in ('suspend', 'restore') then
    perform public._notify(
      p_user_id,
      'report_update',
      case when p_action = 'suspend' then 'Account suspended' else 'Account restored' end,
      case when p_reason is null then 'Your account status was updated by moderation.' else 'Reason: ' || p_reason end,
      'account',
      p_user_id::text
    );
  end if;

  return to_jsonb(v_target);
end;
$$;

create or replace function public.submit_verification(
  p_document_urls jsonb,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ep public.employer_profiles%rowtype;
  v_admin record;
begin
  select * into v_ep from public.employer_profiles where account_id = v_uid;
  if not found then
    raise exception 'Employer profile missing.';
  end if;
  if v_ep.verification = 'verified' then
    raise exception 'Your account is already verified.';
  end if;
  if v_ep.verification = 'pending' then
    raise exception 'Your verification request is already under review.' using errcode = '23505';
  end if;
  if p_document_urls is null or jsonb_array_length(p_document_urls) = 0 then
    raise exception 'Please attach at least one supporting document.';
  end if;
  update public.employer_profiles
  set verification = 'pending',
      verification_note = nullif(left(coalesce(p_note, ''), 1000), ''),
      document_urls = p_document_urls
  where id = v_ep.id
  returning * into v_ep;

  for v_admin in select id from public.accounts where role = 'admin' and status = 'active' loop
    perform public._notify(v_admin.id, 'report_update', 'Verification request submitted', format('%s submitted documents for verification.', v_ep.business_name), 'account', v_uid::text);
  end loop;

  return to_jsonb(v_ep);
end;
$$;

create or replace function public.create_job(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_job public.jobs%rowtype;
  v_skill jsonb;
begin
  if v_uid is null or public.current_account_role() <> 'employer' then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  if nullif(p_payload->>'title', '') is null or nullif(p_payload->>'description', '') is null or nullif(p_payload->>'category', '') is null then
    raise exception 'Title, description and category are required.';
  end if;
  if coalesce((p_payload->>'compensation')::numeric, 0) <= 0 then
    raise exception 'Valid compensation is required.';
  end if;

  insert into public.jobs(
    employer_id, title, category, description, responsibilities, qualifications, compensation,
    compensation_type, positions, employment_type, start_date, end_date, municipality_id, barangay,
    location_text, latitude, longitude, urgency_level, working_hours, application_deadline, status, scam_flags
  )
  values (
    v_uid,
    trim(p_payload->>'title'),
    p_payload->>'category',
    trim(p_payload->>'description'),
    coalesce(p_payload->'responsibilities', '[]'::jsonb),
    coalesce(p_payload->'qualifications', '[]'::jsonb),
    (p_payload->>'compensation')::numeric,
    coalesce(nullif(p_payload->>'compensation_type', ''), 'daily'),
    greatest(1, coalesce((p_payload->>'positions')::integer, 1)),
    coalesce(nullif(p_payload->>'employment_type', ''), 'regular'),
    nullif(p_payload->>'start_date', '')::timestamptz,
    nullif(p_payload->>'end_date', '')::timestamptz,
    nullif(p_payload->>'municipality_id', '')::uuid,
    nullif(p_payload->>'barangay', ''),
    nullif(p_payload->>'location_text', ''),
    nullif(p_payload->>'latitude', '')::double precision,
    nullif(p_payload->>'longitude', '')::double precision,
    coalesce(nullif(p_payload->>'urgency_level', ''), 'normal'),
    nullif(p_payload->>'working_hours', ''),
    nullif(p_payload->>'application_deadline', '')::timestamptz,
    case when p_payload->>'status' = 'published' then 'published' else 'draft' end,
    coalesce(p_payload->'scam_flags', '[]'::jsonb)
  )
  returning * into v_job;

  for v_skill in select * from jsonb_array_elements(coalesce(p_payload->'required_skills', '[]'::jsonb)) loop
    if nullif(v_skill->>'skill_id', '') is not null then
      insert into public.job_required_skills(job_id, skill_id, importance, weight)
      values (
        v_job.id,
        (v_skill->>'skill_id')::uuid,
        case when v_skill->>'importance' = 'preferred' then 'preferred' else 'required' end,
        coalesce((v_skill->>'weight')::double precision, 1)
      )
      on conflict (job_id, skill_id) do nothing;
    end if;
  end loop;

  if v_job.status = 'published' and v_job.urgency_level in ('urgent', 'critical') and v_job.municipality_id is not null then
    insert into public.notifications(account_id, type, title, body, link_type, link_id)
    select wp.account_id, 'urgent_job', 'Urgent job nearby', format('%s was posted as %s.', v_job.title, v_job.urgency_level), 'job', v_job.id::text
    from public.worker_profiles wp
    where wp.municipality_id = v_job.municipality_id
    limit 200;
  end if;

  return to_jsonb(v_job);
end;
$$;

create or replace function public.update_job(p_job_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_job public.jobs%rowtype;
  v_skill jsonb;
begin
  select * into v_job from public.jobs where id = p_job_id;
  if not found then
    raise exception 'Job not found.';
  end if;
  if v_job.employer_id <> v_uid and not public.is_admin() then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;

  update public.jobs
  set title = case when p_payload ? 'title' then p_payload->>'title' else title end,
      category = case when p_payload ? 'category' then p_payload->>'category' else category end,
      description = case when p_payload ? 'description' then p_payload->>'description' else description end,
      responsibilities = case when p_payload ? 'responsibilities' then p_payload->'responsibilities' else responsibilities end,
      qualifications = case when p_payload ? 'qualifications' then p_payload->'qualifications' else qualifications end,
      compensation = case when p_payload ? 'compensation' then (p_payload->>'compensation')::numeric else compensation end,
      compensation_type = case when p_payload ? 'compensation_type' then p_payload->>'compensation_type' else compensation_type end,
      positions = case when p_payload ? 'positions' then (p_payload->>'positions')::integer else positions end,
      employment_type = case when p_payload ? 'employment_type' then p_payload->>'employment_type' else employment_type end,
      start_date = case when p_payload ? 'start_date' then nullif(p_payload->>'start_date', '')::timestamptz else start_date end,
      end_date = case when p_payload ? 'end_date' then nullif(p_payload->>'end_date', '')::timestamptz else end_date end,
      municipality_id = case when p_payload ? 'municipality_id' then nullif(p_payload->>'municipality_id', '')::uuid else municipality_id end,
      barangay = case when p_payload ? 'barangay' then nullif(p_payload->>'barangay', '') else barangay end,
      location_text = case when p_payload ? 'location_text' then nullif(p_payload->>'location_text', '') else location_text end,
      latitude = case when p_payload ? 'latitude' then nullif(p_payload->>'latitude', '')::double precision else latitude end,
      longitude = case when p_payload ? 'longitude' then nullif(p_payload->>'longitude', '')::double precision else longitude end,
      urgency_level = case when p_payload ? 'urgency_level' then p_payload->>'urgency_level' else urgency_level end,
      working_hours = case when p_payload ? 'working_hours' then nullif(p_payload->>'working_hours', '') else working_hours end,
      application_deadline = case when p_payload ? 'application_deadline' then nullif(p_payload->>'application_deadline', '')::timestamptz else application_deadline end,
      status = case when p_payload ? 'status' then p_payload->>'status' else status end,
      moderation_status = case when p_payload ? 'moderation_status' and public.is_admin() then p_payload->>'moderation_status' else moderation_status end
  where id = p_job_id
  returning * into v_job;

  if p_payload ? 'required_skills' then
    delete from public.job_required_skills where job_id = p_job_id;
    for v_skill in select * from jsonb_array_elements(coalesce(p_payload->'required_skills', '[]'::jsonb)) loop
      if nullif(v_skill->>'skill_id', '') is not null then
        insert into public.job_required_skills(job_id, skill_id, importance, weight)
        values (
          p_job_id,
          (v_skill->>'skill_id')::uuid,
          case when v_skill->>'importance' = 'preferred' then 'preferred' else 'required' end,
          coalesce((v_skill->>'weight')::double precision, 1)
        )
        on conflict (job_id, skill_id) do nothing;
      end if;
    end loop;
  end if;

  return to_jsonb(v_job);
end;
$$;

create or replace function public.update_employment(p_employment_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_emp public.employments%rowtype;
  v_status text;
begin
  select * into v_emp from public.employments where id = p_employment_id;
  if not found then
    raise exception 'Employment not found.';
  end if;
  if v_emp.employer_id <> v_uid and v_emp.worker_account_id <> v_uid and not public.is_admin() then
    raise exception 'Forbidden.' using errcode = '42501';
  end if;
  v_status := nullif(p_payload->>'status', '');
  if v_status = 'completed' and v_emp.employer_id <> v_uid and not public.is_admin() then
    raise exception 'Only the employer can mark employment completed.' using errcode = '42501';
  end if;

  update public.employments
  set status = coalesce(v_status, status),
      end_date = case when p_payload ? 'end_date' then nullif(p_payload->>'end_date', '')::timestamptz else end_date end,
      target_workdays = case when p_payload ? 'target_workdays' then greatest(1, (p_payload->>'target_workdays')::integer) else target_workdays end
  where id = p_employment_id
  returning * into v_emp;

  return to_jsonb(v_emp);
end;
$$;

create or replace function public.get_passport(p_worker_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'workerId', wp.id,
    'workerName', wp.full_name,
    'photoUrl', wp.photo_url,
    'municipalityName', m.name,
    'barangay', wp.barangay,
    'bio', wp.bio,
    'skills', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ws.id,
        'skillId', ws.skill_id,
        'skillName', s.name,
        'categoryName', sc.name,
        'level', ws.level,
        'yearsExperience', ws.years_experience,
        'experienceLevel', ws.experience_level,
        'notes', ws.notes,
        'verifiedJobCount', ws.verified_job_count,
        'totalRatingCount', ws.total_rating_count,
        'avgRating', case when ws.total_rating_count > 0 then round(ws.total_rating_sum::numeric / ws.total_rating_count, 1) else null end,
        'badges', coalesce((select jsonb_agg(b.badge) from public.skill_badges b where b.worker_id = wp.id and b.skill_id = ws.skill_id), '[]'::jsonb)
      ) order by s.name)
      from public.worker_skills ws
      join public.skills s on s.id = ws.skill_id
      left join public.skill_categories sc on sc.id = s.category_id
      where ws.worker_id = wp.id
    ), '[]'::jsonb),
    'completedJobs', (select count(*) from public.employments e where e.worker_id = wp.id and e.status = 'completed'),
    'totalWorkdays', (
      select count(*) from public.daily_accomplishments da
      join public.employments e on e.id = da.employment_id
      where e.worker_id = wp.id and da.status = 'approved'
    ),
    'evaluations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ev.id,
        'employerName', coalesce(ep.business_name, 'Employer'),
        'rating', ev.rating,
        'comment', ev.comment,
        'jobTitle', coalesce(j.title, 'Employment'),
        'createdAt', ev.created_at
      ) order by ev.created_at desc)
      from public.employment_evaluations ev
      join public.employments e on e.id = ev.employment_id
      left join public.jobs j on j.id = e.job_id
      left join public.employer_profiles ep on ep.account_id = ev.employer_id
      where ev.worker_id = wp.id
    ), '[]'::jsonb),
    'employmentHistory', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'employerName', coalesce(ep.business_name, 'Employer'),
        'jobTitle', coalesce(j.title, 'Employment'),
        'startDate', e.start_date,
        'endDate', e.end_date,
        'status', e.status,
        'employmentEvent', e.employment_event,
        'approvedWorkdays', (select count(*) from public.daily_accomplishments da where da.employment_id = e.id and da.status = 'approved')
      ) order by e.start_date asc)
      from public.employments e
      left join public.jobs j on j.id = e.job_id
      left join public.employer_profiles ep on ep.account_id = e.employer_id
      where e.worker_id = wp.id
    ), '[]'::jsonb),
    'badges', coalesce((
      select jsonb_agg(jsonb_build_object('skillName', s.name, 'badge', b.badge, 'earnedAt', b.earned_at))
      from public.skill_badges b
      join public.skills s on s.id = b.skill_id
      where b.worker_id = wp.id
    ), '[]'::jsonb)
  )
  from public.worker_profiles wp
  left join public.municipalities m on m.id = wp.municipality_id
  where wp.id = p_worker_id
$$;

create or replace function public.admin_overview()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'workers', (select count(*) from public.worker_profiles),
    'employers', (select count(*) from public.employer_profiles),
    'admins', (select count(*) from public.admin_profiles),
    'publishedJobs', (select count(*) from public.jobs where status = 'published'),
    'applications', (select count(*) from public.job_applications),
    'pendingReports', (select count(*) from public.reports where status = 'open'),
    'suspendedAccounts', (select count(*) from public.accounts where status = 'suspended'),
    'completedEmployments', (select count(*) from public.employments where status = 'completed')
  )
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
on conflict (id) do update set public = true;

drop policy if exists uploads_public_read on storage.objects;
create policy uploads_public_read on storage.objects for select using (bucket_id = 'uploads');

drop policy if exists uploads_auth_insert on storage.objects;
create policy uploads_auth_insert on storage.objects for insert to authenticated with check (bucket_id = 'uploads');

drop policy if exists uploads_auth_update on storage.objects;
create policy uploads_auth_update on storage.objects for update to authenticated using (bucket_id = 'uploads') with check (bucket_id = 'uploads');

drop policy if exists uploads_auth_delete on storage.objects;
create policy uploads_auth_delete on storage.objects for delete to authenticated using (bucket_id = 'uploads');

grant execute on function public.apply_to_job(uuid, text, double precision, jsonb) to authenticated;
grant execute on function public.update_application_status(uuid, text, text) to authenticated;
grant execute on function public.create_accomplishment(uuid, date, jsonb, text, integer, text, jsonb) to authenticated;
grant execute on function public.review_accomplishment(uuid, text, text, text) to authenticated;
grant execute on function public.create_renewal(uuid, text, timestamptz, text, text) to authenticated;
grant execute on function public.respond_renewal(uuid, uuid, text) to authenticated;
grant execute on function public.create_evaluation(uuid, integer, text, integer, integer, integer) to authenticated;
grant execute on function public.create_report(text, text, uuid, uuid) to authenticated;
grant execute on function public.review_report(uuid, text, text) to authenticated;
grant execute on function public.admin_job_action(uuid, text, text) to authenticated;
grant execute on function public.admin_user_action(uuid, text, text) to authenticated;
grant execute on function public.submit_verification(jsonb, text) to authenticated;
grant execute on function public.create_job(jsonb) to authenticated;
grant execute on function public.update_job(uuid, jsonb) to authenticated;
grant execute on function public.update_employment(uuid, jsonb) to authenticated;
grant execute on function public.get_passport(uuid) to anon, authenticated;
grant execute on function public.admin_overview() to authenticated;
