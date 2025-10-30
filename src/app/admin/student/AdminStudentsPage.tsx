"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Trash2, Search } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminStudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = searchParams.get("admin_id");

  const [students, setStudents] = useState<any[]>([]);
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

  // ✅ Fetch student list
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students/list");
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setFiltered(data.students);
      }
    } catch (error) {
      console.error("❌ Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ✅ Search filter
  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      students.filter(
        (s) =>
          s.first_name.toLowerCase().includes(term) ||
          s.last_name.toLowerCase().includes(term) ||
          s.id_number.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term)
      )
    );
  }, [search, students]);

  // 🗑️ Delete confirmation
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
      <header className="w-full bg-[#548E28] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-4 sm:px-5 py-3 shadow-md">
  <div className="flex items-center gap-3">
    {/* Back Button */}
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

    {/* Title + Subtitle — Now visible on all screens */}
    <div className="flex flex-col">
      <h1 className="font-semibold text-base sm:text-lg leading-tight">Students</h1>
      <p className="text-[11px] sm:text-xs opacity-80">
        Manage student accounts
      </p>
    </div>
  </div>
</header>


      <div className="w-[90%] sm:w-[80%] md:w-[70%] lg:max-w-4xl mt-4 px-3 py-2 flex items-center bg-[#f3f8f2] border-2 border-[#548E28] rounded-full shadow-sm">
  <Search className="w-5 h-5 text-[#548E28] mx-2 flex-shrink-0" />
  <input
    type="text"
    placeholder="Search student..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="flex-1 bg-transparent outline-none px-2 text-sm text-gray-700 placeholder:text-gray-400"
  />
</div>


      {/* ✅ Table Wrapper */}
      <main className="w-full max-w-6xl mt-6 px-3 sm:px-4">
        {/* 📱 Card Layout (Mobile) */}
        <div className="block sm:hidden">
          {loading ? (
            <p className="text-center text-gray-500 py-6">Loading students...</p>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="border border-[#548E28]/40 rounded-lg p-4 shadow-sm bg-[#f9fdf9] hover:bg-[#f3f8f2] transition"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-[#548E28]">
                      {s.first_name} {s.last_name}
                    </h2>
                    <div className="flex gap-2">
                      <Pencil
                        className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-800"
                        onClick={() =>
                          Swal.fire("Coming soon!", "Edit student info.", "info")
                        }
                      />
                      <Trash2
                        className="w-5 h-5 text-red-600 cursor-pointer hover:text-red-800"
                        onClick={() =>
                          handleDelete(s.id, `${s.first_name} ${s.last_name}`)
                        }
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>ID:</strong> {s.id_number}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong>{" "}
                    {s.email
                      ? s.email.replace(/(.{2}).+(@.+)/, "$1*****$2")
                      : "*******@gmail.com"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Password:</strong>{" "}
                    {"*".repeat(Math.min(8, s.password?.length || 6))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">No students found.</p>
          )}
        </div>

        {/* 💻 Table Layout (Desktop / Tablet) */}
        <div className="hidden sm:block border border-[#548E28] rounded-lg shadow-inner max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm text-left text-gray-700 border-collapse">
            <thead className="bg-[#548E28] text-white sticky top-0 text-xs sm:text-sm">
              <tr>
                <th className="p-3">ID Number</th>
                <th className="p-3">First Name</th>
                <th className="p-3">Last Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Password</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    Loading students...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-200 hover:bg-[#f3f8f2] transition"
                  >
                    <td className="p-3 font-semibold text-[#548E28] text-xs sm:text-sm">
                      {s.id_number}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">{s.first_name}</td>
                    <td className="p-3 text-xs sm:text-sm">{s.last_name}</td>
                    <td className="p-3 text-xs sm:text-sm">
                      {s.email
                        ? s.email.replace(/(.{2}).+(@.+)/, "$1*****$2")
                        : "*******@gmail.com"}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {"*".repeat(Math.min(8, s.password?.length || 6))}
                    </td>
                    <td className="p-3 text-center flex justify-center gap-3">
                      <Pencil
                        className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-800"
                        onClick={() =>
                          Swal.fire("Coming soon!", "Edit student info.", "info")
                        }
                      />
                      <Trash2
                        className="w-5 h-5 text-red-600 cursor-pointer hover:text-red-800"
                        onClick={() =>
                          handleDelete(s.id, `${s.first_name} ${s.last_name}`)
                        }
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No students found.
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
