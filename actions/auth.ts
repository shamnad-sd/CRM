"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema, signupSchema } from "@/lib/validations";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function signupAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "sales",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { name, email, password, role } = parsed.data;

  await connectToDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    return {
      success: false,
      error: "An account with this email already exists.",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  // Auto sign-in after successful signup.
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });

  return { success: true };
}

export async function loginAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: "Invalid email or password." };
    }
    // NEXT_REDIRECT is thrown by signIn() on success — rethrow it so
    // Next.js can perform the redirect.
    throw err;
  }

  return { success: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
