import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, secretKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  if (!session) return;

  try {
    const parsed = await decrypt(session);
    if (!parsed) {
      // Clear invalid session
      const response = NextResponse.next();
      response.cookies.delete('session');
      return response;
    }

    // Refresh session expiration
    const res = NextResponse.next();
    res.cookies.set({
      name: 'session',
      value: await encrypt({
        ...parsed,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return res;
  } catch (error) {
    // Clear invalid session
    const response = NextResponse.next();
    response.cookies.delete('session');
    return response;
  }
}