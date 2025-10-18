"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Search, X } from "lucide-react";
import Swal from "sweetalert2";

type Rect = { id: number; x: number; y: number; w: number; h: number; color: string };
type OptionItem = { id: number; name: string; image: string };

export default function SchematicBuilderGame() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rects, setRects] = useState<Rect[]>([]);
  const [answers, setAnswers] = useState<OptionItem[]>([]);
  const [shuffledAnswers, setShuffledAnswers] = useState<OptionItem[]>([]);
  const [placed, setPlaced] = useState<(OptionItem | null)[]>([]);
  const [dragging, setDragging] = useState<OptionItem | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState<OptionItem | null>(null);
  const [diagram, setDiagram] = useState<string | null>(null);
  const [setName, setSetName] = useState<string>("");

  // All sets
  const [sets, setSets] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);

  // 🎵 Music
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const imageRef = useRef<HTMLDivElement | null>(null);

  /* ---------- Load Auth ---------- */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");
    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  /* ---------- Utility: Fisher–Yates shuffle ---------- */
  function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- Fetch All Sets ---------- */
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const res = await fetch(`/api/gamemode3/set/list?admin_id=ADMIN-0001`);
        const setsData = await res.json();
        if (!Array.isArray(setsData) || setsData.length === 0) {
          Swal.fire("No sets found", "Ask admin to create schematic sets.", "info");
          return;
        }

        // 🔀 Shuffle all sets
        const shuffledSets = shuffle(setsData);
        setSets(shuffledSets);
        loadSet(shuffledSets[0]);
      } catch (err) {
        console.error("Error fetching sets:", err);
      }
    })();
  }, [user]);

  /* ---------- Load One Set ---------- */
  const loadSet = async (setData: any) => {
    try {
      setSetName(setData.set_name);
      const detailRes = await fetch(`/api/gamemode3/set/get?id=${setData.id}`);
      const data = await detailRes.json();

      setDiagram(data.image_url);

      const parsedRects = Array.isArray(data.rect_data)
        ? data.rect_data
        : JSON.parse(data.rect_data || "[]");
      setRects(parsedRects);

      const parsedAnswers = Array.isArray(data.correct_answers)
        ? data.correct_answers
        : JSON.parse(data.correct_answers || "[]");

      setAnswers(parsedAnswers.slice(0, 20));
      setShuffledAnswers(shuffle(parsedAnswers.slice(0, 20)));
      setPlaced(new Array(parsedRects.length || 20).fill(null));
    } catch (err) {
      console.error("Error loading set:", err);
    }
  };

  /* ---------- Music Fetch ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gamemode3/music/get");
        if (!res.ok) return;
        const data = await res.json();
        setMusicUrl(data.file_url || data.music_url || data.theme_file || data.url || null);
      } catch (err) {
        console.error("Music error:", err);
      }
    })();
  }, []);

  /* ---------- Background Music ---------- */
  useEffect(() => {
    if (!musicUrl) return;
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    const playMusic = async () => {
      try {
        await audio.play();
        window.removeEventListener("click", playMusic);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("click", playMusic);
    return () => {
      audio.pause();
      audio.currentTime = 0;
      window.removeEventListener("click", playMusic);
    };
  }, [musicUrl]);

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  /* ---------- Handle Placement ---------- */
  const handlePlaceAnswer = (rectId: number) => {
    if (!dragging) return;

    const correctAnswer = answers[rectId - 1];
    if (!correctAnswer) return;

    if (dragging.id === correctAnswer.id) {
      setPlaced((prev) => {
        const newPlaced = [...prev];
        newPlaced[rectId - 1] = dragging;
        return newPlaced;
      });
      setDragging(null);
    } else {
      // ❌ Wrong attempt
      setWrongAttempt(dragging);
      setDragging(null);
      setTimeout(() => {
        setPlaced(new Array(answers.length).fill(null));
        setShuffledAnswers(shuffle(answers)); // 🔀 reshuffle on wrong attempt
        setWrongAttempt(null);
      }, 1000);
    }
  };

  /* ---------- Watch for completion ---------- */
  useEffect(() => {
    if (placed.length === 0) return;
    const allCorrect = rects.length > 0 && placed.every((p, i) => p && p.id === answers[i]?.id);

    if (allCorrect) {
      stopMusic();
      const newScore = score + 100;
      setScore(newScore);

      Swal.fire({
        icon: "success",
        title: "✅ Set Completed!",
        html: `<b>+100 Points</b><br/>Total: ${newScore}`,
        confirmButtonColor: "#548E28",
      }).then(() => {
        if (currentIndex + 1 < sets.length) {
          const next = currentIndex + 1;
          setCurrentIndex(next);
          loadSet(sets[next]); // 🔀 New set automatically reshuffles
        } else {
          Swal.fire({
            icon: "info",
            title: "🎉 All Sets Completed!",
            text: `You earned a total of ${newScore} points!`,
            confirmButtonColor: "#548E28",
          }).then(() => router.push("/student/play/gametest"));
        }
      });
    }
  }, [placed]);

  /* ---------- Render ---------- */
  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading student data...
      </div>
    );

  return (
    <div className="flex flex-col items-center min-h-screen bg-white relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative mb-4">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => {
            stopMusic();
            router.push("/student/play/gametest");
          }}
        >
          <Image
            src={user.avatar || "/student-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">{user.first_name?.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-4">
          <Search
            onClick={() => setShowSearch(true)}
            className="w-6 h-6 cursor-pointer hover:text-gray-300 text-white"
          />
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={() => {
              stopMusic();
              localStorage.clear();
              router.push("/");
            }}
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
          />
        </div>

        {showSearch && (
          <div className="absolute inset-0 bg-[#7b2020] flex items-center justify-center px-4 z-10">
            <input
              type="text"
              placeholder="Search for key terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-3/4 px-3 py-2 rounded-md text-white border"
              autoFocus
            />
            <X
              onClick={() => {
                setSearchTerm("");
                setShowSearch(false);
              }}
              className="ml-3 w-6 h-6 cursor-pointer text-white"
            />
          </div>
        )}
      </header>

      {/* Main */}
      <main className="w-full max-w-lg flex flex-col items-center">
        <h2 className="text-xl font-bold text-[#7b2020] mb-1">{setName || "Loading..."}</h2>
        <p className="text-gray-600 mb-3">Score: {score}</p>

        <div
          ref={imageRef}
          className="relative border-2 border-gray-300 rounded-lg overflow-hidden w-full aspect-square flex items-center justify-center bg-gray-50"
        >
          {diagram ? (
            <Image src={diagram} alt="Diagram" fill className="object-contain" />
          ) : (
            <p className="text-gray-500 text-sm">Loading diagram...</p>
          )}

          {rects.map((r, i) => (
            <div
              key={`rect-${r.id}-${i}`}
              onClick={() => handlePlaceAnswer(r.id)}
              className={`absolute flex items-center justify-center rounded-lg transition-all duration-300 ${
                wrongAttempt
                  ? "shake border-4 border-red-500"
                  : placed[r.id - 1]
                  ? "border-2 border-green-600"
                  : ""
              }`}
              style={{
                top: `${r.y}px`,
                left: `${r.x}px`,
                width: `${r.w}px`,
                height: `${r.h}px`,
                background: placed[r.id - 1] ? "#e5ffe5" : r.color,
              }}
            >
              {placed[r.id - 1] ? (
                <Image
                  src={placed[r.id - 1]?.image || "/placeholder.png"}
                  alt={placed[r.id - 1]?.name || "placed option"}
                  width={r.w - 10}
                  height={r.h - 10}
                  className="object-contain rounded-md"
                />
              ) : (
                <span className="text-white font-bold">{r.id}</span>
              )}
            </div>
          ))}
        </div>

        {/* Shuffled Options */}
        <div className="flex justify-center gap-3 mt-5 flex-wrap">
          {shuffledAnswers.map((a, i) => (
            <div
              key={`answer-${a.id}-${i}`}
              onClick={() => setDragging(a)}
              className={`w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center cursor-pointer border-2 transition-all ${
                dragging?.id === a.id ? "ring-4 ring-[#548E28] scale-110" : "hover:scale-105"
              }`}
            >
              <Image
                src={a.image || "/placeholder.png"}
                alt={a.name}
                width={60}
                height={60}
                className={`object-contain rounded-md ${
                  wrongAttempt?.id === a.id ? "border-4 border-red-500 shake" : ""
                }`}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Animations */}
      <style jsx>{`
        @keyframes shake {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-8px);
          }
          50% {
            transform: translateX(8px);
          }
          75% {
            transform: translateX(-8px);
          }
          100% {
            transform: translateX(0);
          }
        }
        .shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
