"use client";

import { ProtectedPage } from "@/components/auth/protected-page";
import { MainDashboard } from "@/components/dashboard/main-dashboard";

export default function HomePage() {
  return (
    <ProtectedPage>
      <MainDashboard />
    </ProtectedPage>
  );
}
