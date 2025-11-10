"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Search, X, ArrowLeft } from "lucide-react";
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
    <div className="flex flex-col min-h-screen bg-white">
      {/* ✅ Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push("/student/play")}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span className="hidden sm:inline text-sm font-medium text-white">
              Back
            </span>
          </button>
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
          
        </div>

        
      </header>

      {/* ✅ Main content */}
      <main className=" mb-25 flex flex-col items-center justify-center flex-1 w-full px-4 text-center">
        <h2 className="text-xl font-bold text-[#7b2020] mb-6">
          🧩 Choose Game Type
        </h2>

        {/* ✅ Grid of game modes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 place-items-center">
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
              className="w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] border border-gray-400 rounded-lg flex flex-col items-center justify-center p-3 bg-white hover:scale-105 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center mb-2">
                <Image
                  src={game.img}
                  alt={game.title}
                  width={60}
                  height={60}
                  className="object-contain mb-2"
                />
                <h3 className="text-sm font-bold text-[#7b2020] leading-tight">
                  {game.title}
                </h3>
                <p className="text-gray-600 text-[11px] mt-[1px]">{game.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
