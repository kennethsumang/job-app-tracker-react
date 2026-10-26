import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Auth guard, session bootstrap and sign-out coverage.
 *
 * These tests rely on the stateful `authApi` mock: a sign-in or a pre-seeded
 * session changes what `GET /api/auth/get-session` returns, exactly like the
 * real cookie session.
 */

const account = TEST_ACCOUNTS.verified
const credentials = { email: account.user.email, password: account.password }

test.describe('Session guard', () => {
  test('redirects an anonymous visitor from a protected route to the login page', async ({
    loginPage,
    page,
  }) => {
    // Arrange — anonymous session is the fixture default.

    // Act
    await page.goto('/app')

    // Assert
    await expect(page).toHaveURL('/')
    await loginPage.expectLoaded()
  })

  test('returns the user to the originally requested route after signing in', async ({
    authApi,
    loginPage,
    page,
  }) => {
    // Arrange
    const requestedRoute = '/app/applications'
    authApi.respondWith({ outcome: 'success', user: account.user })

    // Act
    await page.goto(requestedRoute)
    await loginPage.expectLoaded()
    await loginPage.signIn(credentials)

    // Assert
    await expect(page).toHaveURL(requestedRoute)
  })

  test('shows the session loading state before rendering the router', async ({
    authApi,
    loginPage,
    page,
  }) => {
    // Arrange
    authApi.setSessionLatency(750)

    // Act
    await page.goto('/')

    // Assert — the AuthProvider gates the router behind a status indicator
    await expect(page.getByRole('status')).toBeVisible()
    await loginPage.expectLoaded()
  })

  test('redirects an authenticated user away from the login page', async ({
    authApi,
    dashboardPage,
    page,
  }) => {
    // Arrange
    authApi.authenticateAs(account.user)

    // Act
    await page.goto('/')

    // Assert
    await dashboardPage.expectLoaded()
  })

  test('keeps an authenticated user signed in across a reload', async ({
    authApi,
    dashboardPage,
    loginPage,
    page,
  }) => {
    // Arrange
    authApi.respondWith({ outcome: 'success', user: account.user })
    await loginPage.goto()
    await loginPage.signIn(credentials)
    await dashboardPage.expectLoaded()
    const probesBeforeReload = authApi.getSessionCalls

    // Act
    await page.reload()

    // Assert
    await dashboardPage.expectLoaded()
    expect(authApi.getSessionCalls).toBeGreaterThan(probesBeforeReload)
  })

  test('lets an authenticated user deep-link into a protected route', async ({
    authApi,
    dashboardPage,
    page,
  }) => {
    // Arrange
    authApi.authenticateAs(account.user)

    // Act
    await page.goto('/app/applications')

    // Assert
    await expect(page).toHaveURL('/app/applications')
    await expect(dashboardPage.signOutButton).toBeVisible()
  })

  test('signs the user out and blocks the protected routes again', async ({
    authApi,
    dashboardPage,
    loginPage,
    page,
  }) => {
    // Arrange
    authApi.authenticateAs(account.user)
    await dashboardPage.goto()

    // Act
    await dashboardPage.signOut()

    // Assert — back on the login screen, session cleared
    await loginPage.expectLoaded()
    await expect(page).toHaveURL('/')
    expect(authApi.signOutCalls).toBe(1)

    // Act — try to reach the shell again
    await page.goto('/app')

    // Assert
    await expect(page).toHaveURL('/')
    await loginPage.expectLoaded()
  })
})
