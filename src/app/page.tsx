"use client";

import { useRouter } from "next/navigation";
import Section1 from "./mainpage/1/page";
import Section2 from "./mainpage/2/page";
import Section3 from "./mainpage/3/page";
import Section4 from "./mainpage/4/page";
import Section5 from "./mainpage/5/page";

export default function MainPage() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center w-full min-h-screen">
      {/* Header */}
      <header className="w-full bg-[#a32424] text-white flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <img
            src="/resources/logo/tupc.png"
            alt="Logo"
            className="w-8 h-8 rounded-full border border-white"
          />
        </div>

        {/* ✅ Login button that routes to /login */}
        <button
          onClick={() => router.push("/login")}
          className="text-sm font-semibold hover:underline transition"
        >
          LOGIN
        </button>
      </header>

      {/* Page Sections */}
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 />
      <Section5 />

      {/* Footer */}
      <footer className="w-full bg-[#a32424] py-3 text-center text-xs text-white font-medium">
        © 2025 EIM | All Rights Reserved
      </footer>
    </main>
  );
}
