import { z } from 'zod';
import { UserRoles } from '../../enums/enums';

export const userSchema = z.object({
  email: z.string().email(),
  about: z.string().optional(),
  firstName: z.string().regex(/^[A-Za-z]+$/, {
    message: 'First name must contain only alphabets',
  }),
  lastName: z
    .string()
    .regex(/^[A-Za-z]+$/, { message: 'Last name must contain only alphabets' }),
  password: z.string().optional(),
  roles: z.array(z.nativeEnum(UserRoles)).default([UserRoles.BASIC_USER]),
});

export type IUser = z.infer<typeof userSchema>;
