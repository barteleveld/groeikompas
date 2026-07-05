-- Formatief dashboard: kernschema, integriteitsregels, indexes en RLS.
create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'teacher', 'admin');
create type public.assignment_status as enum (
  'not_started', 'in_progress', 'submitted',
  'feedback_received', 'feedback_processed', 'completed'
);
create type public.learning_goal_level as enum (
  'not_visible', 'developing', 'demonstrated', 'strongly_demonstrated'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 100),
  school_year text not null check (school_year ~ '^20[0-9]{2}-20[0-9]{2}$'),
  created_at timestamptz not null default now(),
  unique (name, school_year)
);

create table public.cohort_members (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  unique (cohort_id, student_id)
);

create table public.teacher_cohorts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  unique (teacher_id, cohort_id)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 160),
  description text not null default '',
  deadline timestamptz,
  period text,
  is_published boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cohort_assignments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  unique (cohort_id, assignment_id)
);

create table public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 240),
  description text not null default '',
  domain text,
  kerntaak text,
  werkproces text,
  level text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignment_learning_goals (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  learning_goal_id uuid not null references public.learning_goals(id) on delete cascade,
  unique (assignment_id, learning_goal_id)
);

create table public.student_assignment_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  status public.assignment_status not null default 'not_started',
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (student_id, assignment_id)
);

create table public.student_learning_goal_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  learning_goal_id uuid not null references public.learning_goals(id) on delete cascade,
  level public.learning_goal_level not null default 'not_visible',
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (student_id, learning_goal_id)
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id),
  assignment_id uuid references public.assignments(id) on delete cascade,
  learning_goal_id uuid references public.learning_goals(id) on delete cascade,
  feedback_text text not null check (length(trim(feedback_text)) > 0),
  feedforward_text text not null check (length(trim(feedforward_text)) > 0),
  created_at timestamptz not null default now(),
  processed_by_student boolean not null default false,
  processed_at timestamptz,
  check (assignment_id is not null or learning_goal_id is not null),
  check (processed_by_student = (processed_at is not null))
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete cascade,
  learning_goal_id uuid references public.learning_goals(id) on delete cascade,
  title text not null check (length(trim(title)) between 2 and 160),
  description text not null default '',
  url text not null check (url ~ '^https?://'),
  created_at timestamptz not null default now(),
  check (assignment_id is not null or learning_goal_id is not null)
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete cascade,
  learning_goal_id uuid references public.learning_goals(id) on delete cascade,
  reflection_text text not null check (length(trim(reflection_text)) between 3 and 2000),
  created_at timestamptz not null default now(),
  check (assignment_id is not null or learning_goal_id is not null)
);

create index cohort_members_student_idx on public.cohort_members(student_id);
create index teacher_cohorts_teacher_idx on public.teacher_cohorts(teacher_id);
create index cohort_assignments_assignment_idx on public.cohort_assignments(assignment_id);
create index assignments_deadline_idx on public.assignments(deadline);
create index assignment_progress_student_status_idx on public.student_assignment_progress(student_id, status);
create index assignment_progress_assignment_idx on public.student_assignment_progress(assignment_id);
create index goal_progress_student_level_idx on public.student_learning_goal_progress(student_id, level);
create index feedback_student_processed_idx on public.feedback(student_id, processed_by_student, created_at desc);
create index feedback_assignment_idx on public.feedback(assignment_id);
create index evidence_student_idx on public.evidence(student_id, created_at desc);
create index reflections_student_idx on public.reflections(student_id, created_at desc);

-- SECURITY DEFINER helpers centraliseren klastoegang en voorkomen recursieve RLS-evaluatie.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.teacher_can_access_student(target_student uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.teacher_cohorts tc
    join public.cohort_members cm on cm.cohort_id = tc.cohort_id
    where tc.teacher_id = auth.uid() and cm.student_id = target_student
  )
$$;

create or replace function public.user_can_access_cohort(target_cohort uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select public.is_admin() or exists (
    select 1 from public.cohort_members where cohort_id = target_cohort and student_id = auth.uid()
  ) or exists (
    select 1 from public.teacher_cohorts where cohort_id = target_cohort and teacher_id = auth.uid()
  )
$$;

create or replace function public.user_can_access_assignment(target_assignment uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select public.is_admin() or exists (
    select 1 from public.cohort_assignments ca
    where ca.assignment_id = target_assignment and public.user_can_access_cohort(ca.cohort_id)
  )
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)), 'student');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp
as $$ begin new.updated_at = now(); return new; end $$;
create trigger assignments_touch before update on public.assignments for each row execute procedure public.touch_updated_at();
create trigger learning_goals_touch before update on public.learning_goals for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.teacher_cohorts enable row level security;
alter table public.assignments enable row level security;
alter table public.cohort_assignments enable row level security;
alter table public.learning_goals enable row level security;
alter table public.assignment_learning_goals enable row level security;
alter table public.student_assignment_progress enable row level security;
alter table public.student_learning_goal_progress enable row level security;
alter table public.feedback enable row level security;
alter table public.evidence enable row level security;
alter table public.reflections enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin() or public.teacher_can_access_student(id));
create policy profiles_admin_write on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cohorts_select on public.cohorts for select to authenticated using (public.user_can_access_cohort(id));
create policy cohorts_admin_write on public.cohorts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy cohort_members_select on public.cohort_members for select to authenticated using (public.user_can_access_cohort(cohort_id));
create policy cohort_members_admin_write on public.cohort_members for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy teacher_cohorts_select on public.teacher_cohorts for select to authenticated using (teacher_id = auth.uid() or public.is_admin());
create policy teacher_cohorts_admin_write on public.teacher_cohorts for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy assignments_select on public.assignments for select to authenticated using (created_by = auth.uid() or public.is_admin() or (is_published and public.user_can_access_assignment(id)));
create policy assignments_teacher_insert on public.assignments for insert to authenticated with check (created_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher') or public.is_admin());
create policy assignments_owner_update on public.assignments for update to authenticated using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
create policy assignments_admin_delete on public.assignments for delete to authenticated using (public.is_admin());
create policy cohort_assignments_select on public.cohort_assignments for select to authenticated using (public.user_can_access_cohort(cohort_id));
create policy cohort_assignments_write on public.cohort_assignments for all to authenticated using (public.is_admin() or exists (select 1 from public.teacher_cohorts tc where tc.teacher_id = auth.uid() and tc.cohort_id = cohort_id)) with check (public.is_admin() or exists (select 1 from public.teacher_cohorts tc where tc.teacher_id = auth.uid() and tc.cohort_id = cohort_id));

create policy learning_goals_select on public.learning_goals for select to authenticated using (true);
create policy learning_goals_admin_write on public.learning_goals for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy assignment_goals_select on public.assignment_learning_goals for select to authenticated using (public.user_can_access_assignment(assignment_id));
create policy assignment_goals_write on public.assignment_learning_goals for all to authenticated using (public.is_admin() or exists (select 1 from public.assignments a where a.id = assignment_id and a.created_by = auth.uid())) with check (public.is_admin() or exists (select 1 from public.assignments a where a.id = assignment_id and a.created_by = auth.uid()));

create policy assignment_progress_select on public.student_assignment_progress for select to authenticated using (student_id = auth.uid() or public.teacher_can_access_student(student_id) or public.is_admin());
create policy assignment_progress_teacher_insert on public.student_assignment_progress for insert to authenticated with check ((public.teacher_can_access_student(student_id) and updated_by = auth.uid()) or public.is_admin());
create policy assignment_progress_teacher_update on public.student_assignment_progress for update to authenticated using (public.teacher_can_access_student(student_id) or public.is_admin()) with check ((public.teacher_can_access_student(student_id) and updated_by = auth.uid()) or public.is_admin());
create policy assignment_progress_admin_delete on public.student_assignment_progress for delete to authenticated using (public.is_admin());

create policy goal_progress_select on public.student_learning_goal_progress for select to authenticated using (student_id = auth.uid() or public.teacher_can_access_student(student_id) or public.is_admin());
create policy goal_progress_teacher_insert on public.student_learning_goal_progress for insert to authenticated with check ((public.teacher_can_access_student(student_id) and updated_by = auth.uid()) or public.is_admin());
create policy goal_progress_teacher_update on public.student_learning_goal_progress for update to authenticated using (public.teacher_can_access_student(student_id) or public.is_admin()) with check ((public.teacher_can_access_student(student_id) and updated_by = auth.uid()) or public.is_admin());
create policy goal_progress_admin_delete on public.student_learning_goal_progress for delete to authenticated using (public.is_admin());

create policy feedback_select on public.feedback for select to authenticated using (student_id = auth.uid() or public.teacher_can_access_student(student_id) or public.is_admin());
create policy feedback_teacher_insert on public.feedback for insert to authenticated with check ((teacher_id = auth.uid() and public.teacher_can_access_student(student_id)) or public.is_admin());
create policy feedback_teacher_update on public.feedback for update to authenticated using ((teacher_id = auth.uid() and public.teacher_can_access_student(student_id)) or public.is_admin()) with check ((teacher_id = auth.uid() and public.teacher_can_access_student(student_id)) or public.is_admin());
create policy feedback_teacher_delete on public.feedback for delete to authenticated using ((teacher_id = auth.uid() and public.teacher_can_access_student(student_id)) or public.is_admin());

create policy evidence_select on public.evidence for select to authenticated using (student_id = auth.uid() or public.teacher_can_access_student(student_id) or public.is_admin());
create policy evidence_student_insert on public.evidence for insert to authenticated with check (student_id = auth.uid() or public.is_admin());
create policy evidence_student_update on public.evidence for update to authenticated using (student_id = auth.uid() or public.is_admin()) with check (student_id = auth.uid() or public.is_admin());
create policy evidence_student_delete on public.evidence for delete to authenticated using (student_id = auth.uid() or public.is_admin());

create policy reflections_select on public.reflections for select to authenticated using (student_id = auth.uid() or public.teacher_can_access_student(student_id) or public.is_admin());
create policy reflections_student_insert on public.reflections for insert to authenticated with check (student_id = auth.uid() or public.is_admin());
create policy reflections_student_update on public.reflections for update to authenticated using (student_id = auth.uid() or public.is_admin()) with check (student_id = auth.uid() or public.is_admin());
create policy reflections_student_delete on public.reflections for delete to authenticated using (student_id = auth.uid() or public.is_admin());

-- Studenten verwerken feedback uitsluitend via deze smalle RPC en kunnen de inhoud niet wijzigen.
create or replace function public.mark_feedback_processed(feedback_id uuid, reflection text default null)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare target public.feedback;
begin
  select * into target from public.feedback f where f.id = feedback_id and f.student_id = auth.uid() for update;
  if not found then raise exception 'Feedback niet gevonden of geen toegang'; end if;
  update public.feedback set processed_by_student = true, processed_at = now() where id = feedback_id;
  if reflection is not null and length(trim(reflection)) >= 3 then
    insert into public.reflections (student_id, assignment_id, learning_goal_id, reflection_text)
    values (auth.uid(), target.assignment_id, target.learning_goal_id, reflection);
  end if;
end;
$$;

revoke all on function public.mark_feedback_processed(uuid, text) from public;
grant execute on function public.mark_feedback_processed(uuid, text) to authenticated;
revoke all on function public.is_admin() from public;
revoke all on function public.teacher_can_access_student(uuid) from public;
revoke all on function public.user_can_access_cohort(uuid) from public;
revoke all on function public.user_can_access_assignment(uuid) from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.teacher_can_access_student(uuid) to authenticated;
grant execute on function public.user_can_access_cohort(uuid) to authenticated;
grant execute on function public.user_can_access_assignment(uuid) to authenticated;
