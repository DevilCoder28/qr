import { z } from 'zod';
import { Request } from 'express';
import { UserRoles } from '../../enums/enums';

export const UserPayloadSchema = z.object({
  userId: z.string(),
  roles: z.array(z.nativeEnum(UserRoles)),
});

export type UserPayload = z.infer<typeof UserPayloadSchema>;
