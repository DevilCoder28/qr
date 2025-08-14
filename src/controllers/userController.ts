import expressAsyncHandler from 'express-async-handler';
import { Response } from 'express';
import { ApiResponse } from '../config/ApiResponse';
import { User } from '../models/auth/user';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

export const userProfile = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const decodedData = req.data;

    if (!decodedData) {
      return ApiResponse(res, 404, 'Profile could not be fetched', false, null);
    }

    const { userId } = decodedData;

    const user = await User.findById(userId);

    return ApiResponse(res, 200, 'Profile retrieved successfully', true, {
      userData: {
        id: user?._id,
        name: `${user?.firstName} ${user?.lastName}`,
        email: user?.email,
        roles: user?.roles,
      },
    });
  },
);

export const registerDeviceToken = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.data?.userId;
    const { token } = req.body as { token?: string };

    if (!userId || !token) {
      return ApiResponse(res, 400, 'Missing token', false);
    }

    const user = await User.findById(userId);
    if (!user) return ApiResponse(res, 404, 'User not found', false);

    const set = new Set([...(user.deviceTokens || []), token]);
    // Optionally limit stored tokens per user
    user.deviceTokens = Array.from(set).slice(-5);

    await user.save();
    return ApiResponse(res, 200, 'Device registered', true, null);
  }
);

export const unregisterDeviceToken = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.data?.userId;
    const { token } = req.body as { token?: string };

    if (!userId || !token) {
      return ApiResponse(res, 400, 'Missing token', false);
    }

    const user = await User.findById(userId);
    if (!user) return ApiResponse(res, 404, 'User not found', false);

    user.deviceTokens = (user.deviceTokens || []).filter((t) => t !== token);
    await user.save();
    return ApiResponse(res, 200, 'Device unregistered', true, null);
  }
);