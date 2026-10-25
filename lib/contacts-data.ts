import { isValidObjectId, Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Contact from "@/models/Contact";
import "@/models/User"; // ensure the User model is registered for populate()
import type { ContactSource } from "@/lib/constants";
import type { AppUserRole } from "@/types/next-auth";

export const CONTACTS_PAGE_SIZE = 10;

export interface ContactOwner {
  id: string;
  name: string;
}

export interface ContactSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: ContactSource;
  tags: string[];
  owner: ContactOwner | null;
  createdAt: string;
}

export interface ContactListResult {
  contacts: ContactSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface PopulatedOwner {
  _id: Types.ObjectId;
  name: string;
}

interface LeanContact {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: ContactSource;
  tags: string[];
  createdAt: Date;
  ownerId: PopulatedOwner | Types.ObjectId | null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSummary(doc: LeanContact): ContactSummary {
  const owner =
    doc.ownerId && typeof doc.ownerId === "object" && "name" in doc.ownerId
      ? { id: doc.ownerId._id.toString(), name: doc.ownerId.name }
      : null;

  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    company: doc.company,
    source: doc.source,
    tags: doc.tags,
    owner,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getContacts(options: {
  userId: string;
  role: AppUserRole;
  query?: string;
  page?: number;
}): Promise<ContactListResult> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (options.role !== "admin") {
    filter.ownerId = options.userId;
  }

  const q = options.query?.trim();
  if (q) {
    const safe = escapeRegex(q);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { company: { $regex: safe, $options: "i" } },
    ];
  }

  const page = Math.max(1, options.page ?? 1);
  const total = await Contact.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / CONTACTS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const docs = (await Contact.find(filter)
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * CONTACTS_PAGE_SIZE)
    .limit(CONTACTS_PAGE_SIZE)
    .populate("ownerId", "name")
    .lean()) as unknown as LeanContact[];

  return {
    contacts: docs.map(toSummary),
    total,
    page: currentPage,
    pageSize: CONTACTS_PAGE_SIZE,
    totalPages,
  };
}

export async function getContactById(
  id: string
): Promise<ContactSummary | null> {
  if (!isValidObjectId(id)) return null;

  await connectToDatabase();

  const doc = (await Contact.findById(id)
    .populate("ownerId", "name")
    .lean()) as unknown as LeanContact | null;

  return doc ? toSummary(doc) : null;
}

export interface ContactOption {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface LeanContactOption {
  _id: Types.ObjectId;
  name: string;
  email: string;
  company?: string;
}

/** Unpaginated contact list for pickers (deal forms, etc). */
export async function getContactOptions(options: {
  userId: string;
  role: AppUserRole;
}): Promise<ContactOption[]> {
  await connectToDatabase();

  const filter = options.role === "admin" ? {} : { ownerId: options.userId };

  const docs = (await Contact.find(filter)
    .select("name email company")
    .sort({ name: 1 })
    .lean()) as unknown as LeanContactOption[];

  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    company: doc.company,
  }));
}
