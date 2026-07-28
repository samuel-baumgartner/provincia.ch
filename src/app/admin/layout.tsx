import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { MARKETING_SECTIONS } from "@/lib/marketing-hub";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthed();

  if (!authed) {
    return <>{children}</>;
  }

  return <AdminShell sections={MARKETING_SECTIONS}>{children}</AdminShell>;
}
