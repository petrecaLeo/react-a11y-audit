#!/usr/bin/env bash
# Next.js + Tailwind v4 + shadcn/ui: colors in :root and .dark, used through @theme inline.
set -euo pipefail
mkdir -p src/app src/components/ui
cat > package.json <<'JSON'
{ "name": "account", "private": true, "dependencies": { "next": "^15.0.0", "react": "^19.0.0", "react-dom": "^19.0.0", "@radix-ui/react-dialog": "^1.1.0", "lucide-react": "^0.400.0", "tailwindcss": "^4.1.0" } }
JSON
cat > src/app/globals.css <<'CSS'
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted-foreground: var(--muted-foreground);
  --color-ring: var(--ring);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --muted-foreground: oklch(0.45 0 0);
  --ring: oklch(0.556 0 0);
}
CSS
cat > src/components/ui/dialog.tsx <<'TSX'
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-lg leading-none font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogTitle, DialogDescription };
TSX
cat > src/components/DeleteAccount.tsx <<'TSX'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export function DeleteAccount({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Dialog>
      <DialogTrigger className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Delete account</DialogTrigger>
      <DialogContent>
        <DialogDescription>This removes your orders and saved addresses. It can't be undone.</DialogDescription>
        <div className="flex justify-end gap-2">
          <DialogClose className="rounded-md border px-4 py-2 text-sm">Cancel</DialogClose>
          <button type="button" className="rounded-md bg-red-700 px-4 py-2 text-sm text-white" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
TSX
git init -q -b main
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "Delete account dialog"
