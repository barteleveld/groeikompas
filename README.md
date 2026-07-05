# GroeiKompas — formatief voortgangsdashboard

GroeiKompas helpt mbo-studenten en docenten om drie vragen concreet te maken: waar werk ik naartoe, waar sta ik nu en wat is mijn volgende stap? De app houdt **opdrachtstatus** en **leerdoelbeheersing** bewust gescheiden. Er worden geen cijfers, gemiddelden, percentages of kunstmatige totaalscores berekend.

## Wat zit in de MVP?

- Student: eigen opdrachten, leerdoelen, volgende acties, feedback/feedforward, bewijslinks en reflecties.
- Docent: eigen klassen, filters en signaleringen, studentbeeld, status- en leerdoelupdates, feedback en bulkacties.
- Beheerder: klassen en koppelingen, opdrachten en leerdoelen beheren.
- Modules: opdrachten in een vaste, herkenbare volgorde bundelen en per klas publiceren.
- Feedbackplanning: snelle checks, peerfeedback, docentfeedback en gesprekken vooraf plannen.
- Feedbacksjablonen: veelgebruikte feedback bewaren en per student aanpassen.
- Nieuwe versies: studenten leveren bestanden of links in en koppelen hun reactie aan feedback.
- Meldingen: nieuwe feedback, geplande momenten, reacties en inzendingen komen automatisch in beeld.
- Gebruikers uitnodigen: beheerder nodigt studenten/docenten uit en koppelt direct een klas.
- Supabase Auth met rolgestuurde routing.
- Postgres-migratie met constraints, indexes en expliciete Row Level Security.
- Nederlandse demo-inhoud: 1 beheerder, 2 docenten, 2 klassen, 10 studenten, 6 opdrachten en 8 leerdoelen.

## Techniek

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 en Supabase (`@supabase/ssr`). De sessie wordt in cookies bewaard en via `proxy.ts` ververst. Autorisatie gebeurt niet alleen in de interface: RLS in Postgres is de beslissende beveiligingslaag.

## Snel lokaal starten

Benodigd: Node.js 20.9 of nieuwer, npm, Docker Desktop en de [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```powershell
npm install
supabase start
supabase db reset
Copy-Item .env.example .env.local
supabase status
```

Neem uit `supabase status` de API URL en publishable/anon key over in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<lokale publishable of anon key>
```

Zonder deze instellingen opent de app automatisch als interactieve demo. Wijzigingen in die demo worden alleen op de eigen computer bewaard.

Start daarna de app:

```powershell
npm run dev
```

Open `http://localhost:3000`. `supabase db reset` voert automatisch alle migraties en `supabase/seed.sql` uit.

### Demoaccounts

Alle lokale demoaccounts gebruiken wachtwoord `Welkom123!`.

| Rol | E-mailadres |
|---|---|
| Beheerder | `admin@formatief.test` |
| Docent klas 4A | `docent.noor@formatief.test` |
| Docent klas 4B | `docent.jamal@formatief.test` |
| Student | `student01@formatief.test` t/m `student10@formatief.test` |

Gebruik de seeddata en dit gedeelde wachtwoord uitsluitend lokaal.

## Een Supabase-cloudproject configureren

1. Maak een project aan in Supabase.
2. Koppel de CLI: `supabase link --project-ref <project-id>`.
3. Publiceer het schema: `supabase db push`. Gebruik `supabase/seed.sql` **niet** in productie; dit bevat demoaccounts.
4. Zet in Authentication → URL Configuration de Site URL op je definitieve Vercel-URL en voeg eventuele preview/local redirect-URL's toe.
5. Maak gebruikers aan via Authentication → Users. De database-trigger maakt automatisch een `profiles`-rij met studentrol.
6. Pas als beheerder de rol in `profiles` aan naar `teacher` of `admin`, en koppel de gebruiker via de app aan een klas.
7. Kopieer Project URL en Publishable key (of bij oudere projecten de anon key) naar de omgevingsvariabelen.
8. Voeg voor het uitnodigen van gebruikers uitsluitend aan de server/Vercel de geheime variabele `SUPABASE_SERVICE_ROLE_KEY` toe. Deze sleutel mag nooit met gebruikers worden gedeeld.

Een service-role/secret key hoort niet in deze frontendapp en wordt nergens gebruikt of opgeslagen.

## Deployen op Vercel

1. Zet het project in een Git-repository en importeer die in Vercel.
2. Voeg onder Project Settings → Environment Variables toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (of `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Gebruik het standaard buildcommando `npm run build` en laat Output Directory leeg.
4. Deploy en voeg de definitieve URL daarna ook toe aan de toegestane Supabase Auth-redirects.

## Controles

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

De tests controleren de prioritering van volgende acties, bewaken dat die logica geen score of percentage introduceert en voeren de PostgreSQL-migratie plus seeddata uit in een ingebedde database. Daarbij worden ook een student- en docentrol gesimuleerd: student 1 mag student 2 niet lezen en docent Noor ziet alleen klas 4A. De volledige controle staat in [docs/ACCEPTATIE.md](docs/ACCEPTATIE.md).

## RLS in het kort

- Studenten lezen alleen eigen voortgang, feedback, bewijs en reflecties.
- Studenten wijzigen officiële voortgang niet. Feedback verwerken loopt via de smalle RPC `mark_feedback_processed`, zodat feedbacktekst zelf niet kan worden aangepast.
- Docenten krijgen alleen studenten uit hun gekoppelde klassen en mogen alleen daar voortgang/feedback bijwerken.
- Beheerders beheren alle inhoud en koppelingen.
- Opdrachten zijn pas voor studenten zichtbaar als ze gepubliceerd én aan hun klas gekoppeld zijn.

De volledige, controleerbare policies staan in [de initiële migratie](supabase/migrations/202607030001_initial_schema.sql).

## Projectstructuur

```text
app/                  routes, layouts en Server Actions
components/           herbruikbare dashboards, formulieren, status en layout
lib/auth/             sessie- en rolcontrole
lib/progress/         volgende-actielogica
lib/supabase/         browser-, server- en proxyclient
supabase/migrations/  schema, indexes, functies en RLS
supabase/seed.sql     uitsluitend lokale demo-inhoud
types/                gedeelde domeintypes en Nederlandse labels
```

## Bewuste MVP-grenzen

Geen cijferboek, summatieve beslisregels, gemiddelde leerdoelscore, bestandsopslag of uitgebreide analytics. Bewijs wordt in deze versie als veilige `http(s)`-link toegevoegd. Zelfinschatting is niet vermengd met het officiële leerdoelniveau; dat kan later als apart gegeven worden ontworpen.
