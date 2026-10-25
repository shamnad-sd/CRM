import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import { DEAL_STAGES, type DealStage } from "@/lib/constants";

export type { DealStage };

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
    enum: DEAL_STAGES,
    default: "new",
  },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expectedCloseDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Indexes back the Deals board filters. `ownerId` leads the compound indexes
// because sales users are always scoped to their own records.
DealSchema.index({ ownerId: 1, stage: 1 });
DealSchema.index({ ownerId: 1, createdAt: -1, _id: -1 });
DealSchema.index({ stage: 1 });
DealSchema.index({ contactId: 1 });
DealSchema.index({ value: 1 });
DealSchema.index({ expectedCloseDate: 1 });

const Deal: Model<IDeal> = models.Deal || model<IDeal>("Deal", DealSchema);

export default Deal;
