import { z } from 'zod';

const UsernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can contain only letters, numbers and underscore');

export const RegisterSchema = z.object({
  username: UsernameSchema,
  password: z.string().min(8),
});

export const LoginSchema = z.object({
  username: UsernameSchema,
  password: z.string(),
});

export const CreateMapSchema = z.object({
  title: z.string().min(1).max(255),
  artist: z.string().min(1).max(255),
  mapper: z.string().min(1).max(255),
  sourceType: z.enum(['rhythia', 'soundspace']).default('rhythia'),
  difficulty: z.number().min(0),
  duration: z.number().int().positive(),
  bpm: z.number().optional(),
  noteCount: z.number().int().nonnegative(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateMapSchema = CreateMapSchema.partial().omit({
  title: true,
  artist: true,
  mapper: true,
});

export const CreateRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const QueryMapsSchema = z.object({
  sort: z.enum(['latest', 'most_downloaded', 'weekly', 'top_rated']).default('latest'),
  search: z.string().optional(),
  sourceType: z.enum(['rhythia', 'soundspace']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('20'),
  difficulty: z.string().transform(Number).pipe(z.number().min(0)).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateMapInput = z.infer<typeof CreateMapSchema>;
export type UpdateMapInput = z.infer<typeof UpdateMapSchema>;
export type CreateRatingInput = z.infer<typeof CreateRatingSchema>;
export type QueryMapsInput = z.infer<typeof QueryMapsSchema>;
