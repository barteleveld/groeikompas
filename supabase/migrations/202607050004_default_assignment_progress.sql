-- Iedere opdracht die aan een klas is gekoppeld krijgt voor iedere student
-- direct een voortgangsregel met de standaardstatus 'not_started'.

create or replace function public.create_progress_for_cohort_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.student_assignment_progress (student_id, assignment_id, status, updated_by)
  select member.student_id, new.assignment_id, 'not_started', member.student_id
  from public.cohort_members member
  where member.cohort_id = new.cohort_id
  on conflict (student_id, assignment_id) do nothing;
  return new;
end;
$$;

drop trigger if exists cohort_assignment_creates_progress on public.cohort_assignments;
create trigger cohort_assignment_creates_progress
after insert on public.cohort_assignments
for each row execute function public.create_progress_for_cohort_assignment();

create or replace function public.create_progress_for_cohort_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.student_assignment_progress (student_id, assignment_id, status, updated_by)
  select new.student_id, link.assignment_id, 'not_started', new.student_id
  from public.cohort_assignments link
  where link.cohort_id = new.cohort_id
  on conflict (student_id, assignment_id) do nothing;
  return new;
end;
$$;

drop trigger if exists cohort_member_creates_progress on public.cohort_members;
create trigger cohort_member_creates_progress
after insert on public.cohort_members
for each row execute function public.create_progress_for_cohort_member();

insert into public.student_assignment_progress (student_id, assignment_id, status, updated_by)
select member.student_id, link.assignment_id, 'not_started', member.student_id
from public.cohort_members member
join public.cohort_assignments link on link.cohort_id = member.cohort_id
on conflict (student_id, assignment_id) do nothing;

