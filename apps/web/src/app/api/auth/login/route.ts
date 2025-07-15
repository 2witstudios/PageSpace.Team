import { users, refreshTokens } from '@pagespace/db';
import { db, eq } from '@pagespace/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateAccessToken, generateRefreshToken } from '@pagespace/lib';
import { serialize } from 'cookie';
import { createId } from '@paralleldrive/cuid2';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return Response.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password } = validation.data;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.password) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const accessToken = await generateAccessToken(user.id, user.tokenVersion);
    const refreshToken = await generateRefreshToken(user.id, user.tokenVersion);

    await db.insert(refreshTokens).values({
      id: createId(),
      token: refreshToken,
      userId: user.id,
      device: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
    });

    const accessTokenCookie = serialize('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });

    const refreshTokenCookie = serialize('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const headers = new Headers();
    headers.append('Set-Cookie', accessTokenCookie);
    headers.append('Set-Cookie', refreshTokenCookie);

    return Response.json({
      id: user.id,
      name: user.name,
      email: user.email,
    }, { status: 200, headers });

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}