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
import { LogOut, Shield, User, Bike } from "lucide-react";

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
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border/50 bg-card px-2 py-1 pr-3 text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[100px] truncate sm:block">
            {session.user.name ?? session.user.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="py-2">
          <p className="font-medium">{session.user.name}</p>
          <p className="text-xs font-normal text-muted-foreground truncate">{session.user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {session.user.role === "ADMIN" && (
          <Link href="/admin">
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Shield className="h-4 w-4" />
              Admin-Bereich
            </DropdownMenuItem>
          </Link>
        )}
        <Link href="/">
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <Bike className="h-4 w-4" />
            Fahrräder
          </DropdownMenuItem>
        </Link>
        <Link href="/profil">
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            Mein Profil
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
