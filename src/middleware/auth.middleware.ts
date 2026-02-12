import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { AccessTokenPayload, verifyAccessToken } from "../utils/jwt";
import { UserResponseDto } from "../schema/user.schema";


declare global {
  namespace Express {
    interface Request {
      authUser?: UserResponseDto;
      authTokenPayload?: AccessTokenPayload;
    }
  }
}


const authService = new AuthService();

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyAccessToken(token);
    const user = await authService.getUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.authUser = user;
    req.authTokenPayload = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
