import { z } from "zod";
import { BaseValidator } from "@/features/core/base.validator";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fields validated by the registration form. */
export interface SignUpInput {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

/**
 * Validates registration: required fields, email format, an 8+ character
 * password, and a matching confirmation.
 */
export class SignUpValidator extends BaseValidator<SignUpInput> {
  protected readonly schema = z
    .object({
      email: z
        .string()
        .refine((value) => value.trim().length > 0, {
          message: "Email is required.",
        })
        .refine((value) => EMAIL_REGEX.test(value.trim()), {
          message: "Enter a valid email address.",
        }),
      name: z
        .string()
        .refine((value) => value.trim().length > 0, {
          message: "Name is required.",
        })
        .refine((value) => value.trim().length <= 128, {
          message: "Name must be 128 characters or fewer.",
        }),
      password: z
        .string()
        .refine((value) => value.length > 0, {
          message: "Password is required.",
        })
        .refine((value) => value.length >= 8, {
          message: "Password must be at least 8 characters.",
        }),
      confirmPassword: z.string().refine((value) => value.length > 0, {
        message: "Please confirm your password.",
      }),
    })
    .refine((data) => data.confirmPassword === data.password, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });
}
