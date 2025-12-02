import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Try database authentication first
        try {
          const user = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
          if (!user.length) {
            console.log("User not found:", credentials.email);
            return null;
          }
          const isPasswordValid = await bcrypt.compare(credentials.password, user[0].password);
          if (!isPasswordValid) {
            console.log("Invalid password for:", credentials.email);
            return null;
          }
          console.log("Authentication successful for:", credentials.email);
          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
          };
        } catch (error) {
          console.error("Database auth error:", error);
          return null;
        }
      }
    })
  ],
  debug: true,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      // Update session when user data changes
      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.email = session.user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the callback URL is root or login page, redirect to dashboard
      if (url === '/' || url === `${baseUrl}/` || url === '/auth/login' || url === `${baseUrl}/auth/login`) {
        return `${baseUrl}/dashboard`;
      }

      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }

      // Fallback to dashboard
      return `${baseUrl}/dashboard`;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// JWT utility functions for API routes
export const generateToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!, {
    expiresIn: '24h',
  });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!);
  } catch (error) {
    return null;
  }
};

export const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check cookies for NextAuth session token
  const cookies = req.headers.get('Cookie');
  if (cookies) {
    const sessionTokenMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
    if (sessionTokenMatch) {
      return sessionTokenMatch[1];
    }
  }

  return null;
};

