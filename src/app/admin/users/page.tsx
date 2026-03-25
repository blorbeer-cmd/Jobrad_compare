import { db } from "@/lib/db";
import { UserTable } from "./_components/user-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      _count: { select: { savedBikes: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Benutzer</h2>
        <p className="text-muted-foreground">
          Alle registrierten Benutzer verwalten.
        </p>
      </div>
      <UserTable users={users} />
    </div>
  );
}
