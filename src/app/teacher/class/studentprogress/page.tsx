"use client";

import { Suspense } from "react";
import StudentProgressPage from "./StudentProgressPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-700">Loading...</div>}>
     <StudentProgressPage />
    </Suspense>
  );
}