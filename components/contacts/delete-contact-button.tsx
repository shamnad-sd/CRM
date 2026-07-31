"use client";

import { useTransition } from "react";
import { deleteContact } from "@/actions/contacts";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteContactButton({ contactId }: { contactId: string }) {
  const [isPending, startTransition] = useTransition();

  // AlertDialogAction unmounts the dialog (and any <form> inside it)
  // synchronously on click, which races the browser's native form submit.
  // Invoking the Server Action directly in a transition sidesteps that race.
  const handleDelete = () => {
    startTransition(() => {
      deleteContact(contactId);
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this contact?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the contact. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleDelete}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
