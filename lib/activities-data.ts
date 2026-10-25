import { isValidObjectId, Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Activity from "@/models/Activity";
import type { ActivityType } from "@/models/Activity";
import Contact from "@/models/Contact";
import Deal from "@/models/Deal";
import "@/models/User"; // ensure the User model is registered for populate()
import type { AppUserRole } from "@/types/next-auth";

export interface ActivityActor {
  id: string;
  name: string;
}

export interface ActivitySummary {
  id: string;
  type: ActivityType;
  content: string;
  createdAt: string;
  contactId: string;
  dealId: string | null;
  createdBy: ActivityActor | null;
}

interface PopulatedActor {
  _id: Types.ObjectId;
  name: string;
}

interface LeanActivity {
  _id: Types.ObjectId;
  type: ActivityType;
  content: string;
  createdAt: Date;
  contactId: Types.ObjectId;
  dealId?: Types.ObjectId | null;
  createdBy: PopulatedActor | Types.ObjectId | null;
}

function actorOrNull(
  value: PopulatedActor | Types.ObjectId | null
): ActivityActor | null {
  return value && typeof value === "object" && "name" in value
    ? { id: value._id.toString(), name: value.name }
    : null;
}

function toSummary(doc: LeanActivity): ActivitySummary {
  return {
    id: doc._id.toString(),
    type: doc.type,
    content: doc.content,
    createdAt: doc.createdAt.toISOString(),
    contactId: doc.contactId.toString(),
    dealId: doc.dealId ? doc.dealId.toString() : null,
    createdBy: actorOrNull(doc.createdBy),
  };
}

async function userOwnsContact(
  contactId: string,
  userId: string
): Promise<boolean> {
  const contact = await Contact.findById(contactId)
    .select("ownerId")
    .lean<{ ownerId: Types.ObjectId }>();
  return !!contact && contact.ownerId.toString() === userId;
}

async function userOwnsDeal(dealId: string, userId: string): Promise<boolean> {
  const deal = await Deal.findById(dealId)
    .select("ownerId")
    .lean<{ ownerId: Types.ObjectId }>();
  return !!deal && deal.ownerId.toString() === userId;
}

/**
 * Activities for a contact's general timeline. Includes activities that are
 * also linked to a deal, since they still belong to the contact's history.
 * Returns an empty list (rather than throwing) when the requester doesn't
 * own the contact, matching the pattern used by getDealsForContact.
 */
export async function getActivitiesForContact(
  contactId: string,
  options: { userId: string; role: AppUserRole }
): Promise<ActivitySummary[]> {
  if (!isValidObjectId(contactId)) return [];

  await connectToDatabase();

  if (
    options.role !== "admin" &&
    !(await userOwnsContact(contactId, options.userId))
  ) {
    return [];
  }

  const docs = (await Activity.find({ contactId })
    .sort({ createdAt: -1 })
    .populate("createdBy", "name")
    .lean()) as unknown as LeanActivity[];

  return docs.map(toSummary);
}

/** Activities scoped to a single deal only (not the contact's full history). */
export async function getActivitiesForDeal(
  dealId: string,
  options: { userId: string; role: AppUserRole }
): Promise<ActivitySummary[]> {
  if (!isValidObjectId(dealId)) return [];

  await connectToDatabase();

  if (
    options.role !== "admin" &&
    !(await userOwnsDeal(dealId, options.userId))
  ) {
    return [];
  }

  const docs = (await Activity.find({ dealId })
    .sort({ createdAt: -1 })
    .populate("createdBy", "name")
    .lean()) as unknown as LeanActivity[];

  return docs.map(toSummary);
}

export interface CreateActivityInput {
  type: ActivityType;
  content: string;
  contactId: string;
  dealId?: string;
  createdBy: string;
}

export async function createActivity(
  data: CreateActivityInput
): Promise<ActivitySummary> {
  await connectToDatabase();

  const doc = await Activity.create({
    type: data.type,
    content: data.content,
    contactId: data.contactId,
    dealId: data.dealId,
    createdBy: data.createdBy,
  });

  await doc.populate("createdBy", "name");

  return toSummary(doc.toObject() as unknown as LeanActivity);
}
