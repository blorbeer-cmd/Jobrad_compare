"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";

interface Invite {
  id: string;
  email: string;
  usedAt: Date | string | null;
  createdAt: Date | string;
  expiresAt: Date | string;
  invitedBy: string;
  sender: { email: string | null; name: string | null };
}

export function InviteList({ invites }: { invites: Invite[] }) {
  const router = useRouter();

  async function handleRevoke(id: string) {
    if (!confirm("Einladung wirklich widerrufen?")) return;
    await fetch(`/api/invites/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function getStatus(invite: Invite) {
    if (invite.usedAt) return { label: "Angenommen", variant: "success" as const };
    if (new Date(invite.expiresAt) < new Date()) return { label: "Abgelaufen", variant: "secondary" as const };
    return { label: "Offen", variant: "warning" as const };
  }

  if (invites.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Noch keine Einladungen vorhanden.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>E-Mail</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Eingeladen am</TableHead>
            <TableHead>L\u00e4uft ab</TableHead>
            <TableHead>Eingeladen von</TableHead>
            <TableHead className="text-right">Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => {
            const status = getStatus(invite);
            return (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.email}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invite.createdAt).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invite.expiresAt).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invite.sender.email ?? "\u2013"}
                </TableCell>
                <TableCell className="text-right">
                  {!invite.usedAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevoke(invite.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
