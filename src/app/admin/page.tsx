import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, CheckCircle, Clock } from "lucide-react";

export default async function AdminDashboardPage() {
  const [userCount, inviteCount, usedInviteCount, pendingInviteCount] =
    await Promise.all([
      db.user.count(),
      db.invite.count(),
      db.invite.count({ where: { usedAt: { not: null } } }),
      db.invite.count({
        where: { usedAt: null, expiresAt: { gt: new Date() } },
      }),
    ]);

  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const stats = [
    {
      title: "Benutzer",
      value: userCount,
      icon: Users,
      description: "Registrierte Benutzer",
    },
    {
      title: "Einladungen",
      value: inviteCount,
      icon: Mail,
      description: "Gesamt gesendet",
    },
    {
      title: "Angenommen",
      value: usedInviteCount,
      icon: CheckCircle,
      description: "Einladungen genutzt",
    },
    {
      title: "Offen",
      value: pendingInviteCount,
      icon: Clock,
      description: "Ausstehende Einladungen",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          \u00dcbersicht \u00fcber Benutzer und Einladungen.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Letzte Registrierungen</CardTitle>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Benutzer.</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
