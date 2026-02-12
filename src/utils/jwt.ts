import * as crypto from "crypto";

type TokenPayloadBase = {
  sub: string;
  iat: number;
  exp: number;
};

export type AccessTokenPayload = TokenPayloadBase & {
  email: string;
  name: string;
  type: "access";
};

export type RefreshTokenPayload = TokenPayloadBase & {
  jti: string;
  type: "refresh";
};

const JWT_ALGORITHM = "HS256";
const ACCESS_TOKEN_TTL_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || "dev-secret-change-me";
};

const base64UrlEncode = (value: string): string => {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (value: string): string => {
  const padLength = (4 - (value.length % 4)) % 4;
  const padded = `${value}${"=".repeat(padLength)}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  return Buffer.from(padded, "base64").toString("utf8");
};

const sign = (input: string, secret: string): string => {
  return crypto
    .createHmac("sha256", secret)
    .update(input)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

export const generateAccessToken = (user: {
  id: string;
  email: string;
  name: string;
}): string => {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  const header = {
    alg: JWT_ALGORITHM,
    typ: "JWT",
  };

  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    type: "access",
    iat: nowInSeconds,
    exp: nowInSeconds + ACCESS_TOKEN_TTL_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(unsignedToken, getJwtSecret());

  return `${unsignedToken}.${signature}`;
};

export const generateRefreshToken = (userId: string): {
  token: string;
  expiresAt: Date;
} => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const refreshTokenId = crypto.randomUUID();

  const header = {
    alg: JWT_ALGORITHM,
    typ: "JWT",
  };

  const payload: RefreshTokenPayload = {
    sub: userId,
    jti: refreshTokenId,
    type: "refresh",
    iat: nowInSeconds,
    exp: nowInSeconds + REFRESH_TOKEN_TTL_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(unsignedToken, getJwtSecret());

  return {
    token: `${unsignedToken}.${signature}`,
    expiresAt: new Date(payload.exp * 1000),
  };
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = verifyJwtSignature(token) as AccessTokenPayload;

  if (payload.type !== "access") {
    throw new Error("Invalid access token type");
  }

  if (!payload.sub || !payload.email || !payload.name) {
    throw new Error("Invalid token payload");
  }

  return payload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const payload = verifyJwtSignature(token) as RefreshTokenPayload;

  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token type");
  }

  if (!payload.sub || !payload.jti) {
    throw new Error("Invalid refresh token payload");
  }

  return payload;
};

const verifyJwtSignature = (token: string): TokenPayloadBase => {
  const [encodedHeader, encodedPayload, providedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !providedSignature) {
    throw new Error("Malformed token");
  }

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(unsignedToken, getJwtSecret());

  const providedSignatureBuffer = Buffer.from(providedSignature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (providedSignatureBuffer.length !== expectedSignatureBuffer.length) {
    throw new Error("Invalid token signature");
  }

  const isValidSignature = crypto.timingSafeEqual(
    providedSignatureBuffer,
    expectedSignatureBuffer,
  );

  if (!isValidSignature) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayloadBase;

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
};

export const hashRefreshToken = (refreshToken: string): string => {
  return crypto.createHash("sha256").update(refreshToken).digest("hex");
};
