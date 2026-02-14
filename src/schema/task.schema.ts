import { z } from "zod";

const endDateSchema = z
  .string()
  .datetime({
    offset: true,
    message: "Invalid end_date format. Expected ISO datetime string",
  })
  .refine(
    (value) => new Date(value).getTime() > Date.now(),
    "end_date must be in the future",
  );

export const createTaskSchema = z.object({
  // user_id: z.string().uuid("Invalid user ID format"),
  text: z
    .string()
    .min(1, "Task text cannot be empty")
    .max(100, "Task text must be less than 100   characters"),
  category_id: z.string().optional(),
  end_date: endDateSchema.optional().nullable(),
  order_number: z.number().int().nonnegative().optional(),
});

export const updateTaskSchema = z.object({
  text: z
    .string()
    .min(1, "Task text cannot be empty")
    .max(100, "Task text must be less than 100 characters")
    .optional(),
  is_completed: z.boolean().optional(),
  category_id: z.string().nullable().optional(),
  end_date: endDateSchema.optional().nullable(),
  order_number: z.number().int().nonnegative().optional(),
});

export const reorderTasksSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1),
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
  end_date: Date | null;
  order_number: number;
  created_at: Date;
  updated_at: Date;
}
