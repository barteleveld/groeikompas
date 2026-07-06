-- Triggerfuncties zijn geen openbare RPC's. Hulpfuncties zijn alleen voor ingelogde gebruikers.
revoke all on function public.create_progress_for_cohort_assignment() from public, anon, authenticated;
revoke all on function public.create_progress_for_cohort_member() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.notify_feedback_created() from public, anon, authenticated;
revoke all on function public.notify_feedback_response_created() from public, anon, authenticated;
revoke all on function public.notify_submission_created() from public, anon, authenticated;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.teacher_can_access_student(uuid) from public, anon;
revoke all on function public.user_can_access_cohort(uuid) from public, anon;
revoke all on function public.user_can_access_assignment(uuid) from public, anon;
revoke all on function public.user_can_access_module(uuid) from public, anon;
revoke all on function public.mark_feedback_processed(uuid, text) from public, anon;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.teacher_can_access_student(uuid) to authenticated;
grant execute on function public.user_can_access_cohort(uuid) to authenticated;
grant execute on function public.user_can_access_assignment(uuid) to authenticated;
grant execute on function public.user_can_access_module(uuid) to authenticated;
grant execute on function public.mark_feedback_processed(uuid, text) to authenticated;
