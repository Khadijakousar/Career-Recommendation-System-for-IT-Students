# Career Recommendation System implementation plan

Build a university final-year project that helps IT students choose a career, understand their skill gaps, and track a learning roadmap. Keep the code and scoring rules simple enough to explain in a viva.

## Requirements

- Students register and log in, manage an academic profile, complete skills and interest assessments, view ranked careers and career details, generate and track roadmaps, and review progress on a dashboard.
- Admins manage careers, skills, career requirements, interest areas, questions, option weights, and links to resources. Public signup creates student accounts. The first admin comes from the seed.
- Signup follows SRS FR001 and UC001. Validate that the confirmation matches the password, create the student account, show a success message, and redirect to Login. Issue the JWT after successful login.
- Academic information appears on the profile and dashboard. The recommendation score uses skill ratings and interest answers.
- The scope covers a responsive web app and external learning links. AI, machine learning, counselling bookings, job listings, course hosting, payments, messaging, file uploads, social login, and native apps are outside scope.
- Use the local [technical specification](docs/PROJECT_SPEC.md) and [university SRS](docs/SRS_Career_Recommendation_System.docx) to verify requirements. The files under `docs/` stay local and must never be staged or pushed.

## Architecture

`React and Vite ↔ Express JSON API ↔ Prisma ↔ PostgreSQL`

- `client/src/` holds the API wrapper, shared components, auth context, route guards, and pages for auth, students, and admins. Use React Router, Tailwind, and Recharts when charts are needed. Use clear layouts and verify UI changes at 360px and desktop widths.
- `server/src/` holds feature modules, config, and middleware. Each feature uses routes, controllers, services, and Zod validation. Services enforce ownership and use Prisma. Separate the app from the process that starts it.
- Use JavaScript ES modules, Node.js LTS, JWT with bcrypt, Helmet, a CORS allowlist, auth rate limiting, Vitest for backend tests, ESLint, and Prettier. Add dependencies after approval.
- Use PostgreSQL locally through Docker Compose or an existing local install. Provide env examples for both apps. Real environment files and secrets stay outside agent edits and Git.

## Data and recommendation flow

- `User` has at most one `StudentProfile`. `StudentSkill` stores one rating per student and skill.
- `Career` belongs to an `InterestArea`. `CareerSkill` links careers to skills with required levels and importance weights. `Resource` links a learning URL to a skill.
- `InterestQuestion`, `InterestOption`, and `InterestOptionWeight` define the questionnaire. `InterestAnswer` stores one choice per student per question.
- A saved skill level of 0 is a rating. The interest assessment is complete when every current question has a valid answer. An empty questionnaire uses skill-only scoring.
- `RecommendationRun` and `RecommendationResult` store each dated ranking with the career titles and scores used for that run. `Roadmap` stores a student's plan for one career, and `RoadmapStep` stores each skill's levels, order, and status.
- Each recommendation run records whether it used skills alone or skills and interests. PostgreSQL restricts catalog deletes that would remove student history. Phase 3 will report blocked deletes as HTTP 409.
- The recommendation service loads the student's assessments and catalog, then passes plain data to a pure engine. The score uses 60% weighted skill coverage and 40% normalized interest match, with a skill-only fallback. Rank by total score, then skill score, then career title. Save the run and results together.
- Gap priority equals skill importance multiplied by missing levels. Roadmaps sort by learning stage and then priority. Regeneration retains the statuses of remaining steps. Rating updates after finishing a step require student confirmation.

## Phases

| Phase | Work and completion check |
| --- | --- |
| 0. Setup | Scaffold both apps and package scripts. Add Tailwind, React Router, Express, Prisma, local Postgres, env examples, linting, and setup instructions. Verify the client loads, both dev servers start, `GET /api/health` responds, Prisma connects to Postgres, and lint passes. |
| 1. Authentication | Add the user migration, signup, login, current-user endpoint, role checks, and route guards. Verify password confirmation, the success message and redirect to Login, and token issuance on successful login. Test bad credentials, duplicate email, invalid or mismatched passwords, missing token, and wrong role. |
| 2. Schema and seed | Add the full schema and starter admin and catalog. Apply migrations to an empty database and run the seed twice to check that records stay stable. |
| 3. Admin catalog | Build CRUD, career skill mapping, and delete protection. Configure a career through the UI and verify student tokens receive 403 on admin routes. |
| 4. Profile and assessments | Save and reload profile and assessment data. Verify validation, ownership, and atomic saves. |
| 5. Recommendations | Add pure scoring, stored runs, and ranked results. Test hand-calculated scores, fallback, zero denominators, ties, and an empty catalog. |
| 6. Gaps and roadmaps | Add career details, gap charts, roadmap generation, and status updates. Test empty gaps, regeneration, confirmed rating changes, and cross-student access. |
| 7. Dashboard | Show completion prompts, the top three saved matches, roadmap progress, and the skills summary. Verify the dashboard for new and returning students. |
| 8. Delivery | Check accessibility, 360px layout, browser compatibility, and loading, empty, and error states. Verify the SRS timing targets and fresh-clone setup. Document deployment. |

## Progress

- Phase 0 is complete. Both apps start on Node.js 24 LTS. Builds, lint, formatting, and both API tests pass. Chrome displayed the setup screen at 360px, 640px, and 1280px. The live health check returned 503 with PostgreSQL stopped and 200 after it restarted.
- Phase 1 is implemented and verified. The User migration applied to a separate local database. Both builds, lint and formatting checks, and all 14 backend tests passed. Chrome verified the SRS signup flow, validation, session restore, sign-out, and student and admin redirects. The admin account seed is scheduled for Phase 2.
- Phase 2 is implemented and verified. Both migrations applied to an empty local database, and an upgrade preserved the Phase 1 test accounts. Two seed runs produced identical rows. The seeded admin could sign in, catalog deletion guards protected student history, and all 59 distinct resource URLs returned HTTP 2xx.
- Phase 3 is implemented and verified. Chrome verified career creation and skill mapping, questionnaire edits, resource filtering and deletion, and student redirects at desktop and 360px widths. Live PostgreSQL checks verified protected deletes and transactional updates. All 16 backend tests passed, including student denial on all 27 admin routes.
- Phase 4 is implemented and verified. Chrome verified profile and assessment saves, reloads, and visible validation at desktop and 360px widths. A live API check with two students verified ownership, atomic saves, and that question responses omit option weights. All 24 backend tests passed.
- Phase 5 is implemented and verified. All 35 backend tests passed. The local API checks verified both scoring modes, student isolation, empty runs, and that renaming a career leaves past results intact. Chrome verified the highlights, scoring breakdown, and saved results at desktop and 360px widths.
- Phase 6 is implemented and verified. Chrome verified career details, the skill-gap chart at desktop and 360px widths, resource links, progress tracking, and the rating confirmation. The local API verified roadmap ordering, regeneration, completed empty roadmaps, and ownership. All 39 backend tests passed.
- Phase 7 is implemented and verified. The local API verified assessment counts, skill averages, the latest three matches, active roadmap progress, and isolation between students. Chrome verified new and returning dashboards, retry after an error, and the skills chart at desktop and 360px widths. All 42 backend tests passed.
- Phase 8 local delivery checks passed. A fresh clone installed from the lockfiles, applied all migrations, and seeded an empty database. Chrome verified the student flow through both assessments, recommendations, and a saved roadmap step, along with admin catalog access, keyboard navigation, and the 360px layout. Firefox and WebKitGTK smoke-tested admin sign-in and a direct catalog link at 360px. In one local Chrome run, the dashboard reloaded in 0.94 seconds and matches appeared in 0.23 seconds. Native Edge and Safari checks and hosted performance measurements are pending. The README records deployment steps and checks.

## Working agreement

- Start a phase when the owner asks to proceed. Plan it briefly, complete it, verify normal and failure paths, and report before moving to the next phase. Update this file with outcomes and decisions.
- Ask about meaningful gaps or conflicting requirements. Handle routine implementation choices using the agreed plan.
- Write focused Git commits with short imperative subjects that describe the specific change. Use a commit body when the reason or tradeoff matters. Keep messages factual and free of generic filler, emojis, and unverified claims.
- Show the proposed commit message and wait for the owner's approval before each commit.
- Keep the working tree free of unrelated files. Ignore production-only artifacts, secrets, and local outputs that do not belong in development or release. Keep release inputs and reproducible setup files in Git.

## GitHub sync

- Publish tested checkpoints to `development` after approval. Review changes there before merging to `main`.
