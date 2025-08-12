import { UserPayload } from '../validators/auth/userPayloadSchema';
import { Request } from 'express';

export type AuthenticatedRequest = Request & {
  data?: UserPayload;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
};
