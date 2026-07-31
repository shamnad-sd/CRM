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

const Contact: Model<IContact> =
  models.Contact || model<IContact>("Contact", ContactSchema);

export default Contact;
