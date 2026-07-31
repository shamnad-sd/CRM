import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export type TaskStatus = "pending" | "done";

export interface ITask extends Document {
  title: string;
  dueDate: Date;
  contactId?: Types.ObjectId;
  dealId?: Types.ObjectId;
  assignedTo: Types.ObjectId;
  status: TaskStatus;
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true, trim: true },
  dueDate: { type: Date, required: true },
  contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
  dealId: { type: Schema.Types.ObjectId, ref: "Deal" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "done"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const Task: Model<ITask> = models.Task || model<ITask>("Task", TaskSchema);

export default Task;
