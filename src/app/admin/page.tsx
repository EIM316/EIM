"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    modules: 3,
    classMode: 1,
    classes: 1,
    gameMode: 1,
  });

  // ✅ Load admin user
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");
    if (!savedUser || savedType !== "admin") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Fetch teacher & student count from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        if (data.success) {
          setStats((prev) => ({
            ...prev,
            students: data.students,
            teachers: data.teachers,
          }));
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchData();
  }, []);

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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading admin data...
      </div>
    );
  }

  // ✅ Define all dashboard cards with their routes
  const cards = [
    {
      title: "Students",
      count: stats.students,
      color: "bg-[#66BB6A]",
      icon: "/resources/admin/student.png",
      link: "/admin/students",
    },
    {
      title: "Teachers",
      count: stats.teachers,
      color: "bg-[#81C784]",
      icon: "/resources/admin/teacher.png",
      link: "/admin/teachers",
    },
    {
      title: "Modules",
      count: stats.modules,
      color: "bg-[#AED581]",
      icon: "/resources/admin/module.png",
      link: "/admin/modules",
    },
    {
      title: "Class Mode",
      count: stats.classMode,
      color: "bg-[#FF8A65]",
      icon: "/resources/admin/classmode.png",
      link: "/admin/classmode",
    },
    {
      title: "Class",
      count: stats.classes,
      color: "bg-[#BA68C8]",
      icon: "/resources/admin/class.jpg",
      link: "/admin/classes",
    },
    {
      title: "Game Mode",
      count: stats.gameMode,
      color: "bg-[#E57373]",
      icon: "/resources/admin/gamemode.png",
      link: "/admin/gamemode",
    },
  ];

  // ✅ Navigate with admin_id query parameter
  const handleCardClick = (link: string) => {
    if (user?.admin_id) {
      router.push(`${link}?admin_id=${encodeURIComponent(user.admin_id)}`);
    } else {
      router.push(link); // fallback if admin_id missing
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* ✅ Header */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-5 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <Image
            src={user.avatar || "/resources/icons/admin.png"}
            alt="Admin Avatar"
            width={45}
            height={45}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">
            {user.first_name}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </header>

      {/* ✅ Dashboard Grid */}
      <main className="grid grid-cols-2 gap-4 p-6 w-full max-w-md">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(card.link)}
            className={`${card.color} text-white rounded-2xl shadow-md p-4 flex flex-col justify-between items-center cursor-pointer hover:scale-105 transition transform`}
            style={{ aspectRatio: "1 / 1" }}
          >
            <div className="flex flex-col justify-center items-center">
              <h2 className="text-3xl font-extrabold">{card.count}</h2>
              <p className="font-semibold text-sm mt-1">{card.title}</p>
            </div>
            <Image
              src={card.icon}
              alt={card.title}
              width={80}
              height={50}
              className="mt-3"
            />
          </div>
        ))}
      </main>
    </div>
  );
}
