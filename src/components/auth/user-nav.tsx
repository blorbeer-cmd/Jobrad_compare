"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { LogOut, Shield, User } from "lucide-react";

export function UserNav() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/login">Anmelden</Link>
      </Button>
    );
  }

  const initials = (session.user.name ?? session.user.email ?? "?")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border p-1 pr-3 transition-colors hover:bg-muted">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {session.user.name ?? session.user.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <p className="text-sm">{session.user.name}</p>
          <p className="text-xs text-muted-foreground">{session.user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {session.user.role === "ADMIN" && (
          <Link href="/admin">
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              Admin-Bereich
            </DropdownMenuItem>
          </Link>
        )}
        <Link href="/">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Fahrr\u00e4der
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
