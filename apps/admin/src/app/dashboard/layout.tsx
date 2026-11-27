import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";
import AdminShell from "./admin-shell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await auth.protect();
  return <AdminShell>{children}</AdminShell>;
}
