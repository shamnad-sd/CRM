import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export type ActivityType = "call" | "email" | "meeting" | "note";

export interface IActivity extends Document {
  type: ActivityType;
  contactId: Types.ObjectId;
  dealId?: Types.ObjectId;
  content: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  type: {
    type: String,
    enum: ["call", "email", "meeting", "note"],
    required: true,
  },
  contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
  dealId: { type: Schema.Types.ObjectId, ref: "Deal" },
  content: { type: String, required: true, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const Activity: Model<IActivity> =
  models.Activity || model<IActivity>("Activity", ActivitySchema);

export default Activity;
