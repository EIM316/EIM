"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  X,
  Home,
  Settings,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import Swal from "sweetalert2";

export default function TeacherReportPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Disable background scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    document.body.style.touchAction = menuOpen ? "none" : "";
  }, [menuOpen]);

  // ✅ Load teacher info
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");
    if (!savedUser || savedType !== "teacher") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Logout
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
        localStorage.clear();
        router.push("/");
      }
    });
  };

  // ✅ Submit Report (save + send email)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      Swal.fire("⚠️ Error", "Please enter your concern before sending.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_number: user.id_number,
          email: user.email,
          message,
          userType: "teacher",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Swal.fire({
          icon: "success",
          title: "✅ Report Submitted!",
          html: `
            <p>Your issue has been recorded and sent to our admin team.</p>
            <p><b>Email:</b> ${user.email}</p>
            <p><b>ID:</b> ${user.id_number}</p>
          `,
          confirmButtonColor: "#7b2020",
        });
        setMessage("");
      } else {
        Swal.fire("Error", data.error || "Failed to submit your report.", "error");
      }
    } catch (err) {
      console.error("❌ Error submitting report:", err);
      Swal.fire("Error", "A network or server issue occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading...
      </div>
    );

  return (
    <main className="min-h-screen flex flex-col items-center bg-white relative overflow-x-hidden">
      {/* ✅ Navbar */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md fixed top-0 left-0 z-50">
        <div className="flex items-center gap-3">
          <Menu
            className="w-7 h-7 cursor-pointer hover:opacity-80 transition"
            onClick={() => setMenuOpen(true)}
          />
          <Image
            src={user.avatar || "/teacher-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">
            Prof. {user.first_name?.toUpperCase()}
          </span>
        </div>
        <LogOut
          onClick={handleLogout}
          className="w-6 h-6 cursor-pointer hover:opacity-80"
        />
      </header>

      {/* ✅ Hamburger Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-full bg-[#7b2020] text-white z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/20">
          <span className="text-xl font-bold">Menu</span>
          <X
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 cursor-pointer hover:opacity-80 transition"
          />
        </div>

        <div className="flex flex-col mt-6 px-6 space-y-6">
          <button
            onClick={() => {
              router.push("/teacher");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <Home className="w-5 h-5" /> My Classes
          </button>

          <button
            onClick={() => {
              router.push("/teacher/settings");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <Settings className="w-5 h-5" /> Profile Settings
          </button>

          <button
            onClick={() => {
              router.push("/teacher/performance");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <BarChart3 className="w-5 h-5" /> Class Performance
          </button>

          <button
            onClick={() => {
              router.push("/teacher/reportaproblem");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <AlertTriangle className="w-5 h-5" /> Report a Problem
          </button>
        </div>

        <div className="mt-auto border-t border-white/20 px-6 py-5">
          <button
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 text-lg font-semibold hover:text-gray-300 transition"
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
        </div>
      </div>

      {/* ✅ Report Form */}
      <div className="pt-24 flex flex-col items-center w-full px-6">
        <h1 className="text-2xl font-bold text-[#7b2020] mb-2">
          Report a Problem
        </h1>
        <p className="text-gray-600 mb-6 text-sm text-center max-w-md">
          If you encounter any issues or bugs while using the app, please
          describe them below. We’ll review your report as soon as possible.
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white border-2 border-[#7b2020] rounded-xl p-6 shadow-md flex flex-col space-y-4"
        >
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="border border-gray-400 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-700"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              Describe your problem
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Type your concern here..."
              className="border border-gray-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b2020] text-gray-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#7b2020] hover:bg-red-800"
            } text-white font-semibold rounded-md py-2 transition`}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
