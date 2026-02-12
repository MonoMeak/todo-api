import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
});

export const loginUserSchema = z.object({
  email: z.email("Invalid email format"),
  password: z
    .string() 
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type LoginUserDto = z.infer<typeof loginUserSchema>;

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  access_token: string;
}
