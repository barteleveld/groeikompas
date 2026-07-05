// @vitest-environment node
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();

beforeAll(async () => {
  await db.exec(`
    create schema auth;
    create schema storage;
    create role authenticated;
    create table auth.users (
      instance_id uuid,
      id uuid primary key,
      aud text,
      role text,
      email text,
      encrypted_password text,
      email_confirmed_at timestamptz,
      raw_app_meta_data jsonb default '{}'::jsonb,
      raw_user_meta_data jsonb default '{}'::jsonb,
      created_at timestamptz,
      updated_at timestamptz
    );
    create table auth.identities (
      id uuid primary key,
      provider_id text not null,
      user_id uuid not null references auth.users(id),
      identity_data jsonb,
      provider text not null,
      last_sign_in_at timestamptz,
      created_at timestamptz,
      updated_at timestamptz,
      unique (provider_id, provider)
    );
    create function auth.uid() returns uuid language sql stable
    as $$ select null::uuid $$;
    create function public.gen_salt(text) returns text language sql immutable
    as $$ select 'test-salt'::text $$;
    create function public.crypt(text, text) returns text language sql immutable
    as $$ select $1 $$;
    create table storage.buckets (
      id text primary key,
      name text not null,
      public boolean not null default false,
      file_size_limit bigint,
      allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text not null references storage.buckets(id),
      name text not null,
      owner_id text
    );
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable
    as $$ select (string_to_array($1, '/'))[1:greatest(array_length(string_to_array($1, '/'), 1) - 1, 0)] $$;
  `);
  const migrationDir = new URL("./migrations/", import.meta.url);
  const migrationFiles = (await readdir(migrationDir)).filter((name) => name.endsWith(".sql")).sort();
  for (const filename of migrationFiles) {
    const migration = (await readFile(new URL(filename, migrationDir), "utf8"))
      .replace(/^create extension if not exists pgcrypto;$/m, ""); // Supabase heeft pgcrypto; PGlite bundelt deze extensie niet.
    await db.exec(migration);
  }
  const seed = await readFile(new URL("./seed.sql", import.meta.url), "utf8");
  await db.exec(seed);
  await db.exec(`
    create or replace function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public to authenticated;
    grant usage on schema storage to authenticated;
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select, insert, update, delete on all tables in schema storage to authenticated;
    grant usage on all sequences in schema public to authenticated;
  `);
}, 30_000);

afterAll(async () => db.close());

describe.sequential("Supabase-migratie", () => {
  it("maakt alle MVP-tabellen aan", async () => {
    const result = await db.query<{ table_name: string }>(`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
    `);
    const names = new Set(result.rows.map((row) => row.table_name));
    for (const name of ["profiles", "cohorts", "assignments", "learning_goals", "student_assignment_progress", "student_learning_goal_progress", "feedback", "evidence", "reflections", "modules", "feedback_moments", "feedback_templates", "submissions", "feedback_responses", "notifications"]) {
      expect(names.has(name), `${name} ontbreekt`).toBe(true);
    }
  });

  it("schakelt RLS in en maakt expliciete policies", async () => {
    const rls = await db.query<{ count: number }>(`
      select count(*)::int as count from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relrowsecurity
    `);
    const policies = await db.query<{ count: number }>(`
      select count(*)::int as count from pg_policies where schemaname = 'public'
    `);
    expect(rls.rows[0].count).toBeGreaterThanOrEqual(21);
    expect(policies.rows[0].count).toBeGreaterThanOrEqual(50);
  });

  it("laadt de volledige Nederlandse seeddata", async () => {
    const result = await db.query<{ profiles: number; students: number; assignments: number; goals: number; modules: number; moments: number }>(`
      select
        (select count(*)::int from public.profiles) as profiles,
        (select count(*)::int from public.profiles where role = 'student') as students,
        (select count(*)::int from public.assignments) as assignments,
        (select count(*)::int from public.learning_goals) as goals,
        (select count(*)::int from public.modules) as modules,
        (select count(*)::int from public.feedback_moments) as moments
    `);
    expect(result.rows[0]).toEqual({ profiles: 13, students: 10, assignments: 6, goals: 8, modules: 3, moments: 2 });
  });

  it("isoleert studenten en klassen daadwerkelijk via RLS", async () => {
    try {
      await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', false);`);
      const studentView = await db.query<{ profile_count: number; progress_count: number }>(`
        select
          (select count(*)::int from public.profiles) as profile_count,
          (select count(*)::int from public.student_assignment_progress) as progress_count
      `);
      expect(studentView.rows[0]).toEqual({ profile_count: 1, progress_count: 6 });
      const workflowView = await db.query<{ modules: number; moments: number; submissions: number; notifications: number }>(`
        select
          (select count(*)::int from public.modules) as modules,
          (select count(*)::int from public.feedback_moments) as moments,
          (select count(*)::int from public.submissions) as submissions,
          (select count(*)::int from public.notifications) as notifications
      `);
      expect(workflowView.rows[0]).toEqual({ modules: 3, moments: 1, submissions: 1, notifications: 2 });
      const forbiddenUpdate = await db.query(`
        update public.student_assignment_progress set status = 'completed'
        where student_id = 'c0000000-0000-0000-0000-000000000001'
        returning id
      `);
      expect(forbiddenUpdate.rows).toHaveLength(0);
      await db.query(`select public.mark_feedback_processed(
        '90000000-0000-0000-0000-000000000001',
        'Ik heb de betekenis per trend toegevoegd.'
      )`);
      const processed = await db.query<{ processed_by_student: boolean }>(`
        select processed_by_student from public.feedback
        where id = '90000000-0000-0000-0000-000000000001'
      `);
      expect(processed.rows[0].processed_by_student).toBe(true);

      await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000001', false);`);
      const teacherView = await db.query<{ student_count: number }>(`
        select count(*)::int as student_count from public.profiles where role = 'student'
      `);
      expect(teacherView.rows[0].student_count).toBe(5);
    } finally {
      await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");
    }
  });
});
