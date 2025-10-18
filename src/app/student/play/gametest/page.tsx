"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Search, X } from "lucide-react";
import Swal from "sweetalert2";

export default function GameTestPage() {
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
      {/* ✅ Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative mb-8">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push("/student/play")}
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
      <main className="flex flex-col items-center w-full px-4">
        <h2 className="text-xl font-bold text-[#7b2020] mb-4">
          🧩 Choose Game Type
        </h2>

        {/* ✅ Perfect Square Layout */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {[
            {
              title: "SCHEMATIC BUILDER",
              desc: "CREATE & SOLVE DIAGRAMS",
              img: "/resources/modes/schematic.png",
              route: "/student/play/gametest/1",
            },
            {
              title: "PHASE RUSH",
              desc: "FAST REACTION QUIZ",
              img: "/resources/modes/phaserush.png",
              route: "/student/play/gametest/2",
            },
          ].map((game, i) => (
            <div
              key={i}
              onClick={() => router.push(game.route)}
              className="relative border-2 border-black rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer bg-white aspect-square flex flex-col justify-between items-center p-3 overflow-hidden"
            >
              <div className="text-center">
                <h3 className="text-md font-bold text-[#7b2020] leading-tight">
                  {game.title}
                </h3>
                <p className="text-gray-600 text-xs">{game.desc}</p>
              </div>

              <div className="flex-1 flex items-center justify-center w-full">
                <Image
                  src={game.img}
                  alt={game.title}
                  width={100}
                  height={100}
                  className="object-contain max-h-[70%]"
                />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
