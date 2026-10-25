import { isValidObjectId, Types, type QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Contact, { type IContact } from "@/models/Contact";
import "@/models/User"; // ensure the User model is registered for populate()
import type { ContactSource } from "@/lib/constants";
import {
  dateRangeToBounds,
  escapeRegex,
  type ContactFilters,
} from "@/lib/filters";
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

/** Names/companies sort case-insensitively; matches the collated indexes on the model. */
const SORT_COLLATION = { locale: "en", strength: 2 } as const;

/**
 * Filtered, sorted, paginated contact list.
 *
 * Ownership is applied first and can't be widened by params: a sales user
 * always gets `ownerId = self`, and asking for someone else's `owner` yields
 * an empty result rather than being ignored. Only admins may filter by owner.
 */
export async function getContactsFiltered(
  filters: ContactFilters,
  user: { userId: string; role: AppUserRole }
): Promise<ContactListResult> {
  const empty: ContactListResult = {
    contacts: [],
    total: 0,
    page: 1,
    pageSize: CONTACTS_PAGE_SIZE,
    totalPages: 1,
  };

  const filter: QueryFilter<IContact> = {};

  if (user.role === "admin") {
    if (filters.owner) filter.ownerId = new Types.ObjectId(filters.owner);
  } else {
    if (filters.owner && filters.owner !== user.userId) return empty;
    filter.ownerId = new Types.ObjectId(user.userId);
  }

  if (filters.source.length > 0) filter.source = { $in: filters.source };
  if (filters.tag.length > 0) filter.tags = { $in: filters.tag };

  const created = dateRangeToBounds(filters.from, filters.to);
  if (created) filter.createdAt = created;

  if (filters.q) {
    const safe = escapeRegex(filters.q);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { company: { $regex: safe, $options: "i" } },
    ];
  }

  await connectToDatabase();

  const total = await Contact.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / CONTACTS_PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);

  const direction = filters.dir === "asc" ? 1 : -1;
  // `_id` tiebreaker keeps pagination stable when sort values repeat.
  const sort: Record<string, 1 | -1> = { [filters.sort]: direction, _id: direction };

  let query = Contact.find(filter)
    .sort(sort)
    .skip((currentPage - 1) * CONTACTS_PAGE_SIZE)
    .limit(CONTACTS_PAGE_SIZE)
    .populate("ownerId", "name");
  if (filters.sort !== "createdAt") query = query.collation(SORT_COLLATION);

  const docs = (await query.lean()) as unknown as LeanContact[];

  return {
    contacts: docs.map(toSummary),
    total,
    page: currentPage,
    pageSize: CONTACTS_PAGE_SIZE,
    totalPages,
  };
}

/** Distinct tags across the contacts this user can see, for the tag filter. */
export async function getContactTagOptions(user: {
  userId: string;
  role: AppUserRole;
}): Promise<string[]> {
  await connectToDatabase();

  const filter: QueryFilter<IContact> =
    user.role === "admin" ? {} : { ownerId: new Types.ObjectId(user.userId) };

  const tags = (await Contact.distinct("tags", filter)) as string[];
  return tags
    .filter((tag) => typeof tag === "string" && tag.length > 0)
    .sort((a, b) => a.localeCompare(b));
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
