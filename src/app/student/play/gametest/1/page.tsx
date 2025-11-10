"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

type Rect = { id: number; x: number; y: number; w: number; h: number; color: string };
type OptionItem = { id: number; name: string; image: string };

export default function SchematicBuilderGame() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [answers, setAnswers] = useState<OptionItem[]>([]);
  const [shuffledAnswers, setShuffledAnswers] = useState<OptionItem[]>([]);
  const [placed, setPlaced] = useState<(OptionItem | null)[]>([]);
  const [dragging, setDragging] = useState<OptionItem | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState<OptionItem | null>(null);
  const [diagram, setDiagram] = useState<string | null>(null);
  const [setName, setSetName] = useState<string>("");

  const [sets, setSets] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [diagramLoaded, setDiagramLoaded] = useState(false);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  /* ---------- Show Instructions (One-Time) ---------- */
  useEffect(() => {
    if (!user) return;

    Swal.fire({
      title: "📘 How to Play - Schematic Builder",
      html: `
        <div style="text-align:left;">
          <p><b>Objective:</b> Match the correct electrical component images with their labeled positions in the schematic diagram.</p>
          <ul style="margin-top:8px;line-height:1.6;">
            <li>1️⃣ Click an image option below to select it.</li>
            <li>2️⃣ Then click on the correct box (numbered area) in the diagram.</li>
            <li>3️⃣ If correct, the component will be placed.</li>
            <li>4️⃣ If wrong, the board will reset — try again!</li>
            <li>5️⃣ Complete all correctly to finish the set and earn points!</li>
          </ul>
          <p style="margin-top:10px;color:#555;font-size:0.9em;">
            Tip: Listen to the background music to stay focused 🎵
          </p>
        </div>
      `,
      confirmButtonText: "Start Game",
      confirmButtonColor: "#7b2020",
      allowOutsideClick: false,
    });
  }, [user]);

  /* ---------- Shuffle ---------- */
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- Fetch Sets ---------- */
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
        const shuffledSets = shuffle(setsData);
        setSets(shuffledSets);
        loadSet(shuffledSets[0]);
      } catch (err) {
        console.error("Error fetching sets:", err);
      }
    })();
  }, [user]);

  /* ---------- Load Set ---------- */
  const loadSet = async (setData: any) => {
    try {
      setSetName(setData.set_name);
      const detailRes = await fetch(`/api/gamemode3/set/get?id=${setData.id}`);
      const data = await detailRes.json();

      setDiagramLoaded(false);
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

  /* ---------- Background Music ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gamemode3/music/get");
        if (!res.ok) return;
        const data = await res.json();
        setMusicUrl(data.file_url || data.music_url || data.theme_file || data.url || null);
      } catch (err) {
        console.error("Music fetch error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!musicUrl || !diagramLoaded) return;
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [musicUrl, diagramLoaded]);

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  /* ---------- Placement ---------- */
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
      setWrongAttempt(dragging);
      setDragging(null);
      setTimeout(() => {
        setPlaced(new Array(answers.length).fill(null));
        setShuffledAnswers(shuffle(answers));
        setWrongAttempt(null);
      }, 1000);
    }
  };

  /* ---------- Completion Check ---------- */
  useEffect(() => {
    if (placed.length === 0 || !user) return;
    const allCorrect = rects.length > 0 && placed.every((p, i) => p && p.id === answers[i]?.id);

    if (allCorrect) {
      stopMusic();
      (async () => {
        try {
          const currentSet = sets[currentIndex];
          const res = await fetch("/api/gamemode3/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: user.id_number,
              set_id: currentSet.id,
              admin_id: "ADMIN-0001",
            }),
          });

          const result = await res.json();

          if (res.ok) {
            Swal.fire({
              icon: "success",
              title: "✅ Set Completed!",
              html: `<b>${result.message}</b><br/>Total: ${
                score + (result.progress?.points_awarded || 0)
              } pts`,
              confirmButtonColor: "#548E28",
            }).then(() => {
              if (currentIndex + 1 < sets.length) {
                const next = currentIndex + 1;
                setCurrentIndex(next);
                setScore((s) => s + (result.progress?.points_awarded || 0));
                loadSet(sets[next]);
              } else {
                Swal.fire({
                  icon: "info",
                  title: "🎉 All Sets Completed!",
                  text: `You earned a total of ${
                    score + (result.progress?.points_awarded || 0)
                  } points!`,
                  confirmButtonColor: "#548E28",
                }).then(() => router.push("/student/play/gametest"));
              }
            });
          } else {
            throw new Error(result.error || "Failed to save progress");
          }
        } catch (err) {
          console.error("Error saving schematic progress:", err);
          Swal.fire("Error", "Failed to save schematic progress.", "error");
        }
      })();
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
      {/* Navbar */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative">
        <button
          onClick={() => {
            stopMusic();
            router.push("/student/play");
          }}
          className="flex items-center gap-2 hover:text-gray-300"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-sm">
          SCHEMATIC BUILDER
        </h1>
      </header>

      {/* Diagram */}
      <main className="w-95 max-w-lg flex flex-col items-center">
        <h2 className="text-xl font-bold text-[#7b2020] mb-1">{setName || "Loading..."}</h2>
        <p className="text-gray-600 mb-3">Score: {score}</p>

        <div className="relative border border-gray-300 rounded-lg w-full h-[260px] sm:h-[300px] flex items-center justify-center overflow-hidden bg-gray-50">
          {diagram ? (
            <>
              <img
                src={diagram}
                alt="Diagram"
                className="object-contain w-full h-full pointer-events-none select-none"
                draggable={false}
                onLoad={() => setDiagramLoaded(true)}
              />
              {rects.map((r, i) => (
                <div
                  key={`rect-${r.id}-${i}`}
                  onClick={() => handlePlaceAnswer(r.id)}
                  className={`absolute flex items-center justify-center rounded-md transition-all duration-300 ${
                    wrongAttempt
                      ? "shake border-4 border-red-500"
                      : placed[r.id - 1]
                      ? "border-2 border-green-600"
                      : ""
                  }`}
                  style={{
                    top: `${r.y}px`,
                    left: `${r.x}px`,
                    width: `${r.w - 20}px`,
                    height: `${r.h - 20}px`,
                    background: placed[r.id - 1] ? "#e5ffe5" : r.color,
                  }}
                >
                  {placed[r.id - 1] ? (
                    <img
                      src={placed[r.id - 1]?.image || "/placeholder.png"}
                      alt={placed[r.id - 1]?.name || "placed option"}
                      className="object-contain w-full h-full rounded"
                    />
                  ) : (
                    <span className="text-white font-bold">{r.id}</span>
                  )}
                </div>
              ))}
            </>
          ) : (
            <p className="text-gray-500 text-sm">Loading diagram...</p>
          )}
        </div>

        {/* Options */}
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
          0%, 100% {
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
        }
        .shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
