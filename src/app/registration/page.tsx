"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const handleSelect = (role: "student" | "teacher") => {
    router.push(`/registration/${role}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-white text-center relative">
      {/* ✅ Navbar */}
      <div className="w-full bg-[#BC2A2A] text-white flex items-center justify-between px-6 py-3 shadow-md fixed top-0 left-0 z-50">
        <div className="flex items-center space-x-3">
          <Image
            src="/resources/logo/tupc.png"
            alt="School Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <h1 className="text-lg font-semibold tracking-wide">EIM</h1>
        </div>

        {/* Optional right side button */}
        <button
          onClick={() => router.push("/login")}
          className="bg-white text-[#BC2A2A] px-4 py-1.5 rounded-md font-semibold text-sm hover:bg-gray-100 transition"
        >
          Back
        </button>
      </div>

      {/* ✅ Page Content */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
        {/* Title */}
        <h1 className="text-3xl font-bold text-black mb-2">EIM</h1>
        <p className="text-gray-600 mb-8">
          Create an account
          <br />
          To Start Having Fun!
        </p>

        {/* Student Card */}
        <button
          onClick={() => handleSelect("student")}
          className="w-56 aspect-square border-2 border-gray-300 rounded-2xl flex items-center justify-between px-4 hover:shadow-lg transition mb-4 bg-white"
        >
          <span className="text-lg font-medium text-left text-black">
            Student
          </span>
          <Image
            src="/resources/others/student.png"
            alt="Student"
            width={110}
            height={80}
            className="rounded-lg object-cover"
          />
        </button>

        <p className="text-gray-500 mb-4 font-semibold">OR</p>

        {/* Teacher Card */}
        <button
          onClick={() => handleSelect("teacher")}
          className="w-56 aspect-square border-2 border-gray-300 rounded-2xl flex items-center justify-between px-4 hover:shadow-lg transition bg-white"
        >
          <span className="text-lg font-medium text-left text-black">
            Teacher
          </span>
          <Image
            src="/resources/others/teacher.png"
            alt="Teacher"
            width={120}
            height={80}
            className="rounded-lg object-cover"
          />
        </button>
      </section>
    </main>
  );
}
