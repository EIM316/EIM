"use client";

declare global {
  interface Window {
    Android?: {
      saveBase64ToDownloads?: (base64Data: string, filename: string) => void;
    };
  }
}

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Download, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Swal from "sweetalert2";

interface StudentProgress {
  student_id: string;
  student_name: string;
  module_points: number;
  game_points: number;
  total_points: number;
  avatar?: string;
  createdAt?: string;
}

export default function StudentProgressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id");

  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [filteredData, setFilteredData] = useState<StudentProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedYear, setSelectedYear] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);

  // ✅ Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!classId) return;

      try {
        setLoading(true);

        const [progressRes, classRes] = await Promise.all([
          fetch(`/api/classmode/progress?class_id=${classId}`),
          fetch(`/api/class/info?class_id=${classId}`),
        ]);

        const progressJson = await progressRes.json();
        const classJson = await classRes.json();

        if (classJson.success) setClassInfo(classJson.class);

        if (progressJson.success) {
          const formattedData: StudentProgress[] = progressJson.progressData.map(
            (item: any) => ({
              student_id: item.student_id,
              student_name: item.student_name,
              module_points: item.module_points ?? 0,
              game_points: item.game_points ?? 0,
              total_points: item.total_points ?? 0,
              avatar: item.avatar || "/resources/icons/student.png",
              createdAt: item.createdAt || new Date().toISOString(),
            })
          );

          setProgressData(formattedData);
          setFilteredData(formattedData);
        } else {
          Swal.fire("Error", "Failed to load student progress.", "error");
        }
      } catch (error) {
        console.error("❌ Error fetching student progress:", error);
        Swal.fire("Error", "Something went wrong fetching data.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  // ✅ Apply filters
  useEffect(() => {
    let data = [...progressData];
    const now = new Date();

    if (searchTerm) {
      data = data.filter((s) =>
        s.student_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      data = data.filter((s) => new Date(s.createdAt!) >= startOfWeek);
    }

    if (filterType === "range" && dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      data = data.filter(
        (s) =>
          new Date(s.createdAt!) >= start && new Date(s.createdAt!) <= end
      );
    }

    if (filterType === "year" && selectedYear) {
      data = data.filter(
        (s) => new Date(s.createdAt!).getFullYear() === Number(selectedYear)
      );
    }

    setFilteredData(data);
  }, [filterType, dateRange, selectedYear, searchTerm, progressData]);


const handleDownloadCSV = async () => {
  if (!classId) return;

  try {
    const query = new URLSearchParams({
      class_id: String(classId),
      filterType,
      start: dateRange.start || "",
      end: dateRange.end || "",
      year: selectedYear || "",
    }).toString();

    const res = await fetch(`/api/classmode/download?${query}`);
    if (!res.ok) throw new Error("Failed to download CSV");

    const blob = await res.blob();
    const reader = new FileReader();

    reader.onloadend = function () {
      // ✅ Android WebView
      if (window.Android?.saveBase64ToDownloads) {
        try {
          window.Android.saveBase64ToDownloads(
            reader.result as string,
            `class_${classId}_progress.csv`
          );
          console.log("✅ CSV sent to Android WebView for saving.");
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
        const a = document.createElement("a");
        a.href = url;
        a.download = `class_${classId}_progress.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        console.log("✅ File downloaded via browser.");
      }

      setOpenModal(true); // ✅ success modal
    };

    reader.readAsDataURL(blob);
  } catch (err) {
    console.error("❌ Download error:", err);
    Swal.fire("Error", "Failed to download CSV file.", "error");
  }
};

  // ✅ Loading UI
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-[#7b2020]" />
        <p>Loading Student Progress...</p>
      </div>
    );

  // ✅ Main Render
  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-12 relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer"
            onClick={() => router.push(`/teacher/class?class_id=${classId}`)}
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">
              {classInfo?.class_name || "Class Progress Overview"}
            </h1>
            <p className="text-xs opacity-80">Class ID: {classId || "N/A"}</p>
          </div>
        </div>
      </header>

      {/* Table */}
      <section className="w-[90%] max-w-4xl mt-6 relative">
        <h2 className="text-[#7b2020] font-bold text-base mb-2">
          STUDENT PROGRESS RECORDS
        </h2>

        <div className="border-2 border-[#7b2020] rounded-lg bg-white p-5 flex flex-col relative min-h-[200px]">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search student..."
                className="w-full border rounded-lg px-3 py-2 text-sm pr-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                size={16}
                className="absolute right-2 top-2.5 text-gray-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="week">This Week</option>
                <option value="range">Date Range</option>
                <option value="year">Year</option>
              </select>

              {filterType === "range" && (
                <>
                  <input
                    type="date"
                    className="border rounded-lg px-2 py-1 text-sm"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, start: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    className="border rounded-lg px-2 py-1 text-sm"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, end: e.target.value })
                    }
                  />
                </>
              )}

              {filterType === "year" && (
                <input
                  type="number"
                  placeholder="Year"
                  className="border rounded-lg px-2 py-1 text-sm w-24"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                />
              )}

              <Button
                onClick={handleDownloadCSV}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download size={16} /> Download
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="w-full max-h-[520px] overflow-y-auto overflow-x-auto rounded-md">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#7b2020] text-white text-sm">
                <tr>
                  <th className="p-2 pl-3">Avatar</th>
                  <th className="p-2">Student ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2 text-center">Module Points</th>
                  <th className="p-2 text-center">Game Points</th>
                  <th className="p-2 text-center">Total Points</th>
                  <th className="p-2 text-right pr-3">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((rec, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[#7b2020]/30 hover:bg-[#f3dada] transition-all"
                    >
                      <td className="p-2 pl-3">
                        <Image
                          src={rec.avatar || "/resources/icons/student.png"}
                          alt={rec.student_name}
                          width={36}
                          height={36}
                          className="rounded-full border border-[#7b2020] object-cover"
                        />
                      </td>
                      <td className="p-2 text-sm">{rec.student_id}</td>
                      <td className="p-2 text-sm font-medium text-gray-800">
                        {rec.student_name}
                      </td>
                      <td className="p-2 text-center font-medium">
                        {rec.module_points}
                      </td>
                      <td className="p-2 text-center font-medium">
                        {rec.game_points}
                      </td>
                      <td className="p-2 text-center font-semibold text-[#7b2020]">
                        {rec.total_points}
                      </td>
                      <td className="p-2 text-right pr-3 text-xs text-gray-600">
                        {new Date(rec.createdAt!).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-4 text-gray-700 font-medium"
                    >
                      NO STUDENT PROGRESS FOUND
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Download Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-[#7b2020] text-lg">
              Download Successful!
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Your report has been successfully downloaded.
          </p>
          <DialogFooter>
            <Button
              onClick={() => setOpenModal(false)}
              className="bg-[#7b2020] text-white hover:bg-[#631818] w-full"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
