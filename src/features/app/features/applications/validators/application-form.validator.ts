import { z } from 'zod'
import { BaseValidator } from '@/features/core/base.validator'

/**
 * The raw, string-based input of the application form.
 *
 * Salary values stay strings so non-numeric input is reported as a field error
 * instead of being silently coerced to `NaN` before it reaches the API.
 */
export interface ApplicationFormInput {
  companyName: string
  positionTitle: string
  employmentType: string
  workplaceType: string
  location: string
  website: string
  salaryMin: string
  salaryMax: string
  currency: string
  notes: string
}

const WEBSITE_REGEX = /^https?:\/\/.+/

const salaryField = z
  .string()
  .refine((value) => value.trim() === '' || !Number.isNaN(Number(value)), {
    message: 'Must be a number.'
  })
  .refine((value) => value.trim() === '' || Number(value) >= 0, {
    message: 'Salary must be non-negative.'
  })

/**
 * Validates the create/edit application form: required company and position,
 * an optional http(s) website, non-negative salaries and a max >= min range.
 */
export class ApplicationFormValidator extends BaseValidator<ApplicationFormInput> {
  protected readonly schema = z
    .object({
      companyName: z.string().refine((value) => value.trim().length > 0, {
        message: 'Company name is required.'
      }),
      positionTitle: z.string().refine((value) => value.trim().length > 0, {
        message: 'Position title is required.'
      }),
      employmentType: z.string(),
      workplaceType: z.string(),
      location: z.string(),
      website: z
        .string()
        .refine(
          (value) =>
            value.trim() === '' || WEBSITE_REGEX.test(value.trim()),
          { message: 'Enter a valid URL starting with http:// or https://' }
        ),
      salaryMin: salaryField,
      salaryMax: salaryField,
      currency: z.string(),
      notes: z.string()
    })
    .refine(
      (data) => {
        const min = data.salaryMin.trim() === '' ? null : Number(data.salaryMin)
        const max = data.salaryMax.trim() === '' ? null : Number(data.salaryMax)

        if (
          min !== null &&
          max !== null &&
          !Number.isNaN(min) &&
          !Number.isNaN(max)
        ) {
          return max >= min
        }

        return true
      },
      {
        message: 'Max salary must be greater than or equal to min salary.',
        path: ['salaryMax']
      }
    )
}
