"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Deal from "@/models/Deal";
import { dealSchema } from "@/lib/validations";
import { DEAL_STAGES, type DealStage } from "@/lib/constants";

export interface DealActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseDealFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    contactId: formData.get("contactId"),
    value: formData.get("value"),
    stage: formData.get("stage"),
    expectedCloseDate: formData.get("expectedCloseDate"),
  };
}

export async function createDeal(
  _prevState: DealActionResult | undefined,
  formData: FormData
): Promise<DealActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in." };
  }

  const parsed = dealSchema.safeParse(parseDealFormData(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await connectToDatabase();

  await Deal.create({
    ...parsed.data,
    ownerId: session.user.id,
  });

  redirect("/dashboard/deals?created=true");
}

export async function updateDeal(
  dealId: string,
  _prevState: DealActionResult | undefined,
  formData: FormData
): Promise<DealActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!isValidObjectId(dealId)) {
    return { success: false, error: "Deal not found." };
  }

  const parsed = dealSchema.safeParse(parseDealFormData(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await Deal.findById(dealId);
  if (!existing) {
    return { success: false, error: "Deal not found." };
  }

  const isOwner = existing.ownerId.toString() === session.user.id;
  if (session.user.role !== "admin" && !isOwner) {
    return {
      success: false,
      error: "You don't have permission to edit this deal.",
    };
  }

  existing.set(parsed.data);
  await existing.save();

  redirect("/dashboard/deals?updated=true");
}

export async function deleteDeal(dealId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!isValidObjectId(dealId)) {
    redirect("/dashboard/deals");
  }

  await connectToDatabase();

  const existing = await Deal.findById(dealId);
  if (!existing) {
    redirect("/dashboard/deals");
  }

  const isOwner = existing.ownerId.toString() === session.user.id;
  if (session.user.role !== "admin" && !isOwner) {
    redirect("/dashboard/deals?error=forbidden");
  }

  await Deal.findByIdAndDelete(dealId);

  redirect("/dashboard/deals?deleted=true");
}

const stageUpdateSchema = z.object({
  stage: z.enum(DEAL_STAGES, { error: "Select a valid stage" }),
});

export interface UpdateDealStageResult {
  success: boolean;
  error?: string;
}

export async function updateDealStage(
  dealId: string,
  stage: DealStage
): Promise<UpdateDealStageResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!isValidObjectId(dealId)) {
    return { success: false, error: "Deal not found." };
  }

  const parsed = stageUpdateSchema.safeParse({ stage });
  if (!parsed.success) {
    return { success: false, error: "Invalid stage." };
  }

  await connectToDatabase();

  const existing = await Deal.findById(dealId);
  if (!existing) {
    return { success: false, error: "Deal not found." };
  }

  const isOwner = existing.ownerId.toString() === session.user.id;
  if (session.user.role !== "admin" && !isOwner) {
    return {
      success: false,
      error: "You don't have permission to move this deal.",
    };
  }

  existing.stage = parsed.data.stage;
  await existing.save();

  return { success: true };
}
