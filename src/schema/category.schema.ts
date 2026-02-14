import { z } from "zod";
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category text cannot be empty")
    .max(50, "Category text cannot be over 50 characters")
    .trim(),
  icon: z.string().optional(),
  description: z
    .string()
    .max(120, "Category text cannot be over 120 characters")
    .trim()
    .optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  icon: z.string().optional(),
  description: z.string().max(120).trim().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

export interface ResponseCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
