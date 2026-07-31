"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: ActionResult | undefined = undefined;

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(
    signupAction,
    initialState
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Sign up to start using the CRM</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {state?.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" autoComplete="name" required />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            {state?.fieldErrors?.email && (
              <p className="text-xs text-red-600">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            {state?.fieldErrors?.password && (
              <p className="text-xs text-red-600">{state.fieldErrors.password[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue="sales"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <option value="sales">Sales</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Sign up"}
          </Button>
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-slate-900 underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
