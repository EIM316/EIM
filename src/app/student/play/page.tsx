"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Search, X } from "lucide-react";
import Swal from "sweetalert2";

export default function PlayPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }

    setUser(JSON.parse(savedUser));
  }, [router]);

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7b2020",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, logout",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        localStorage.removeItem("studentClass");
        router.push("/");
      }
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading student data...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white relative">
      {/* ✅ Header (same as student page) */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative mb-10">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push("/student")}
        >
          <Image
            src={user.avatar || "/student-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">
            {user.first_name?.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Search
            onClick={() => setShowSearch(true)}
            className="w-6 h-6 cursor-pointer hover:text-gray-300 text-white"
          />
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={handleLogout}
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
          />
        </div>

        {/* ✅ Pop-up Search Bar */}
        {showSearch && (
          <div className="absolute inset-0 bg-[#7b2020] flex items-center justify-center px-4 z-10">
            <input
              type="text"
              placeholder="Search for key terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-3/4 px-3 py-2 rounded-md text-white border"
              autoFocus
            />
            <X
              onClick={() => {
                setSearchTerm("");
                setShowSearch(false);
              }}
              className="ml-3 w-6 h-6 cursor-pointer text-white"
            />
          </div>
        )}
      </header>

      {/* ✅ Main content */}
      <main className="flex flex-col items-center w-full mt-3">
        <div className="flex flex-col items-center gap-4 w-full max-w-sm mb-10">
          {/* Refresher Mode */}
          <div
            onClick={() => router.push("/student/play/refresher")}
            className="border-2 border-black rounded-lg p-4 text-center shadow-md w-[90%] hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <h3 className="text-lg font-bold text-[#7b2020] mb-1">
              REFRESHER MODE
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              TAKE QUIZ AT YOUR OWN TIME
            </p>
            <Image
              src="/resources/modes/refresher.png"
              alt="Refresher Mode"
              width={180}
              height={180}
              className="mx-auto"
            />
          </div>

          {/* Quiz Mode */}
          <div
            onClick={() => router.push("/on-going")}
            className="border-2 border-black rounded-lg p-4 text-center shadow-md w-[90%] hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <h3 className="text-lg font-bold text-[#7b2020] mb-1">QUIZ MODE</h3>
            <p className="text-gray-600 text-sm mb-3">TAKE QUIZ WITH TIMER</p>
            <Image
              src="/resources/modes/quiz.png"
              alt="Quiz Mode"
              width={180}
              height={180}
              className="mx-auto"
            />
          </div>

          {/* Class Mode */}
          <div
            onClick={() => router.push("/on-going")}
            className="border-2 border-black rounded-lg p-4 text-center shadow-md w-[90%] hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <h3 className="text-lg font-bold text-[#7b2020] mb-1">
              CLASS MODE
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              Join Class and Show your Limits
            </p>
            <Image
              src="/resources/modes/class.png"
              alt="Class Mode"
              width={180}
              height={180}
              className="mx-auto"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
