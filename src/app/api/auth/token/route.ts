import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generateToken } from "@/lib/jwt";
import { z } from "zod";

const tokenRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = tokenRequestSchema.parse(body);

    // Find user in database
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user.length) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user[0].password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user[0].id,
      email: user[0].email,
      name: user[0].name || undefined,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name || undefined,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}