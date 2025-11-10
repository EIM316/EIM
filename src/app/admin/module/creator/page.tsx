
"use client";

import { Suspense } from "react";
import AdminSlideshowCreator from "./AdminSlideshowCreator";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-700">Loading...</div>}>
      <AdminSlideshowCreator />
    </Suspense>
  );
}
