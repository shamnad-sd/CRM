import { isValidObjectId, Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Deal from "@/models/Deal";
import Contact from "@/models/Contact";
import "@/models/User"; // ensure the User model is registered for populate()
import type { DealStage } from "@/lib/constants";
import type { AppUserRole } from "@/types/next-auth";

export interface DealContactRef {
  id: string;
  name: string;
}

export interface DealOwnerRef {
  id: string;
  name: string;
}

export interface DealSummary {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  expectedCloseDate: string | null;
  createdAt: string;
  contact: DealContactRef | null;
  owner: DealOwnerRef | null;
}

interface PopulatedRef {
  _id: Types.ObjectId;
  name: string;
}

interface LeanDeal {
  _id: Types.ObjectId;
  title: string;
  value: number;
  stage: DealStage;
  expectedCloseDate?: Date;
  createdAt: Date;
  contactId: PopulatedRef | Types.ObjectId | null;
  ownerId: PopulatedRef | Types.ObjectId | null;
}

function refOrNull(
  value: PopulatedRef | Types.ObjectId | null
): { id: string; name: string } | null {
  return value && typeof value === "object" && "name" in value
    ? { id: value._id.toString(), name: value.name }
    : null;
}

function toSummary(doc: LeanDeal): DealSummary {
  return {
    id: doc._id.toString(),
    title: doc.title,
    value: doc.value,
    stage: doc.stage,
    expectedCloseDate: doc.expectedCloseDate
      ? doc.expectedCloseDate.toISOString()
      : null,
    createdAt: doc.createdAt.toISOString(),
    contact: refOrNull(doc.contactId),
    owner: refOrNull(doc.ownerId),
  };
}

function ownershipFilter(userId: string, role: AppUserRole) {
  return role === "admin" ? {} : { ownerId: userId };
}

export async function getDeals(options: {
  userId: string;
  role: AppUserRole;
}): Promise<DealSummary[]> {
  await connectToDatabase();

  const docs = (await Deal.find(ownershipFilter(options.userId, options.role))
    .sort({ createdAt: -1 })
    .populate("contactId", "name")
    .populate("ownerId", "name")
    .lean()) as unknown as LeanDeal[];

  return docs.map(toSummary);
}

export async function getDealById(id: string): Promise<DealSummary | null> {
  if (!isValidObjectId(id)) return null;

  await connectToDatabase();

  const doc = (await Deal.findById(id)
    .populate("contactId", "name")
    .populate("ownerId", "name")
    .lean()) as unknown as LeanDeal | null;

  return doc ? toSummary(doc) : null;
}

export async function getDealsForContact(
  contactId: string,
  options: { userId: string; role: AppUserRole }
): Promise<DealSummary[]> {
  if (!isValidObjectId(contactId)) return [];

  await connectToDatabase();

  const docs = (await Deal.find({
    contactId,
    ...ownershipFilter(options.userId, options.role),
  })
    .sort({ createdAt: -1 })
    .populate("contactId", "name")
    .populate("ownerId", "name")
    .lean()) as unknown as LeanDeal[];

  return docs.map(toSummary);
}

export interface DealOption {
  id: string;
  title: string;
  contactId: string;
}

interface LeanDealOption {
  _id: Types.ObjectId;
  title: string;
  contactId: Types.ObjectId;
}

/** Unpaginated deal list for pickers (task creation, etc). */
export async function getDealOptions(options: {
  userId: string;
  role: AppUserRole;
}): Promise<DealOption[]> {
  await connectToDatabase();

  const docs = (await Deal.find(ownershipFilter(options.userId, options.role))
    .select("title contactId")
    .sort({ title: 1 })
    .lean()) as unknown as LeanDealOption[];

  return docs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    contactId: doc.contactId.toString(),
  }));
}

export interface DashboardStats {
  openDealsCount: number;
  openDealsValue: number;
  wonThisMonthCount: number;
  wonThisMonthValue: number;
  totalContacts: number;
}

export async function getDashboardStats(options: {
  userId: string;
  role: AppUserRole;
}): Promise<DashboardStats> {
  await connectToDatabase();

  const filter = ownershipFilter(options.userId, options.role);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [openAgg, wonAgg, totalContacts] = await Promise.all([
    Deal.aggregate<{ _id: null; count: number; total: number }>([
      { $match: { ...filter, stage: { $nin: ["won", "lost"] } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$value" } } },
    ]),
    // "Won this month" is based on expectedCloseDate, since the schema
    // doesn't track a separate closed-at timestamp.
    Deal.aggregate<{ _id: null; count: number; total: number }>([
      {
        $match: {
          ...filter,
          stage: "won",
          expectedCloseDate: { $gte: monthStart, $lt: monthEnd },
        },
      },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$value" } } },
    ]),
    Contact.countDocuments(filter),
  ]);

  return {
    openDealsCount: openAgg[0]?.count ?? 0,
    openDealsValue: openAgg[0]?.total ?? 0,
    wonThisMonthCount: wonAgg[0]?.count ?? 0,
    wonThisMonthValue: wonAgg[0]?.total ?? 0,
    totalContacts,
  };
}
