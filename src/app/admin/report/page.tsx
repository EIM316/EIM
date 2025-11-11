"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  Search,
  Mail,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import Swal from "sweetalert2";

interface Message {
  message: string;
  date: string;
  fromAdmin: boolean;
}

interface Report {
  email: string;
  userType: string;
  id_number: string;
  threadId?: string;
  thread: Message[];
  isRead?: boolean;
}

interface User {
  first_name: string;
  avatar?: string;
  admin_id?: string;
}

export default function AdminReportPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Load Admin Info
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");
    if (!savedUser || savedType !== "admin") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Fetch Reports
  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/report/fetch");
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.reports)) {
          setReports(
            data.reports.map((r: Report) => ({
              ...r,
              isRead: r.isRead ?? false,
            }))
          );
        }
      } catch (err) {
        console.error("Fetch reports error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  // ✅ Mark as Read and Open Modal
  const handleSelectReport = async (report: Report) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id_number === report.id_number ? { ...r, isRead: true } : r
      )
    );
    setSelectedReport(report);

    // Optional: Update DB
    try {
      await fetch("/api/report/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: report.id_number }),
      });
    } catch (err) {
      console.error("Error marking report as read:", err);
    }
  };

  // ✅ Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedReport]);

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

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading reports...
      </div>
    );

  const filteredReports = reports.filter(
    (r) =>
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.id_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* ✅ Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#2F4F24] text-white p-5 space-y-4 relative">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src={user?.avatar || "/resources/icons/admin.png"}
            alt="Admin Avatar"
            width={45}
            height={45}
            className="rounded-full border-2 border-white"
          />
          <div>
            <p className="font-semibold text-sm">{user?.first_name}</p>
            <p className="text-xs opacity-75">Administrator</p>
          </div>
        </div>

        <nav className="flex flex-col space-y-3">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530]"
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => router.push("/admin/report")}
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#548E28]"
          >
            <FileText className="w-5 h-5" /> Reports
          </button>
          <button
            onClick={() => router.push("/admin/emails")}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530]"
          >
            <Mail className="w-5 h-5" /> Allowed Email
          </button>
        </nav>

        <div className="mt-auto border-t border-white/20 pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530]"
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
              onClick={() => setSidebarOpen(true)}
            />
            <h1 className="font-semibold text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" /> Report Management
            </h1>
          </div>
          <Image
            src={user?.avatar || "/resources/icons/admin.png"}
            alt="Admin"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
        </header>

        {/* 🧩 Report List */}
        <section className="flex-1 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#2F4F24] mb-3 sm:mb-0">
              Conversations
            </h2>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or ID..."
                className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#548E28]"
              />
              <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredReports.length ? (
              filteredReports.map((r, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectReport(r)}
                  className="cursor-pointer bg-white border border-gray-300 rounded-lg p-4 shadow-sm hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-[#548E28] capitalize">
                      {r.userType === "teacher" ? "👨‍🏫 Teacher" : "🎓 Student"} (
                      {r.id_number})
                    </p>
                    <span
                      className={`text-xs font-medium ${
                        r.isRead ? "text-gray-500" : "text-red-600"
                      }`}
                    >
                      {r.isRead ? "✅ Read" : "🕓 Unread"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {r.thread[r.thread.length - 1].message}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 italic mt-6">
                No conversations found.
              </p>
            )}
          </div>
        </section>
      </main>

      {/* ✅ Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 bg-[#2F4F24] text-white w-64 p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Image
                  src={user?.avatar || "/resources/icons/admin.png"}
                  alt="Admin Avatar"
                  width={45}
                  height={45}
                  className="rounded-full border-2 border-white"
                />
                <div>
                  <p className="font-semibold text-sm">{user?.first_name}</p>
                  <p className="text-xs opacity-75">Administrator</p>
                </div>
              </div>
              <X
                className="w-5 h-5 text-white cursor-pointer"
                onClick={() => setSidebarOpen(false)}
              />
            </div>

            <nav className="flex flex-col space-y-3">
              <button
                onClick={() => router.push("/admin")}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530]"
              >
                <LayoutDashboard className="w-5 h-5" /> Dashboard
              </button>
              <button
                onClick={() => router.push("/admin/report")}
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#548E28]"
              >
                <FileText className="w-5 h-5" /> Reports
              </button>
              <button
                onClick={() => router.push("/admin/emails")}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530]"
              >
                <Mail className="w-5 h-5" /> Allowed Email
              </button>
              
            </nav>

            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-3 px-3 py-2 mt-3 rounded-md hover:bg-[#3d6530] w-full"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💬 Modal Chat View */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md sm:max-w-lg shadow-lg p-5 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-lg font-semibold text-[#2F4F24] flex items-center gap-1">
                  {selectedReport.userType === "teacher"
                    ? "👨‍🏫 Teacher"
                    : "🎓 Student"}
                </h3>
                <p className="text-sm text-gray-500">
                  ID: {selectedReport.id_number} | {selectedReport.email}
                </p>
              </div>
              <X
                className="w-5 h-5 text-gray-500 cursor-pointer"
                onClick={() => setSelectedReport(null)}
              />
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 bg-gray-50 rounded-md p-3">
              {selectedReport.thread.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.fromAdmin ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm max-w-[75%] shadow-sm ${
                      msg.fromAdmin
                        ? "bg-[#4CAF50] text-white"
                        : "bg-[#0078FF] text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                    <span className="block text-[10px] text-white/80 mt-1 text-right">
                      {msg.date}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-3 text-center text-gray-500 text-sm italic">
              👁️ This report has been marked as read.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
