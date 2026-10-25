import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { ACTIVITY_TYPES, CONTACT_SOURCES, DEAL_STAGES } from "@/lib/constants";

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

export const dealSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150),
  contactId: z
    .string()
    .trim()
    .refine(isValidObjectId, { error: "Select a valid contact" }),
  value: z.coerce
    .number({ error: "Enter a valid amount" })
    .min(0, "Value must be 0 or more")
    .max(1_000_000_000, "Value is too large"),
  stage: z.enum(DEAL_STAGES, { error: "Select a valid stage" }).default("new"),
  expectedCloseDate: z.preprocess(
    emptyToUndefined,
    z.coerce.date({ error: "Enter a valid date" }).optional()
  ),
});

export type DealInput = z.infer<typeof dealSchema>;

export const activitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES, { error: "Select a valid type" }),
  content: z.string().trim().min(1, "Content is required").max(2000, "Content is too long"),
  contactId: z
    .string()
    .trim()
    .refine(isValidObjectId, { error: "Invalid contact" }),
  dealId: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .refine(isValidObjectId, { error: "Invalid deal" })
      .optional()
  ),
});

export type ActivityInput = z.infer<typeof activitySchema>;

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  dueDate: z.coerce.date({ error: "Enter a valid due date" }),
  contactId: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .refine(isValidObjectId, { error: "Invalid contact" })
      .optional()
  ),
  dealId: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .refine(isValidObjectId, { error: "Invalid deal" })
      .optional()
  ),
  assignedTo: z
    .string()
    .trim()
    .refine(isValidObjectId, { error: "Select a valid assignee" }),
});

export type TaskInput = z.infer<typeof taskSchema>;
