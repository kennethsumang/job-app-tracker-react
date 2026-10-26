/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests/unit'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  // Only business logic that is expected to have unit tests. Pages,
  // components, layouts, providers, routes, hooks and CSS are covered by
  // type-checking/Playwright instead of Jest.
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/features/**/services/**/*.ts',
    'src/features/**/store/**/*.ts',
    'src/features/**/validators/**/*.ts',
    'src/features/core/**/*.ts',
    'src/i18n/config.ts',
    'src/i18n/language.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['text', 'text-summary', 'lcov'],
}
