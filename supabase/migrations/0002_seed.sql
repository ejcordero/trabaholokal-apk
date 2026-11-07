delete from public.accomplishment_photos
where accomplishment_id in (
  select da.id from public.daily_accomplishments da
  where da.worker_account_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  )
);

delete from public.daily_accomplishments
where worker_account_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
) or employment_id in (
  select id from public.employments
  where employer_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  ) or worker_account_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  )
);

delete from public.employment_evaluations
where employer_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
) or worker_id in (
  select id from public.worker_profiles
  where account_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  )
);

delete from public.employment_renewals
where employment_id in (
  select id from public.employments
  where employer_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  ) or worker_account_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  )
);

delete from public.employments
where employer_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
) or worker_account_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
);

delete from public.notifications
where account_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
);

delete from public.moderation_actions
where admin_account_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
);

delete from public.audit_logs
where admin_account_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
);

delete from public.reports
where reporter_account_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
) or target_account_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
);

delete from public.job_applications
where account_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
) or job_id in (
  select id from public.jobs
  where employer_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  )
);

delete from public.job_required_skills
where job_id in (
  select id from public.jobs
  where employer_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  )
);

delete from public.jobs
where employer_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
);

delete from public.skill_badges
where worker_id in (
  select id from public.worker_profiles
  where account_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  )
);

delete from public.worker_skills
where worker_id in (
  select id from public.worker_profiles
  where account_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  )
);

delete from public.accounts
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
);

delete from auth.users
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'admin@trabaho.lokal',
  extensions.crypt('admin123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"admin","full_name":"Platform Administrator"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-4222-8222-222222222222',
  'authenticated',
  'authenticated',
  'builds@trabaho.lokal',
  extensions.crypt('employer123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"employer","business_name":"BuildRight Construction","employer_type":"contractor","contact_person":"Maria Santos","mobile_number":"09171234567","barangay":"San Juan","address":"12 Rizal St, San Juan, Cainta, Rizal","description":"Local construction contractor for residential and small commercial projects."}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-4333-8333-333333333333',
  'authenticated',
  'authenticated',
  'juan@trabaho.lokal',
  extensions.crypt('worker123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"worker","full_name":"Juan dela Cruz","mobile_number":"09185551234","barangay":"San Isidro","bio":"Hardworking local laborer with construction experience.","education":"High School (incomplete)"}'::jsonb,
  now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u
where u.id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
)
on conflict (provider_id, provider) do nothing;

insert into public.municipalities (name, province, latitude, longitude)
values
  ('Cainta', 'Rizal', 14.5669, 121.1222),
  ('Antipolo', 'Rizal', 14.5722, 121.1722),
  ('Marikina', 'Metro Manila', 14.6503, 121.1029),
  ('Pasig', 'Metro Manila', 14.5764, 121.0851),
  ('Taguig', 'Metro Manila', 14.5176, 121.0509),
  ('Quezon City', 'Metro Manila', 14.6760, 121.0437),
  ('Makati', 'Metro Manila', 14.5547, 121.0244),
  ('San Juan', 'Metro Manila', 14.6019, 121.0294)
on conflict (name) do nothing;

insert into public.barangays (municipality_id, name)
select m.id, b.name
from (
  values
    ('Cainta', 'San Juan'),
    ('Cainta', 'San Isidro'),
    ('Cainta', 'Santo Domingo'),
    ('Antipolo', 'San Roque'),
    ('Antipolo', 'San Jose'),
    ('Antipolo', 'San Isidro'),
    ('Marikina', 'Concepcion'),
    ('Pasig', 'Pinagbuhatan'),
    ('Taguig', 'Signal Village'),
    ('Quezon City', 'Batasan Hills'),
    ('Makati', 'Poblacion'),
    ('San Juan', 'Greenhills')
) as b(municipality, name)
join public.municipalities m on m.name = b.municipality
on conflict (municipality_id, name) do nothing;

update public.worker_profiles
set full_name = 'Juan dela Cruz',
    mobile_number = '09185551234',
    municipality_id = (select id from public.municipalities where name = 'Cainta'),
    barangay = 'San Isidro',
    latitude = 14.57,
    longitude = 121.12,
    bio = 'Hardworking local laborer with construction experience.',
    education = 'High School (incomplete)',
    preferred_categories = '["construction","general_labor"]'::jsonb,
    preferred_distance_km = 15,
    available = true
where account_id = '33333333-3333-4333-8333-333333333333';

update public.employer_profiles
set business_name = 'BuildRight Construction',
    employer_type = 'contractor',
    contact_person = 'Maria Santos',
    mobile_number = '09171234567',
    municipality_id = (select id from public.municipalities where name = 'Cainta'),
    barangay = 'San Juan',
    address = '12 Rizal St, San Juan, Cainta, Rizal',
    description = 'Local construction contractor for residential and small commercial projects.',
    verification = 'verified'
where account_id = '22222222-2222-4222-8222-222222222222';

update public.admin_profiles
set full_name = 'Platform Administrator'
where account_id = '11111111-1111-4111-8111-111111111111';

insert into public.skill_categories (name)
values
  ('Construction'),
  ('Agriculture'),
  ('Electrical'),
  ('Plumbing'),
  ('Automotive'),
  ('Domestic Services'),
  ('Food and Hospitality'),
  ('Retail'),
  ('Office and Administration'),
  ('Technology'),
  ('General Labor'),
  ('Other')
on conflict (name) do nothing;

insert into public.skills (name, category_id)
select v.name, c.id
from (
  values
    ('Masonry', 'Construction'),
    ('Carpentry', 'Construction'),
    ('Tile Installation', 'Construction'),
    ('Painting', 'Construction'),
    ('Welding', 'Construction'),
    ('Concrete Mixing', 'Construction'),
    ('Farming', 'Agriculture'),
    ('Planting', 'Agriculture'),
    ('Harvesting', 'Agriculture'),
    ('Animal Husbandry', 'Agriculture'),
    ('Electrical Wiring', 'Electrical'),
    ('Electrical Repair', 'Electrical'),
    ('Pipe Fitting', 'Plumbing'),
    ('Plumbing Repair', 'Plumbing'),
    ('Auto Mechanic', 'Automotive'),
    ('Engine Repair', 'Automotive'),
    ('Housekeeping', 'Domestic Services'),
    ('Cooking', 'Domestic Services'),
    ('Laundry', 'Domestic Services'),
    ('Food Service', 'Food and Hospitality'),
    ('Bartending', 'Food and Hospitality'),
    ('Cashier', 'Retail'),
    ('Merchandising', 'Retail'),
    ('Data Entry', 'Office and Administration'),
    ('Bookkeeping', 'Office and Administration'),
    ('Basic Computer', 'Technology'),
    ('General Labor', 'General Labor'),
    ('Heavy Lifting', 'General Labor'),
    ('Loading', 'General Labor')
) as v(name, category)
join public.skill_categories c on c.name = v.category
on conflict (name) do nothing;

insert into public.learning_resources (skill_id, title, provider, url, type, accredited)
select s.id, r.title, r.provider, r.url, 'article', false
from (
  values
    ('Masonry', 'Basic Masonry Tutorial', 'Free Online', 'https://example.com/masonry'),
    ('Carpentry', 'Carpentry Fundamentals', 'Free Online', 'https://example.com/carpentry'),
    ('Tile Installation', 'Tile Setting Guide', 'Free Online', 'https://example.com/tile')
) as r(skill, title, provider, url)
join public.skills s on s.name = r.skill
where not exists (
  select 1 from public.learning_resources lr where lr.skill_id = s.id and lr.title = r.title
);

insert into public.fair_pay_references (category, compensation_type, min_rate, max_rate, source)
select v.category, v.compensation_type, v.min_rate, v.max_rate, 'Local reference estimate (not a legally mandated wage).'
from (
  values
    ('construction', 'daily', 450, 700),
    ('general_labor', 'daily', 400, 550),
    ('agriculture', 'daily', 350, 500),
    ('service', 'daily', 400, 600),
    ('skilled_labor', 'daily', 500, 800),
    ('construction', 'monthly', 15000, 25000),
    ('office', 'monthly', 14000, 22000)
) as v(category, compensation_type, min_rate, max_rate)
where not exists (
  select 1 from public.fair_pay_references f
  where f.category = v.category and f.compensation_type = v.compensation_type and f.municipality_id is null
);

do $$
declare
  v_worker uuid := '33333333-3333-4333-8333-333333333333';
  v_employer uuid := '22222222-2222-4222-8222-222222222222';
  v_worker_profile uuid;
  v_cainta uuid;
  v_antipolo uuid;
  v_job1 uuid;
  v_job2 uuid;
  v_job3 uuid;
  v_job4 uuid;
  v_emp uuid;
  v_app uuid;
begin
  select id into v_worker_profile from public.worker_profiles where account_id = v_worker;
  select id into v_cainta from public.municipalities where name = 'Cainta';
  select id into v_antipolo from public.municipalities where name = 'Antipolo';

  insert into public.worker_skills (worker_id, skill_id, level, years_experience, experience_level, verified_job_count)
  select v_worker_profile, s.id, v.level, v.years, v.exp, v.verified
  from (
    values
      ('Masonry', 'verified_experience', 3, 'intermediate', 2),
      ('Concrete Mixing', 'verified_experience', 2, 'intermediate', 2),
      ('General Labor', 'repeatedly_demonstrated', 5, 'advanced', 4),
      ('Carpentry', 'self_declared', 1, 'beginner', 0)
  ) as v(skill, level, years, exp, verified)
  join public.skills s on s.name = v.skill
  on conflict (worker_id, skill_id) do nothing;

  insert into public.jobs (
    employer_id, title, category, description, responsibilities, qualifications,
    compensation, compensation_type, positions, employment_type, start_date, end_date,
    municipality_id, barangay, latitude, longitude, urgency_level, working_hours, status, scam_flags
  )
  values (
    v_employer,
    'Mason Needed (1 Day, Urgent)',
    'urgent',
    'Need one experienced mason for a one-day wall construction project. Tools provided on-site.',
    '["Lay hollow blocks","Mix and apply mortar","Ensure plumb and level"]'::jsonb,
    '["At least 1 year experience","Can follow instructions"]'::jsonb,
    600, 'daily', 1, 'daily', now() + interval '1 day', now() + interval '1 day',
    v_cainta, 'San Juan', 14.568, 121.12, 'urgent', '7:00 AM - 4:00 PM', 'published', '[]'::jsonb
  )
  returning id into v_job1;

  insert into public.job_required_skills (job_id, skill_id, importance, weight)
  select v_job1, s.id, v.importance, 1
  from (
    values ('Masonry', 'required'), ('Concrete Mixing', 'required'), ('Tile Installation', 'preferred')
  ) as v(skill, importance)
  join public.skills s on s.name = v.skill
  on conflict (job_id, skill_id) do nothing;

  insert into public.jobs (
    employer_id, title, category, description, responsibilities, qualifications,
    compensation, compensation_type, positions, employment_type, start_date, end_date,
    municipality_id, barangay, latitude, longitude, urgency_level, working_hours, status, scam_flags
  )
  values (
    v_employer,
    'General Labor - Warehouse Loading',
    'general_labor',
    'Loading and unloading of goods in a warehouse. Daily wage.',
    '["Load/unload boxes","Sort inventory","Keep area clean"]'::jsonb,
    '["Physically fit"]'::jsonb,
    450, 'daily', 3, 'daily', now() + interval '2 days', now() + interval '7 days',
    v_antipolo, 'San Roque', 14.58, 121.17, 'normal', '7:00 AM - 4:00 PM', 'published', '[]'::jsonb
  )
  returning id into v_job2;

  insert into public.job_required_skills (job_id, skill_id, importance, weight)
  select v_job2, s.id, 'required', 1
  from (values ('General Labor'), ('Heavy Lifting')) as v(skill)
  join public.skills s on s.name = v.skill
  on conflict (job_id, skill_id) do nothing;

  insert into public.jobs (
    employer_id, title, category, description, responsibilities, qualifications,
    compensation, compensation_type, positions, employment_type, start_date, end_date,
    municipality_id, barangay, latitude, longitude, urgency_level, working_hours, status, scam_flags
  )
  values (
    v_employer,
    'Carpenter - 1 Month Contract',
    'construction',
    'Residential carpentry work for one month. Formworks, doors, and cabinets.',
    '["Build formworks","Install doors and frames","Fabricate cabinets"]'::jsonb,
    '["Carpentry experience"]'::jsonb,
    18000, 'monthly', 1, 'monthly', now() + interval '3 days', now() + interval '33 days',
    v_cainta, 'San Isidro', 14.566, 121.122, 'normal', '7:00 AM - 4:00 PM', 'published', '[]'::jsonb
  )
  returning id into v_job3;

  insert into public.job_required_skills (job_id, skill_id, importance, weight)
  select v_job3, s.id, 'required', 1
  from (values ('Carpentry')) as v(skill)
  join public.skills s on s.name = v.skill
  on conflict (job_id, skill_id) do nothing;

  insert into public.jobs (
    employer_id, title, category, description, responsibilities, qualifications,
    compensation, compensation_type, positions, employment_type, start_date, end_date,
    municipality_id, barangay, latitude, longitude, urgency_level, working_hours, status, scam_flags
  )
  values (
    v_employer,
    'Farm Helper - Harvest Season',
    'agriculture',
    'Help with harvest and packing for the season.',
    '["Harvest crops","Pack produce","Load transport"]'::jsonb,
    '["Willing to work outdoors"]'::jsonb,
    400, 'daily', 5, 'contractual', now() + interval '5 days', now() + interval '20 days',
    v_antipolo, 'San Jose', 14.6, 121.18, 'normal', '7:00 AM - 4:00 PM', 'published', '[]'::jsonb
  )
  returning id into v_job4;

  insert into public.job_required_skills (job_id, skill_id, importance, weight)
  select v_job4, s.id, 'required', 1
  from (values ('Farming'), ('Harvesting')) as v(skill)
  join public.skills s on s.name = v.skill
  on conflict (job_id, skill_id) do nothing;

  insert into public.job_applications (job_id, worker_id, account_id, message, match_score, match_details, status)
  values (
    v_job1,
    v_worker_profile,
    v_worker,
    'Available immediately. I have masonry experience.',
    100,
    '{"skillCoverage":1,"experienceRelevance":0.85,"locationSuitability":1,"availabilitySuitability":1,"matchingSkills":[],"missingSkills":[],"preferredSkills":[],"explanation":["Seeded demo application."],"weights":{"skillCoverage":0.7,"experienceRelevance":0.15,"locationSuitability":0.1,"availabilitySuitability":0.05}}'::jsonb,
    'accepted'
  )
  returning id into v_app;

  insert into public.employments (
    job_id, worker_id, worker_account_id, employer_id, start_date, end_date,
    agreed_compensation, compensation_type, working_hours, status, target_workdays, employment_event
  )
  values (
    v_job1, v_worker_profile, v_worker, v_employer, now(), now() + interval '1 day',
    600, 'daily', '7:00 AM - 4:00 PM', 'active', 1, 'new_job'
  )
  returning id into v_emp;

  insert into public.daily_accomplishments (
    employment_id, worker_account_id, work_date, tasks, description, progress_percent, status
  )
  values (
    v_emp,
    v_worker,
    current_date,
    '["Laid hollow blocks for back wall","Mixed mortar"]'::jsonb,
    'Started the back wall, laid about 60% of blocks. Will continue tomorrow.',
    60,
    'pending'
  );

  insert into public.notifications (account_id, type, title, body, link_type, link_id)
  values
    (v_employer, 'application_update', 'New application', 'Juan dela Cruz applied to Mason Needed (1 Day, Urgent).', 'application', v_app::text),
    (v_worker, 'offer', 'Employment accepted', 'You were accepted for Mason Needed (1 Day, Urgent).', 'employment', v_emp::text);
end;
$$;
