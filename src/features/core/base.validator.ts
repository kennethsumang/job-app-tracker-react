import type { z } from 'zod'

/**
 * A map of field names to their corresponding validation error messages.
 */
export type ValidationErrors = Record<string, string[]>

/**
 * The result of a validation operation.
 */
export type ValidationResult<T> =
  | { success: true; data: T; errors: null }
  | { success: false; data: null; errors: ValidationErrors }

/**
 * Base validator class that provides schema-based validation using Zod.
 *
 * Copied from `job-app-tracker-web` so the auth validators can be shared
 * between the Next.js and Vite clients.
 */
export abstract class BaseValidator<T> {
  protected abstract readonly schema: z.ZodType<T>

  validate(data: unknown): ValidationResult<T> {
    const result = this.schema.safeParse(data)

    if (result.success) {
      return { success: true, data: result.data, errors: null }
    }

    const errors: ValidationErrors = {}

    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!errors[field]) {
        errors[field] = []
      }
      errors[field].push(issue.message)
    }

    return { success: false, data: null, errors }
  }
}
