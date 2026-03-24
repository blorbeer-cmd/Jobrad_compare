import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { InviteForm } from "./_components/invite-form";
import { InviteList } from "./_components/invite-list";

export default async function AdminInvitesPage() {
  await requireAdmin();

  const invites = await db.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { email: true, name: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Einladungen</h2>
        <p className="text-muted-foreground">
          Lade neue Benutzer per E-Mail ein.
        </p>
      </div>

      <InviteForm />
      <InviteList invites={invites} />
    </div>
  );
}
