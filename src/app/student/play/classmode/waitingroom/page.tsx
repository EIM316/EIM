
"use client";

import { Suspense } from "react";
import Waitingroompage from "./ProfessorWaitingRoom";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-700">Loading...</div>}>
      <Waitingroompage />
    </Suspense>
  );
}
