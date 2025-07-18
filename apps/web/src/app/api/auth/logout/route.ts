import { refreshTokens } from '@pagespace/db';
import { db, eq } from '@pagespace/db';
import { parse, serialize } from 'cookie';

export async function POST(req: Request) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const refreshTokenValue = cookies.refreshToken;

  if (refreshTokenValue) {
    try {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshTokenValue));
    } catch {
      // If the token is not found, we can ignore the error and proceed with clearing cookies.
      console.log("Refresh token not found in DB, may have already been invalidated.");
    }
  }

  const accessTokenCookie = serialize('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0),
  });

  const refreshTokenCookie = serialize('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0),
  });

  const headers = new Headers();
  headers.append('Set-Cookie', accessTokenCookie);
  headers.append('Set-Cookie', refreshTokenCookie);

  return Response.json({ message: 'Logged out successfully' }, { status: 200, headers });
}