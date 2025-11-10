
"use client";

import { Suspense } from "react";
import AdminStudentRecordsPage from "./AdminStudentRecordsPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-700">Loading...</div>}>
      <AdminStudentRecordsPage />
    </Suspense>
  );
}
