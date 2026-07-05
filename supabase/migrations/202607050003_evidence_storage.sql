-- Privé-opslag voor bewijs en nieuwe versies. Bestanden staan per student in een eigen map.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-evidence', 'student-evidence', false, 20971520,
  array['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy evidence_files_select on storage.objects for select to authenticated
using (
  bucket_id = 'student-evidence' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.teacher_can_access_student(((storage.foldername(name))[1])::uuid)
    or public.is_admin()
  )
);
create policy evidence_files_insert on storage.objects for insert to authenticated
with check (bucket_id = 'student-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy evidence_files_update on storage.objects for update to authenticated
using (bucket_id = 'student-evidence' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'student-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy evidence_files_delete on storage.objects for delete to authenticated
using (bucket_id = 'student-evidence' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
