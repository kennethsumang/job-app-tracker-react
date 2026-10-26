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
│   ├── dashboard.page.ts
│   └── register.page.ts
└── specs/auth/
    ├── login/
    │   ├── login.spec.ts             # happy paths
    │   ├── login-validation.spec.ts  # client-side validation
    │   └── login-errors.spec.ts      # API failure mapping
    ├── register/
    │   ├── register.spec.ts             # happy paths
    │   ├── register-validation.spec.ts  # client-side validation
    │   └── register-errors.spec.ts      # API failure mapping
    └── session-guard.spec.ts         # guard, bootstrap, sign-out
```

## Conventions

- **AAA** — every test reads `// Arrange`, `// Act`, `// Assert`.
- **Page objects** own selectors and copy. Specs never call `page.locator`.
  Selectors are role/label/id based (the app ships no `data-testid`s); inputs use
  their ids because MUI appends the required asterisk to the visible label.
- **Fixtures over helpers** — `authApi`, `appApi`, `loginPage`, `registerPage`
  and `dashboardPage` are injected. `authApi`/`appApi` are `auto`, so a spec can
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

`AppDataApiMock` serves `GET /api/applications` (list + count, filtered by the
repeated `statuses` query key) and `GET /api/interviews/upcoming`, which is what
the dashboard needs after a successful sign-in.

## Why not a global storage state?

`storageState` is for cookie-based auth against a real backend. Here the session
is produced by `AuthApiMock`, so tests start anonymous and opt into an
authenticated session with `authApi.authenticateAs(user)` — or drive the login
form itself when the journey is the thing under test.
