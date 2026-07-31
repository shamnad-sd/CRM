import { z } from "zod";
import { CONTACT_SOURCES } from "@/lib/constants";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  role: z.enum(["admin", "sales"]).default("sales"),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const PHONE_REGEX = /^[0-9+\-().\s]{7,20}$/;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  phone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(PHONE_REGEX, "Enter a valid phone number")
      .optional()
  ),
  company: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(100).optional()
  ),
  source: z.enum(CONTACT_SOURCES, {
    error: "Select a valid source",
  }),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
});

export type ContactInput = z.infer<typeof contactSchema>;
