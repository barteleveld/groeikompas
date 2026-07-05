-- Uitbreiding: modules, geplande feedback, versies, reacties en meldingen.
create type public.feedback_moment_kind as enum ('quick_check', 'peer_feedback', 'teacher_feedback', 'conversation');
create type public.feedback_moment_status as enum ('planned', 'open', 'closed');

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 160),
  description text not null default '',
  period text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cohort_modules (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  unique (cohort_id, module_id)
);

create table public.module_assignments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  sort_order integer not null default 0,
  unique (module_id, assignment_id)
);

create table public.feedback_moments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 160),
  instructions text not null default '',
  kind public.feedback_moment_kind not null default 'teacher_feedback',
  status public.feedback_moment_status not null default 'planned',
  scheduled_at timestamptz not null,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (module_id is not null or assignment_id is not null)
);

create table public.feedback_templates (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 2 and 100),
  feedback_text text not null check (length(trim(feedback_text)) > 0),
  feedforward_text text not null check (length(trim(feedforward_text)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  note text not null default '' check (length(note) <= 2000),
  url text check (url is null or url ~ '^https?://'),
  storage_path text,
  original_filename text,
  mime_type text,
  created_at timestamptz not null default now(),
  unique (student_id, assignment_id, version_number),
  check (url is not null or storage_path is not null)
);

create table public.feedback_responses (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  response_text text not null check (length(trim(response_text)) between 3 and 2000),
  submission_id uuid references public.submissions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (feedback_id, student_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  href text not null default '/',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.evidence alter column url drop not null;
alter table public.evidence add column storage_path text;
alter table public.evidence add column original_filename text;
alter table public.evidence add column mime_type text;
alter table public.evidence add constraint evidence_has_source check (url is not null or storage_path is not null);

create index cohort_modules_cohort_idx on public.cohort_modules(cohort_id);
create index module_assignments_module_order_idx on public.module_assignments(module_id, sort_order);
create index feedback_moments_cohort_date_idx on public.feedback_moments(cohort_id, scheduled_at);
create index feedback_templates_teacher_idx on public.feedback_templates(teacher_id);
create index submissions_student_assignment_idx on public.submissions(student_id, assignment_id, version_number desc);
create index feedback_responses_student_idx on public.feedback_responses(student_id, created_at desc);
create index notifications_user_unread_idx on public.notifications(user_id, read_at, created_at desc);

create trigger modules_touch before update on public.modules for each row execute procedure public.touch_updated_at();
create trigger feedback_templates_touch before update on public.feedback_templates for each row execute procedure public.touch_updated_at();

create or replace function public.user_can_access_module(target_module uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select public.is_admin() or exists (
    select 1 from public.modules m where m.id = target_module and m.created_by = auth.uid()
  ) or exists (
    select 1 from public.cohort_modules cm
    where cm.module_id = target_module and public.user_can_access_cohort(cm.cohort_id)
  )
$$;

alter table public.modules enable row level security;
alter table public.cohort_modules enable row level security;
alter table public.module_assignments enable row level security;
alter table public.feedback_moments enable row level security;
alter table public.feedback_templates enable row level security;
alter table public.submissions enable row level security;
alter table public.feedback_responses enable row level security;
alter table public.notifications enable row level security;

create policy modules_select on public.modules for select to authenticated
using (created_by = auth.uid() or public.is_admin() or (is_published and public.user_can_access_module(id)));
create policy modules_insert on public.modules for insert to authenticated
with check (created_by = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher') or public.is_admin());
create policy modules_update on public.modules for update to authenticated
using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
create policy modules_delete on public.modules for delete to authenticated using (created_by = auth.uid() or public.is_admin());

create policy cohort_modules_select on public.cohort_modules for select to authenticated using (public.user_can_access_cohort(cohort_id));
create policy cohort_modules_write on public.cohort_modules for all to authenticated
using (public.is_admin() or exists (select 1 from public.teacher_cohorts where teacher_id = auth.uid() and cohort_id = cohort_modules.cohort_id))
with check (public.is_admin() or exists (select 1 from public.teacher_cohorts where teacher_id = auth.uid() and cohort_id = cohort_modules.cohort_id));

create policy module_assignments_select on public.module_assignments for select to authenticated using (public.user_can_access_module(module_id));
create policy module_assignments_write on public.module_assignments for all to authenticated
using (public.is_admin() or exists (select 1 from public.modules where id = module_id and created_by = auth.uid()))
with check (public.is_admin() or exists (select 1 from public.modules where id = module_id and created_by = auth.uid()));

create policy feedback_moments_select on public.feedback_moments for select to authenticated
using (public.is_admin() or created_by = auth.uid() or public.user_can_access_cohort(cohort_id));
create policy feedback_moments_insert on public.feedback_moments for insert to authenticated
with check (public.is_admin() or (created_by = auth.uid() and exists (select 1 from public.teacher_cohorts where teacher_id = auth.uid() and cohort_id = feedback_moments.cohort_id)));
create policy feedback_moments_update on public.feedback_moments for update to authenticated
using (public.is_admin() or created_by = auth.uid()) with check (public.is_admin() or created_by = auth.uid());
create policy feedback_moments_delete on public.feedback_moments for delete to authenticated using (public.is_admin() or created_by = auth.uid());

create policy feedback_templates_select on public.feedback_templates for select to authenticated using (teacher_id = auth.uid() or public.is_admin());
create policy feedback_templates_insert on public.feedback_templates for insert to authenticated with check (teacher_id = auth.uid() or public.is_admin());
create policy feedback_templates_update on public.feedback_templates for update to authenticated using (teacher_id = auth.uid() or public.is_admin()) with check (teacher_id = auth.uid() or public.is_admin());
create policy feedback_templates_delete on public.feedback_templates for delete to authenticated using (teacher_id = auth.uid() or public.is_admin());

create policy submissions_select on public.submissions for select to authenticated
using (student_id = auth.uid() or public.teacher_can_access_student(student_id) or public.is_admin());
create policy submissions_insert on public.submissions for insert to authenticated with check (student_id = auth.uid());
create policy submissions_update on public.submissions for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy submissions_delete on public.submissions for delete to authenticated using (student_id = auth.uid() or public.is_admin());

create policy feedback_responses_select on public.feedback_responses for select to authenticated
using (student_id = auth.uid() or public.teacher_can_access_student(student_id) or public.is_admin());
create policy feedback_responses_insert on public.feedback_responses for insert to authenticated
with check (student_id = auth.uid() and exists (select 1 from public.feedback where id = feedback_id and student_id = auth.uid()));
create policy feedback_responses_update on public.feedback_responses for update to authenticated
using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy notifications_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_admin on public.notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.notify_feedback_created()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare subject_title text;
begin
  select coalesce(a.title, lg.title, 'je ontwikkeling') into subject_title
  from (select new.assignment_id assignment_id, new.learning_goal_id learning_goal_id) x
  left join public.assignments a on a.id = x.assignment_id
  left join public.learning_goals lg on lg.id = x.learning_goal_id;
  insert into public.notifications(user_id, title, body, href)
  values (new.student_id, 'Nieuwe feedback', 'Je hebt feedback ontvangen op ' || subject_title || '.',
    case when new.assignment_id is not null then '/student/opdrachten/' || new.assignment_id::text else '/student/leerdoelen/' || new.learning_goal_id::text end);
  return new;
end $$;
create trigger feedback_created_notification after insert on public.feedback for each row execute procedure public.notify_feedback_created();

create or replace function public.notify_feedback_moment_created()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.notifications(user_id, title, body, href)
  select cm.student_id, 'Nieuw feedbackmoment', new.title || ' staat gepland.', '/student'
  from public.cohort_members cm where cm.cohort_id = new.cohort_id;
  return new;
end $$;
create trigger feedback_moment_created_notification after insert on public.feedback_moments for each row execute procedure public.notify_feedback_moment_created();

create or replace function public.notify_feedback_response_created()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.notifications(user_id, title, body, href)
  select f.teacher_id, 'Student heeft feedback verwerkt', p.full_name || ' heeft gereageerd op je feedback.', '/teacher/studenten/' || new.student_id::text
  from public.feedback f join public.profiles p on p.id = new.student_id where f.id = new.feedback_id;
  return new;
end $$;
create trigger feedback_response_created_notification after insert on public.feedback_responses for each row execute procedure public.notify_feedback_response_created();

create or replace function public.notify_submission_created()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.notifications(user_id, title, body, href)
  select distinct tc.teacher_id, 'Nieuwe versie ingeleverd', p.full_name || ' heeft versie ' || new.version_number::text || ' ingeleverd.', '/teacher/studenten/' || new.student_id::text
  from public.cohort_members cm
  join public.teacher_cohorts tc on tc.cohort_id = cm.cohort_id
  join public.profiles p on p.id = new.student_id
  where cm.student_id = new.student_id;
  return new;
end $$;
create trigger submission_created_notification after insert on public.submissions for each row execute procedure public.notify_submission_created();

revoke all on function public.user_can_access_module(uuid) from public;
grant execute on function public.user_can_access_module(uuid) to authenticated;
