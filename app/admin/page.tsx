import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Admin",
};

export default async function AdminPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin/dashboard");

  return (
    <div className="min-h-screen bg-ink px-4 py-20 text-cream">
      <h1 className="text-center font-display text-3xl">Dr.Meedina</h1>
      <AdminLoginForm />
    </div>
  );
}
