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
