"use client";

import { useRouter } from "next/navigation";

interface Invite {
  id: string;
  email: string;
  usedAt: string | null;
  createdAt: string;
  expiresAt: string;
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
    if (invite.usedAt) return { label: "Angenommen", className: "text-green-600" };
    if (new Date(invite.expiresAt) < new Date())
      return { label: "Abgelaufen", className: "text-muted-foreground" };
    return { label: "Offen", className: "text-yellow-600" };
  }

  if (invites.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Noch keine Einladungen vorhanden.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">E-Mail</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Eingeladen am</th>
              <th className="px-4 py-3 text-left font-medium">Läuft ab</th>
              <th className="px-4 py-3 text-right font-medium">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => {
              const status = getStatus(invite);
              return (
                <tr key={invite.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{invite.email}</td>
                  <td className={`px-4 py-3 ${status.className}`}>
                    {status.label}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(invite.createdAt).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(invite.expiresAt).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!invite.usedAt && (
                      <button
                        onClick={() => handleRevoke(invite.id)}
                        className="text-sm text-destructive hover:underline"
                      >
                        Widerrufen
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
