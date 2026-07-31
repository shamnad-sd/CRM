"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { contactSchema } from "@/lib/validations";

export interface ContactActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseContactFormData(formData: FormData) {
  const tagsRaw = String(formData.get("tags") ?? "");
  return {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    source: formData.get("source"),
    tags: tagsRaw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

export async function createContact(
  _prevState: ContactActionResult | undefined,
  formData: FormData
): Promise<ContactActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in." };
  }

  const parsed = contactSchema.safeParse(parseContactFormData(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await connectToDatabase();

  const contact = await Contact.create({
    ...parsed.data,
    ownerId: session.user.id,
  });

  redirect(`/dashboard/contacts/${contact._id.toString()}?created=true`);
}

export async function updateContact(
  contactId: string,
  _prevState: ContactActionResult | undefined,
  formData: FormData
): Promise<ContactActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!isValidObjectId(contactId)) {
    return { success: false, error: "Contact not found." };
  }

  const parsed = contactSchema.safeParse(parseContactFormData(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await Contact.findById(contactId);
  if (!existing) {
    return { success: false, error: "Contact not found." };
  }

  const isOwner = existing.ownerId.toString() === session.user.id;
  if (session.user.role !== "admin" && !isOwner) {
    return {
      success: false,
      error: "You don't have permission to edit this contact.",
    };
  }

  existing.set(parsed.data);
  await existing.save();

  redirect(`/dashboard/contacts/${contactId}?updated=true`);
}

export async function deleteContact(contactId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!isValidObjectId(contactId)) {
    redirect("/dashboard/contacts");
  }

  await connectToDatabase();

  const existing = await Contact.findById(contactId);
  if (!existing) {
    redirect("/dashboard/contacts");
  }

  const isOwner = existing.ownerId.toString() === session.user.id;
  if (session.user.role !== "admin" && !isOwner) {
    redirect(`/dashboard/contacts/${contactId}?error=forbidden`);
  }

  await Contact.findByIdAndDelete(contactId);

  redirect("/dashboard/contacts?deleted=true");
}
