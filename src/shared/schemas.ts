import { z } from "zod";

const titleSchema = z.string().trim().min(1).max(120);
const descriptionSchema = z.string().trim().max(1000);
const statusSchema = z.enum(["Erledigt", "In Arbeit", "Offen"]);
const ratingSchema = z.number().int().min(1).max(5);

export const itemInput = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    status: statusSchema,
    rating: ratingSchema.default(3),
  })
  .strict();

export const itemPatch = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    status: statusSchema.optional(),
    rating: ratingSchema.optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Mindestens ein Feld muss angegeben werden.",
  });