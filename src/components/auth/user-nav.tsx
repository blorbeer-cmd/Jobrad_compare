"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function UserNav() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium hover:underline"
      >
        Anmelden
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {session.user.role === "ADMIN" && (
        <Link
          href="/admin/invites"
          className="text-sm text-muted-foreground hover:underline"
        >
          Einladungen
        </Link>
      )}
      <span className="text-sm text-muted-foreground">
        {session.user.email}
      </span>
      <button
        onClick={() => signOut()}
        className="text-sm font-medium hover:underline"
      >
        Abmelden
      </button>
    </div>
  );
}
