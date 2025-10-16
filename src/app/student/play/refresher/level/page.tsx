"use client";

import { Suspense } from "react";
import RefresherLevelPage from "./RefresherLevelPageInner";

export default function RefresherLevelPageWrapper() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Loading level...</div>}>
      <RefresherLevelPage />
    </Suspense>
  );
}
