import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import { CONTACT_SOURCES, type ContactSource } from "@/lib/constants";

export interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: ContactSource;
  ownerId: Types.ObjectId;
  tags: string[];
  createdAt: Date;
}

const ContactSchema = new Schema<IContact>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  source: { type: String, enum: CONTACT_SOURCES, required: true, default: "Other" },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

// Indexes back the Contacts list filters/sorts. `ownerId` leads the compound
// indexes because sales users are always scoped to their own records.
// name/company sorts use a case-insensitive collation, so their indexes carry
// the same collation or the sort couldn't use them. They end in _id because
// the list sorts by (field, _id) so pagination is stable when values repeat.
const CASE_INSENSITIVE = { locale: "en", strength: 2 } as const;
ContactSchema.index({ ownerId: 1, createdAt: -1, _id: -1 });
ContactSchema.index(
  { ownerId: 1, name: 1, _id: 1 },
  { collation: CASE_INSENSITIVE }
);
ContactSchema.index(
  { ownerId: 1, company: 1, _id: 1 },
  { collation: CASE_INSENSITIVE }
);
ContactSchema.index({ source: 1 });
ContactSchema.index({ tags: 1 });
ContactSchema.index({ createdAt: -1 });

const Contact: Model<IContact> =
  models.Contact || model<IContact>("Contact", ContactSchema);

export default Contact;
