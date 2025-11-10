"use client";

declare global {
  interface Window {
    Android?: {
      saveBase64ToDownloads?: (base64Data: string, filename: string) => void;
    };
  }
}

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Trash2, Search, Download } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminStudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = searchParams.get("admin_id");

  const [students, setStudents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
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

  // ✅ Fetch students
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

  const handleDownload = async () => {
  setDownloading(true);

  try {
    const res = await fetch("/api/admin/students/export");
    if (!res.ok) throw new Error("Failed to download student records");

    const blob = await res.blob();
    const reader = new FileReader();

    reader.onloadend = function () {
      const filename = "student_records.csv";

      // ✅ Android WebView version
      if (window.Android?.saveBase64ToDownloads) {
        try {
          window.Android.saveBase64ToDownloads(reader.result as string, filename);
          console.log("✅ File sent to Android WebView for saving.");
          
        } catch (androidError) {
          console.error("❌ Android Bridge Error:", androidError);
          Swal.fire("Error", "Failed to save file on Android device.", "error");
        }
      } else {
        // ✅ Browser fallback
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        console.log("✅ File downloaded via browser.");
        Swal.fire("✅ Success", "Student records downloaded successfully!", "success");
      }
    };

    reader.readAsDataURL(blob);
  } catch (error) {
    console.error("❌ Error downloading student data:", error);
    Swal.fire("Error", "Failed to download student records.", "error");
  } finally {
    setDownloading(false);
  }
};

  // ✏️ Edit student
  const handleEdit = (student: any) => {
    Swal.fire({
      title: "Edit Student",
      html: `
        <input id="firstName" class="swal2-input" placeholder="First Name" value="${student.first_name}" />
        <input id="lastName" class="swal2-input" placeholder="Last Name" value="${student.last_name}" />
        <input id="email" class="swal2-input" placeholder="Email" value="${student.email}" />
      `,
      focusConfirm: false,
      confirmButtonText: "Save Changes",
      confirmButtonColor: "#548E28",
      showCancelButton: true,
      cancelButtonColor: "#aaa",
      preConfirm: () => {
        const first_name = (document.getElementById("firstName") as HTMLInputElement).value.trim();
        const last_name = (document.getElementById("lastName") as HTMLInputElement).value.trim();
        const email = (document.getElementById("email") as HTMLInputElement).value.trim();

        if (!first_name || !last_name || !email) {
          Swal.showValidationMessage("All fields are required!");
          return;
        }
        return { first_name, last_name, email };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { first_name, last_name, email } = result.value!;
        try {
          const res = await fetch("/api/admin/students/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: student.id,
              first_name,
              last_name,
              email,
            }),
          });

          const data = await res.json();

          if (data.success) {
            Swal.fire("Updated!", "Student details have been updated.", "success");
            fetchStudents();
          } else {
            Swal.fire("Error", data.error || "Failed to update student.", "error");
          }
        } catch (error) {
          Swal.fire("Error", "Server error while updating.", "error");
        }
      }
    });
  };

  // 🗑️ Delete student
  const handleDelete = (id: number, name: string) => {
    Swal.fire({
      title: `Delete ${name}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#548E28",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const response = await fetch("/api/admin/students/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          const data = await response.json();

          if (data.success) {
            Swal.fire("Deleted!", `${name} has been removed.`, "success");
            fetchStudents();
          } else {
            Swal.fire("Error", data.error || "Failed to delete student.", "error");
          }
        } catch (err) {
          Swal.fire("Error", "Server error while deleting.", "error");
        }
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
      {/* Header */}
      <header className="w-full bg-[#548E28] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-4 sm:px-5 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/admin?admin_id=${adminId}`)}
            className="text-white text-2xl font-bold hover:opacity-80 transition"
          >
            ←
          </button>

          <Image
            src={user.avatar || "/resources/icons/admin.png"}
            alt="Admin Avatar"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />

          <div className="flex flex-col">
            <h1 className="font-semibold text-base sm:text-lg leading-tight">
              Students
            </h1>
            <p className="text-[11px] sm:text-xs opacity-80">
              Manage student accounts
            </p>
          </div>
        </div>
      </header>

      {/* Search bar */}
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

 <main className="w-full max-w-6xl mt-6 px-3 sm:px-4">
  {/* ✅ Desktop Table */}
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
              onClick={() => router.push(`/admin/student/student-records?student_id=${s.id_number}`)}
              className="border-b border-gray-200 hover:bg-[#f3f8f2] transition cursor-pointer"
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
              <td
                className="p-3 text-center flex justify-center gap-3"
                onClick={(e) => e.stopPropagation()} // prevent navigation when clicking icons
              >
                <Pencil
                  className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-800"
                  onClick={() => handleEdit(s)}
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

  {/* ✅ Mobile Card Layout (Scrollable up to 5, clickable) */}
  <div className="block sm:hidden w-full mt-4 max-h-[85vh] overflow-y-auto px-1">
    {loading ? (
      <p className="text-center text-gray-500">Loading students...</p>
    ) : filtered.length > 0 ? (
      <div className="space-y-3 pb-4">
        {filtered.slice(0, 50).map((s) => (
          <div
            key={s.id}
           onClick={() => router.push(`/admin/student/student-records?student_id=${s.id}`)}


            className="border border-[#548E28] rounded-lg p-4 shadow-sm flex flex-col bg-[#f9fcf8] hover:bg-[#eef6eb] active:bg-[#d8ebd3] transition cursor-pointer"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-[#548E28]">{s.id_number}</h2>
              <div
                className="flex gap-3"
                onClick={(e) => e.stopPropagation()} // prevent triggering navigation
              >
                <Pencil
                  className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-800"
                  onClick={() => handleEdit(s)}
                />
                <Trash2
                  className="w-5 h-5 text-red-600 cursor-pointer hover:text-red-800"
                  onClick={() =>
                    handleDelete(s.id, `${s.first_name} ${s.last_name}`)
                  }
                />
              </div>
            </div>

            <p className="text-sm">
              <span className="font-semibold">Name:</span>{" "}
              {s.first_name} {s.last_name}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Email:</span>{" "}
              {s.email
                ? s.email.replace(/(.{2}).+(@.+)/, "$1*****$2")
                : "*******@gmail.com"}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Password:</span>{" "}
              {"*".repeat(Math.min(8, s.password?.length || 6))}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-500">No students found.</p>
    )}

    <button
        onClick={handleDownload}
        disabled={downloading}
        className="fixed bottom-6 right-6 bg-[#548E28] hover:bg-[#3f6b1f] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold transition-all"
      >
        <Download className="w-4 h-4" />
        {downloading ? "Downloading..." : "Download CSV"}
      </button>
  </div>
</main>


    </div>
  );
}
