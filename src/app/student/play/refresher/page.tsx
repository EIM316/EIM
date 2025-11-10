"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Star, Lock, Loader2, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

interface Level {
  id: number;
  level_number: number;
  admin_id: string;
  created_at: string;
  updated_at: string;
}

interface Progress {
  level_id: number;
  stars: number;
  completed_at?: string;
}

export default function RefresherModePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load student data and progress
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    fetchLevels();
    fetchProgress(parsedUser.id_number);
  }, [router]);

  // ✅ Fetch levels
  const fetchLevels = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gamemode1/level/list");
      if (!res.ok) throw new Error("Failed to load levels");
      const data = await res.json();
      setLevels(data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to fetch levels.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch student progress
  const fetchProgress = async (student_id: string) => {
    try {
      const res = await fetch(`/api/gamemode1/progress?student_id=${student_id}`);
      if (!res.ok) throw new Error("Failed to load progress");
      const data = await res.json();

      setProgress(Array.isArray(data) ? data : data.progress || []);
    } catch (error) {
      console.error("Error fetching progress:", error);
      setProgress([]);
    }
  };

  // ✅ Determine if level is unlocked (previous level must have 3 stars)
  const isUnlocked = (levelNumber: number) => {
    if (levelNumber === 1) return true; // First level always unlocked

    const prevLevel = progress.find((p) => p.level_id === levelNumber - 1);
    return !!(prevLevel && prevLevel.stars === 3);
  };

  // ✅ Handle clicking on a level
  const handleLevelClick = (level: Level) => {
    if (!isUnlocked(level.level_number)) {
      Swal.fire(
        "Locked!",
        "You need to earn 3 stars in the previous level to unlock this one.",
        "info"
      );
      return;
    }
    router.push(`/student/play/refresher/level?id=${level.id}`);
  };

  // ✅ Render star icons for each level
  const renderStars = (levelNumber: number) => {
    const stars = progress.find((p) => p.level_id === levelNumber)?.stars || 0;
    return (
      <div className="flex justify-center gap-1 mt-2">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            className={`w-5 h-5 transition ${
              i <= stars ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
            }`}
          />
        ))}
      </div>
    );
  };

  // ✅ Logout confirmation
  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7b2020",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, logout",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.clear();
        router.push("/");
      }
    });
  };

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading student data...
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white relative">
      {/* ✅ Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md mb-10">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push("/student/play")}
        >
          <ArrowLeft className="w-6 h-6 hover:text-gray-300" />
          <Image
            src={user.avatar || "/student-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">
            {user.first_name?.toUpperCase()}
          </span>
        </div>

        <LogOut
          onClick={handleLogout}
          className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
        />
      </header>

      {/* ✅ Levels Grid */}
      <main className="flex flex-col items-center w-full px-4">
        <h2 className="text-2xl font-bold text-[#7b2020] mb-6">
          🎯 Refresher Levels
        </h2>

        {loading ? (
          <Loader2 className="animate-spin text-[#7b2020] w-10 h-10" />
        ) : levels.length === 0 ? (
          <p className="text-gray-600 italic mt-10">No levels available yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full max-w-3xl pb-16">
            {levels.map((level) => {
              const unlocked = isUnlocked(level.level_number);
              const stars =
                progress.find((p) => p.level_id === level.level_number)?.stars || 0;

              return (
                <div
                  key={level.id}
                  onClick={() => handleLevelClick(level)}
                  className={`relative border-2 rounded-xl p-4 text-center transition-all transform ${
                    unlocked
                      ? "cursor-pointer border-[#7b2020] hover:scale-105 hover:shadow-lg hover:bg-[#fcebea]"
                      : "cursor-not-allowed border-gray-300 bg-gray-200 opacity-80"
                  }`}
                >
                  <div className="flex justify-center mb-3">
                    {unlocked ? (
                      <Image
                        src="/resources/admin/game1.png"
                        alt="Unlocked"
                        width={60}
                        height={60}
                        className="transition-transform duration-300 hover:scale-110"
                      />
                    ) : (
                      <Lock className="w-12 h-12 text-gray-500" />
                    )}
                  </div>

                  <h3
                    className={`font-bold text-lg ${
                      unlocked ? "text-[#7b2020]" : "text-gray-500"
                    }`}
                  >
                    Level {level.level_number}
                  </h3>

                  {/* ⭐ Stars */}
                  {renderStars(level.level_number)}

                  {/* ✅ "Done" Label */}
                  {stars > 0 && (
                    <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Done
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
