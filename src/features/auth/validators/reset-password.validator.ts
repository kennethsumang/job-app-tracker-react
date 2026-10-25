import { z } from "zod";
import { BaseValidator } from "@/features/core/base.validator";

/** Fields validated by the reset-password form. */
export interface ResetPasswordInput {
  password: string;
  confirmPassword: string;
}

/**
 * Validates reset-password fields, including minimum length, character
 * complexity, and confirmation matching.
 */
export class ResetPasswordValidator extends BaseValidator<ResetPasswordInput> {
  protected readonly schema = z
    .object({
      password: z
        .string()
        .refine((value) => value.length > 0, {
          message: "Password is required.",
        })
        .refine((value) => value.length >= 8, {
          message: "Password must be at least 8 characters.",
        })
        .refine((value) => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value), {
          message: "Password must contain uppercase, lowercase, and number.",
        }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.confirmPassword === data.password, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });
}
