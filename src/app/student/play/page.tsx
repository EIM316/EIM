"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Search, X, ArrowLeft } from "lucide-react";
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
    <div className="flex flex-col min-h-screen bg-white">
      {/* ✅ Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative mb-8">
        {/* 👤 User info */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
         
        > <button
            onClick={() => router.push("/student")}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span className="hidden sm:inline text-sm font-medium text-white">
              
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

  
      
      </header>

      {/* ✅ Main content */}
      <main className="mb-55 flex flex-col items-center justify-center w-full flex-1 px-4 max-w-6xl mx-auto text-center">
        <h2 className="text-xl font-bold text-[#7b2020] mb-6">
          🎮 Choose Your Mode
        </h2>

        <div className="grid grid-cols-2 gap-6 sm:gap-8 place-items-center">
          {[
            {
              title: "REFRESHER",
              desc: "AT YOUR OWN PACE",
              img: "/resources/modes/refresher.png",
              route: "/student/play/refresher",
            },
            {
              title: "QUIZ MODE",
              desc: "WITH TIMER",
              img: "/resources/modes/quiz.png",
              route: "/student/play/quizmode",
            },
            {
              title: "CLASS MODE",
              desc: "JOIN A CLASS",
              img: "/resources/modes/class.png",
              route: "/student/play/classmode",
            },
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
          ].map((mode, i) => (
            <div
              key={i}
              onClick={() => router.push(mode.route)}
              className="w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] border border-gray-400 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white hover:scale-105 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-center justify-center h-16 mb-2">
                <Image
                  src={mode.img}
                  alt={mode.title}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#7b2020] leading-tight">
                  {mode.title}
                </h3>
                <p className="text-gray-600 text-[11px] mt-[1px]">{mode.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
