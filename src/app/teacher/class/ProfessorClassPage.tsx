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
import { ArrowLeft, Plus, Search, Copy, X, Download, Eye } from "lucide-react";
import Swal from "sweetalert2";
import {
  BarChart,
  Bar,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ✅ Strong typing for safety
type OptionKey = "A" | "B" | "C" | "D";

interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: string;
}

function ClassProgressChart({ classId, filterType, dateRange, selectedYear }: any) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/classmode/progress?class_id=${classId}`);
        const data = await res.json();

        if (data.success) {
          let records = data.progressData;

          // ✅ Apply filters (same logic as before)
          const now = new Date();
          if (filterType === "week") {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            records = records.filter(
              (r: any) => new Date(r.createdAt || now) >= startOfWeek
            );
          }

          if (filterType === "range" && dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            records = records.filter(
              (r: any) =>
                new Date(r.createdAt || now) >= start &&
                new Date(r.createdAt || now) <= end
            );
          }

          if (filterType === "year" && selectedYear) {
            records = records.filter(
              (r: any) =>
                new Date(r.createdAt || now).getFullYear() ===
                Number(selectedYear)
            );
          }

          // ✅ Prepare chart data
          const formatted = records.map((r: any) => ({
            name: r.student_name,
            avatar: r.avatar,
            points: r.total_points,
          }));
          setChartData(formatted);
        }
      } catch (err) {
        console.error("Error loading class progress chart:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [classId, filterType, dateRange, selectedYear]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[300px] text-gray-500">
        Loading chart...
      </div>
    );

  return (
    <div className="h-[300px] w-full overflow-x-auto">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barSize={45}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(123,32,32,0.1)" }}
            content={({ active, payload }) =>
              active && payload && payload.length ? (
                <div className="bg-white shadow-md rounded-lg p-3 flex items-center gap-3">
                  <Image
                    src={payload[0].payload.avatar}
                    alt="Student Avatar"
                    width={40}
                    height={40}
                    className="rounded-full border"
                  />
                  <div>
                    <p className="font-semibold text-sm text-[#7b2020]">
                      {payload[0].payload.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Total Points: {payload[0].payload.points}
                    </p>
                  </div>
                </div>
              ) : null
            }
          />
          <Bar dataKey="points" fill="#7b2020" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


export default function ProfessorClassPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id");

  const [students, setStudents] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedMode] = useState("Phase Rush");
  const [gameCode, setGameCode] = useState("");

const [filterType, setFilterType] = useState("all");
const [dateRange, setDateRange] = useState({ start: "", end: "" });
const [selectedYear, setSelectedYear] = useState("");
const [openModal, setOpenModal] = useState(false);


  // ✅ Question system
  const [showQuestionListModal, setShowQuestionListModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<Record<OptionKey, string>>({
    A: "",
    B: "",
    C: "",
    D: "",
  });
  const [answer, setAnswer] = useState<OptionKey>("A");

  // ✅ Image states
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [optionImages, setOptionImages] = useState<Record<OptionKey, string | null>>({
    A: null,
    B: null,
    C: null,
    D: null,
  });
  
    // ✅ Go to Lobby
  const goToLobby = (game: any) => {
    localStorage.setItem("activeGameCode", game.game_code);
    localStorage.setItem("activeGameType", game.game_type);
    localStorage.setItem("activeClassId", classId?.toString() || "");

    router.push(`/teacher/class/lobby?code=${game.game_code}&class_id=${classId}`);
  };
  

  // 🧩 Upload image to Cloudinary (via your API endpoint)
const uploadToCloudinary = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/cloudinary/uploadg6", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success && data.url) {
      return data.url; // ✅ return Cloudinary image URL
    } else {
      Swal.fire("Upload failed", data.error || "Cloudinary error", "error");
      return null;
    }
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    Swal.fire("Error", "Failed to upload image", "error");
    return null;
  }
};

// 🖼 Handle file input & auto-upload to Cloudinary
const handleImageSelect = async (
  e: React.ChangeEvent<HTMLInputElement>,
  key?: OptionKey
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const imageUrl = await uploadToCloudinary(file);
  if (!imageUrl) return;

  // ✅ Preview and save URL
  if (key) {
    setOptionImages((prev) => ({ ...prev, [key]: imageUrl }));
  } else {
    setQuestionImage(imageUrl);
  }
};

  // ✅ Load teacher info
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");
    if (savedUser && savedType === "teacher") {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // ✅ Fetch data
  const fetchAllData = async () => {
    if (!classId) return;
    try {
      setLoading(true);
      const [classRes, studentRes, gameRes, recordRes] = await Promise.all([
        fetch(`/api/class/info?class_id=${classId}`),
        fetch(`/api/class/students?class_id=${classId}`),
        fetch(`/api/classmode/list?class_id=${classId}`),
        fetch(`/api/classmode/records/get?class_id=${classId}`),
      ]);

      const classData = await classRes.json();
      const studentData = await studentRes.json();
      const gameData = await gameRes.json();
      const recordData = await recordRes.json();

      if (classData.success) setClassInfo(classData.class);
      if (studentData.success) setStudents(studentData.students);
      if (gameData.success) setGames(gameData.games || []);
      if (recordData.success) setRecords(recordData.records || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const openQuestionList = async () => {
    if (!classId) return;
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/class/questions/list?class_id=${classId}`);
      const data = await res.json();
      if (data.success) setQuestions(data.questions);
      else setQuestions([]);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load questions", "error");
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    openQuestionList();
  }, [classId]);

  // ✅ Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [students, searchTerm]);

  // ✅ Generate game code
  const generateGameCode = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    setGameCode(code);
  };

  // ✅ Copy code
  const copyCode = () => {
    navigator.clipboard.writeText(gameCode);
    Swal.fire({
      title: "Copied!",
      text: `Game code ${gameCode} copied.`,
      icon: "success",
      timer: 1000,
      showConfirmButton: false,
    });
  };

  // ✅ Create new game
  const handleCreateGame = async () => {
    if (!selectedMode) {
      Swal.fire("Select Game Mode", "Please choose a game mode.", "warning");
      return;
    }

    if (!classId || !user?.id_number) return;

    try {
      const res = await fetch("/api/classmode/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: Number(classId),
          teacher_id: user.id_number,
          game_type: selectedMode.toLowerCase().replace(" ", "_"),
          game_code: gameCode,
        }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          title: "Game Created!",
          text: `Game code: ${data.game.game_code}`,
          icon: "success",
          confirmButtonColor: "#7b2020",
        });

        setGameCode(data.game.game_code);
        setShowModal(false);
        fetchAllData();
      } else {
        Swal.fire("Error", data.error || "Failed to create game.", "error");
      }
    } catch (error) {
      console.error("❌ Create Game Error:", error);
      Swal.fire("Error", "Server error occurred.", "error");
    }
  };

  // ✅ Question Modals
  const handleOpenAddQuestion = () => {
    setShowAddQuestionModal(true);
    setEditMode(false);
    setQuestion("");
    setOptions({ A: "", B: "", C: "", D: "" });
    setAnswer("A");
    setQuestionImage(null);
    setOptionImages({ A: null, B: null, C: null, D: null });
    setSelectedQuestion(null);
  };

  const handleEditQuestion = (q: any) => {
  setShowAddQuestionModal(true);
  setEditMode(true);
  setSelectedQuestion(q);

  setQuestion(q.question);
  setOptions({
    A: q.option_a,
    B: q.option_b,
    C: q.option_c,
    D: q.option_d,
  });
  setAnswer(q.answer as OptionKey);

  // ✅ Load Cloudinary images (if available)
  setQuestionImage(q.question_image || null);

  // Some databases store option_images as JSON string → parse if needed
  let parsedOptionImages: Record<OptionKey, string | null> = { A: null, B: null, C: null, D: null };

  try {
    if (typeof q.option_images === "string") {
      parsedOptionImages = JSON.parse(q.option_images);
    } else if (typeof q.option_images === "object" && q.option_images !== null) {
      parsedOptionImages = q.option_images;
    }
  } catch (error) {
    console.warn("⚠️ Error parsing option_images:", error);
  }

  setOptionImages(parsedOptionImages);
};

  const handleSaveQuestion = async () => {
    if (!question.trim()) {
      Swal.fire("Error", "Please enter a question", "warning");
      return;
    }

    try {
      const res = await fetch("/api/class/questions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: Number(classId),
          teacher_id: user.id_number,
          question,
          option_a: options.A,
          option_b: options.B,
          option_c: options.C,
          option_d: options.D,
          answer,
          question_image: questionImage,
          option_images: optionImages,
        }),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire("Success", "Question added!", "success");
        setShowAddQuestionModal(false);
        openQuestionList();
      } else {
        Swal.fire("Error", data.error || "Failed to save question.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error saving question.", "error");
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion) return;
    try {
      const res = await fetch("/api/class/questions/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedQuestion.id,
          question,
          option_a: options.A,
          option_b: options.B,
          option_c: options.C,
          option_d: options.D,
          answer,
          question_image: questionImage,
          option_images: optionImages,
        }),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire("Updated!", "Question updated successfully.", "success");
        setShowAddQuestionModal(false);
        openQuestionList();
      } else {
        Swal.fire("Error", data.error || "Failed to update question.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error updating question.", "error");
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This question will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/class/questions/delete?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire("Deleted", "Question removed successfully.", "success");
         // ✅ Refresh question list
      openQuestionList();

      // ✅ Close any open modals automatically
      setShowAddQuestionModal(false);
      setShowQuestionListModal(false);
      setSelectedQuestion(null);
      setEditMode(false);
      } else {
        Swal.fire("Error", data.error || "Failed to delete question.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error deleting question.", "error");
    }
  };

  // Filter records for chart
const filteredRecords = records.filter((rec) => {
  const date = new Date(rec.created_at);
  const now = new Date();

  if (filterType === "year" && selectedYear) {
    return date.getFullYear() === Number(selectedYear);
  }

  if (filterType === "week") {
    const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }

  if (filterType === "range" && dateRange.start && dateRange.end) {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return date >= start && date <= end;
  }

  return true;
});

// ✅ Aggregate total points per student from records
const studentPointsMap: Record<string, number> = {};

filteredRecords.forEach((rec) => {
  const id = rec.student_id_number;
  studentPointsMap[id] = (studentPointsMap[id] || 0) + Number(rec.points || 0);
});

// ✅ Merge with all students (so even those with 0 points appear)
const chartData = students.map((s) => {
  const totalPoints = studentPointsMap[s.id_number] || 0;

  return {
    name: `${s.first_name} ${s.last_name}`,
    avatar: s.avatar || "/resources/icons/student.png",
    points: totalPoints,
  };
});




  // ✅ RENDER
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading class data...
      </div>
    );

  if (!classInfo)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-gray-700">
        <p>Class not found.</p>
        <button
          onClick={() => router.push("/teacher")}
          className="text-[#7b2020] font-semibold mt-2 underline"
        >
          Go back
        </button>
      </div>
    );

  if (!classInfo)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-gray-700">
        <p>Class not found.</p>
        <button
          onClick={() => router.push("/teacher")}
          className="text-[#7b2020] font-semibold mt-2 underline"
        >
          Go back
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-12 relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer"
            onClick={() => router.push("/teacher")}
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">{classInfo.class_name}</h1>
            <p className="text-xs opacity-80">Class code: {classInfo.class_code}</p>
          </div>
        </div>
      </header>

      {/* Students Section */}
      <section className="w-[90%] max-w-md mt-5">
        <h2 className="text-[#7b2020] font-bold text-base mb-3">MY STUDENTS</h2>
        <div className="flex items-center bg-[#f8e8e8] border border-[#7b2020] rounded-lg px-3 py-2 mb-3">
          <Search className="w-5 h-5 text-[#7b2020] mr-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student..."
            className="bg-transparent w-full text-sm outline-none placeholder:text-gray-500"
          />
        </div>

        <div className="border-2 border-[#7b2020] rounded-lg bg-[#f8e8e8] max-h-[300px] overflow-y-auto shadow-inner">
          {filteredStudents.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#7b2020] text-white text-sm">
                <tr>
                  <th className="p-2 pl-4">Avatar</th>
                  <th className="p-2">Name</th>
                  <th className="p-2 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-[#7b2020]/30 hover:bg-[#f3dada] transition-all"
                  >
                    <td className="p-2 pl-4">
                      <Image
                        src={student.avatar || "/resources/icons/student.png"}
                        alt={`${student.first_name} ${student.last_name}`}
                        width={32}
                        height={32}
                        className="rounded-full border border-[#7b2020] object-cover"
                      />
                    </td>
                    <td className="p-2 text-sm font-medium text-gray-800">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="p-2 pr-4 text-right">
                      <button
                        onClick={() =>
                          router.push(`/teacher/class/studentrecords?student_id=${student.id}`)

                        }
                        className="text-[#7b2020] font-bold text-sm"
                      >
                        →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-600 text-center py-4">No students found.</div>
          )}
        </div>
      </section>

{/* 🧭 CLASS PROGRESS OVERVIEW (Compact & Matches Student List) */}
<section className="w-[90%] max-w-md mt-6">
  <h2 className="text-[#7b2020] font-bold text-base mb-3 text-center sm:text-left">
    Class Progress Overview
  </h2>

  <div className="border-2 border-[#7b2020] rounded-lg bg-[#f8e8e8] shadow-inner p-4 flex flex-col gap-4">
    {/* Filter + Buttons */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-md w-full sm:w-auto">
        <select
          className="border rounded-lg px-3 py-1 text-sm w-full sm:w-auto"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All</option>
          <option value="week">This Week</option>
          <option value="range">Date Range</option>
          <option value="year">Year</option>
        </select>

        {filterType === "range" && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="date"
              className="border rounded-lg px-2 py-1 text-sm w-full sm:w-auto"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
            <input
              type="date"
              className="border rounded-lg px-2 py-1 text-sm w-full sm:w-auto"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        )}

        {filterType === "year" && (
          <input
            type="number"
            placeholder="Year"
            className="border rounded-lg px-2 py-1 text-sm w-full sm:w-24"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          />
        )}
      </div>

 {/* Buttons */}
<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
  <Button
    onClick={async () => {
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
        if (!res.ok) throw new Error("Failed to download");

        const blob = await res.blob();
        const reader = new FileReader();

        reader.onloadend = function () {
          // ✅ Android WebView integration
          if (window.Android?.saveBase64ToDownloads) {
            try {
              window.Android.saveBase64ToDownloads(
                reader.result as string,
                `class_${classId}_progress.csv`
              );
              console.log("✅ Sent to Android WebView for saving.");
            } catch (androidError) {
              console.error("❌ Android Bridge Error:", androidError);
              Swal.fire(
                "Error",
                "Failed to save file on Android WebView.",
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

          setOpenModal(true);
        };

        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Download error:", err);
        Swal.fire("Error", "Failed to download CSV file.", "error");
      }
    }}
    variant="outline"
    className="flex items-center justify-center gap-2 w-full sm:w-auto"
  >
    <Download size={16} /> Download
  </Button>

  <Button
    onClick={() =>
      router.push(`/teacher/class/studentprogress?class_id=${classId}`)
    }
    className="bg-[#7b2020] text-white hover:bg-[#631818] flex items-center justify-center gap-2 w-full sm:w-auto"
  >
    <Eye size={16} /> View More
  </Button>
</div>
    </div>

    {/* ✅ Compact Chart Wrapper */}
    <div className="w-full h-[180px] sm:h-[200px] overflow-x-auto">
      <div className="min-w-[400px] sm:min-w-0 h-full">
        <ClassProgressChart
          classId={classId}
          filterType={filterType}
          dateRange={dateRange}
          selectedYear={selectedYear}
        />
      </div>
    </div>
  </div>

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
</section>



{/* 🧠 QUESTION BANK SECTION */}
<section className="w-[90%] max-w-md mt-6 relative">
  <h2 className="text-[#7b2020] font-bold text-base mb-2">QUESTION BANK</h2>

  <div className="border-2 border-[#7b2020] rounded-lg bg-[#f8e8e8] p-5 flex flex-col relative min-h-[200px]">
    {loadingQuestions ? (
      <div className="text-center text-gray-500 py-10">Loading questions...</div>
    ) : questions.length > 0 ? (
      <div className="w-full max-h-[250px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#7b2020] text-white text-sm">
            <tr>
              <th className="p-2 pl-3">Question</th>
              <th className="p-2 text-center">Answer</th>
              <th className="p-2 text-right pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => (
              <tr
                key={q.id}
                className="border-b border-[#7b2020]/30 hover:bg-[#f3dada] transition-all cursor-pointer"
                onClick={() => handleEditQuestion(q)}
              >
                <td className="p-2 pl-3 text-sm font-medium text-[#7b2020] truncate max-w-[180px]">
                  Question {i + 1}
                </td>
                <td className="p-2 text-center text-sm text-gray-700 font-semibold">
                  {q.answer}
                </td>
                <td className="p-2 text-right pr-3 text-[#7b2020] font-semibold">
                  →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-sm text-gray-700 font-medium text-center">
        NO QUESTIONS YET
      </p>
    )}

    {/* ➕ Create New Question Button */}
    <button
      onClick={() => {
        handleOpenAddQuestion();
      }}
      className="absolute bottom-3 right-3 bg-[#7b2020] text-white p-3 rounded-full shadow-md hover:bg-[#5f1717]"
    >
      <Plus className="w-5 h-5" />
    </button>
  </div>
</section>


 {/* Class Mode Lobby */}
<section className="w-[90%] max-w-md mt-6 relative">
  <h2 className="text-[#7b2020] font-bold text-base mb-2">
    CLASS MODE LOBBY
  </h2>

  <div className="border-2 border-[#7b2020] rounded-lg bg-[#f8e8e8] p-5 flex flex-col justify-center items-center relative min-h-[200px]">
    {games.length > 0 ? (
      <div className="w-full max-h-[250px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#7b2020] text-white text-sm">
            <tr>
              <th className="p-2 pl-3">Game Mode</th>
              <th className="p-2">Code</th>
              <th className="p-2 text-right pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr
                key={game.id}
                className="border-b border-[#7b2020]/30 hover:bg-[#f3dada] cursor-pointer text-black transition-all"
                onClick={() => goToLobby(game)}
              >
                <td className="p-2 pl-3 text-sm capitalize">
                  {game.game_type.replace("_", " ")}
                </td>
                <td className="p-2 text-sm font-semibold text-[#7b2020]">
                  {game.game_code}
                </td>
                <td className="p-2 text-right pr-3 text-[#7b2020] font-semibold">
                  →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-sm text-gray-700 font-medium text-center">
        NO CLASS MODE GAME RECORD YET
      </p>
    )}

    {/* ➕ Create New Game Button */}
    <button
      onClick={() => {
        setShowModal(true);
        generateGameCode();
      }}
      className="absolute bottom-3 right-3 bg-[#7b2020] text-white p-3 rounded-full shadow-md hover:bg-[#5f1717]"
    >
    <Plus className="w-5 h-5" />
    </button>
  </div>
</section>

{/* 🏁 CLASS MODE RECORDS */}
<section className="w-[90%] max-w-md mt-6 relative">
  <h2 className="text-[#7b2020] font-bold text-base mb-2">CLASS MODE RECORDS</h2>

  <div className="border-2 border-[#7b2020] rounded-lg bg-[#f8e8e8] p-5 flex flex-col relative min-h-[200px]">
    {records.length > 0 ? (
      <div className="w-full max-h-[250px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#7b2020] text-white text-sm">
            <tr>
              <th className="p-2 pl-3">Game Code</th>
              <th className="p-2 text-center pr-3">Date</th>
              <th className="p-2 text-right pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {/* ✅ Extract unique game codes */}
            {Array.from(
              new Map(
                records.map((r) => [r.game_code, r])
              ).values()
            ).map((rec) => (
              <tr
                key={rec.game_code}
                className="border-b border-[#7b2020]/30 hover:bg-[#f3dada] transition-all cursor-pointer"
                onClick={() =>
                  router.push(
                    `/teacher/class/gamerecords?code=${rec.game_code}&class_id=${classId}`
                  )
                }
              >
                <td className="p-2 pl-3 text-sm font-semibold text-[#7b2020]">
                  {rec.game_code}
                </td>
                <td className="p-2 text-center text-xs text-gray-600">
                  {new Date(rec.created_at).toLocaleDateString()}{" "}
                  {new Date(rec.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="p-2 text-right pr-3 text-[#7b2020] font-semibold">
                  →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-sm text-gray-700 font-medium text-center">
        NO CLASS MODE RECORDS YET
      </p>
    )}
  </div>
</section>

{/* ✅ Question List Modal */}
{showQuestionListModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white w-[90%] max-w-md p-6 rounded-lg shadow-lg relative">
      <button
        onClick={() => setShowQuestionListModal(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-black"
      >
        <X className="w-5 h-5" />
      </button>

      <h2 className="text-[#7b2020] font-bold text-lg mb-4 text-center">
        Questions for {classInfo.class_name}
      </h2>

      {loadingQuestions ? (
        <p className="text-center text-gray-500">Loading questions...</p>
      ) : questions.length === 0 ? (
        <p className="text-center text-gray-500 italic">No questions yet.</p>
      ) : (
        <ul className="space-y-2 max-h-[300px] overflow-y-auto">
          {questions.map((q, i) => (
            <li
              key={q.id}
              onClick={() => handleEditQuestion(q)}
              className="border border-[#7b2020]/40 rounded-md px-3 py-2 flex justify-between cursor-pointer hover:bg-[#f3dada]"
            >
              <span className="text-[#7b2020] font-medium">
                Q{i + 1}: {q.question}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteQuestion(q.id);
                }}
                className="text-red-500 text-sm"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ➕ Add Question Button */}
      <button
        onClick={handleOpenAddQuestion}
        className="absolute bottom-4 right-4 bg-[#7b2020] text-white p-3 rounded-full shadow-lg hover:bg-[#5f1717]"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  </div>
)}

{/* ✅ Add / Edit Question Modal */}
{showAddQuestionModal && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center text-black">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
      <button
        onClick={() => setShowAddQuestionModal(false)}
        className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
      >
        <X className="w-5 h-5" />
      </button>

      <h2 className="text-xl font-semibold mb-4  text-[#7b2020] text-center">
        {editMode ? "Edit Question" : "Add Question"}
      </h2>

      {/* Question + Image Upload */}
      <div className="flex gap-3 items-center mb-4">
        {questionImage ? (
          <div className="relative">
            <img
              src={questionImage}
              alt="Question"
              className="w-24 h-24 object-contain rounded-lg border bg-gray-100 p-1"
            />
            <button
              onClick={() => setQuestionImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-100">
            <Plus className="w-5 h-5 text-gray-500" />
            <span className="text-xs text-gray-500 mt-1">Add</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageSelect(e)}
            />
          </label>
        )}
        <input
          type="text"
          placeholder="Enter question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 border border-gray-400 rounded-md px-3 py-2"
        />
      </div>

      {/* Option Inputs with Optional Images */}
      {(["A", "B", "C", "D"] as OptionKey[]).map((key) => (
        <div key={key} className="flex gap-3 items-center mb-2">
          {optionImages[key] ? (
            <div className="relative">
              <img
                src={optionImages[key] as string}
                alt={`Option ${key}`}
                className="w-20 h-20 object-contain rounded-lg border bg-gray-100 p-1"
              />
              <button
                onClick={() =>
                  setOptionImages((prev) => ({ ...prev, [key]: null }))
                }
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-100">
              <Plus className="w-5 h-5 text-gray-500" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageSelect(e, key)}
              />
            </label>
          )}
          <input
            type="text"
            placeholder={`Option ${key}`}
            value={options[key]}
            onChange={(e) =>
              setOptions((prev) => ({ ...prev, [key]: e.target.value }))
            }
            className="flex-1 border border-gray-400 rounded-md px-3 py-2"
          />
        </div>
      ))}

      {/* Answer Selector */}
      <select
        value={answer}
        onChange={(e) => setAnswer(e.target.value as OptionKey)}
        className="w-full border border-gray-400 rounded-md px-3 py-2 mt-2 mb-4"
      >
        <option value="A">Answer: A</option>
        <option value="B">Answer: B</option>
        <option value="C">Answer: C</option>
        <option value="D">Answer: D</option>
      </select>

      <div className="flex gap-3">
        <button
          onClick={editMode ? handleUpdateQuestion : handleSaveQuestion}
          className="flex-1 bg-[#7b2020] text-white py-2 rounded-md hover:bg-[#3d6a1f]"
        >
          {editMode ? "Update Question" : "Save Question"}
        </button>

        {editMode && selectedQuestion && (
          <button
            onClick={() => handleDeleteQuestion(selectedQuestion.id)}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            🗑 Remove
          </button>
        )}
      </div>
    </div>
  </div>
)}


      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-[90%] max-w-sm p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-[#7b2020] font-bold text-lg mb-4 text-center">
              Create Class Game
            </h2>

           <label className="block text-sm font-semibold text-gray-700 mb-2">
                Game Mode
              </label>
              <input
                type="text"
                value="Phase Rush"
                readOnly
                className="w-full border-2 border-[#7b2020] rounded-md p-2 text-sm mb-4 text-gray-700 bg-[#f8e8e8] cursor-not-allowed select-none"
              />


            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Game Code
            </label>
            <div className="flex items-center bg-[#f8e8e8] border-2 border-[#7b2020] rounded-md px-3 py-2 mb-4">
              <span className="text-[#7b2020] font-bold flex-1">{gameCode}</span>
              <Copy
                className="cursor-pointer text-[#7b2020] w-5 h-5 ml-2"
                onClick={copyCode}
              />
            </div>

            <button
              onClick={handleCreateGame}
              className="w-full bg-[#7b2020] text-white font-semibold py-2 rounded-md hover:bg-[#5f1717]"
            >
              Create Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}