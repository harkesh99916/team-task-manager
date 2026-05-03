import { AppShell } from "@/components/dashboard/app-shell";

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
