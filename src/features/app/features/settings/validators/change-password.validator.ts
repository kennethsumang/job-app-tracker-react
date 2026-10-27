import { z } from 'zod'
import { BaseValidator } from '@/features/core/base.validator'

/** Raw input of the change-password dialog. */
export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * Validates the change-password dialog: a non-empty current password, a new
 * password of at least 8 characters that differs from the current one, and a
 * matching confirmation.
 */
export class ChangePasswordValidator extends BaseValidator<ChangePasswordInput> {
  protected readonly schema = z
    .object({
      currentPassword: z.string().refine((value) => value.length > 0, {
        message: 'Enter your current password.'
      }),
      newPassword: z
        .string()
        .refine((value) => value.length > 0, {
          message: 'Enter a new password.'
        })
        .refine((value) => value.length >= 8, {
          message: 'Password must be at least 8 characters.'
        }),
      confirmPassword: z.string().refine((value) => value.length > 0, {
        message: 'Please confirm your new password.'
      })
    })
    .refine(
      (data) =>
        data.newPassword.length === 0 ||
        data.newPassword !== data.currentPassword,
      {
        message: 'New password must differ from current password.',
        path: ['newPassword']
      }
    )
    .refine((data) => data.confirmPassword === data.newPassword, {
      message: 'Passwords do not match.',
      path: ['confirmPassword']
    })
}
