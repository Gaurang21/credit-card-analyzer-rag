import { z } from "zod";

export const NetworkSchema = z.enum(["Visa", "Mastercard", "Amex", "Discover"]);

export const CategorySchema = z.object({
  category: z.string().min(1).max(48),
  multiplier: z.number().min(0).max(20),
  cap_amount: z.number().nullable().optional(),
  cap_period: z.string().max(48).nullable().optional(),
  notes: z.string().max(280).nullable().optional(),
});
export type CardCategoryInput = z.infer<typeof CategorySchema>;

export const SignupBonusSchema = z
  .object({
    points: z.number().nonnegative(),
    spend_required: z.number().nonnegative(),
    months: z.number().int().positive(),
  })
  .nullable();

export const CardInputSchema = z.object({
  name: z.string().min(1).max(120),
  issuer: z.string().max(60).nullable().optional(),
  network: NetworkSchema.nullable().optional(),
  last_four: z
    .string()
    .regex(/^\d{4}$/u, "Must be exactly 4 digits")
    .nullable()
    .optional()
    .or(z.literal("")),
  annual_fee: z.coerce.number().min(0).default(0),
  foreign_txn_fee_pct: z.coerce.number().min(0).max(10).default(0),
  signup_bonus: SignupBonusSchema.optional(),
  notes: z.string().max(2000).nullable().optional(),
  categories: z.array(CategorySchema).max(20).default([]),
});

export type CardInput = z.infer<typeof CardInputSchema>;

/** Strict variant used to validate LLM extraction output. */
export const ExtractedCardSchema = CardInputSchema.extend({
  // The LLM is allowed to return null for unknowns; we coerce in the form.
  annual_fee: z.coerce.number().min(0),
  foreign_txn_fee_pct: z.coerce.number().min(0).max(10),
});
export type ExtractedCard = z.infer<typeof ExtractedCardSchema>;
