import { Schema, model, models, type Model, type Document } from "mongoose";

export type UserRole = "admin" | "sales";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "sales"], default: "sales" },
  createdAt: { type: Date, default: Date.now },
});

const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);

export default User;
