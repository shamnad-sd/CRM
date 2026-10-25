"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Contact from "@/models/Contact";
import Deal from "@/models/Deal";
import { activitySchema } from "@/lib/validations";
import {
  createActivity,
  getActivitiesForContact,
  getActivitiesForDeal,
  type ActivitySummary,
} from "@/lib/activities-data";

export interface ActivityActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  activity?: ActivitySummary;
}

/**
 * Logs an activity against a contact and, optionally, a deal. contactId and
 * dealId are bound server-side by the caller (not read from the form), so
 * the client can only ever supply the type/content of the entry.
 */
export async function logActivity(
  contactId: string,
  dealId: string | undefined,
  _prevState: ActivityActionResult | undefined,
  formData: FormData
): Promise<ActivityActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in." };
  }

  const parsed = activitySchema.safeParse({
    type: formData.get("type"),
    content: formData.get("content"),
    contactId,
    dealId,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await connectToDatabase();

  const contact = await Contact.findById(parsed.data.contactId);
  if (!contact) {
    return { success: false, error: "Contact not found." };
  }

  const ownsContact = contact.ownerId.toString() === session.user.id;
  if (session.user.role !== "admin" && !ownsContact) {
    return {
      success: false,
      error: "You don't have permission to log activity on this contact.",
    };
  }

  if (parsed.data.dealId) {
    const deal = await Deal.findById(parsed.data.dealId);
    if (!deal) {
      return { success: false, error: "Deal not found." };
    }

    const ownsDeal = deal.ownerId.toString() === session.user.id;
    if (session.user.role !== "admin" && !ownsDeal) {
      return {
        success: false,
        error: "You don't have permission to log activity on this deal.",
      };
    }
  }

  const activity = await createActivity({
    ...parsed.data,
    createdBy: session.user.id,
  });

  revalidatePath(`/dashboard/contacts/${parsed.data.contactId}`);
  revalidatePath("/dashboard/deals");

  return { success: true, activity };
}

/**
 * Reads activities for the timeline. When dealId is present the timeline is
 * scoped to that deal only; otherwise it's the contact's full history.
 * Ownership is re-checked here (not just trusted from props) since this is
 * invoked directly from client components.
 */
export async function fetchActivities(
  contactId: string,
  dealId?: string
): Promise<ActivitySummary[]> {
  const session = await auth();
  if (!session?.user) return [];

  if (dealId && isValidObjectId(dealId)) {
    return getActivitiesForDeal(dealId, {
      userId: session.user.id,
      role: session.user.role,
    });
  }

  return getActivitiesForContact(contactId, {
    userId: session.user.id,
    role: session.user.role,
  });
}
