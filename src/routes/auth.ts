import express from "express";
import { Request, Response } from "express";
import {
  AuthResponseDto,
  CreateUserDto,
  LoginUserDto,
  UpdatePasswordDto,
  UpdateUserDto,
  createUserSchema,
  loginUserSchema,
  updatePasswordSchema,
  updateUserSchema,
} from "../schema/user.schema";
import { validateBody } from "../middleware/validate.middleware";
import { AuthService } from "../services/auth.service";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { requireAuth } from "../middleware/auth.middleware";

const authRoutes = express.Router();
const authService = new AuthService();
const REFRESH_COOKIE_NAME = "refresh_token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const isProduction = process.env.NODE_ENV === "production";

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/api/auth",
  });
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/api/auth",
  });
};

authRoutes.post(
  "/register",
  validateBody(createUserSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password, name }: CreateUserDto = req.body;
      const user = await authService.createUser({ email, password, name });
      const access_token = generateAccessToken({
        id: user.id,
        email: user.email,
        name: user.name,
      });
      const refreshTokenPayload = generateRefreshToken(user.id);
      await authService.storeRefreshToken(
        user.id,
        refreshTokenPayload.token,
        refreshTokenPayload.expiresAt,
      );
      setRefreshTokenCookie(res, refreshTokenPayload.token);

      const response: AuthResponseDto = { user, access_token };
      return res.status(201).json(response);
    } catch (error: any) {
      if (error.message === "User with this email already exists") {
        return res.status(409).json({ error: error.message });
      }

      console.error("Error registering user:", error);
      return res.status(500).json({ error: "Failed to register user" });
    }
  },
);

authRoutes.post(
  "/login",
  validateBody(loginUserSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password }: LoginUserDto = req.body;
      const user = await authService.validateUserCredentials(email, password);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const access_token = generateAccessToken({
        id: user.id,
        email: user.email,
        name: user.name,
      });
      const refreshTokenPayload = generateRefreshToken(user.id);
      await authService.storeRefreshToken(
        user.id,
        refreshTokenPayload.token,
        refreshTokenPayload.expiresAt,
      );
      setRefreshTokenCookie(res, refreshTokenPayload.token);

      const response: AuthResponseDto = { user, access_token };
      return res.json(response);
    } catch (error) {
      console.error("Error logging in user:", error);
      return res.status(500).json({ error: "Failed to login user" });
    }
  },
);

authRoutes.get("/me", requireAuth, async (req: Request, res: Response) => {
  return res.json({ user: req.authUser });
});

authRoutes.patch(
  "/me",
  requireAuth,
  validateBody(updateUserSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.authUser!.id;
      const payload: UpdateUserDto = req.body;
      const updatedUser = await authService.updateUserProfile(userId, payload);

      const access_token = generateAccessToken({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      });

      const response: AuthResponseDto = {
        user: updatedUser,
        access_token,
      };

      return res.json(response);
    } catch (error: any) {
      if (error.message === "User with this email already exists") {
        return res.status(409).json({ error: error.message });
      }

      if (error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: "Failed to update profile" });
    }
  },
);

authRoutes.patch(
  "/me/password",
  requireAuth,
  validateBody(updatePasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.authUser!.id;
      const payload: UpdatePasswordDto = req.body;
      await authService.updateUserPassword(userId, payload);
      return res.json({ success: true });
    } catch (error: any) {
      if (error.message === "Current password is incorrect") {
        return res.status(400).json({ error: error.message });
      }

      if (error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: "Failed to update password" });
    }
  },
);

authRoutes.post("/refresh", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token missing" });
    }

    const payload = verifyRefreshToken(refreshToken);
    const isValidToken = await authService.isRefreshTokenValid(refreshToken);

    if (!isValidToken) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await authService.getUserById(payload.sub);
    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: "Unauthorized" });
    }

    await authService.revokeRefreshToken(refreshToken);
    const nextRefreshTokenPayload = generateRefreshToken(user.id);
    await authService.storeRefreshToken(
      user.id,
      nextRefreshTokenPayload.token,
      nextRefreshTokenPayload.expiresAt,
    );
    setRefreshTokenCookie(res, nextRefreshTokenPayload.token);

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return res.json({ access_token: accessToken });
  } catch (error) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

authRoutes.post("/logout", async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (refreshToken) {
    await authService.revokeRefreshToken(refreshToken);
  }

  clearRefreshTokenCookie(res);
  return res.json({ success: true });
});

export default authRoutes;
