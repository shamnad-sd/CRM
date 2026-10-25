"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { taskSchema } from "@/lib/validations";
import {
  createTask,
  toggleTaskStatus,
  updateTask,
  deleteTask,
  type TaskSummary,
} from "@/lib/tasks-data";

export interface TaskActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  task?: TaskSummary;
}

function parseTaskFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    dueDate: formData.get("dueDate"),
    contactId: formData.get("contactId"),
    dealId: formData.get("dealId"),
    assignedTo: formData.get("assignedTo"),
  };
}

export async function createTaskAction(
  _prevState: TaskActionResult | undefined,
  formData: FormData
): Promise<TaskActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in." };
  }

  const parsed = taskSchema.safeParse(parseTaskFormData(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // Only admins may assign a task to someone other than themselves.
  if (
    session.user.role !== "admin" &&
    parsed.data.assignedTo !== session.user.id
  ) {
    return {
      success: false,
      error: "You can only create tasks assigned to yourself.",
    };
  }

  await connectToDatabase();

  const task = await createTask(parsed.data);

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  if (parsed.data.contactId) {
    revalidatePath(`/dashboard/contacts/${parsed.data.contactId}`);
  }

  return { success: true, task };
}

export async function updateTaskAction(
  taskId: string,
  _prevState: TaskActionResult | undefined,
  formData: FormData
): Promise<TaskActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!isValidObjectId(taskId)) {
    return { success: false, error: "Task not found." };
  }

  const parsed = taskSchema.safeParse(parseTaskFormData(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await Task.findById(taskId);
  if (!existing) {
    return { success: false, error: "Task not found." };
  }

  const isAssignee = existing.assignedTo.toString() === session.user.id;
  if (session.user.role !== "admin" && !isAssignee) {
    return {
      success: false,
      error: "You don't have permission to edit this task.",
    };
  }

  if (
    session.user.role !== "admin" &&
    parsed.data.assignedTo !== session.user.id
  ) {
    return {
      success: false,
      error: "You can only assign tasks to yourself.",
    };
  }

  const task = await updateTask(taskId, parsed.data);

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");

  return { success: true, task: task ?? undefined };
}

export async function toggleTaskStatusAction(
  taskId: string
): Promise<TaskActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!isValidObjectId(taskId)) {
    return { success: false, error: "Task not found." };
  }

  await connectToDatabase();

  const existing = await Task.findById(taskId);
  if (!existing) {
    return { success: false, error: "Task not found." };
  }

  const isAssignee = existing.assignedTo.toString() === session.user.id;
  if (session.user.role !== "admin" && !isAssignee) {
    return {
      success: false,
      error: "You don't have permission to update this task.",
    };
  }

  const task = await toggleTaskStatus(taskId);

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");

  return { success: true, task: task ?? undefined };
}

export async function deleteTaskAction(
  taskId: string
): Promise<TaskActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!isValidObjectId(taskId)) {
    return { success: false, error: "Task not found." };
  }

  await connectToDatabase();

  const existing = await Task.findById(taskId);
  if (!existing) {
    return { success: false, error: "Task not found." };
  }

  const isAssignee = existing.assignedTo.toString() === session.user.id;
  if (session.user.role !== "admin" && !isAssignee) {
    return {
      success: false,
      error: "You don't have permission to delete this task.",
    };
  }

  await deleteTask(taskId);

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");

  return { success: true };
}
