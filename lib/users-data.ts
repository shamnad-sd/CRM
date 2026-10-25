import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export interface UserOption {
  id: string;
  name: string;
}

interface LeanUser {
  _id: Types.ObjectId;
  name: string;
}

/**
 * Minimal user list for admin-only pickers (e.g. assigning a task to
 * someone else). Deliberately returns only id/name — never email or
 * password — since this DTO reaches the client.
 */
export async function getUserOptions(): Promise<UserOption[]> {
  await connectToDatabase();

  const docs = (await User.find()
    .select("name")
    .sort({ name: 1 })
    .lean()) as unknown as LeanUser[];

  return docs.map((doc) => ({ id: doc._id.toString(), name: doc.name }));
}
