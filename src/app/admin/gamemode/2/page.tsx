"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  LogOut,
  Plus,
  Loader2,
  Trash2,
  X,
  Upload,
  Music,
  Check,
} from "lucide-react";
import Swal from "sweetalert2";

type OptionKey = "A" | "B" | "C" | "D";

interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: OptionKey;
  question_image?: string | null;
  option_a_image?: string | null;
  option_b_image?: string | null;
  option_c_image?: string | null;
  option_d_image?: string | null;
  level_id: number | null;
  mode?: string; // ✅ Add this line
  
}


interface GameConfig {
  total_minutes: number;
  total_points: number;
  hints_per_student: number;
  time_per_question: number;
  shuffle_mode: boolean;
  max_questions: number;
  
}

export default function GameMode2Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  // 🎵 Music Theme States
const [showMusicModal, setShowMusicModal] = useState(false);
const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
const previewAudioRef = useRef<HTMLAudioElement | null>(null);
const previewTimeoutRef = useRef<number | null>(null);


// ✅ Music Theme List
const themes = [
  { name: "Theme 1", file: "/resources/music/theme1.mp3" },
  { name: "Theme 2", file: "/resources/music/theme2.mp3" },
  { name: "Theme 3", file: "/resources/music/theme3.mp3" },
];

  const [config, setConfig] = useState<GameConfig>({
    total_minutes: 5,
    total_points: 100,
    hints_per_student: 3,
    time_per_question: 15,
    shuffle_mode: false,
    max_questions: 10,
  });

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // ✅ Load admin and fetch questions
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");
    if (!savedUser || savedType !== "admin") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
    fetchQuestions();
  }, [router]);

  // ✅ Fetch saved music theme for GameMode 2
useEffect(() => {
  const fetchSavedTheme = async () => {
    try {
      const res = await fetch("/api/gamemode2/music/get");
      if (!res.ok) return; // No theme yet
      const data = await res.json();
      setSelectedTheme(data.theme_file);
    } catch (err) {
      console.error("Failed to fetch saved theme:", err);
    }
  };
  fetchSavedTheme();
}, []);

const fetchQuestions = async () => {
  try {
    setLoading(true);

    // 🔹 Fetch both gamemode1 and gamemode2 in parallel
    const [res1, res2] = await Promise.all([
      fetch("/api/gamemode1/list-all"),
      fetch("/api/gamemode2/list"),
    ]);

    if (!res1.ok || !res2.ok) throw new Error("Failed to fetch one or both question sets");

    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

    // 🔹 Merge both lists and tag their origin
    const combined = [
      ...data1.map((q: any) => ({ ...q, mode: "GameMode 1" })),
      ...data2.map((q: any) => ({ ...q, mode: "GameMode 2" })),
    ];

    // Optional: sort combined list (by id or alphabetically)
    combined.sort((a, b) => a.id - b.id);

    setQuestions(combined);
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Failed to load questions.", "error");
  } finally {
    setLoading(false);
  }
};


  // ✅ Upload to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cloudinary/uploadg2", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        Swal.fire("Error", err.error || "Cloudinary upload failed", "error");
        setUploading(false);
        return null;
      }

      const data = await res.json();
      setUploading(false);
      return data.url ?? null;
    } catch (err) {
      console.error("Upload error:", err);
      setUploading(false);
      Swal.fire("Error", "Upload failed", "error");
      return null;
    }
  };

  // ✅ Handle image upload for question or options
  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>, key?: OptionKey) => {
    const file = e.target.files?.[0];
    if (!file || !selectedQuestion) return;

    const uploadedUrl = await uploadToCloudinary(file);
    if (!uploadedUrl) return;

    setSelectedQuestion((prev) => {
      if (!prev) return prev;
      if (key) {
        const imageKey = `option_${key.toLowerCase()}_image` as keyof Question;
        return { ...prev, [imageKey]: uploadedUrl };
      }
      return { ...prev, question_image: uploadedUrl };
    });
  };

const handleSaveSettings = async () => {
  if (!user?.admin_id) {
    Swal.fire("Error", "Admin not logged in.", "error");
    return;
  }

  try {
    const res = await fetch("/api/gamemode2/settings/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_id: user.admin_id,
        ...config,
        theme_name: selectedTheme
          ? selectedTheme.split("/").pop()?.replace(".mp3", "")
          : null,
        theme_file: selectedTheme,
      }),
    });

    if (!res.ok) throw new Error("Failed to save settings");
    const saved = await res.json();

    Swal.fire("Success!", "Game Mode 2 settings saved!", "success");
  } catch (err) {
    console.error("Save settings error:", err);
    Swal.fire("Error", "Failed to save settings.", "error");
  }
};

// ✅ Open Add/Edit Modal
const openModal = (question?: Question) => {
  // 🚫 Prevent editing questions from GameMode 1
  if (question && question.mode !== "GameMode 2") {
    Swal.fire({
      title: "Notice",
      text: "To update or remove this, please go to Game Mode 1.",
      icon: "info",
      confirmButtonText: "OK",
    });
    return; // stop opening modal
  }

  setSelectedQuestion(
    question || {
      id: 0,
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      answer: "A",
      level_id: null,
      question_image: null,
      option_a_image: null,
      option_b_image: null,
      option_c_image: null,
      option_d_image: null,
      mode: "GameMode 2",
    }
  );
  setEditMode(!!question);
  setShowModal(true);
};


  const closeModal = () => {
    setShowModal(false);
    setSelectedQuestion(null);
  };

 // ✅ Save Question
const handleSaveQuestion = async () => {
  if (!selectedQuestion) return;

  // 🚫 Prevent saving/updating GameMode 1 questions
  if (editMode && selectedQuestion.mode !== "GameMode 2") {
    Swal.fire({
      title: "Notice",
      text: "To update this question, please go to Game Mode 1.",
      icon: "info",
      confirmButtonText: "OK",
    });
    closeModal();
    return;
  }

  const url = editMode ? "/api/gamemode2/update" : "/api/gamemode2/add";
  const method = editMode ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedQuestion),
    });

    if (!res.ok) throw new Error("Failed to save question");
    await fetchQuestions();
    Swal.fire("Success", "Question saved successfully!", "success");
    closeModal();
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Failed to save question.", "error");
  }
};

 // ✅ Delete Question
const handleDelete = async (id: number) => {
  const target = questions.find((q) => q.id === id);

  // 🚫 Prevent deleting GameMode 1 questions
  if (target && target.mode !== "GameMode 2") {
    Swal.fire({
      title: "Notice",
      text: "To update or remove this, please go to Game Mode 1.",
      icon: "info",
      confirmButtonText: "OK",
    });
    return;
  }

  const confirm = await Swal.fire({
    title: "Delete Question?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Yes, delete it",
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await fetch(`/api/gamemode2/delete?id=${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    await fetchQuestions();
    Swal.fire("Deleted!", "Question removed.", "success");
  } catch (err) {
    Swal.fire("Error", "Could not delete question.", "error");
  }
};


  // ✅ Play Preview
const handlePreview = (file: string) => {
  try {
    // Stop any existing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    // Toggle playback
    if (currentlyPlaying === file) {
      setCurrentlyPlaying(null);
      return;
    }

    const audio = new Audio(file);
    audio.volume = 0.5;
    audio.play().catch(() => {});
    previewAudioRef.current = audio;
    setCurrentlyPlaying(file);

    // Auto-stop after 15s
    previewTimeoutRef.current = window.setTimeout(() => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current = null;
      }
      previewTimeoutRef.current = null;
      setCurrentlyPlaying(null);
    }, 15000);

    audio.onended = () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      if (previewAudioRef.current) previewAudioRef.current = null;
      setCurrentlyPlaying(null);
    };
  } catch (err) {
    console.error("Audio preview error:", err);
  }
};

// ✅ Save Selected Theme
const handleSaveTheme = async () => {
  if (!selectedTheme) {
    Swal.fire("Please select a theme before saving.", "", "info");
    return;
  }

  // Stop any preview
  if (previewAudioRef.current) {
    previewAudioRef.current.pause();
    previewAudioRef.current.currentTime = 0;
    previewAudioRef.current = null;
  }
  if (previewTimeoutRef.current) {
    clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = null;
  }
  setCurrentlyPlaying(null);

  try {
    const res = await fetch("/api/gamemode2/music/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_id: user.admin_id,
        gamemode: "gamemode2",
        theme_name: selectedTheme.split("/").pop()?.replace(".mp3", ""),
        theme_file: selectedTheme,
      }),
    });

    if (!res.ok) throw new Error("Failed to save theme");
    const saved = await res.json();

    Swal.fire("Success!", `${saved.theme_name} saved for Game Mode 2!`, "success");
    setShowMusicModal(false);
  } catch (err) {
    console.error("Save theme error:", err);
    Swal.fire("Error", "Failed to save music theme.", "error");
  }
};


  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading admin data...
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-5 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/gamemode")}
            className="flex items-center gap-1 hover:opacity-80"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <Image
            src={user.avatar || "/resources/icons/admin.png"}
            alt="Admin Avatar"
            width={45}
            height={45}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">{user.first_name}</span>
        </div>

        
      </header>

      {/* Title */}
      <h1 className="text-2xl font-bold text-[#548E28] mt-6 mb-4 text-center">
        🧩 Game Mode 2: Quiz Mode
      </h1>

      {/* ⚙️ Game Config Section */}
      <div className="w-full max-w-3xl bg-[#f8fbf5] text-black border border-[#cbe3bb] rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-[#548E28] mb-4">
          ⚙️ Game Configuration
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span>Duration (mins)</span>
            <input
              type="number"
              min={1}
              value={config.total_minutes}
              onChange={(e) =>
                setConfig({ ...config, total_minutes: +e.target.value })
              }
              className="border rounded-md px-3 py-3 sm:py-2 focus:ring-2 focus:ring-[#548E28]/30 transition-al"
            />
          </label>

          <label className="flex flex-col">
            <span>Total Points</span>
            <input
              type="number"
              min={1}
              value={config.total_points}
              onChange={(e) =>
                setConfig({ ...config, total_points: +e.target.value })
              }
              className="border rounded-md px-3 py-3 sm:py-2 focus:ring-2 focus:ring-[#548E28]/30 transition-al"
            />
          </label>

          <label className="flex flex-col">
            <span>Hints</span>
            <input
              type="number"
              min={0}
              value={config.hints_per_student}
              onChange={(e) =>
                setConfig({ ...config, hints_per_student: +e.target.value })
              }
              className="border rounded-md px-3 py-3 sm:py-2 focus:ring-2 focus:ring-[#548E28]/30 transition-al"
            />
          </label>

          <label className="flex flex-col">
            <span>Time per (seconds)</span>
            <input
              type="number"
              min={5}
              value={config.time_per_question}
              onChange={(e) =>
                setConfig({ ...config, time_per_question: +e.target.value })
              }
              className="border rounded-md px-3 py-3 sm:py-2 focus:ring-2 focus:ring-[#548E28]/30 transition-all"

            />
          </label>

          <label className="flex flex-col">
            <span>Max Questions</span>
            <input
              type="number"
              min={1}
              max={questions.length}
              value={config.max_questions}
              onChange={(e) =>
                setConfig({
                  ...config,
                  max_questions: Math.min(+e.target.value, questions.length),
                })
              }
              className="border rounded-md px-3 py-3 sm:py-2 focus:ring-2 focus:ring-[#548E28]/30 transition-all"
            />
          </label>

          <label className="flex items-center gap-3 mt-5">
            <input
              type="checkbox"
              checked={config.shuffle_mode}
              onChange={(e) =>
                setConfig({ ...config, shuffle_mode: e.target.checked })
              }
            />
            <span>Shuffle Questions</span>
          </label>
        </div>
                    
<div className="flex flex-wrap justify-between items-center mt-6 gap-3">
  <button
    onClick={handleSaveSettings}
    className="bg-[#548E28] text-white px-6 py-3 rounded-md hover:bg-[#3e6a20] w-full sm:w-auto flex items-center justify-center"
  >
    Save Settings
  </button>

  <button
    onClick={() => setShowMusicModal(true)}
    className="flex items-center justify-center gap-2 bg-[#548E28] text-white px-6 py-3 rounded-md hover:bg-[#3e6a20] w-full sm:w-auto"
  >
    <Music className="w-5 h-5" />
    <span className="text-center">Select Music Theme</span>
  </button>
</div>


      </div>




     {/* 📜 Question List Section */}
<div className="w-full max-w-3xl text-black">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold text-[#548E28]">
      📜 Question List ({questions.length})
    </h2>
    <div className="flex justify-end pr-4 sm:pr-6">
  <button
    onClick={() => openModal()}
    className="bg-[#548E28] text-white px-4 py-2 rounded-md hover:bg-[#3e6a20] flex items-center justify-center"
  >
    <Plus className="inline w-4 h-4 mr-1" />

  </button>
</div>

  </div>

  <div
    className="border border-[#cbe3bb] rounded-lg shadow-inner bg-[#f8fbf5] max-h-[400px] overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-[#a7cc8c] scrollbar-track-transparent"
  >
    {loading ? (
      <div className="flex justify-center py-6">
        <Loader2 className="animate-spin text-[#548E28]" />
      </div>
    ) : questions.length === 0 ? (
      <p className="text-center text-gray-500 italic py-6">
        No questions found.
      </p>
    ) : (
      <ul className="space-y-2">
        {questions.map((q, i) => (
          <li
            key={q.id}
            className="border rounded-md px-3 py-2 flex justify-between items-center hover:bg-[#eef8ea] transition text-sm sm:text-base"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <b>Q{i + 1}:</b>
              <span className="truncate max-w-[200px] sm:max-w-none">{q.question}</span>
              <span className="text-xs text-gray-500 ml-1">({q.mode})</span>
            </div>

            <div className="flex gap-2 text-sm">
              <button
                onClick={() => openModal(q)}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(q.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
</div>

{/* 🎵 Music Theme Modal */}
{showMusicModal && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center text-black">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative flex flex-col">
      <button
        onClick={() => {
          if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current.currentTime = 0;
            previewAudioRef.current = null;
          }
          if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
            previewTimeoutRef.current = null;
          }
          setCurrentlyPlaying(null);
          setShowMusicModal(false);
        }}
        className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
      >
        <X className="w-5 h-5" />
      </button>

      <h2 className="text-xl font-semibold mb-4 text-[#548E28] text-center">
        🎵 Choose a Music Theme
      </h2>

      <ul className="space-y-3 mb-6">
        {themes.map((theme) => (
          <li
            key={theme.file}
            className={`border rounded-lg p-3 flex justify-between items-center cursor-pointer transition ${
              selectedTheme === theme.file
                ? "bg-[#e8f5e9] border-[#548E28]"
                : "hover:bg-gray-100"
            }`}
            onClick={() => setSelectedTheme(theme.file)}
          >
            <div className="flex items-center gap-2">
              {selectedTheme === theme.file && (
                <Check className="text-[#548E28] w-5 h-5" />
              )}
              <div className="flex flex-col">
                <span className="font-medium text-[#548E28]">{theme.name}</span>
                <span className="text-xs text-gray-500">
                  {theme.file.split("/").pop()}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePreview(theme.file);
              }}
              className={`text-sm text-white px-3 py-1 rounded transition ${
                currentlyPlaying === theme.file
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#548E28] hover:bg-[#3e6a20]"
              }`}
            >
              {currentlyPlaying === theme.file ? "Stop" : "Preview"}
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSaveTheme}
        className="w-full bg-[#548E28] text-white py-2 rounded-md hover:bg-[#3e6a20] transition"
      >
        Save Theme
      </button>
    </div>
  </div>
)}



      {/* ✅ Add/Edit Modal */}
      {showModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 text-black">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-[#548E28] mb-3">
              {editMode ? "Edit Question" : "Add Question"}
            </h3>

            {/* Question with Image */}
            <div className="flex gap-3 items-center mb-4">
              {selectedQuestion.question_image ? (
                <div className="relative">
                  <img
                    src={selectedQuestion.question_image}
                    alt="Question"
                    className="w-24 h-24 object-contain rounded-lg border bg-gray-100 p-1"
                  />
                  <button
                    onClick={() =>
                      setSelectedQuestion({ ...selectedQuestion, question_image: null })
                    }
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-100">
                  <Upload className="w-6 h-6 text-gray-500" />
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
                value={selectedQuestion.question}
                onChange={(e) =>
                  setSelectedQuestion({ ...selectedQuestion, question: e.target.value })
                }
                className="flex-1 border border-gray-400 rounded-md px-3 py-2"
              />
            </div>

            {/* Options A–D */}
            {(["A", "B", "C", "D"] as OptionKey[]).map((key) => {
              const textKey = `option_${key.toLowerCase()}` as keyof Question;
              const imageKey = `option_${key.toLowerCase()}_image` as keyof Question;

              return (
                <div key={key} className="flex gap-3 items-center mb-2">
                  {selectedQuestion[imageKey] ? (
                    <div className="relative">
                      <img
                        src={selectedQuestion[imageKey] as string}
                        alt={`Option ${key}`}
                        className="w-20 h-20 object-contain rounded-lg border bg-gray-100 p-1"
                      />
                      <button
                        onClick={() =>
                          setSelectedQuestion({
                            ...selectedQuestion,
                            [imageKey]: null,
                          } as Question)
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
                    value={selectedQuestion[textKey] as string}
                    onChange={(e) =>
                      setSelectedQuestion({
                        ...selectedQuestion,
                        [textKey]: e.target.value,
                      } as Question)
                    }
                    className="flex-1 border border-gray-400 rounded-md px-3 py-2"
                  />
                </div>
              );
            })}

            <select
              value={selectedQuestion.answer}
              onChange={(e) =>
                setSelectedQuestion({
                  ...selectedQuestion,
                  answer: e.target.value as OptionKey,
                })
              }
              className="w-full border border-gray-400 rounded-md px-3 py-2 mt-2 mb-4"
            >
              <option value="A">Answer: A</option>
              <option value="B">Answer: B</option>
              <option value="C">Answer: C</option>
              <option value="D">Answer: D</option>
            </select>

            <div className="flex gap-3">
              <button
                onClick={handleSaveQuestion}
                className="flex-1 bg-[#548E28] text-white py-2 rounded-md hover:bg-[#3e6a20]"
              >
                {editMode ? "Update" : "Save"}
              </button>

              {editMode && (
                <button
                  onClick={() => handleDelete(selectedQuestion.id)}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <Loader2 className="animate-spin text-white w-12 h-12" />
        </div>
      )}

      
    </div>
    
  );
}
