# End-to-end tests (Playwright)

Production-style E2E coverage for the React client. The suite runs the real app
(router, providers, react-query, MUI) in a real browser and mocks the HTTP API at
the network boundary, so tests are hermetic, fast and deterministic.

## Running

```bash
yarn test:e2e                                   # Chromium, headless
E2E_BROWSERS=firefox,webkit yarn test:e2e       # extra browsers
yarn test:e2e:ui                                # interactive UI mode
yarn test:e2e:headed                            # watch it run
yarn test:e2e:report                            # open the last HTML report
```

| Variable          | Default                 | Purpose                                        |
| ----------------- | ----------------------- | ---------------------------------------------- |
| `E2E_BASE_URL`    | `http://localhost:5173` | Target an existing deployment (skips dev server) |
| `E2E_WEB_SERVER`  | –                       | `off` disables the managed Vite server          |
| `E2E_PORT`        | `5173`                  | Port for the managed Vite server                |
| `E2E_BROWSERS`    | `chromium`              | Comma-separated Playwright projects             |

`playwright.config.ts` starts `yarn dev` automatically (`webServer`), pins
`locale: en-US` and `timezoneId: UTC` (the app detects its language from
`navigator` and formats dates with Intl), and keeps traces, failure screenshots
and videos under the git-ignored `test-results/` directory.

## Layout

```
tests/e2e/
├── global-setup.ts          # reachability check + Vite module-graph warm-up
├── fixtures/
│   ├── index.ts             # extended `test` with authApi/appApi + POMs
│   └── users.ts             # deterministic user/session/password fixtures
├── mocks/
│   ├── http.ts              # `{ data, meta }` envelope + error helpers
│   ├── auth-api.mock.ts     # stateful /api/auth/* mock
│   └── app-data-api.mock.ts # applications + interviews reads
├── pages/
│   ├── login.page.ts
│   ├── register.page.ts
│   ├── dashboard.page.ts
│   ├── applications-list.page.ts
│   ├── application-detail.page.ts
│   ├── application-form-dialog.page.ts
│   ├── add-application-dialog.page.ts
│   ├── status-change-dialog.page.ts
│   ├── interview-form-dialog.page.ts
│   ├── delete-application-dialog.page.ts
│   └── calendar.page.ts
├── specs/
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login.spec.ts             # happy paths
│   │   │   ├── login-validation.spec.ts  # client-side validation
│   │   │   └── login-errors.spec.ts      # API failure mapping
│   │   ├── register/
│   │   │   ├── register.spec.ts             # happy paths
│   │   │   ├── register-validation.spec.ts  # client-side validation
│   │   │   └── register-errors.spec.ts      # API failure mapping
│   │   └── session-guard.spec.ts         # guard, bootstrap, sign-out
│   ├── dashboard/
│   │   ├── dashboard.spec.ts             # widgets, counters, navigation, sign-out
│   │   ├── dashboard-errors.spec.ts      # failing counters/interviews/list
│   │   └── add-application.spec.ts       # Add Application dialog
│   ├── applications/
│   │   ├── applications-list.spec.ts        # search/status/deleted filters + pagination
│   │   ├── applications-list-errors.spec.ts # failing list requests
│   │   ├── create-application.spec.ts       # FAB create (happy + failure)
│   │   ├── edit-application.spec.ts         # entry edit (happy + failure)
│   │   ├── delete-application.spec.ts       # entry delete (happy + failure)
│   │   ├── application-detail.spec.ts       # header, edit, status, delete, add interview
│   │   └── application-detail-errors.spec.ts # failing detail actions
│   └── calendar/
│       └── calendar.spec.ts              # month grid, events, day dialog
```

## Conventions

- **AAA** — every test reads `// Arrange`, `// Act`, `// Assert`.
- **Page objects** own selectors and copy. Specs never call `page.locator`.
  Selectors are role/label/id based (the app ships no `data-testid`s); inputs use
  their ids because MUI appends the required asterisk to the visible label.
- **Fixtures over helpers** — `authApi`, `appApi`, `loginPage`, `registerPage`,
  `dashboardPage`, `applicationsListPage`, `applicationDetailPage` and
  `calendarPage` are injected. `authApi`/`appApi` are `auto`, so a spec can
  never reach the real backend by accident.
- **No arbitrary sleeps** — assert loading states with `expect(locator)` and use
  the mock's `latencyMs` options to make them observable.
- **Deterministic data** — accounts and applications live in
  `fixtures/users.ts` and `mocks/app-data-api.mock.ts`; `NEW_ACCOUNT` is the
  brand-new account registered by the sign-up specs.

## API mocks

`AuthApiMock` is stateful, mirroring the cookie session:

| Request                          | Behaviour                                                        |
| -------------------------------- | ---------------------------------------------------------------- |
| `GET /api/auth/get-session`      | `{ session, user }` when authenticated, literal `null` otherwise |
| `POST /api/auth/sign-in/email`   | configurable success/failure outcome + optional latency          |
| `POST /api/auth/sign-up/email`   | `{ token, user }` and flips the mocked session                   |
| `POST /api/auth/sign-out`        | `{ success: true }` and clears the mocked session                |

Failure outcomes cover invalid credentials, already-registered email, rate
limiting, CAPTCHA failure, unverified email, a stricter server-side password
policy, validation rejection, 5xx and network aborts. Specs assert the
*humanised* copy produced by `src/lib/auth-errors.ts`, not the raw API message.

`AppDataApiMock` serves what the dashboard and the pages it links to need:

| Request                                  | Behaviour                                                        |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `GET /api/applications`                  | `{ data, count }` page, filtered by `statuses` (repeated), `search` and `showDeleted` |
| `POST /api/applications`                 | creates (201) and appends to the seed, so counters move          |
| `PATCH /api/applications/:id`            | updates (200) and replaces the seeded application                |
| `DELETE /api/applications/:id`           | soft-deletes (200), setting `deletedAt`                          |
| `PATCH /api/applications/:id/status`     | changes the status (200) and replaces the seed                   |
| `POST /api/applications/:id/restore`     | restores (200), clearing `deletedAt`                             |
| `POST /api/applications/:id/interviews`  | creates an interview (201) and appends to the seed               |
| `PATCH /api/applications/:id/interviews/:interviewId` | updates an interview (200)                          |
| `DELETE /api/applications/:id/interviews/:interviewId` | deletes an interview (204)                          |
| `GET /api/applications/:id`              | single application, `404` when the id is unknown                  |
| `GET /api/applications/:id/interviews`   | interviews of that application                                    |
| `GET /api/interviews/upcoming`           | interviews at/after `from`, sorted, limited by `top`              |
| `GET /api/interviews`                    | interviews inside `[from, to)`, sorted                           |

It also offers the knobs the failure/loading specs need:

- `setApplications()` / `setInterviews()` (and `setUpcomingInterviews()`)
  replace the seed (the dashboard's counters are derived from
  `dashboardCounts`, never hardcoded).
- `setLatency()` delays every response so loading placeholders stay observable.
- `failApplications()`, `failCreateApplication()`, `failUpdateApplication()`,
  `failDeleteApplication()`, `failStatusChange()`, `failCreateInterview()`,
  `failUpdateInterview()`, `failDeleteInterview()`, `failApplicationDetail()`
  and `failUpcomingInterviews()` inject a `{ status, message }` failure or
  `'network-error'`; `clearFailures()` restores the happy path (used by the
  retry tests).
- `applicationListRequests` / `createRequests` / `updateRequests` /
  `deleteRequests` / `statusChangeRequests` / `createInterviewRequests` /
  `updateInterviewRequests` / `deleteInterviewRequests` /
  `upcomingInterviewRequests` log what the UI asked for, so specs can assert
  the request contract instead of sleeping.

## Why not a global storage state?

`storageState` is for cookie-based auth against a real backend. Here the session
is produced by `AuthApiMock`, so tests start anonymous and opt into an
authenticated session with `authApi.authenticateAs(user)` — or drive the login
form itself when the journey is the thing under test.
