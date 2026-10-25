import { z } from "zod";
import { BaseValidator } from "@/features/core/base.validator";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fields validated by the login form. */
export interface SignInInput {
  email: string;
  password: string;
}

/** Validates the login form: required email and password. */
export class SignInValidator extends BaseValidator<SignInInput> {
  protected readonly schema = z.object({
    email: z
      .string()
      .refine((value) => value.trim().length > 0, {
        message: "Email is required.",
      })
      .refine((value) => EMAIL_REGEX.test(value.trim()), {
        message: "Enter a valid email address.",
      }),
    password: z.string().refine((value) => value.length > 0, {
      message: "Password is required.",
    }),
  });
}
