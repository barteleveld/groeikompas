-- Versterk de rol- en klasisolatie voor de productieomgeving.
-- Studenten zien in cohort_members uitsluitend hun eigen koppeling.

create or replace function public.teacher_can_access_student(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teacher_cohorts tc
    join public.cohort_members cm on cm.cohort_id = tc.cohort_id
    join public.cohorts c on c.id = tc.cohort_id and c.archived_at is null
    join public.profiles teacher
      on teacher.id = tc.teacher_id
      and teacher.role = 'teacher'
      and teacher.is_active
    join public.profiles student
      on student.id = cm.student_id
      and student.role = 'student'
      and student.is_active
    where tc.teacher_id = (select auth.uid())
      and cm.student_id = target_student
  )
$$;

create or replace function public.user_can_access_cohort(target_cohort uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin()
  or exists (
    select 1
    from public.cohort_members cm
    join public.cohorts c on c.id = cm.cohort_id and c.archived_at is null
    join public.profiles student
      on student.id = cm.student_id
      and student.role = 'student'
      and student.is_active
    where cm.cohort_id = target_cohort
      and cm.student_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.teacher_cohorts tc
    join public.cohorts c on c.id = tc.cohort_id and c.archived_at is null
    join public.profiles teacher
      on teacher.id = tc.teacher_id
      and teacher.role = 'teacher'
      and teacher.is_active
    where tc.cohort_id = target_cohort
      and tc.teacher_id = (select auth.uid())
  )
$$;

drop policy if exists cohort_members_select on public.cohort_members;
create policy cohort_members_select
on public.cohort_members
for select
to authenticated
using (
  student_id = (select auth.uid())
  or public.is_admin()
  or exists (
    select 1
    from public.teacher_cohorts tc
    join public.profiles teacher
      on teacher.id = tc.teacher_id
      and teacher.role = 'teacher'
      and teacher.is_active
    where tc.teacher_id = (select auth.uid())
      and tc.cohort_id = cohort_members.cohort_id
  )
);
