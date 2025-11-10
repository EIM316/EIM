"use client";

import { useRouter } from "next/navigation";

export default function Section1() {
  const router = useRouter();

  return (
    <section className="w-full bg-white flex flex-col items-center text-center px-6 py-10">
      <h1 className="text-5xl font-extrabold text-black mt-6 mb-3">EIM</h1>
      <p className="text-gray-700 text-sm leading-relaxed mb-3">
        Dive into the exciting world of electrical installation made fun and easy to understand for students! 💡
      </p>
      <p className="text-gray-700 text-sm leading-relaxed mb-6">
        Earn points, unlock achievements, and test your skills as you become the greatest Achiever!
      </p>

      <img
        src="/resources/icons/mainicon.jpeg"
        alt="Mascot"
        className="w-36 h-36 object-contain mb-4"
      />

      {/* ✅ START Button navigates to login page */}
      <button
        onClick={() => router.push("/login")}
        className="bg-[#a32424] text-white px-8 py-2 rounded-full font-semibold shadow hover:bg-[#8e1f1f] transition"
      >
        START
      </button>
    </section>
  );
}
