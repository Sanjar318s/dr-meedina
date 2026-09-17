import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Admin dashboard",
};

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");
  return (
    <div className="min-h-screen bg-ink">
      <AdminDashboard />
    </div>
  );
}
