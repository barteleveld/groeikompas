-- Veilige levenscyclus voor inhoud, klassen en accounts.
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.cohorts add column if not exists archived_at timestamptz;
alter table public.assignments add column if not exists archived_at timestamptz;
alter table public.learning_goals add column if not exists archived_at timestamptz;

create index if not exists cohorts_active_idx on public.cohorts (name) where archived_at is null;
create index if not exists assignments_active_idx on public.assignments (created_at desc) where archived_at is null;
create index if not exists learning_goals_active_idx on public.learning_goals (domain, sort_order) where archived_at is null;
create index if not exists profiles_active_idx on public.profiles (role, full_name) where is_active;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active) $$;

create or replace function public.teacher_can_access_student(target_student uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teacher_cohorts tc
    join public.cohort_members cm on cm.cohort_id = tc.cohort_id
    join public.cohorts c on c.id = tc.cohort_id and c.archived_at is null
    join public.profiles teacher on teacher.id = tc.teacher_id and teacher.is_active
    join public.profiles student on student.id = cm.student_id and student.is_active
    where tc.teacher_id = auth.uid() and cm.student_id = target_student
  )
$$;

create or replace function public.user_can_access_cohort(target_cohort uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select public.is_admin() or exists (
    select 1 from public.cohort_members cm
    join public.cohorts c on c.id = cm.cohort_id and c.archived_at is null
    join public.profiles p on p.id = cm.student_id and p.is_active
    where cm.cohort_id = target_cohort and cm.student_id = auth.uid()
  ) or exists (
    select 1 from public.teacher_cohorts tc
    join public.cohorts c on c.id = tc.cohort_id and c.archived_at is null
    join public.profiles p on p.id = tc.teacher_id and p.is_active
    where tc.cohort_id = target_cohort and tc.teacher_id = auth.uid()
  )
$$;

create or replace function public.user_can_access_assignment(target_assignment uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select public.is_admin() or exists (
    select 1 from public.assignments a
    join public.cohort_assignments ca on ca.assignment_id = a.id
    where a.id = target_assignment
      and a.archived_at is null
      and public.user_can_access_cohort(ca.cohort_id)
  )
$$;
