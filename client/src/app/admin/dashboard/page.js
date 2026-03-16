import { Suspense } from "react";
import AdminDashboardClient from "./AdminDashboardClient";
import PageLoader from "@/components/PageLoader";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader text="Loading dashboard..." />}>
      <AdminDashboardClient />
    </Suspense>
  );
}