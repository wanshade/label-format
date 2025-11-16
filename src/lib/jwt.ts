import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!, {
    expiresIn: '24h',
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const getTokenFromRequest = (req: NextRequest): string | null => {
  // First check Authorization header
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Then check cookies for NextAuth session token
  const cookies = req.headers.get('Cookie');
  if (cookies) {
    const sessionTokenMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
    if (sessionTokenMatch) {
      return sessionTokenMatch[1];
    }
  }

  return null;
};

export const getUserFromToken = (req: NextRequest): JWTPayload | null => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }

  return verifyToken(token);
};

// Helper function for API routes to authenticate users
export const authenticateUser = async (req: NextRequest): Promise<JWTPayload | null> => {
  try {
    const user = getUserFromToken(req);
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};