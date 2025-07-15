import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-default-secret'
);
const JWT_ALGORITHM = 'HS256';

interface UserPayload extends jose.JWTPayload {
  userId: string;
  tokenVersion: number;
}

export async function decodeToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });
    return payload as UserPayload;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

export async function generateAccessToken(userId: string, tokenVersion: number): Promise<string> {
  return await new jose.SignJWT({ userId, tokenVersion })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

export async function generateRefreshToken(userId: string, tokenVersion: number): Promise<string> {
  return await new jose.SignJWT({ userId, tokenVersion })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}