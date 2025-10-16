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
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        router.push("/");
      }
    });
  };

  const gameModes = [
    {
      id: 1,
      title: "Refresher Challenge",
      description:
        "A progressive learning mode where students take on up to 20 levels of interactive challenges. Each level builds upon the previous one, helping players refresh their knowledge and skills step by step in a fun and rewarding way.",
      image: "/resources/admin/game1.png",
    },
    {
      id: 2,
      title: "Quiz Battle",
      description:
        "A timed quiz game that tests accuracy and speed! Set a default timer of 10 minutes and define the maximum number of items. Perfect for assessing comprehension under time pressure while keeping gameplay exciting.",
      image: "/resources/admin/game2.png",
    },
    {
      id: 3,
      title: "Schematic Builder",
      description:
        "A creative mode focused on filling in missing parts of schematic diagrams. Teachers can add up to 10 sets of circuit or wiring diagrams for students to complete — perfect for hands-on electrical learning.",
      image: "/resources/admin/game3.png",
    },
    {
      id: 4,
      title: "Random Rush (True or False)",
      description:
        "A fast-paced true or false challenge with a countdown timer. Teachers can set the maximum number of questions, making it an ideal mode for quick reviews and critical-thinking drills.",
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
      {/* Header (reuse from admin) */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center space-x-3">
          <Image
            src={user.avatar || "/admin-avatar.png"}
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
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={handleLogout}
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#548E28]">Game Modes</h1>
          <button
            onClick={() =>
              Swal.fire("Add Game Mode", "Feature coming soon!", "info")
            }
            className="flex items-center gap-2 bg-[#548E28] text-white px-4 py-2 rounded-lg hover:bg-[#3d6a1f] transition"
          >
            <Plus className="w-5 h-5" /> Add Game Mode
          </button>
        </div>

        {/* Game Mode List */}
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
