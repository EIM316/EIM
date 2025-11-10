"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Settings,
  ArrowLeft,
  LogOut,
  Loader2,
  X,
  Upload,
  Trash2,
  Music,
  Check, 
} from "lucide-react";
import Swal from "sweetalert2";


type OptionKey = "A" | "B" | "C" | "D";

interface Level {
  id: number;
  level_number: number;
  admin_id: string;
  created_at: string;
  updated_at: string;
}

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
  level_id: number;
}

export default function GameMode1Page() {
  const router = useRouter();
  const [levels, setLevels] = useState<Level[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
const previewTimeoutRef = useRef<number | null>(null);



  const [question, setQuestion] = useState("");
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<OptionKey, string>>({
    A: "",
    B: "",
    C: "",
    D: "",
  });
  const [optionImages, setOptionImages] = useState<
    Record<OptionKey, string | null>
  >({
    A: null,
    B: null,
    C: null,
    D: null,
  });
  const [answer, setAnswer] = useState<OptionKey>("A");
  const [uploading, setUploading] = useState(false);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    null
  );

  // ✅ Load admin user
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");
    if (!savedUser || savedType !== "admin") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Fetch Levels
  useEffect(() => {
    fetchLevels();
  }, []);

  // ✅ Fetch the currently saved music theme
useEffect(() => {
  const fetchSavedTheme = async () => {
    try {
      const res = await fetch("/api/gamemode1/music/get");
      if (!res.ok) return; // no theme yet
      const data = await res.json();
      setSelectedTheme(data.theme_file);
    } catch (err) {
      console.error("Failed to fetch saved theme:", err);
    }
  };
  fetchSavedTheme();
}, []);

useEffect(() => {
  return () => {
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
  };
}, []);


  const fetchLevels = async () => {
    try {
      setLoadingLevels(true);
      const res = await fetch("/api/gamemode1/level/list");
      if (!res.ok) throw new Error("Failed to load levels");
      const data = await res.json();
      setLevels(data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to fetch levels", "error");
    } finally {
      setLoadingLevels(false);
    }
  };

  // ✅ Add Level
  const addLevel = async () => {
    if (!user?.admin_id) {
      Swal.fire("Error", "Admin ID missing. Please re-login.", "error");
      return;
    }

    try {
      const newLevelNumber = levels.length + 1;
      const res = await fetch("/api/gamemode1/level/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level_number: newLevelNumber,
          admin_id: user.admin_id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        Swal.fire("Error", err.error || "Failed to create level", "error");
        return;
      }

      const newLevel = await res.json();
      setLevels((prev) => [...prev, newLevel]);
      Swal.fire(
        "Success",
        `Level ${newLevelNumber} added successfully!`,
        "success"
      );
    } catch (error) {
      console.error("Add level error:", error);
      Swal.fire("Error", "Could not add new level", "error");
    }
  };

  // ✅ Open Question List Modal
  const openQuestionListModal = async (levelId: number) => {
    setCurrentLevel(levelId);
    setShowListModal(true);
    setLoadingQuestions(true);

    try {
      const res = await fetch(`/api/gamemode1/list?level_id=${levelId}`);
      const data = await res.json();
      setQuestions(data.length ? data : []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load questions", "error");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleCloseListModal = () => {
    setShowListModal(false);
    setQuestions([]);
    setCurrentLevel(null);
  };

  // ✅ Open Add Question Modal
const handleOpenAddModal = () => {
  setShowAddModal(true);
  setEditMode(false);
  setSelectedQuestionId(null);
  setQuestion("");
  setQuestionImage(null);

  // ✅ Default option text values
  setOptions({
    A: "Option 1",
    B: "Option 2",
    C: "Option 3",
    D: "Option 4",
  });

  // ✅ Reset option images
  setOptionImages({
    A: null,
    B: null,
    C: null,
    D: null,
  });

  setAnswer("A");
};


  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditMode(false);
    setSelectedQuestionId(null);
  };

  // ✅ Edit Question
  const handleEditQuestion = (q: Question) => {
    setSelectedQuestionId(q.id);
    setQuestion(q.question);
    setQuestionImage(q.question_image || null);
    setOptions({
      A: q.option_a,
      B: q.option_b,
      C: q.option_c,
      D: q.option_d,
    });
    setOptionImages({
      A: q.option_a_image || null,
      B: q.option_b_image || null,
      C: q.option_c_image || null,
      D: q.option_d_image || null,
    });
    setAnswer(q.answer);
    setEditMode(true);
    setShowAddModal(true);
  };

  // ✅ Upload to Cloudinary (backend)
  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cloudinary/uploadg1", {
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

  // ✅ Handle image upload
  const handleImageSelect = async (
    e: ChangeEvent<HTMLInputElement>,
    key?: OptionKey
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await uploadToCloudinary(file);
    if (!uploadedUrl) return;

    if (key) setOptionImages((prev) => ({ ...prev, [key]: uploadedUrl }));
    else setQuestionImage(uploadedUrl);
  };

  // ✅ Save Question to DB
  const handleSaveQuestion = async () => {
    if (!question || !options.A || !options.B || !options.C || !options.D) {
      Swal.fire("Warning", "Please fill in all fields.", "warning");
      return;
    }

    try {
      const res = await fetch("/api/gamemode1/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          option_a: options.A,
          option_b: options.B,
          option_c: options.C,
          option_d: options.D,
          answer,
          level_id: currentLevel,
          question_image: questionImage,
          option_a_image: optionImages.A,
          option_b_image: optionImages.B,
          option_c_image: optionImages.C,
          option_d_image: optionImages.D,
        }),
      });

      if (!res.ok) throw new Error("Failed to save question");
      const newQ = await res.json();

      setQuestions((prev) => [...prev, newQ]);
      Swal.fire("Success", "Question saved successfully!", "success");
      handleCloseAddModal();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to save question.", "error");
    }
  };

  // ✅ Update Question
  const handleUpdateQuestion = async () => {
    if (!selectedQuestionId) return;
    try {
      const res = await fetch("/api/gamemode1/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedQuestionId,
          question,
          option_a: options.A,
          option_b: options.B,
          option_c: options.C,
          option_d: options.D,
          answer,
          question_image: questionImage,
          option_a_image: optionImages.A,
          option_b_image: optionImages.B,
          option_c_image: optionImages.C,
          option_d_image: optionImages.D,
        }),
      });

      if (!res.ok) throw new Error("Failed to update question");
      const updatedQ = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === updatedQ.id ? updatedQ : q))
      );
      Swal.fire("Success", "Question updated successfully!", "success");
      handleCloseAddModal();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to update question.", "error");
    }
  };

  // ✅ Delete Question
  const handleDeleteQuestion = async () => {
    if (!selectedQuestionId) return;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This question will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/gamemode1/delete?id=${selectedQuestionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete question");

      setQuestions((prev) =>
        prev.filter((q) => q.id !== selectedQuestionId)
      );
      Swal.fire("Deleted!", "Question has been removed.", "success");
      handleCloseAddModal();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to delete question.", "error");
    }
  };

// ✅ Music Theme List
const themes = [
  { name: "Theme 1", file: "/resources/music/theme1.mp3" },
  { name: "Theme 2", file: "/resources/music/theme2.mp3" },
  { name: "Theme 3", file: "/resources/music/theme3.mp3" },
];

// ✅ Play Preview (only one plays at a time)
const handlePreview = (file: string) => {
  try {
    // If there's an active preview, stop it and clear timeout
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    // Toggle: if clicking the currently playing file -> stop and return
    if (currentlyPlaying === file) {
      setCurrentlyPlaying(null);
      return;
    }

    // Create single new audio instance and play
    const audio = new Audio(file);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // autoplay may be blocked, but we still set refs so user can press preview again
    });

    previewAudioRef.current = audio;
    setCurrentlyPlaying(file);

    // auto-stop after 15 seconds
    previewTimeoutRef.current = window.setTimeout(() => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current = null;
      }
      previewTimeoutRef.current = null;
      setCurrentlyPlaying(null);
    }, 15000);

    // When audio ends naturally, clear state & timeout
    audio.onended = () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      if (previewAudioRef.current) {
        previewAudioRef.current = null;
      }
      setCurrentlyPlaying(null);
    };
  } catch (err) {
    console.error("Audio preview error:", err);
  }
};


const handleSaveTheme = async () => {
  if (!selectedTheme) {
    Swal.fire("Please select a theme before saving.", "", "info");
    return;
  }

  // STOP any preview audio (ref-controlled) and clear timeout
  try {
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

    // Also stop any remaining <audio> elements just in case
    const audios = Array.from(document.getElementsByTagName("audio"));
    audios.forEach((a) => {
      try {
        a.pause();
        a.currentTime = 0;
      } catch {}
    });
  } catch (e) {
    console.warn("Error while stopping audio before save:", e);
  }

  // Save to DB via your API
  try {
    const res = await fetch("/api/gamemode1/music/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_id: user.admin_id,
        gamemode: "gamemode1",
        theme_name: selectedTheme.split("/").pop()?.replace(".mp3", ""),
        theme_file: selectedTheme,
      }),
    });

    if (!res.ok) throw new Error("Failed to save theme");
    const saved = await res.json();

    Swal.fire("Success!", `${saved.theme_name} has been saved as your theme!`, "success");
    setShowMusicModal(false);
  } catch (err) {
    console.error("Save theme error:", err);
    Swal.fire("Error", "Failed to save music theme.", "error");
  }
};





  // ✅ UI
  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading admin data...
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Navbar */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-5 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/gamemode")}
            className="flex items-center gap-1 hover:opacity-80 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
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

      <h1 className="text-2xl font-bold text-gray-800 mt-6 text-center">
        🎮 Game Mode 1: Refresher
      </h1>

      {/* Levels */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-4xl mt-4 px-4 pb-32">
        {loadingLevels ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="animate-spin text-[#548E28] w-10 h-10" />
          </div>
        ) : levels.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 italic py-6">
            No levels yet. Click + to add one.
          </div>
        ) : (
          levels.map((level) => (
            <div
              key={level.id}
              className="bg-[#81C784] text-white rounded-2xl shadow-md p-4 cursor-pointer hover:scale-105 transition transform flex flex-col justify-between"
              style={{ aspectRatio: "1 / 1" }}
            >
              <div className="flex w-full justify-between items-start">
                <h2 className="text-2xl font-bold">
                  Level {level.level_number}
                </h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openQuestionListModal(level.id);
                  }}
                  className="bg-white text-[#81C784] p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm mt-2 text-center">
                Created by {level.admin_id} <br />
                <span className="text-xs opacity-80">
                  {new Date(level.created_at).toLocaleDateString()}
                </span>
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Level Button */}
      <button
        onClick={addLevel}
        className="fixed bottom-8 right-8 bg-[#548E28] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition"
        title="Add Level"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 🎵 Music Selector Button */}
<button
  onClick={() => setShowMusicModal(true)}
  className="fixed bottom-8 right-28 bg-[#548E28] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition"
  title="Select Music Theme"
>
  <Music className="w-6 h-6" />
</button>


      {/* ✅ Question List Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center text-black">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg h-[600px] p-6 relative flex flex-col">

            <button
              onClick={handleCloseListModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-[#548E28]">
              Questions (Level {currentLevel})
            </h2>

            {loadingQuestions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-[#548E28] w-8 h-8" />
              </div>
            ) : questions.length === 0 ? (
              <p className="text-gray-500 text-center py-6 italic">
                No questions yet.
              </p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {questions.map((q, i) => (
                  <li
                    key={q.id}
                    onClick={() => handleEditQuestion(q)}
                    className="border rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-[#e8f5e9] transition"
                  >
                    <span className="font-medium text-[#548E28]">
                      QUESTION {i + 1}
                    </span>
                    <span className="text-gray-400">→</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Floating Add Button */}
            <button
              onClick={handleOpenAddModal}
              className="absolute bottom-6 right-6 bg-[#548E28] text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ✅ Add / Edit Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center text-black">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
            <button
              onClick={handleCloseAddModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-[#548E28]">
              {editMode ? "Edit Question" : "Add Question"}
            </h2>

            {/* Question + Image */}
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
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 border border-gray-400 rounded-md px-3 py-2"
              />
            </div>

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
                className="flex-1 bg-[#548E28] text-white py-2 rounded-md hover:bg-[#3d6a1f]"
              >
                {editMode ? "Update Question" : "Save Question"}
              </button>

              {editMode && (
                <button
                  onClick={handleDeleteQuestion}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}

{/* 🎵 Music Theme Modal */}
{showMusicModal && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center text-black">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative flex flex-col">
      <button
       onClick={() => {
  // stop preview and clear timeout
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
                  : "bg-[#548E28] hover:bg-[#3d6a1f]"
              }`}
            >
              {currentlyPlaying === theme.file ? "Stop" : "Preview"}
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSaveTheme}
        className="w-full bg-[#548E28] text-white py-2 rounded-md hover:bg-[#3d6a1f] transition"
      >
        Save Theme
      </button>
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
