import expressAsyncHandler from "express-async-handler";
import { Request, Response } from "express";
import {
  forgotPasswordSchema,
  ILoginSchema,
  ISignUpSchema,
  loginSchema,
  resendVerificationEmailSchema,
  signUpSchema,
} from "../../validators/auth/authSchema";
import { IUserDocument, User } from "../../models/auth/user";
import { ApiResponse } from "../../config/ApiResponse";
import bcrypt from "bcrypt";
import {
  FRONTEND_BASE_URL_DEV,
  FRONTEND_BASE_URL_PROD_DOMAIN,
  FRONTEND_SIGNUP_URL,
  FRONTEND_URL,
  HASH_ID_SECRET_SALT,
  JWT_SECRET,
  NODE_ENV,
} from "../../secrets";
import { sendEmail } from "../../config/mailer";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../../types/AuthenticatedRequest";
import { APP_NAME } from "../../config/constants";
import { MailTemplate } from "../../enums/enums";
import { renderTemplate } from "../../utils/templateRenderer";
import Hashids from "hashids";
import { QRModel } from "../../models/qr-flow/qrModel";
import { uploadToCloudinary } from "../../config/uploadToCloudinary";

export const signUp = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const signUpData: ISignUpSchema = req.body;
      const validation = signUpSchema.safeParse(signUpData);
      const hashids = new Hashids(HASH_ID_SECRET_SALT, 10);

      console.log(validation.error?.errors);

      if (!validation.success)
        return ApiResponse(
          res,
          400,
          "Validation failed for User Schema",
          false,
          null,
          "Error occurred in validation"
        );

      const existingUser = await User.findOne({
        email: validation.data?.email,
      });
      if (existingUser)
        return ApiResponse(
          res,
          400,
          "User already exists",
          false,
          null,
          "Could not create a user"
        );

      const hashedPassword = await bcrypt.hash(validation.data.password, 10);

      const user = await User.create({
        ...validation.data,
        password: hashedPassword,
      });

      if (user) {
        if (validation.data?._tk) {
          const _tk = hashids.decodeHex(validation.data?._tk);
          const referralUser = await User.findById(_tk);
          const totalDigitalPoints = referralUser?.digitalWalletCoins;
          const updatedUser = await User.updateOne(
            { _id: _tk },
            {
              digitalWalletCoins: totalDigitalPoints || 0 + 5,
            }
          );
        }
      }

      const verificationToken = jwt.sign({ userId: user._id }, JWT_SECRET!, {
        expiresIn: "1h",
      });

      const frontendBaseUrl =
        NODE_ENV == "dev"
          ? FRONTEND_BASE_URL_DEV
          : FRONTEND_BASE_URL_PROD_DOMAIN;
      const verificationLink = `${frontendBaseUrl}/auth/verify-email?token=${verificationToken}`;

      const emailContent = {
        user_name: user.firstName,
        verification_link: verificationLink,
        app_name: APP_NAME,
      };

      const { html, text } = await renderTemplate(
        MailTemplate.VERIFY_EMAIL,
        emailContent
      );

      await sendEmail(
        user.email,
        `Verify Your Email at ${APP_NAME}`,
        text,
        html
      );

      return ApiResponse(
        res,
        200,
        "Successfully sent email for verification!",
        true,
        null
      );
    } catch (error: any) {
      return ApiResponse(
        res,
        404,
        "Error occurred signing up!",
        false,
        null,
        error.message
      );
    }
  }
);

export const login = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const loginData: ILoginSchema = req.body;
      const validation = loginSchema.safeParse(loginData);
      if (!validation.success)
        return ApiResponse(
          res,
          400,
          "Error occurred validation login schema",
          false,
          null,
          "Validation Error"
        );

      const user = await User.findOne({ email: validation.data.email });

      if (!user)
        return ApiResponse(
          res,
          400,
          "No such user exists",
          false,
          null,
          "User not found!"
        );

      const isValidPassword = await bcrypt.compare(
        validation.data.password,
        user?.password
      );
      if (!user || !isValidPassword)
        return ApiResponse(
          res,
          401,
          "Invalid Credentials",
          false,
          null,
          "Login Error!"
        );

      if (!user.isVerified)
        return ApiResponse(
          res,
          403,
          "Email is not verified!",
          false,
          null,
          "Unverified Email"
        );

      const token = jwt.sign(
        { userId: user._id, roles: user.roles },
        JWT_SECRET!,
        {
          expiresIn: "7d",
        }
      );

      // Determine cookie settings based on environment
      const cookieOptions: {
        httpOnly: boolean;
        maxAge: number;
        secure?: boolean;
        sameSite?: "none" | "lax" | "strict";
      } = {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      };

      if (process.env.NODE_ENV === "production") {
        cookieOptions.secure = true;
        cookieOptions.sameSite = "none";
      } else {
        // Development environment - allow HTTP
        cookieOptions.secure = false;
        cookieOptions.sameSite = "lax";
      }

      res.cookie("token", token, cookieOptions);

      return ApiResponse(res, 201, "Login Successful", true, { token });
    } catch (err) {
      return ApiResponse(
        res,
        404,
        "Error occurred while logging in",
        false,
        null,
        "Login error"
      );
    }
  }
);

export const verifyEmail = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token) {
      return ApiResponse(
        res,
        400,
        "No token provided",
        false,
        null,
        "Verification failed"
      );
    }

    try {
      const decoded: any = jwt.verify(token as string, JWT_SECRET!);

      const user = await User.findById(decoded.userId);
      if (!user) {
        return ApiResponse(
          res,
          400,
          "User not found",
          false,
          null,
          "Verification failed"
        );
      }

      if (user.isVerified) {
        return ApiResponse(
          res,
          400,
          "Email already verified",
          false,
          null,
          "Email already verified"
        );
      }

      await User.findByIdAndUpdate(user._id, {
        $set: { isVerified: true },
      });

      return ApiResponse(res, 200, "Email verified successfully", true, null);
    } catch (err) {
      return ApiResponse(
        res,
        400,
        "Invalid or expired verification link",
        false,
        null,
        "Verification failed"
      );
    }
  }
);

export const resendVerificationLink = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const emailData = req.body;

    const validation = resendVerificationEmailSchema.safeParse(emailData);
    if (!validation.success)
      return ApiResponse(
        res,
        400,
        "Error occurred in parsing email",
        false,
        null,
        "Email is Invalid"
      );

    const user = await User.findOne({ email: validation.data.email });

    if (!user) {
      return ApiResponse(res, 404, "User not found", false, null);
    }

    if (user.isVerified) {
      return ApiResponse(res, 400, "User is already verified", false, null);
    }

    const verificationToken = jwt.sign({ userId: user._id }, JWT_SECRET!, {
      expiresIn: "1h",
    });

    const frontendBaseUrl =
      NODE_ENV == "dev" ? FRONTEND_BASE_URL_DEV : FRONTEND_BASE_URL_PROD_DOMAIN;

    const verificationLink = `${frontendBaseUrl}/auth/verify-email?token=${verificationToken}`;

    const emailContent = {
      user_name: user.firstName,
      verification_link: verificationLink,
      app_name: APP_NAME,
    };

    const { html, text } = await renderTemplate(
      MailTemplate.VERIFY_EMAIL,
      emailContent
    );

    await sendEmail(user.email, "Resend Verification Link", text, html);

    return ApiResponse(
      res,
      200,
      "Verification link resent successfully",
      true,
      null
    );
  }
);

export const forgotPassword = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const forgotPasswordData = req.body;

    const validation = forgotPasswordSchema.safeParse(forgotPasswordData);
    if (!validation.success)
      return ApiResponse(
        res,
        400,
        "Error occurred in parsing email",
        false,
        null,
        "Email is Invalid"
      );

    const user = await User.findOne({ email: validation.data.email });
    if (!user) {
      return ApiResponse(res, 404, "User not found", false, null);
    }

    const resetToken = jwt.sign({ userId: user._id }, JWT_SECRET!, {
      expiresIn: "1h",
    });
    const frontendBaseUrl =
      NODE_ENV == "dev" ? FRONTEND_BASE_URL_DEV : FRONTEND_BASE_URL_PROD_DOMAIN;
    const resetLink = `${frontendBaseUrl}/auth/reset-password?token=${resetToken}`;

    const emailContent = {
      user_name: user.firstName,
      reset_link: resetLink,
      app_name: APP_NAME,
    };
    const { html, text } = await renderTemplate(
      MailTemplate.RESET_PASSWORD,
      emailContent
    );

    await sendEmail(user.email, "Password Reset Link", text, html);

    return ApiResponse(
      res,
      200,
      "Password reset link sent to email",
      true,
      null
    );
  }
);

export const resetPassword = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { password } = req.body;

    const { token } = req.query;

    if (!token || !password) {
      return ApiResponse(
        res,
        400,
        "Token or password missing",
        false,
        null,
        "Reset failed"
      );
    }

    try {
      const decoded: any = jwt.verify(token.toString(), JWT_SECRET!);

      const user = await User.findById(decoded.userId);
      if (!user) {
        return ApiResponse(res, 404, "User not found", false, null);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.findByIdAndUpdate(user._id, {
        $set: { password: hashedPassword },
      });

      return ApiResponse(res, 200, "Password reset successfully", true, null);
    } catch (err) {
      return ApiResponse(
        res,
        400,
        "Invalid or expired reset password link",
        false,
        null,
        "Reset failed"
      );
    }
  }
);

export const logout = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 0,
      });
      return ApiResponse(res, 200, "Logged out successfully", true, null);
    } catch (error: any) {
      return ApiResponse(
        res,
        500,
        "Error occurred while logging out",
        false,
        null,
        error.message
      );
    }
  }
);

export const getUserFromUserId = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.data?.userId;
    const user = await User.findById(userId).lean();

    if (!user) {
      throw new Error("User not found");
    }
    const qrs = await QRModel.find({ createdFor: userId })
      .populate("qrTypeId", "qrName")
      .select("qrTypeId qrStatus qrUrl")
      .lean();

    const qrList = qrs.map((qr) => ({
      qrName: (qr.qrTypeId as any)?.qrName || "",
      qrStatus: qr.qrStatus,
      qrUrl: qr.qrUrl,
    }));

    const response = {
      userId:userId,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || null,
      email: user.email,
      digitalWalletCoins: user.digitalWalletCoins || 0,
      totalNumberOfQRsGenerated: qrList.length || 0,
      referralLink: await getReferralLink(user._id.toString()),
      qrs: qrList,
      about: user.about || null,
      phoneNumber: user.phoneNumber || null,
      altMobileNumber: user.altMobileNumber || null,
      vehicleNumber: user.vehicleNumber || null,
      vehicleType: user.vehicleType || null,
    };

    return ApiResponse(
      res,
      200,
      "User Profile Fetched successfully!",
      true,
      response
    );
  }
);

export const updateUserProfile = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.data?.userId;

    if (!userId) {
      return ApiResponse(res, 401, "Unauthorized", false);
    }

    const { firstName, lastName, phoneNumber,about, altMobileNumber, vehicleNumber, vehicleType } = req.body;
    const file = req.file;

    const user = await User.findById(userId);
    if (!user) {
      return ApiResponse(res, 404, "User not found", false);
    }

    if (file) {
      try {
        const cloudinaryResult: any = await uploadToCloudinary(
          file.buffer,
          `users/${userId}`,
          "image",
          `avatar-${userId}`
        );
        user.avatar = cloudinaryResult.secure_url;
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        return ApiResponse(res, 500, "Failed to upload avatar", false);
      }
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (about) user.about = about;
    if (altMobileNumber) user.altMobileNumber = altMobileNumber;
    if (vehicleNumber) user.vehicleNumber = vehicleNumber;
    if (vehicleType) user.vehicleType = vehicleType;

    await user.save();

    return ApiResponse(res, 200, "Profile updated successfully!", true, {
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      about: user.about || null,
      phoneNumber: user.phoneNumber || null,
      altMobileNumber: user.altMobileNumber || null,
      vehicleNumber: user.vehicleNumber || null,
      vehicleType: user.vehicleType || null,
    });
  }
);

export const resetUserProfile = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.data?.userId;

    if (!userId) {
      return ApiResponse(res, 401, 'Unauthorized', false, null);
    }

    const resetFields = {
      avatar: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      altMobileNumber: "",
      vehicleNumber: "",
      vehicleType: "",
      about: ""
    };

    const user = await User.findByIdAndUpdate(
      userId,
      resetFields,
      { new: true }
    );

    if (!user) {
      return ApiResponse(res, 404, 'User not found', false, null);
    }

    return ApiResponse(res, 200, 'Profile reset successfully', true, {
      userData: {
        avatar: user.avatar,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        altMobileNumber: user.altMobileNumber,
        vehicleNumber: user.vehicleNumber,
        vehicleType: user.vehicleType,
        about: user.about
      }
    });
  }
);

export const getReferralLink = async (userId: string) => {
  const user = await User.findById(userId);

  let encodedReferralLink = FRONTEND_SIGNUP_URL;

  if (userId) {
    const hashids = new Hashids(HASH_ID_SECRET_SALT, 10);
    const encodedData = hashids.encodeHex(userId.toString());
    encodedReferralLink = FRONTEND_SIGNUP_URL + "?_tk=" + encodedData;
  }

  return encodedReferralLink;
};

export const generateReferralLink = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.data?.userId);
    const userId = user?._id;

    if (!user)
      return ApiResponse(res, 404, "Referral Link not found!", true, null);

    let encodedReferralLink = FRONTEND_SIGNUP_URL;

    if (userId) {
      const hashids = new Hashids(HASH_ID_SECRET_SALT, 10);
      const encodedData = hashids.encodeHex(userId.toString());
      encodedReferralLink = FRONTEND_SIGNUP_URL + "?_tk=" + encodedData;
    }

    return ApiResponse(
      res,
      200,
      "Referral Link Generated",
      true,
      encodedReferralLink
    );
  }
);
