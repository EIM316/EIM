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

type OptionKey = "A" | "B";

interface Question {
  id: number;
  question: string;

  // 🅰️🅱️🅲️🅳️ Options
  option_a: string;
  option_b: string;
  option_c?: string;
  option_d?: string;

  // 🖼️ Optional images for each option
  option_a_image?: string | null;
  option_b_image?: string | null;
  option_c_image?: string | null;
  option_d_image?: string | null;

  // ✅ Answer & metadata
  answer: "A" | "B" | "C" | "D";
  question_image?: string | null;
  level_id: number | null;
  mode?: string;
}


interface GameConfig {
  total_game_time: number;
  question_interval: number;
  shuffle_mode: boolean;
}

export default function GameMode4Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // 🎵 Music Controls
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);

  const themes = [
    { name: "Theme 1", file: "/resources/music/theme1.mp3" },
    { name: "Theme 2", file: "/resources/music/theme2.mp3" },
    { name: "Theme 3", file: "/resources/music/theme3.mp3" },
  ];

  const [config, setConfig] = useState<GameConfig>({
    total_game_time: 60,
    question_interval: 5,
    shuffle_mode: true,
  });

   // ✅ Load Admin + Fetch Questions + Settings + Theme
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "admin") {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    fetchQuestions();
    fetchSettings(parsedUser.admin_id);
  }, [router]);

   // ✅ Fetch GameMode4 Settings (NEW)
  const fetchSettings = async (admin_id: string) => {
    try {
      const res = await fetch(`/api/gamemode4/settings/get?admin_id=${admin_id}`);
      if (res.ok) {
        const data = await res.json();
        setConfig({
          total_game_time: data.total_game_time,
          question_interval: data.question_interval,
          shuffle_mode: data.shuffle_mode,
        });
        setSelectedTheme(data.theme_file || null);
      }
    } catch (error) {
      console.warn("⚠️ No saved settings found for this admin");
    }
  };

  // ✅ Save GameMode4 Settings (NEW)
  const handleSaveSettings = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/gamemode4/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: user.admin_id,
          total_game_time: config.total_game_time,
          question_interval: config.question_interval,
          shuffle_mode: config.shuffle_mode,
          theme_name: selectedTheme
            ? selectedTheme.split("/").pop()?.replace(".mp3", "")
            : null,
          theme_file: selectedTheme,
        }),
      });

      if (!res.ok) throw new Error();
      Swal.fire("Saved!", "Game Mode 4 settings have been updated.", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to save settings.", "error");
    }
  };


  // ✅ Fetch All Questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const [res1, res2, res4] = await Promise.allSettled([
        fetch("/api/gamemode1/list-all"),
        fetch("/api/gamemode2/list"),
        fetch("/api/gamemode4/list"),
      ]);

      const data1 = res1.status === "fulfilled" && res1.value.ok ? await res1.value.json() : [];
      const data2 = res2.status === "fulfilled" && res2.value.ok ? await res2.value.json() : [];
      const data4 = res4.status === "fulfilled" && res4.value.ok ? await res4.value.json() : [];

      const combined = [
        ...data1.map((q: any) => ({ ...q, mode: "GameMode 1" })),
        ...data2.map((q: any) => ({ ...q, mode: "GameMode 2" })),
        ...data4.map((q: any) => ({ ...q, mode: "GameMode 4" })),
      ];

      combined.sort((a, b) => a.id - b.id);
      setQuestions(combined);
    } catch (err) {
      Swal.fire("Error", "Failed to load questions.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Saved Theme
  const fetchTheme = async () => {
    try {
      const res = await fetch("/api/gamemode4/music/get");
      if (!res.ok) return;
      const data = await res.json();
      setSelectedTheme(data.theme_file);
    } catch {
      console.warn("No saved theme yet");
    }
  };

  // ✅ Upload to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/cloudinary/uploadg4", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url ?? null;
    } catch {
      Swal.fire("Error", "Upload failed.", "error");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedQuestion) return;
    const uploadedUrl = await uploadToCloudinary(file);
    if (!uploadedUrl) return;
    setSelectedQuestion((prev) => (prev ? { ...prev, question_image: uploadedUrl } : prev));
  };

const openModal = (q?: Question) => {
  // ✅ Case 1: Adding a new question (no q passed)
  if (!q) {
    setSelectedQuestion({
      id: 0,
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      answer: "A",
      level_id: null,
      question_image: null,
      mode: "GameMode 4",
    });
    setEditMode(false);
    setShowModal(true);
    return;
  }

  // ✅ Case 2: Editing existing question — only if GameMode 4
  if (q.mode !== "GameMode 4") {
    Swal.fire({
      title: "Access Denied",
      text: `This question belongs to ${q.mode}. Only GameMode 4 questions can be edited here.`,
      icon: "info",
      confirmButtonText: "OK",
    });
    return; // ❌ Stop here — don't open modal
  }

  // ✅ Allow edit for GameMode 4 questions
  setSelectedQuestion(q);
  setEditMode(true);
  setShowModal(true);
};



  const closeModal = () => {
    setShowModal(false);
    setSelectedQuestion(null);
  };

  const handleSaveQuestion = async () => {
  if (!selectedQuestion) return;

  // ✅ Only allow saving/updating for GameMode4
  if (editMode && selectedQuestion.mode !== "GameMode 4") {
    Swal.fire("Not Editable", `You can only update GameMode 4 questions.`, "info");
    return;
  }

  const url = editMode ? "/api/gamemode4/update" : "/api/gamemode4/add";
  const method = editMode ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedQuestion),
    });
    if (!res.ok) throw new Error();

    await fetchQuestions();
    Swal.fire("Success", "Question saved successfully!", "success");
    closeModal();
  } catch (err) {
    Swal.fire("Error", "Failed to save question.", "error");
  }
};

const handleDelete = async (id: number) => {
  const target = questions.find(
  (q) => q.id === id && q.mode === "GameMode 4"
);

  if (!target) {
    console.warn("❌ No question found for id:", id);
    return;
  }

  console.log("🧩 Delete attempt:", {
    id: target.id,
    mode: target.mode,
    normalized: (target.mode || "").trim().toLowerCase(),
  });

  const mode = (target.mode || "").trim().toLowerCase();

  if (!mode.includes("4")) {
    Swal.fire({
      title: "Cannot Delete",
      text: `This question belongs to ${target.mode || "another mode"} and cannot be deleted here.`,
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
    confirmButtonColor: "#548E28",
  });

  if (!confirm.isConfirmed) return;

  try {
    console.log("✅ Proceeding to delete:", id);
    const res = await fetch(`/api/gamemode4/delete?id=${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());

    await fetchQuestions();
    Swal.fire("Deleted!", "GameMode 4 question removed successfully.", "success");
  } catch (err) {
    console.error("❌ Delete failed:", err);
    Swal.fire("Error", "Failed to delete question.", "error");
  }
};


  // ✅ Handle Music Preview
  const handlePreview = (file: string) => {
    try {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current = null;
      }
      if (currentlyPlaying === file) {
        setCurrentlyPlaying(null);
        return;
      }
      const audio = new Audio(file);
      audio.volume = 0.5;
      audio.play();
      previewAudioRef.current = audio;
      setCurrentlyPlaying(file);
    } catch {
      console.error("Preview failed");
    }
  };

  const handleSaveTheme = async () => {
    if (!selectedTheme) return Swal.fire("Select a theme first", "", "info");
    try {
     await fetch("/api/gamemode4/music/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            admin_id: user.admin_id,
            gamemode: "gamemode4",
            theme_name: selectedTheme.split("/").pop()?.replace(".mp3", ""), 
            theme_file: selectedTheme,
          }),
        });

      Swal.fire("Saved!", "Music theme saved for Game Mode 4!", "success");
      setShowMusicModal(false);
    } catch {
      Swal.fire("Error", "Failed to save theme.", "error");
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

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
          src={user?.avatar || "/resources/icons/admin.png"}
          alt="Admin Avatar"
          width={45}
          height={45}
          className="rounded-full border-2 border-white"
        />
        <span className="font-semibold text-lg">{user?.first_name}</span>
      </div>
    </header>

    {/* Title */}
    <h1 className="text-2xl font-bold text-[#548E28] mt-6 mb-4 text-center">
      ⚡ Game Mode 4: Phase Rush
    </h1>

    {/* ⚙️ Config Section */}
    <div className="w-full max-w-3xl bg-[#f8fbf5] text-black border border-[#cbe3bb] rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold text-[#548E28] mb-4">
        ⚙️ Game Configuration
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span>Total Game Time (seconds)</span>
          <input
            type="number"
            min={10}
            value={config.total_game_time}
            onChange={(e) =>
              setConfig({ ...config, total_game_time: +e.target.value })
            }
            className="border rounded-md px-3 py-3 sm:py-2 focus:ring-2 focus:ring-[#548E28]/30 transition-all"
          />
        </label>

        <label className="flex flex-col">
          <span>Question Interval (seconds)</span>
          <input
            type="number"
            min={3}
            value={config.question_interval}
            onChange={(e) =>
              setConfig({ ...config, question_interval: +e.target.value })
            }
            className="border rounded-md px-3 py-3 sm:py-2 focus:ring-2 focus:ring-[#548E28]/30 transition-all"
          />
        </label>
      </div>

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
          <span>Select Music Theme</span>
        </button>
      </div>
    </div>

    {/* 📜 Questions List */}
    <div className="w-full max-w-3xl text-black">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#548E28]">
          📜 Questions ({questions.length})
        </h2>
        <div className="flex justify-end pr-4 sm:pr-6">
          <button
            onClick={() => openModal()}
            className="bg-[#548E28] text-white px-4 py-2 rounded-md hover:bg-[#3e6a20] flex items-center justify-center"
          >
            <Plus className="inline w-4 h-4 mr-1" /> Add
          </button>
        </div>
      </div>

      <div className="border border-[#cbe3bb] rounded-lg shadow-inner bg-[#f8fbf5] max-h-[400px] overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-[#a7cc8c] scrollbar-track-transparent">
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

    {/* 🎵 Music Modal */}
    {showMusicModal && (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center text-black">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative flex flex-col">
          <button
            onClick={() => setShowMusicModal(false)}
            className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold mb-4 text-[#548E28] text-center">
            🎵 Choose Music Theme
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
     {/* 🧩 Add/Edit Modal */}
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

      {/* 🖼️ Question Image + Text */}
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

      {/* 🅰️🅱️🅲️🅳️ Options */}
      {(["A", "B", "C", "D"] as const).map((key) => {
        const optionKey = `option_${key.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d";
        const imageKey = `${optionKey}_image` as keyof typeof selectedQuestion;

        return (
          <div key={key} className="flex gap-3 items-center mb-3">
            {/* Option Image */}
            {selectedQuestion[imageKey] ? (
              <div className="relative">
                <img
                  src={selectedQuestion[imageKey] as string}
                  alt={`Option ${key}`}
                  className="w-16 h-16 object-contain rounded-lg border bg-gray-100 p-1"
                />
                <button
                  onClick={() =>
                    setSelectedQuestion({
                      ...selectedQuestion,
                      [imageKey]: null,
                    })
                  }
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-14 h-14 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-100">
                <Upload className="w-5 h-5 text-gray-500" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadToCloudinary(file);
                    if (url)
                      setSelectedQuestion({
                        ...selectedQuestion,
                        [imageKey]: url,
                      });
                  }}
                />
              </label>
            )}

            {/* Option Text */}
            <input
              type="text"
              placeholder={`Option ${key}`}
              value={selectedQuestion[optionKey] || ""}
              onChange={(e) =>
                setSelectedQuestion({
                  ...selectedQuestion,
                  [optionKey]: e.target.value,
                })
              }
              className="flex-1 border border-gray-400 rounded-md px-3 py-2"
            />
          </div>
        );
      })}

      {/* ✅ Answer Selector */}
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

      {/* Buttons */}
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
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
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
