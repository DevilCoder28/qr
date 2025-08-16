import { NextFunction, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';
import {
  UserPayload,
  UserPayloadSchema,
} from '../validators/auth/userPayloadSchema';
import { UserRoles } from '../enums/enums';
import { verifyToken } from '../utils/jwtHelper';
import { ApiResponse } from '../config/ApiResponse';

export const authenticate = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token =
      req.cookies?.token ||
      (req.headers?.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      return ApiResponse(
        res,
        401,
        'Unauthenticated',
        false,
        null,
        'Authentication Error',
      );
    }

    const decoded = verifyToken(token);
    const parsedUser = UserPayloadSchema.parse(decoded as UserPayload);
    req.data = parsedUser;

    next();
  },
);

export const authorize = (allowedRoles: UserRoles[]) =>
  expressAsyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.data) {
        return ApiResponse(
          res,
          401,
          'Unauthorized',
          false,
          null,
          'Authorization Error',
        );
      }

      const { roles } = req.data;

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return ApiResponse(
          res,
          403,
          'Forbidden',
          false,
          null,
          'Authorization Error',
        );
      }

      const hasPermission = roles.some((role) =>
        allowedRoles.includes(role as UserRoles),
      );

      if (!hasPermission) {
        throw createHttpError(
          403,
          'Forbidden: You are not authorized to access this resource.',
        );
      }

      next();
    },
  );
