import createHttpError from 'http-errors';
import jwt, { SignOptions } from 'jsonwebtoken';
import { JWT_SECRET } from '../secrets';

export const createToken = (payload: object, options: SignOptions): string => {
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): object | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as object;
  } catch (error: any) {
    throw createHttpError(400, 'Invalid token');
  }
};

export const decodeToken = (token: string): object | null => {
  try {
    return jwt.decode(token) as object;
  } catch (error: any) {
    throw createHttpError(500, 'Invalid Token.');
  }
};
