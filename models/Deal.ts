import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export type DealStage = "new" | "contacted" | "proposal" | "won" | "lost";

export interface IDeal extends Document {
  title: string;
  contactId: Types.ObjectId;
  value: number;
  stage: DealStage;
  ownerId: Types.ObjectId;
  expectedCloseDate?: Date;
  createdAt: Date;
}

const DealSchema = new Schema<IDeal>({
  title: { type: String, required: true, trim: true },
  contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
  value: { type: Number, required: true, min: 0 },
  stage: {
    type: String,
    enum: ["new", "contacted", "proposal", "won", "lost"],
    default: "new",
  },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expectedCloseDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Deal: Model<IDeal> = models.Deal || model<IDeal>("Deal", DealSchema);

export default Deal;
