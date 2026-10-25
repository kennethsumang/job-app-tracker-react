import type { RouteObject } from 'react-router'

/** Public auth route paths. */
export const authPaths = {
  login: '/',
  register: '/auth/register',
} as const

/** Lazy route definitions for login and registration. */
export const authRoutes: RouteObject[] = [
  {
    path: authPaths.login,
    lazy: async () => {
      const { LoginPage } = await import('./pages/LoginPage')
      return { Component: LoginPage }
    },
  },
  {
    path: authPaths.register,
    lazy: async () => {
      const { RegisterPage } = await import('./pages/RegisterPage')
      return { Component: RegisterPage }
    },
  },
]
