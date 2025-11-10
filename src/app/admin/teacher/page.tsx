// /student/play/classmode/waitingroom/page.tsx
"use client";

import { Suspense } from "react";
import AdminTeachersPage from "./AdminTeachersPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-700">Loading...</div>}>
      <AdminTeachersPage />
    </Suspense>
  );
}
