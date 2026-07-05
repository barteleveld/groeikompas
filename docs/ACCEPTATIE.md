# Acceptatie-audit MVP

Deze audit koppelt elk criterium aan controleerbare implementatie en verificatie.

| # | Criterium | Bewijs |
|---|---|---|
| 1 | Student logt in en ziet alleen zichzelf | Supabase Auth in `app/actions/auth.ts`; RLS-policy `profiles_select`; migratietest simuleert student 1 en ziet exact één profiel. |
| 2 | Student ziet afgerond/open/feedback/leerdoelen/acties | `app/student/page.tsx`; afgeleide acties in `lib/progress/next-actions.ts`; unit-tests voor prioriteit, duplicaten en geen schijnprecisie. |
| 3 | Docent ziet eigen klassen | `teacher_cohorts` + `app/teacher/page.tsx`; migratietest bewijst dat docent Noor alleen haar vijf studenten ziet. |
| 4 | Docent wijzigt opdrachtstatus | `AssignmentStatusForm` + `updateAssignmentStatus`; RLS beperkt dit tot gekoppelde studenten. |
| 5 | Docent wijzigt leerdoelbeheersing | `GoalLevelForm` + `updateGoalLevel`; officiële niveaus staan los van opdrachtstatus. |
| 6 | Docent voegt feedback/feedforward toe | `FeedbackForm` + `addTeacherFeedback`; beide teksten zijn database- en formuliervalidatie verplicht. |
| 7 | Student leest en verwerkt feedback | Detailpagina's + RPC `mark_feedback_processed`; migratietest voert deze RPC als student uit. |
| 8 | Student voegt bewijs/link toe | `EvidenceForm` + `addEvidence`; alleen `http(s)` en eigen `student_id`. |
| 9 | Opdrachten zijn gekoppeld aan leerdoelen | `assignment_learning_goals`, beheerformulier en detailpagina's. |
| 10 | Opdrachtstatus en leerdoelniveau gescheiden | Twee enums en twee voortgangstabellen; aparte UI-secties en acties. |
| 11 | Studenten zien elkaar niet | RLS op voortgang, feedback, bewijs en reflecties; migratietest op studentrol. |
| 12 | Docenten zien alleen eigen klassen | `teacher_can_access_student` wordt in alle relevante policies gebruikt; migratietest op docentrol. |
| 13 | Admin beheert leerdoelen, opdrachten en klassen | `/admin`, `/admin/leerdoelen`, `/teacher/opdrachten`; inclusief gebruikersrollen en klas-koppelingen. |
| 14 | App draait lokaal | Productiebuild slaagt; login is op desktop en 390 px gerenderd; lokale Supabase-stappen staan in README. |
| 15 | Voorbereid voor Vercel | Alleen publieke Supabase-config via environment variables; `npm run build` slaagt; deploymentstappen in README. |
| 16 | Migraties en seeddata aanwezig | `supabase/migrations`, `supabase/seed.sql`, `supabase/config.toml`; ingebedde Postgres-test voert migratie én seed uit. |
| 17 | README legt installatie en testen uit | `README.md` bevat lokaal starten, demoaccounts, cloud-Supabase, Vercel, beveiliging en testcommando's. |

## Uitgevoerde eindcontroles

- TypeScript strict typecheck
- ESLint
- 7 geautomatiseerde tests, inclusief uitgevoerde PostgreSQL-migratie, seeddata en RLS-rollen
- Next.js-productiebuild
- npm security audit
- Gerenderde login op 1280 px en 390 px; geen horizontale overflow of browserconsolefouten

Een volledige ingelogde browserproef gebruikt een echt lokaal of cloud-Supabase-project. De meegeleverde `supabase db reset`-route maakt die proef reproduceerbaar; in deze werkomgeving waren Docker en de Supabase CLI niet geïnstalleerd.

## Uitbreiding leerworkflow

- Modules met geordende opdrachten en klaskoppeling
- Geplande feedbackmomenten met vier werkvormen
- Persoonlijke feedbacksjablonen en bulkfeedback
- Expliciete studentreactie op feedback, optioneel gekoppeld aan een verbeterde versie
- Privé-bestandsopslag tot 20 MB voor pdf, afbeelding, Word en PowerPoint
- Meldingen voor feedback, feedbackmomenten, reacties en nieuwe inzendingen
- Veilige gebruikersuitnodigingen via een server-only beheersleutel
- Interactieve demo met lokale opslag en resetmogelijkheid
