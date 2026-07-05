alter table public.modules add column if not exists archived_at timestamptz;

create or replace function public.sync_submission_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.student_assignment_progress (student_id, assignment_id, status, updated_by, updated_at)
  values (new.student_id, new.assignment_id, 'submitted', new.student_id, now())
  on conflict (student_id, assignment_id)
  do update set status = 'submitted', updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  return new;
end;
$$;
revoke all on function public.sync_submission_status() from public;

drop trigger if exists submission_updates_progress on public.submissions;
create trigger submission_updates_progress
after insert on public.submissions
for each row execute function public.sync_submission_status();

create or replace function public.sync_feedback_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.assignment_id is not null then
    insert into public.student_assignment_progress (student_id, assignment_id, status, updated_by, updated_at)
    values (new.student_id, new.assignment_id, 'feedback_received', new.teacher_id, now())
    on conflict (student_id, assignment_id)
    do update set status = 'feedback_received', updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_feedback_status() from public;

drop trigger if exists feedback_updates_progress on public.feedback;
create trigger feedback_updates_progress
after insert on public.feedback
for each row execute function public.sync_feedback_status();

create or replace function public.sync_feedback_response_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare target_assignment uuid;
begin
  select assignment_id into target_assignment
  from public.feedback
  where id = new.feedback_id and student_id = new.student_id;

  if target_assignment is not null then
    update public.student_assignment_progress
    set status = 'feedback_processed', updated_by = new.student_id, updated_at = now()
    where student_id = new.student_id and assignment_id = target_assignment;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_feedback_response_status() from public;

drop trigger if exists feedback_response_updates_progress on public.feedback_responses;
create trigger feedback_response_updates_progress
after insert or update on public.feedback_responses
for each row execute function public.sync_feedback_response_status();

create or replace function public.notify_feedback_moment_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications(user_id, title, body, href)
  select cm.student_id,
    'Nieuw feedbackmoment',
    new.title || ' staat gepland.',
    case
      when new.assignment_id is not null then '/student/opdrachten/' || new.assignment_id::text
      when new.module_id is not null then '/student/modules'
      else '/student'
    end
  from public.cohort_members cm
  where cm.cohort_id = new.cohort_id;
  return new;
end;
$$;
revoke all on function public.notify_feedback_moment_created() from public;

