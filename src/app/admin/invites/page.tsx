import { db } from "@/lib/db";
import { InviteForm } from "./_components/invite-form";
import { InviteList } from "./_components/invite-list";

export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  const invites = await db.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { email: true, name: true } },
    },
  });

  const stats = {
    total: invites.length,
    used: invites.filter((i) => i.usedAt).length,
    pending: invites.filter((i) => !i.usedAt && new Date(i.expiresAt) > new Date()).length,
    expired: invites.filter((i) => !i.usedAt && new Date(i.expiresAt) <= new Date()).length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Einladungen</h2>
        <p className="text-muted-foreground">
          Lade neue Benutzer per E-Mail ein.
        </p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Gesamt</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Angenommen</p>
          <p className="text-xl font-bold text-green-600">{stats.used}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Offen</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Abgelaufen</p>
          <p className="text-xl font-bold text-muted-foreground">{stats.expired}</p>
        </div>
      </div>

      <InviteForm />
      <InviteList invites={invites} />
    </div>
  );
}
