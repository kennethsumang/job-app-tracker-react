import { z } from "zod";
import { BaseValidator } from "@/features/core/base.validator";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fields validated by the forgot-password form. */
export interface ForgotPasswordInput {
  email: string;
}

/** Validates the forgot-password email field. */
export class ForgotPasswordValidator extends BaseValidator<ForgotPasswordInput> {
  protected readonly schema = z.object({
    email: z
      .string()
      .refine((value) => value.trim().length > 0, {
        message: "Email is required.",
      })
      .refine((value) => EMAIL_REGEX.test(value.trim()), {
        message: "Enter a valid email address.",
      }),
  });
}
