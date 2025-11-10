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
import { Search, Download } from "lucide-react"; // ⬅️ Added Download icon
import Swal from "sweetalert2";

export default function AdminClassModePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = searchParams.get("admin_id");

  const [classModes, setClassModes] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [downloading, setDownloading] = useState(false); // ⬅️ Added state

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

  // ✅ Fetch all class modes
  const fetchClassModes = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/classmode/list?search=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (data.success) {
        setClassModes(data.classModes);
        setFiltered(data.classModes);
      } else {
        console.error("❌ Failed to load class modes:", data.error);
      }
    } catch (error) {
      console.error("❌ Error fetching class modes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassModes();
  }, []);

  // ✅ Real-time search with debounce
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchClassModes(search);
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);




const handleDownload = async () => {
  setDownloading(true);

  try {
    const response = await fetch(`/api/admin/classmode/export/all`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const reader = new FileReader();

    reader.onloadend = function () {
      // ✅ If in Android WebView
      if (window.Android?.saveBase64ToDownloads) {
        try {
          window.Android.saveBase64ToDownloads(
            reader.result as string,
            "all_classmode_records.csv"
          );
          console.log("✅ Sent to Android WebView for saving.");
          
        } catch (androidError) {
          console.error("❌ Android Bridge Error:", androidError);
          Swal.fire(
            "Error",
            "Failed to save file on Android device.",
            "error"
          );
        }
      } else {
        // ✅ Browser fallback
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "all_classmode_records.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        console.log("✅ File downloaded via browser.");
        Swal.fire(
          "✅ Success",
          "All class mode records downloaded successfully!",
          "success"
        );
      }
    };

    reader.readAsDataURL(blob);
  } catch (err) {
    console.error("❌ Error downloading:", err);
    Swal.fire("Error", "Failed to download records.", "error");
  } finally {
    setDownloading(false);
  }
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
      <header className="w-full bg-[#548E28] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3 shadow-md">
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

          {/* Title */}
          <div className="flex flex-col">
            <h1 className="font-semibold text-base sm:text-lg leading-tight">
              Class Mode
            </h1>
            <p className="text-[11px] sm:text-xs opacity-80">
              Manage and review all created class modes
            </p>
          </div>
        </div>
      </header>

      {/* ✅ Search Bar */}
      <div className="w-[90%] sm:w-[80%] md:w-[70%] lg:max-w-4xl mt-4 px-3 py-2 flex items-center bg-[#f3f8f2] border-2 border-[#548E28] rounded-full shadow-sm">
        <Search className="w-5 h-5 text-[#548E28] mx-2 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search class by name or game code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none px-2 text-sm text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* ✅ Class Mode List */}
      <main className="w-full max-w-6xl mt-6 px-3 sm:px-4">
        {/* 📱 Mobile Card Layout */}
        <div className="block sm:hidden">
          {loading ? (
            <p className="text-center text-gray-500 py-6">
              Loading class modes...
            </p>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="border border-[#548E28]/40 rounded-lg p-4 shadow-sm bg-[#f9fdf9] hover:bg-[#f3f8f2] transition flex justify-between items-center"
                >
                  <div>
                    <h2 className="font-semibold text-[#548E28]">
                      {c.class_name || "Unnamed Class"}
                    </h2>
                    <p className="text-sm text-gray-700">
                      <strong>Game Code:</strong> {c.game_code}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created:{" "}
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/admin/classmode/records?class_id=${c.id}&code=${c.game_code}&admin_id=${adminId}`
                      )
                    }
                    className="text-[#548E28] font-bold text-xl hover:opacity-80"
                  >
                    →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">
              No class modes found.
            </p>
          )}
        </div>

        {/* 💻 Desktop Table Layout */}
        <div className="hidden sm:block border border-[#548E28] rounded-lg shadow-inner max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm text-left text-gray-700 border-collapse">
            <thead className="bg-[#548E28] text-white sticky top-0 text-xs sm:text-sm">
              <tr>
                <th className="p-3">Class Name</th>
                <th className="p-3">Teacher</th>
                <th className="p-3">Game Code</th>
                <th className="p-3">Game Type</th>
                <th className="p-3">Created At</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    Loading class modes...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-200 hover:bg-[#f3f8f2] transition"
                  >
                    <td className="p-3 font-semibold text-[#548E28]">
                      {c.class_name}
                    </td>
                    <td className="p-3">{c.teacher_name}</td>
                    <td className="p-3">{c.game_code}</td>
                    <td className="p-3 capitalize">{c.game_type}</td>
                    <td className="p-3">
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() =>
                          router.push(
                            `/admin/classmode/records?class_id=${c.id}&code=${c.game_code}&admin_id=${adminId}`
                          )
                        }
                        className="text-[#548E28] font-bold text-lg hover:opacity-80"
                      >
                        →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No class modes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ✅ Floating Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="fixed bottom-6 right-6 bg-[#548E28] hover:bg-[#3f6b1f] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold transition-all"
      >
        <Download className="w-4 h-4" />
        {downloading ? "Downloading..." : "Download All Records"}
      </button>
    </div>
  );
}
