---
adlc: plan
slug: family-tree-website
status: approved
source: docs/adlc/family-tree-website/spec.md@e3352aed2bbf6f23c0c493a9be1ebb25aff5a111
---

# Private family tree website plan

> Drafted by an agent from the approved spec. Snapshot: the repository was empty (no commits on `main`) when this plan was written on 2026-09-27.

## Decisions

These technology choices were made by Joe (owner) during planning. The spec leaves the stack open, so none of them changes it.

| Area | Decision | Basis |
| --- | --- | --- |
| Application | Next.js 16 (App Router, Server Actions), TypeScript in strict mode, `output: "standalone"` | Joe's choice; this is the official self-hosting path (nextjs.org/docs/app/guides/self-hosting) |
| Database | PostgreSQL, with every ID column a UUID | Joe's choice, plus the global convention of UUID IDs |
| Database access and migrations | Drizzle ORM and drizzle-kit, with SQL migrations committed to the repo | Research: no code-generation step to break the Docker build, and migrations are readable SQL |
| Sign-in | Better Auth with the Google provider, database sessions, and a hook that runs before sign-in and checks the invitations table | Research: Auth.js has been maintenance-only since September 2025 and Lucia is deprecated. Database sessions make revoking an invitation take effect immediately (AC-004). |
| Hosting | Joe's VPS running Docker Compose: an app container, a Postgres container that isn't exposed publicly, and Caddy for automatic HTTPS | Joe's choice, plus research |
| Backups | A nightly `pg_dump` in custom format, copied off the server, with a restore drill before launch | Research: adequate at this scale |
| Tree drawing | Decided by slice S2. The leading candidate is React Flow (`@xyflow/react`) with elkjs for layout; the fallback is family-chart (donatso) | Research: no library has published figures for 1,000 people on a phone, so a timed prototype decides |
| GEDCOM | Import with `read-gedcom`. Export with our own writer (no maintained writer library exists). "Step" parent links use a custom `_PEDI step` tag, because standard GEDCOM has no step value. | Research, from GEDCOM 5.5.1 (PEDI values: birth, adopted, foster, sealing) |
| Relationship naming | Our own code: find the closest shared ancestor, count generations from each person, and look the result up in a naming table. In-laws are handled as a separate step through partner links. | Research: there's no maintained JavaScript library for this |
| Tests | Vitest for unit and integration tests, Playwright for end-to-end tests. End-to-end tests sign in by creating a session directly in the test database; they never contact Google. | Research |

## Proposed AC-015 thresholds (for sign-off)

The spec approval required the plan to propose these numbers. Joe signs them off at the plan gate, and slice S2 checks that they can actually be met.

**Test setup:**
- **Device:** a mid-range Android phone (Pixel 6a class) running current Chrome. When no device is available, use Chrome DevTools with 4× CPU slowdown and "Fast 4G" network speed.
- **Data:** a generated tree of 1,000 people spanning 8 generations, where about 10% of people have more than one partner.

**Thresholds:**
- **T1:** from signing in to the tree being usable on screen, at most **3 s** the first time the page loads and at most **1.5 s** when it loads again.
- **T2:** while panning or pinch-zooming continuously, a median of at least **45 frames per second**, and no frame taking longer than **100 ms**.
- **T3:** after choosing a search result or a person, the tree is centred on them within **500 ms**.
- **T4:** search results show within **300 ms** of typing stopping.
- **T5:** a "how are we related?" answer shows within **1 s**.

## Slices

Status key: `ready` means all inputs and permissions are available now; `blocked` means it is waiting on the slices or decisions named.

### S0: Walking skeleton (status: ready)

**Outcome:** a Next.js application that runs locally against a Postgres database, with checks for code style, types, unit tests and end-to-end tests all passing.

**Owns:** the repository root, application configuration, database schema setup, Docker Compose for local development, and test setup.

**Steps:**
1. Create a Next.js 16 app in the repository root with TypeScript, the App Router, ESLint, a `src/` folder, and pnpm as the package manager. Set `output: "standalone"`.
2. Add Drizzle ORM, the `pg` Postgres driver and drizzle-kit. Create an empty schema module, commit the drizzle-kit settings, and add `db:generate` and `db:migrate` scripts.
3. Add a `docker-compose.dev.yml` containing a Postgres 17 service, plus a `.env.example` listing the settings needed: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `OWNER_EMAIL`.
4. Add a `/api/health` endpoint that runs `select 1` against the database and responds `{ ok: true }`.
5. Add Vitest, with one integration test of the health check against the database, and Playwright, with one test that loads the home page.
6. Add package scripts `lint`, `typecheck`, `test` and `test:e2e`, plus a `check` script that runs all four. Add a README section explaining how to run the app locally.

**Acceptance:** from a fresh clone, running `docker compose -f docker-compose.dev.yml up -d`, then `pnpm i`, then `pnpm db:migrate`, then `pnpm check` exits with status 0.
**Check that could falsify it:** run that command sequence in a clean checkout.
**Blocked by:** nothing.

### S1: Invite-only access (status: blocked on S0)

**Outcome:** only invited Google accounts can see anything, and the owner can manage invitations and see who has used the site.

**Scope:**
- Better Auth with Google, storing sessions in Postgres.
- An `invitations` table (id, email, invited_by, invited_at, revoked_at).
- A hook that runs before sign-in and rejects any email without an active invitation.
- The owner is the account whose email matches `OWNER_EMAIL`. An owner-only guard runs on the server for every owner-only route and Server Action.
- Revoking an invitation deletes that relative's sessions.
- Every page and API response carries the robots header `X-Robots-Tag: noindex, nofollow`, plus a `robots.txt` that disallows everything.
- An owner page to add or revoke invitations. For each relative it shows the last sign-in time and the number of sign-ins, and it shows the count of relatives who have signed in since launch (for AC-024).
- A helper that creates sessions directly in the database for end-to-end tests. It is only available when the app runs in test mode.

**Acceptance:** AC-001 to AC-005, and the data needed for AC-024.
**Check:** automated tests that sweep every route and API endpoint signed out, as a non-invited user, as a revoked user and as a non-owner.
**Blocked by:** S0. **External gate:** Joe provides Google OAuth credentials for local development and for production.

### S2: Tree drawing prototype (status: ready; discovery)

**Outcome:** a decision on which library draws the tree, based on measurements, and T1 to T5 measured against the proposed thresholds.

**Scope:**
- A throwaway prototype in `spikes/tree-render/`, kept separate from the application code.
- A generator for a 1,000-person tree in the shape the spec describes: several partners per person, adopted and step links, unknown parents.
- Build the tree view with React Flow and elkjs, and separately with family-chart. Each must centre on a selected person, show adopted and step links differently, and pan and pinch-zoom.
- Measure T1 to T3 for each option in the test setup described above.
- Check family-chart's license file, which is recorded as ISC in one place and MIT in another.

**Acceptance:** a written result at `spikes/tree-render/RESULT.md` with a table of measurements for each library, the recommended library, and any threshold that can't be met.
**Check:** Joe reviews the result and confirms the library and thresholds.
**Blocked by:** nothing. Slice S5 is blocked until this result is signed off.

### S3: People, relationships and change history (status: blocked on S1)

**Outcome:** relatives can record people and relationships of every kind the spec requires, and every change is recorded in the history.

**Scope:**
- A `persons` table with name, gender, birth and death dates, birth, death and residence places, and notes. Dates are stored as structured values: a qualifier (exact, about, estimated, before, after, or between), one or two partial dates each with year, month and day where known, and the original text as entered.
- A `partnerships` table (two people, a start date, an end date, and a status such as current, divorced or widowed).
- A `parent_links` table (parent, child, an optional partnership, and a type: biological, adopted or step).
- A `changes` table recording who made each change, when, the kind of record, the record ID, the operation, and the record before and after. It is written in the same database transaction as the change itself.
- Server Actions to add, edit and delete people and relationships, plus simple forms.

**Acceptance:** AC-006, AC-007, AC-010, AC-016, AC-017, and the stored data needed for AC-008 and AC-009.
**Check:** integration tests covering every date form and relationship type, the history rows written for each operation, and a second session seeing the change after reloading.
**Blocked by:** S1, because history records who made each change.

### S4: Owner history view and revert (status: blocked on S3)

**Outcome:** the owner can browse the history and undo any single change.

**Scope:**
- An owner-only page listing history entries.
- Reverting an entry applies its "before" state and writes a new history entry for the revert.
- If a later change touched the same record, the revert is refused with an explanation rather than overwriting that later change.

**Acceptance:** AC-018.
**Check:** tests covering reverting an add, an edit and a delete; a revert blocked by a later change; and a revert attempted by a non-owner being refused.
**Blocked by:** S3.

### S5: Visual tree view (status: blocked on S2 sign-off and S3)

**Outcome:** the production tree view, built with the library chosen in S2.

**Scope:**
- Pan and zoom.
- Selecting a person centres the view on them, with ancestors above and descendants below.
- A panel showing the selected person's details.
- Partnerships drawn with their own children beneath them.
- Adopted and step links styled differently from biological ones.
- Unknown parents drawn without placeholder people.
- Layout recalculated only when the data changes, not on every pan or zoom.

**Acceptance:** AC-008 and AC-009 (as seen on screen), AC-011, AC-012, and AC-015 (T1 to T3).
**Check:** Playwright tests for centring and the details panel; a performance run on the 1,000-person tree against T1 to T3; a manual check by Joe on a phone.
**Blocked by:** S2 sign-off and S3.

### S6: Search (status: blocked on S5)

**Outcome:** find someone by typing part of their name.

**Scope:** search on the server, ignoring upper and lower case and accents, over all names. Choosing a result centres the tree on that person.

**Acceptance:** AC-013, and AC-015 (T3 and T4).
**Check:** integration tests for matching; a Playwright test from search to a centred tree; a timing check.
**Blocked by:** S5, for centring.

### S7: "How are we related?" (status: blocked on S3; the interface part on S5)

**Outcome:** pick two people and see what they are to each other and the chain of people linking them.

**Scope:**
- A pure function that finds the closest shared ancestor using parent links only.
- A naming table covering parent and child, sibling and half-sibling, grandparent and "great" levels, aunt or uncle and niece or nephew, and cousins of any degree including "removed".
- An in-law step through partnerships.
- A "no known connection" result when nothing links the two people.
- A two-person picker in the interface that highlights the chain on the tree.

**Acceptance:** AC-014, and AC-015 (T5).
**Check:** unit tests against a fixture tree with at least 25 pairs whose answers are known (including half-relations, several "removed" cases, in-laws, adopted links and no connection); a Playwright test of the picker.
**Blocked by:** S3 for the function; S5 for the interface.

### S8: GEDCOM import (status: blocked on S3)

**Outcome:** the owner uploads a GEDCOM file, its contents are added to the tree, and the owner sees a summary.

**Scope:**
- Parse the file with `read-gedcom`.
- Map individuals, families, dates (ABT, EST, BEF, AFT, BET…AND, FROM…TO, month-only) and pedigree values (birth, adopted, and the custom `_PEDI step`) onto the data model.
- Any value the model can't hold is listed in the summary as skipped.
- The whole import runs in a single database transaction and is recorded as one history entry.
- Only the owner can import.

**Acceptance:** AC-019 and AC-020.
**Check:** integration tests using `555SAMPLE.GED` and `REMARR.GED` from gedcom.org/samples.html, `TGC551.ged` (a test file that exercises every GEDCOM tag), and `The Kennedy Family.ged` from github.com/findmypast/gedcom-samples; plus a corrupt file and a non-GEDCOM file, after each of which the tree must be unchanged.
**Blocked by:** S3 (and S1 for the owner check).

### S9: GEDCOM export (status: blocked on S8)

**Outcome:** any signed-in relative can download the whole tree as a GEDCOM 5.5.1 file.

**Scope:**
- Our own writer that turns people, partnerships (as FAM records) and parent links (as FAMC records with PEDI) into GEDCOM, and dates back into GEDCOM date phrases.
- The file uses UTF-8.

**Acceptance:** AC-021.
**Check:** a round-trip test: export a fixture tree, import the file into an empty database, and compare every person, detail and relationship field. The fixture includes step links and approximate dates.
**Blocked by:** S8, which the round-trip check needs.

### S10: Phone usability pass (status: blocked on S4 to S9)

**Outcome:** every feature works on a phone-sized screen.

**Scope:**
- Responsive layout down to 360 px wide.
- Controls at least 44 × 44 px so they can be tapped.
- No horizontal page scrolling.

**Acceptance:** AC-022.
**Check:** Playwright tests at 360 × 740 on every page, checking for horizontal scrolling and the size of controls; a manual walkthrough by Joe on a real phone.
**Blocked by:** S4 to S9.

### S11: Production deployment and backups (status: blocked on S1; external gates)

**Outcome:** the site runs over HTTPS on Joe's VPS, with backups that have been shown to restore.

**Scope:**
- A multi-stage Dockerfile using the standalone output.
- `docker-compose.prod.yml` with the app, Postgres (on an internal network only) and Caddy.
- Database migrations run in a one-off step before the app starts.
- A nightly `pg_dump` in custom format with an offsite copy, keeping 14 daily and 8 weekly backups.
- A restore procedure in `docs/ops/restore.md`, and a restore drill onto a scratch database.

**Acceptance:** the constraints on data durability, privacy (encrypted connections, no indexing) and security.
**Check:**
- HTTPS works and plain HTTP redirects to it.
- Postgres can't be reached from the internet (confirmed by a port scan).
- The restore drill brings back the same number of rows.
- Responses carry `X-Robots-Tag`.

**Blocked by:** S1 (it can be prepared earlier). **External gates:** Joe provides the VPS, a domain, DNS, production Google OAuth credentials, and an offsite backup location.

### S12: Launch check (status: blocked on all slices)

**Outcome:** the whole journey works in production.

**Scope:**
- The full Playwright suite against a staging copy of the production setup.
- Joe invites one real relative, who signs in on their own phone and browses the tree (the manual part of AC-002).
- The AC-015 performance run on the production host.
- AC-023 and AC-024 are then tracked after launch: Joe reviews the tree for completeness, and after 3 months reads the sign-in count on the owner page.

**Acceptance:** all build criteria (AC-001 to AC-022) pass together. AC-023 and AC-024 have a way to be read.
**Blocked by:** S0 to S11.

### Dependencies and ready frontier

```text
S0 ─► S1 ─► S3 ─┬─► S4 ────────────────┐
                ├─► S5 ─┬─► S6         │
S2 (sign-off) ──┘       └─► S7 (UI)    ├─► S10 ─► S12
                ├─► S7 (function)      │
                └─► S8 ─► S9 ──────────┘
S1 ─► S11 (needs Joe's VPS, domain and credentials) ─► S12
```

**Ready now:** S0 and S2. They touch separate folders (the repository root versus `spikes/tree-render/`), so they can run in parallel.

**Why everything else is waiting:**
- S1 needs S0.
- S3 and S11 need S1.
- S4, S7 (the function) and S8 need S3.
- S5 needs S3 and Joe's sign-off on S2.
- S6 and S7 (the interface) need S5.
- S9 needs S8.
- S10 needs S4 to S9.
- S12 needs everything.

**Order of work:** S3 to S9 all change the same schema and migration files. From S3 onward, schema changes happen one slice at a time: each slice that changes the schema merges before the next one starts its migration. The root agent is the integration owner for this.

## Coverage

| Acceptance criterion | Slices | Check |
| --- | --- | --- |
| AC-001 | S1 | Automated sweep of every page and API endpoint while signed out |
| AC-002 | S1, S12 | Playwright test with a seeded invited session; one real relative signs in (S12) |
| AC-003 | S1 | Test that a non-invited account is rejected |
| AC-004 | S1 | Test that a revoked user loses access on their next request |
| AC-005 | S1, S4, S8 | Tests that owner-only functions refuse non-owners |
| AC-006 | S3 | Integration test adding a person with each combination of fields |
| AC-007 | S3, S8, S9 | Date tests for each form, plus the round trip through import and export |
| AC-008 | S3, S5 | Tests of link types in the data, plus a visual check that link styles differ |
| AC-009 | S3, S5 | Tests with several partnerships, plus a visual check that children are grouped under the right partnership |
| AC-010 | S3, S5 | Test that unknown parents don't create placeholder people |
| AC-011 | S5, S10 | Manual pan and zoom check on a desktop and a phone |
| AC-012 | S5 | Playwright test of centring and the details panel |
| AC-013 | S6 | Tests of search matching, plus a Playwright test that choosing a result centres the tree |
| AC-014 | S7 | Unit tests on a fixture of at least 25 known pairs, plus a Playwright test of the picker |
| AC-015 | S2, S5, S6, S7, S12 | Timing checks for T1 to T5 on the 1,000-person tree (S2 prototype, then production in S12) |
| AC-016 | S3 | Test that a second session sees the change after reloading |
| AC-017 | S3 | Test that each operation writes a history entry with before and after values |
| AC-018 | S4 | Revert tests, including a revert blocked by a later change |
| AC-019 | S8 | Import tests with the sample GEDCOM files and the summary |
| AC-020 | S8 | Test that a bad file leaves the tree unchanged |
| AC-021 | S9 | Round-trip test comparing every field |
| AC-022 | S10 | Playwright tests at 360 px wide, plus a manual phone walkthrough |
| AC-023 | S12 | Joe's review of the tree after launch (an outcome signal, not a build gate) |
| AC-024 | S1, S12 | Sign-in count on the owner page, read 3 months after launch (an outcome signal) |
| Constraints | S1, S11 | Robots header and noindex, owner-only guard on the server, HTTPS, Postgres not publicly reachable, restore drill |

## Assignment

Implementation agents are the `j03fr0st-skills:orchestrate-worker` agent on the premium model. Each one owns only the files its slice lists. A separate agent verifies each slice and must not be the one that built it. Joe does every check that needs a real device or a sign-off.

| Slice | Implementer | Verifier |
| --- | --- | --- |
| S0 | Worker agent | Tester agent reruns the clean-clone command sequence |
| S1 | Worker agent | Tester agent runs the access sweep; reviewer agent (security-review) checks the sign-in hook and owner guard |
| S2 | Worker agent | Joe reviews `RESULT.md` and signs off the library and thresholds |
| S3 | Worker agent | Tester agent |
| S4 | Worker agent | Tester agent |
| S5 | Worker agent | Tester agent (Playwright and timing checks); Joe checks it on a phone |
| S6 | Worker agent | Tester agent |
| S7 | Worker agent | Tester agent, using a fixture tree written independently from the naming table |
| S8 | Worker agent | Tester agent |
| S9 | Worker agent | Tester agent |
| S10 | Worker agent | Tester agent; Joe walks through it on a phone |
| S11 | Worker agent (prepares files and runbook); Joe runs the steps that touch the VPS | Joe does the restore drill and the port scan; reviewer agent (security-review) |
| S12 | Root agent (integration owner) | Joe and one real relative |

## Risks and rollback

- **The tree layout is harder than expected** (the chosen library doesn't handle multiple partners and centring well).
  - Mitigation: S2 measures both candidates before any production work.
  - Rollback: S2 is throwaway and doesn't affect the application.
- **The phone performance thresholds can't be met with 1,000 people.**
  - Mitigation: S2 finds this out early. Fallbacks are to draw only the people near the focus person, or to hide distant branches until opened.
  - Rollback: Joe revises T1 to T5 at sign-off.
- **Google-only sign-in shuts out relatives who don't have a Google account.** This is an open area of concern in the spec, owned by Joe.
  - Mitigation: Better Auth can add other providers later without changing the data model.
  - Rollback: none needed. Changing it would mean going back to `/adlc-spec`.
- **Family data leaks** (a route that skips the check, or the site gets indexed).
  - Mitigation: guards on the server, the automated access sweep, the robots header, and a security review in S1 and S11.
  - Rollback: revoke all sessions and take the site offline with `docker compose down`.
- **Data is lost or corrupted** (bad migration, bad import, disk failure).
  - Mitigation: history with revert, imports that apply completely or not at all, nightly offsite backups, a restore drill, and a `pg_dump` before every production deploy.
  - Rollback: restore the backup taken just before the deploy and go back to the previous image tag.
- **Step links are lost in other genealogy tools.** They are exported with the custom `_PEDI step` tag, which other tools may ignore.
  - Mitigation: our own round trip keeps them (AC-021). Document the limitation.
  - Rollback: not applicable.
- **Two people edit the same person at once and the later save wins** (an open concern in the spec).
  - Mitigation: history and revert.
  - Rollback: the owner reverts.
- **Rolling back a slice in general:** each slice is its own branch and pull request. Before merging, roll back by closing the pull request. After merging, revert the commit. A slice that changes the schema also adds a migration that undoes its change, and production is rolled back by restoring the backup taken before the deploy.

## Handoff

`orchestrate`, starting from the ready frontier: S0 and S2 in parallel, with the root agent as integration owner. After that, the slices that follow S3 run one at a time wherever they touch the schema.

Next action: carry out S0 as described above.

## Approvals

| Stage | Decision | Approver | Date | Reviewed revision | Conditions / reasons |
| --- | --- | --- | --- | --- | --- |
| plan | approved | Joe (owner) | 2026-09-27 | 72b8df19deb3944191101bc5a4da1d8a844bd2aa | — |
