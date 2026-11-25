# Career Recommendation System for IT Students

A university final-year project to help IT students compare career paths, identify skill gaps, and plan what to learn. Career recommendations use rule-based matching based on the student's skill ratings and interests.

## Architecture

The React client uses React Router for navigation and sends JSON requests to the Express API. The API validates requests, checks roles and ownership, and uses Prisma to read and write PostgreSQL. The scoring engine ranks careers from saved assessment data and the admin-managed catalog. The database stores each ranking so students can revisit it later.

## Local setup

Use Node.js 24 LTS (24.12 or newer within the 24.x line), npm, and PostgreSQL. With nvm, run `nvm install` and `nvm use` from the repository root.

1. Start PostgreSQL. From the repository root, run:

   ```sh
   docker compose up -d --wait db
   ```

   With an existing local PostgreSQL installation, create a database and a login role that owns it. Set the server's `DATABASE_URL` to `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`, using that database's connection details.

2. Start the Express API in one terminal. Run these commands from the repository root for a fresh setup:

   ```sh
   cd server
   cp -n .env.example .env
   npm ci
   npm run build
   npm run db:migrate
   # Set ADMIN_EMAIL and ADMIN_PASSWORD in .env, then run the seed.
   npm run db:seed
   # Set JWT_SECRET in server/.env before starting. Generate a value with:
   # openssl rand -hex 32
   npm run dev
   ```

   For an existing PostgreSQL installation, update `server/.env` before running the migration. The example database credentials are for local Compose only. Set `JWT_SECRET` to a random value of at least 32 bytes. Check the API with `curl http://localhost:3000/api/health`. It returns HTTP 200 after a PostgreSQL query succeeds and HTTP 503 if the database is unavailable.

3. Start the React client in a second terminal:

   ```sh
   cd client
   cp -n .env.example .env
   npm ci
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) and confirm the screen reports **API and database connected**. Use **Sign in** to open the authentication screens. If you change the API or client address, update `VITE_API_URL` and `CLIENT_URL` to match.

## Authentication

Public signup creates student accounts. After confirming their password and creating an account, students return to the sign-in page. Students land on the dashboard, and admins land on the admin overview.

The API signs seven-day JWTs. The browser stores the token in `localStorage` to restore the session after a refresh. JavaScript on the same origin can read this storage, so an XSS flaw could expose the token. Signing out clears the browser's stored token.

## Starter data

`npm run db:seed` creates the admin configured by `ADMIN_EMAIL` and `ADMIN_PASSWORD` and adds the starter catalog, including 30 skills, eight careers and interest areas, 12 questions, and 60 learning resources. Use an email that does not belong to a student. Running the seed again keeps existing records and the admin's password hash.

## Admin catalog

Sign in with the seeded admin account to open `/admin`. Manage careers, skills, interest areas, questions and answer weights, and learning resources from the catalog navigation. Use **Skills** on a career row to set its required skills, levels, and importance. The API blocks catalog changes that would delete saved student history.

## Student profile and assessments

Use the student dashboard to open the academic profile, skills assessment, or interest assessment. CGPA and completed courses are optional. Save a level for every listed skill, including zero for skills you have yet to learn. The interest questionnaire shows one question at a time and keeps earlier selections when moving back. Saved profile details, ratings, and answers are loaded when you return.

## Career recommendations

Save skill ratings, then select **Generate matches** on the recommendations page. The score combines 60% weighted skill coverage and 40% normalized interest points when every current question has a valid answer. An incomplete or empty questionnaire uses the skill score alone. Results are ranked by total score, then skill score, then career title.

Each run saves the career title, scores, rank, and scoring mode. The latest run reloads when you return, and catalog edits apply to new runs.

## Skill gaps and roadmaps

Open a career from your recommendations to compare your ratings with its requirements. The chart shows the gaps, ordered by missing levels multiplied by skill importance. Generate a roadmap to start with foundation skills and open the learning resources for each step.

Use **Roadmaps** to reopen your plans. Mark steps as done to track progress. After finishing a step, confirm the separate skill rating update if you want your assessment to reflect it. Regenerating a roadmap keeps the status of steps that are still needed.

## Student dashboard

The dashboard shows profile and assessment completion, up to three matches from the latest saved recommendation run, active roadmap progress, and average saved skill ratings by category. A rating of zero is included in the average. Skills without a saved rating are excluded.

## Checks

| Folder | Commands |
| --- | --- |
| `client/` | `npm run lint`, `npm run format:check`, `npm run build` |
| `server/` | `npm run lint`, `npm run format:check`, `npm run build`, `npm test` |

The server tests cover health, authentication, access and validation, recommendation scoring, roadmap rules, and dashboard summaries. They use test data in memory. To check the live database connection, use the browser or the curl command above.

For a local demo, register a student and sign in. Save a profile and both assessments, generate matches, open a career, and complete a roadmap step. Refresh the dashboard to see your saved progress. Sign out and use the seeded admin account to open the catalog. Check both workspaces at desktop width and at 360px.

## Deployment

The frontend can run on Vercel, the API on Render, and PostgreSQL on Neon. Pick the Git branch you want to release and create a separate hosted database for it.

1. In Neon, create a database and copy its direct PostgreSQL connection string with TLS enabled. Use it for `DATABASE_URL` on Render and when running migrations. [Neon connection guide](https://neon.com/docs/connect/connect-from-any-app)
2. Create a Render Node web service with root directory `server`, build command `npm ci --include=dev && npm run build`, start command `npm start`, and health check path `/api/health`. Set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 bytes, and `CLIENT_URL` to the HTTPS origin of the Vercel project without a trailing slash. Render supplies `PORT`. [Render web services](https://render.com/docs/web-services)
3. Apply the checked-in migrations with `npm run db:migrate`. Render paid web services can use this as a pre-deploy command. On services without a pre-deploy command, run it from a trusted machine against the target database before each release. For first-time setup, run `npm run db:seed` from `server/` with the same database URL and the chosen `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Keep seed credentials in the environment used for seeding. [Render deploy commands](https://render.com/docs/deploys)
4. In Vercel, use the Vite preset, root directory `client`, build command `npm run build`, and output directory `dist`. Set `VITE_API_URL` to the Render HTTPS URL followed by `/api` before building. The checked-in rewrite serves the React app when a user opens a route directly. [Vercel SPA rewrites](https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404)
5. Open the API health endpoint, register a test student, sign in, and refresh a nested route such as `/assessment/skills`. Confirm the seeded admin can sign in and that public signup creates student accounts.

For a hosted API, verify that Express identifies the caller through the hosting proxy. Set `TRUST_PROXY_HOPS` only when you have verified the fixed number of trusted hops on every path to the API. The local default is `0`. Confirm that requests from separate clients have separate authentication rate limits before making the service public. [Express proxy settings](https://expressjs.com/en/guide/behind-proxies/)

See [plan.md](plan.md) for the architecture, scope, and implementation phases.
