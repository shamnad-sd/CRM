import { isValidObjectId, Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import type { TaskStatus } from "@/models/Task";
import "@/models/User"; // ensure referenced models are registered for populate()
import "@/models/Contact";
import "@/models/Deal";
import type { AppUserRole } from "@/types/next-auth";

export interface TaskPersonRef {
  id: string;
  name: string;
}

export interface TaskLinkedRef {
  id: string;
  name: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
  assignedTo: TaskPersonRef | null;
  contact: TaskLinkedRef | null;
  deal: TaskLinkedRef | null;
}

interface PopulatedPersonRef {
  _id: Types.ObjectId;
  name: string;
}

interface PopulatedDealRef {
  _id: Types.ObjectId;
  title: string;
}

interface LeanTask {
  _id: Types.ObjectId;
  title: string;
  dueDate: Date;
  status: TaskStatus;
  createdAt: Date;
  assignedTo: PopulatedPersonRef | Types.ObjectId | null;
  contactId?: PopulatedPersonRef | Types.ObjectId | null;
  dealId?: PopulatedDealRef | Types.ObjectId | null;
}

function personRefOrNull(
  value: PopulatedPersonRef | Types.ObjectId | null | undefined
): TaskPersonRef | null {
  return value && typeof value === "object" && "name" in value
    ? { id: value._id.toString(), name: value.name }
    : null;
}

function dealRefOrNull(
  value: PopulatedDealRef | Types.ObjectId | null | undefined
): TaskLinkedRef | null {
  return value && typeof value === "object" && "title" in value
    ? { id: value._id.toString(), name: value.title }
    : null;
}

const POPULATE_OPTIONS = [
  { path: "assignedTo", select: "name" },
  { path: "contactId", select: "name" },
  { path: "dealId", select: "title" },
];

function toSummary(doc: LeanTask): TaskSummary {
  return {
    id: doc._id.toString(),
    title: doc.title,
    dueDate: doc.dueDate.toISOString(),
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    assignedTo: personRefOrNull(doc.assignedTo),
    contact: personRefOrNull(doc.contactId),
    deal: dealRefOrNull(doc.dealId),
  };
}

/**
 * Tasks assigned to a user. Admins can pass includeAll to see every task
 * regardless of assignee; sales users always get only their own tasks,
 * regardless of what's passed.
 */
export async function getTasksForUser(
  userId: string,
  role: AppUserRole,
  includeAll?: boolean
): Promise<TaskSummary[]> {
  await connectToDatabase();

  const filter = role === "admin" && includeAll ? {} : { assignedTo: userId };

  const docs = (await Task.find(filter)
    .sort({ dueDate: 1 })
    .populate(POPULATE_OPTIONS)
    .lean()) as unknown as LeanTask[];

  return docs.map(toSummary);
}

export interface CreateTaskInput {
  title: string;
  dueDate: Date;
  contactId?: string;
  dealId?: string;
  assignedTo: string;
}

export async function createTask(data: CreateTaskInput): Promise<TaskSummary> {
  await connectToDatabase();

  const doc = await Task.create(data);
  await doc.populate(POPULATE_OPTIONS);

  return toSummary(doc.toObject() as unknown as LeanTask);
}

export async function toggleTaskStatus(
  taskId: string
): Promise<TaskSummary | null> {
  if (!isValidObjectId(taskId)) return null;

  await connectToDatabase();

  const task = await Task.findById(taskId);
  if (!task) return null;

  task.status = task.status === "done" ? "pending" : "done";
  await task.save();
  await task.populate(POPULATE_OPTIONS);

  return toSummary(task.toObject() as unknown as LeanTask);
}

export interface UpdateTaskInput {
  title?: string;
  dueDate?: Date;
  contactId?: string | null;
  dealId?: string | null;
  assignedTo?: string;
}

export async function updateTask(
  taskId: string,
  data: UpdateTaskInput
): Promise<TaskSummary | null> {
  if (!isValidObjectId(taskId)) return null;

  await connectToDatabase();

  const task = await Task.findById(taskId);
  if (!task) return null;

  task.set(data);
  await task.save();
  await task.populate(POPULATE_OPTIONS);

  return toSummary(task.toObject() as unknown as LeanTask);
}

export async function deleteTask(taskId: string): Promise<boolean> {
  if (!isValidObjectId(taskId)) return false;

  await connectToDatabase();

  const result = await Task.findByIdAndDelete(taskId);
  return !!result;
}

export interface GroupedTasks {
  overdue: TaskSummary[];
  today: TaskSummary[];
  upcoming: TaskSummary[];
  completed: TaskSummary[];
}

/** Groups pending tasks by due date relative to today; completed tasks get their own bucket. */
export function groupTasksByDueDate(tasks: TaskSummary[]): GroupedTasks {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const groups: GroupedTasks = {
    overdue: [],
    today: [],
    upcoming: [],
    completed: [],
  };

  for (const task of tasks) {
    if (task.status === "done") {
      groups.completed.push(task);
      continue;
    }

    const due = new Date(task.dueDate);
    if (due < startOfToday) {
      groups.overdue.push(task);
    } else if (due < startOfTomorrow) {
      groups.today.push(task);
    } else {
      groups.upcoming.push(task);
    }
  }

  return groups;
}
