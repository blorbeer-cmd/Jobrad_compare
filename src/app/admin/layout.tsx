import { requireAdmin } from "@/lib/auth-guard";
import { AdminSidebar } from "./_components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex gap-8">
      <AdminSidebar email={session.user.email ?? ""} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
