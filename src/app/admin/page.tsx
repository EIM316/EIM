"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Mail,
} from "lucide-react";
import Swal from "sweetalert2";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    modules: 0,
    classModes: 0,
    classes: 0,
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

  // ✅ Fetch dashboard stats from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();

        if (data.success && data.stats) {
          setStats({
            students: data.stats.students,
            teachers: data.stats.teachers,
            modules: data.stats.modules,
            classModes: data.stats.classModes,
            classes: data.stats.classes,
          });
        }
      } catch (err) {
        console.error("❌ Dashboard fetch error:", err);
      }
    };
    fetchDashboardData();
  }, []);

  // ✅ Logout
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

  // ✅ Cards
  const cards = [
    {
      title: "Students",
      count: stats.students,
      color: "bg-[#66BB6A]",
      icon: "/resources/admin/student.png",
      link: "/admin/student",
    },
    {
      title: "Teachers",
      count: stats.teachers,
      color: "bg-[#81C784]",
      icon: "/resources/admin/teacher.png",
      link: "/admin/teacher",
    },
    {
      title: "Modules",
      count: stats.modules,
      color: "bg-[#AED581]",
      icon: "/resources/admin/module.png",
      link: "/admin/module",
    },
    {
      title: "Class Mode",
      count: stats.classModes,
      color: "bg-[#FF8A65]",
      icon: "/resources/admin/classmode.png",
      link: "/admin/classmode",
    },
    {
      title: "Classes",
      count: stats.classes,
      color: "bg-[#BA68C8]",
      icon: "/resources/admin/class.jpg",
      link: "/admin/class",
    },
    {
      title: "Game Mode",
      count: 4, // static for now, since it's predefined
      color: "bg-[#E57373]",
      icon: "/resources/admin/gamemode.png",
      link: "/admin/gamemode",
    },
    
  ];

  // ✅ Card Click
  const handleCardClick = (link: string) => {
    if (user?.admin_id) {
      router.push(`${link}?admin_id=${encodeURIComponent(user.admin_id)}`);
    } else {
      router.push(link);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading admin data...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ✅ Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#2F4F24] text-white p-5 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src={user.avatar || "/resources/icons/admin.png"}
            alt="Admin Avatar"
            width={45}
            height={45}
            className="rounded-full border-2 border-white"
          />
          <div>
            <p className="font-semibold text-sm">{user.first_name}</p>
            <p className="text-xs opacity-75">Administrator</p>
          </div>
        </div>

        <nav className="flex flex-col space-y-3">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#548E28] transition"
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>

          <button
            onClick={() => router.push("/admin/report")}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition"
          >
            <FileText className="w-5 h-5" /> Reports
          </button>
          <button
        onClick={() => {
          router.push("/admin/emails");
          setMenuOpen(false);
        }}
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition"
      >
       <Mail className="w-5 h-5" /> Allowed Email
      </button>
        </nav>

        <div className="mt-auto border-t border-white/20 pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* ✅ Hamburger Sidebar (Mobile) */}
{menuOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
    onClick={() => setMenuOpen(false)}
  ></div>
)}

<aside
  className={`fixed md:hidden top-0 left-0 h-full w-64 bg-[#2F4F24] text-white p-5 z-50 flex flex-col justify-between transform transition-transform duration-300 ${
    menuOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>
  {/* 🔹 Top Section (Profile + Close Button + Navigation) */}
  <div>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Image
          src={user.avatar || "/resources/icons/admin.png"}
          alt="Admin Avatar"
          width={40}
          height={40}
          className="rounded-full border-2 border-white"
        />
        <div>
          <p className="font-semibold text-sm">{user.first_name}</p>
          <p className="text-xs opacity-75">Administrator</p>
        </div>
      </div>
      <X
        className="w-6 h-6 cursor-pointer hover:opacity-80 transition"
        onClick={() => setMenuOpen(false)}
      />
    </div>

    <nav className="flex flex-col space-y-3">
      <button
        onClick={() => {
          router.push("/admin");
          setMenuOpen(false);
        }}
        className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#548E28] transition"
      >
        <LayoutDashboard className="w-5 h-5" /> Dashboard
      </button>

      <button
        onClick={() => {
          router.push("/admin/report");
          setMenuOpen(false);
        }}
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition"
      >
        <FileText className="w-5 h-5" /> Reports
      </button>
      <button
        onClick={() => {
          router.push("/admin/emails");
          setMenuOpen(false);
        }}
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition"
      >
       <Mail className="w-5 h-5" /> Allowed Email
      </button>
    </nav>
  </div>

  {/* 🔹 Bottom Section (Logout) */}
  <div className="border-t border-white/20 pt-4">
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] w-full transition"
    >
      <LogOut className="w-5 h-5" /> Logout
    </button>
  </div>
</aside>


      {/* ✅ Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-[#548E28] text-white flex items-center justify-between px-5 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <Menu
              className="w-6 h-6 cursor-pointer md:hidden"
              onClick={() => setMenuOpen(true)}
            />
            <span className="font-semibold text-lg">Dashboard</span>
          </div>

          <Image
            src={user.avatar || "/resources/icons/admin.png"}
            alt="Admin"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
        </header>

        <main className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 w-full max-w-2xl mx-auto">
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
      </main>
    </div>
  );
}
