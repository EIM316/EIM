"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Menu, Plus } from "lucide-react";
import Swal from "sweetalert2";

export default function GameModePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "admin") {
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
      confirmButtonColor: "#548E28",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, logout",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.clear();
        router.push("/");
      }
    });
  };

  const gameModes = [
    {
      id: 1,
      title: "Refresher Challenge",
      description:
        "A progressive mode with 20 levels of increasing difficulty. Each level builds on the previous one to reinforce learning step-by-step.",
      image: "/resources/admin/game1.png",
    },
    {
      id: 2,
      title: "Quiz Battle",
      description:
        "A competitive timed quiz! Set time limits and max questions to challenge accuracy and speed.",
      image: "/resources/admin/game2.png",
    },
    {
      id: 3,
      title: "Schematic Builder",
      description:
        "A creative mode for completing schematic diagrams. Ideal for hands-on electrical training.",
      image: "/resources/admin/game3.png",
    },
    {
      id: 4,
      title: "Phase Rush",
      description:
        "A fast-pace challenge against bots. Great for quick reviews!",
      image: "/resources/admin/game4.png",
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading admin data...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-white">
      {/* ✅ Header */}
      <header className="w-full bg-[#548E28] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 shadow-md">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={() => router.push("/admin")}
            className="text-white text-2xl font-bold hover:opacity-80 transition"
          >
            ←
          </button>

          {/* Admin Avatar */}
          <Image
            src={user.avatar || "/resources/icons/admin.png"}
            alt="Admin Avatar"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />

          {/* Admin Info */}
          <div className="flex flex-col">
            <h1 className="font-semibold text-base sm:text-lg leading-tight">
             Game Modes
            </h1>
            <p className="text-[11px] sm:text-xs opacity-80">Game Mode Manager</p>
          </div>
        </div>

        
      </header>

      {/* ✅ Main Content */}
      <main className="flex-1 w-full max-w-5xl px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h1 className="text-2xl font-bold text-[#548E28]">Game Modes</h1>
          
        </div>

        {/* ✅ Game Mode List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {gameModes.map((mode) => (
            <div
              key={mode.id}
              className="bg-[#EAF5E2] rounded-2xl shadow-md p-6 flex flex-col items-center justify-start text-center hover:shadow-lg hover:scale-[1.02] transition cursor-pointer"
              onClick={() => router.push(`/admin/gamemode/${mode.id}`)}
            >
              <Image
                src={mode.image}
                alt={mode.title}
                width={120}
                height={80}
                className="mb-3"
              />
              <h2 className="text-lg font-semibold text-[#548E28] mb-2">
                {mode.title}
              </h2>
              <p className="text-sm text-gray-600 leading-snug line-clamp-3">
                {mode.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
