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
      {/* ✅ Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative mb-8">
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
<main className="flex flex-col items-center w-full px-4 max-w-6xl mx-auto">
  <h2 className="text-xl font-bold text-[#7b2020] mb-4">🎮 Choose Your Mode</h2>

<div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
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
      title: "MORE MODES",
      desc: "TRY OTHER SPECIAL GAMES",
      img: "/resources/modes/betatest.jpg",
      route: "/student/play/gametest",
    },
  ].map((mode, i) => (
    <div
  key={i}
  onClick={() => router.push(mode.route)}
  className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] border border-black rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white hover:scale-105 hover:shadow-lg transition-all cursor-pointer"
>

      {/* Image */}
      <div className="flex items-center justify-center h-16 mb-2">
        <Image
          src={mode.img}
          alt={mode.title}
          width={60}
          height={60}
          className="object-contain"
        />
      </div>

      {/* Text */}
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
