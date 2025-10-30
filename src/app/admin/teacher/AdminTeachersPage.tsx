"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Trash2, Search } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminTeachersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = searchParams.get("admin_id");

  const [teachers, setTeachers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // ✅ Load admin info
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");
    if (!savedUser || savedType !== "admin") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Fetch all professors
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/teachers/list");
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers);
        setFiltered(data.teachers);
      }
    } catch (error) {
      console.error("❌ Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // ✅ Search filter
  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      teachers.filter(
        (t) =>
          t.first_name.toLowerCase().includes(term) ||
          t.last_name.toLowerCase().includes(term) ||
          t.id_number.toLowerCase().includes(term) ||
          t.email.toLowerCase().includes(term)
      )
    );
  }, [search, teachers]);

  // 🗑️ Delete handler
  const handleDelete = (id: number, name: string) => {
    Swal.fire({
      title: `Delete ${name}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#548E28",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete",
    }).then((res) => {
      if (res.isConfirmed) {
        Swal.fire("Deleted!", `${name} has been removed.`, "success");
      }
    });
  };

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading admin data...
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-10">
      {/* ✅ Header */}
      <header className="w-full bg-[#548E28] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-4 sm:px-5 py-3 shadow-md">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => router.push(`/admin?admin_id=${adminId}`)}
            className="text-white text-2xl font-bold hover:opacity-80 transition"
          >
            ←
          </button>

          {/* Avatar */}
          <Image
            src={user.avatar || "/resources/icons/admin.png"}
            alt="Admin Avatar"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />

          {/* Title + Subtitle */}
          <div className="flex flex-col">
            <h1 className="font-semibold text-base sm:text-lg leading-tight">Professors</h1>
            <p className="text-[11px] sm:text-xs opacity-80">
              View, search, and manage teacher accounts
            </p>
          </div>
        </div>
      </header>

      {/* ✅ Search Bar */}
      <div className="w-[90%] sm:w-[80%] md:w-[70%] lg:max-w-4xl mt-4 px-3 py-2 flex items-center bg-[#f3f8f2] border-2 border-[#548E28] rounded-full shadow-sm">
        <Search className="w-5 h-5 text-[#548E28] mx-2 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search professor by name, ID, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none px-2 text-sm text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* ✅ Main Section */}
      <main className="w-full max-w-6xl mt-6 px-3 sm:px-4">
        {/* 📱 Mobile Card Layout */}
        <div className="block sm:hidden">
          {loading ? (
            <p className="text-center text-gray-500 py-6">Loading professors...</p>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="border border-[#548E28]/40 rounded-lg p-4 shadow-sm bg-[#f9fdf9] hover:bg-[#f3f8f2] transition"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-[#548E28]">
                      {t.first_name} {t.last_name}
                    </h2>
                    <div className="flex gap-2">
                      <Pencil
                        className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-800"
                        onClick={() =>
                          Swal.fire("Coming soon!", "Edit teacher info.", "info")
                        }
                      />
                      <Trash2
                        className="w-5 h-5 text-red-600 cursor-pointer hover:text-red-800"
                        onClick={() =>
                          handleDelete(t.id, `${t.first_name} ${t.last_name}`)
                        }
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>ID:</strong> {t.id_number}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong>{" "}
                    {t.email
                      ? t.email.replace(/(.{2}).+(@.+)/, "$1*****$2")
                      : "*******@gmail.com"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Password:</strong>{" "}
                    {"*".repeat(Math.min(8, t.password?.length || 6))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Created:</strong>{" "}
                    {t.created_at
                      ? new Date(t.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">No professors found.</p>
          )}
        </div>

        {/* 💻 Desktop Table Layout */}
        <div className="hidden sm:block border border-[#548E28] rounded-lg shadow-inner max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm text-left text-gray-700 border-collapse">
            <thead className="bg-[#548E28] text-white sticky top-0 text-xs sm:text-sm">
              <tr>
                <th className="p-3">ID Number</th>
                <th className="p-3">First Name</th>
                <th className="p-3">Last Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Password</th>
                <th className="p-3">Created At</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    Loading professors...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-200 hover:bg-[#f3f8f2] transition"
                  >
                    <td className="p-3 font-semibold text-[#548E28] text-xs sm:text-sm">
                      {t.id_number}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">{t.first_name}</td>
                    <td className="p-3 text-xs sm:text-sm">{t.last_name}</td>
                    <td className="p-3 text-xs sm:text-sm">
                      {t.email
                        ? t.email.replace(/(.{2}).+(@.+)/, "$1*****$2")
                        : "*******@gmail.com"}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {"*".repeat(Math.min(8, t.password?.length || 6))}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {t.created_at
                        ? new Date(t.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="p-3 text-center flex justify-center gap-3">
                      <Pencil
                        className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-800"
                        onClick={() =>
                          Swal.fire("Coming soon!", "Edit teacher info.", "info")
                        }
                      />
                      <Trash2
                        className="w-5 h-5 text-red-600 cursor-pointer hover:text-red-800"
                        onClick={() =>
                          handleDelete(t.id, `${t.first_name} ${t.last_name}`)
                        }
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    No professors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
