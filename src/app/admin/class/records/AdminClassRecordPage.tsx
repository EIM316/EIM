"use client";

declare global {
  interface Window {
    Android?: {
      saveBase64ToDownloads?: (base64Data: string, filename: string) => void;
    };
  }
}

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { ArrowLeft, Search, Download } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminClassRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const classId = searchParams.get("class_id");
  const adminId = searchParams.get("admin_id");

  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  // ✅ Load admin data
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "admin") {
      router.push("/");
      return;
    }

    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Fetch class info and students
  useEffect(() => {
    const fetchData = async () => {
      if (!classId) return;
      try {
        setLoading(true);
        const [classRes, studentRes] = await Promise.all([
          fetch(`/api/class/info?class_id=${classId}`),
          fetch(`/api/class/students?class_id=${classId}`),
        ]);

        const classData = await classRes.json();
        const studentData = await studentRes.json();

        if (classData.success) setClassInfo(classData.class);
        if (studentData.success) setStudents(studentData.students || []);
      } catch (error) {
        console.error("❌ Error fetching class/student data:", error);
        Swal.fire("Error", "Failed to load class data.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  // ✅ Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter((s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);
const handleDownload = async () => {
  if (!classId) return;
  setDownloading(true);

  try {
    const res = await fetch(`/api/admin/class/export?class_id=${classId}`);
    if (!res.ok) throw new Error("Failed to download file");

    const blob = await res.blob();
    const reader = new FileReader();

    reader.onloadend = function () {
      const filename = `${classInfo?.class_name || "class"}_students.csv`;

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
        Swal.fire("✅ Success", "Class student records downloaded!", "success");
      }
    };

    reader.readAsDataURL(blob);
  } catch (error) {
    console.error("❌ Download failed:", error);
    Swal.fire("Error", "Failed to download class student records.", "error");
  } finally {
    setDownloading(false);
  }
};

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-gray-600">
        Loading class data...
      </div>
    );

  if (!classInfo)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-gray-700">
        <p>Class not found.</p>
        <button
          onClick={() => router.push(`/admin/class?admin_id=${adminId}`)}
          className="text-[#548E28] font-semibold mt-2 underline"
        >
          Go back
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-12 relative">
      {/* Header */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer"
            onClick={() => router.push(`/admin/class?admin_id=${adminId}`)}
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">{classInfo.class_name}</h1>
            <p className="text-xs opacity-80">Class Code: {classInfo.class_code}</p>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="w-[90%] sm:w-[80%] md:w-[70%] lg:max-w-3xl mt-4 px-3 py-2 flex items-center bg-[#f3f8f2] border-2 border-[#548E28] rounded-full shadow-sm">
        <Search className="w-5 h-5 text-[#548E28] mx-2 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search student by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent outline-none px-2 text-sm text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* Student List */}
      <main className="w-full max-w-5xl mt-6 px-3 sm:px-4">
        {/* ✅ Scrollable mobile view if > 8 students */}
        <div
          className={`border border-[#548E28] rounded-lg shadow-inner bg-[#f9fdf9] ${
            filteredStudents.length > 8
              ? "max-h-[70vh] overflow-y-auto"
              : "overflow-y-visible"
          }`}
        >
          {filteredStudents.length > 0 ? (
            <table className="w-full text-sm text-left text-gray-700 border-collapse">
              <thead className="bg-[#548E28] text-white sticky top-0 text-xs sm:text-sm">
                <tr>
                  <th className="p-3">Avatar</th>
                  <th className="p-3">Name</th>
                  <th className="p-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-200 hover:bg-[#f3f8f2] transition-all"
                  >
                    <td className="p-3">
                      <Image
                        src={student.avatar || "/resources/icons/student.png"}
                        alt={`${student.first_name} ${student.last_name}`}
                        width={40}
                        height={40}
                        className="rounded-full border border-[#548E28] object-cover"
                      />
                    </td>
                    <td className="p-3 font-medium text-[#548E28]">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="p-3 text-right text-gray-600">
                      {new Date(student.joined_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-600 text-center py-8">
              No students enrolled in this class.
            </div>
          )}
        </div>
      </main>

      {/* ✅ Floating Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="fixed bottom-6 right-6 bg-[#548E28] hover:bg-[#3f6b1f] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold transition-all"
      >
        <Download className="w-4 h-4" />
        {downloading ? "Downloading..." : "Download CSV"}
      </button>
    </div>
  );
}
