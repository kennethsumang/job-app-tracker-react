# Job App Tracker — React web client

React + TypeScript + Vite frontend. Routing is handled by React Router (data
router) and translations by i18next + react-i18next.

## Commands

```bash
yarn dev       # start the dev server
yarn build     # type-check (tsc -b) and build for production
yarn preview   # preview the production build
yarn lint      # run oxlint
```

## Project structure

```
src/
├── app/                     # Application shell (composition root)
│   ├── App.tsx              # MUI provider + RouterProvider entry
│   ├── providers/           # App-wide providers (MUI theme)
│   ├── router/              # Route tree + browser router instance
│   ├── layouts/             # Shared layouts (RootLayout)
│   └── pages/               # App-level pages (404)
├── features/                # Vertical feature slices
│   └── <feature>/
│       ├── index.ts         # Public API (routes, paths, exports)
│       ├── routes.tsx       # Feature route objects (lazy loaded)
│       ├── pages/           # Route components + CSS modules
│       ├── components/      # Feature-only components
│       ├── hooks/           # Feature-only hooks
│       ├── services/        # API/data access
│       └── locales/         # <language>/<namespace>.json
├── shared/                  # Feature-agnostic building blocks
│   └── components/          # Reusable UI
├── i18n/                    # i18next setup, config, bundled resources
│   ├── index.ts             # Initialization + <html lang> sync
│   ├── config.ts            # Languages + namespace registry
│   ├── language.ts          # Detection + persistence
│   ├── resources.ts         # Bundled translation registry
│   ├── types/               # Type-safe translation keys
│   └── locales/             # Global `common` namespace
└── main.tsx                 # Entry point (imports i18n before render)
```

## Adding a feature

1. Create `src/features/<feature>/`.
2. Export its route objects and path helpers from `index.ts`:

   ```ts
   export { applicationsPaths, applicationsRoutes } from './routes'
   ```

3. Lazy-load route components from `routes.tsx`:

   ```tsx
   lazy: async () => {
     const { ApplicationsPage } = await import('./pages/ApplicationsPage')
     return { Component: ApplicationsPage }
   }
   ```

4. Register the routes in `src/app/router/routes.tsx`.
5. Add translations under
   `src/features/<feature>/locales/<lang>/<namespace>.json`.

Features may depend on `shared` and `i18n`; they must not import from `app`.
Only the `app` layer (router/layouts) composes features together.

## Internationalization

- Supported languages: `en` (fallback) and `es` — see `src/i18n/config.ts`.
- The initial language comes from the persisted choice, then the browser
  preferences, then `en`. Choices are stored in `localStorage` and
  `<html lang>` is kept in sync automatically.
- Add a language by updating `supportedLanguages` and adding the locale files.
- Add a namespace by creating the JSON files and registering it in
  `src/i18n/config.ts` and `src/i18n/resources.ts`.
- Translation keys are fully typed (`src/i18n/types/i18next.d.ts`): misspelled
  keys fail the build.

## Auth routes

- `/` → `LoginPage` (`src/features/auth/pages/LoginPage.tsx`)
- `/auth/register` → `RegisterPage` (`src/features/auth/pages/RegisterPage.tsx`)

Both render outside `RootLayout`, so they are full-screen and do not show the
app navigation. Paths live in `authPaths` (`src/features/auth/routes.tsx`).

The forms are wired to better-auth through `useSignIn` / `useSignUp`:

- Client-side validation uses `SignInValidator` / `SignUpValidator`.
- Errors are mapped with `humaniseError` and shown in an `ErrorBanner`.
- A Turnstile token is attached when the widget is active.
- Successful auth redirects to the originally requested app route or
  `APP_HOME_PATH` (`/applications`).
- Already-authenticated users are redirected away from the auth pages.
- `AuthProvider` resolves the session before the router renders, and
  `RootLayout` redirects unauthenticated users back to `/`.

### Auth API configuration

The browser calls same-origin `/api/auth/*`; the Vite dev server proxies it to
`API_URL` (see `.env.example`, default `http://localhost:3000`). The API's
`CORS_ORIGIN` / trusted origins must include this app's origin (for example
`http://localhost:5173`). Production deployments must expose the same
`/api/auth` reverse proxy, or the client must be given an explicit `baseURL`.

## Turnstile

Both auth forms render `TurnstileWidget`
(`src/features/auth/components/TurnstileWidget.tsx`), ported from the web app.
It behaves like the web version:

- Disabled (renders nothing) while running the Vite dev server or when
  `VITE_TURNSTILE_SITE_KEY` is empty.
- Refreshes the token automatically after 4 minutes.
- Exposes `getResponse()` and `reset()` via a ref for when auth logic is wired:

  ```tsx
  const turnstileRef = useRef<TurnstileWidgetRef | null>(null)

  <TurnstileWidget ref={turnstileRef} />
  const turnstileToken = await turnstileRef.current?.getResponse()
  ```

Configure the public site key in `.env.local` (gitignored; see
`.env.example`):

```bash
VITE_TURNSTILE_SITE_KEY=your-cloudflare-site-key
```

## MUI

The setup mirrors `job-app-tracker-web`, adapted for a Vite SPA (the
Next-specific `@mui/material-nextjs` cache provider is not needed):

- `src/app/providers/MuiProvider.tsx` creates the shared theme and mounts
  `ThemeProvider` + `CssBaseline`.
- `src/app/App.tsx` wraps the router with `MuiProvider`, so every route has
  access to the theme.
- Theme: light/dark `colorSchemes` (follows the OS preference), Geist
  typography, and an 8px base radius.
- Geist is self-hosted via `@fontsource-variable/geist` (imported in
  `src/main.tsx`) and exposed as `--font-geist-sans` in `src/index.css`.
- `CssBaseline` owns the base body typography and colors. App-specific surface
  tokens used by CSS modules (`--color-*`, `--radius-md`) stay in
  `src/index.css` and switch with the same OS preference.

Usage:

```tsx
import Button from '@mui/material/Button'
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded'

<Button variant="contained" startIcon={<WorkOutlineRoundedIcon />}>
  Add application
</Button>
```

## Path aliases

`@/*` maps to `src/*` in both Vite (`vite.config.ts`) and TypeScript
(`tsconfig.app.json`). Prefer absolute imports across features and shared code.
