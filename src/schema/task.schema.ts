import { z } from "zod";

export const createTaskSchema = z.object({
  // user_id: z.string().uuid("Invalid user ID format"),
  text: z
    .string()
    .min(1, "Task text cannot be empty")
    .max(100, "Task text must be less than 100   characters"),
  category_id: z.string().optional(),
});

export const updateTaskSchema = z.object({
  text: z
    .string()
    .min(1, "Task text cannot be empty")
    .max(100, "Task text must be less than 100 characters")
    .optional(),
  is_completed: z.boolean().optional(),
  category_id: z.string().nullable().optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

export interface TaskResponseDto {
  id: string;
  user_id: string;
  category_id: string | null;
  text: string;
  is_completed: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
