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
  const [placed, setPlaced] = useState<(OptionItem | null)[]>([null, null, null, null, null]);
  const [dragging, setDragging] = useState<OptionItem | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState<OptionItem | null>(null);
  const [diagram, setDiagram] = useState<string | null>(null);
  const [setName, setSetName] = useState<string>("");

  const imageRef = useRef<HTMLDivElement | null>(null);

  /* ---------- Load Auth and Fetch Set from Admin ---------- */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");
    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }

    const parsed = JSON.parse(savedUser);
    setUser(parsed);

    (async () => {
      try {
        const res = await fetch(`/api/gamemode3/set/list?admin_id=ADMIN-0001`);
        const sets = await res.json();
        if (!Array.isArray(sets) || sets.length === 0) {
          Swal.fire("No sets found", "Ask admin to create schematic sets.", "info");
          return;
        }

        const selectedSet = sets[0];
        setSetName(selectedSet.set_name);

        const detailRes = await fetch(`/api/gamemode3/set/get?id=${selectedSet.id}`);
        const data = await detailRes.json();

        setDiagram(data.image_url);
        setRects(Array.isArray(data.rect_data) ? data.rect_data : JSON.parse(data.rect_data || "[]"));
        setAnswers(
          Array.isArray(data.correct_answers)
            ? data.correct_answers
            : JSON.parse(data.correct_answers || "[]")
        );
      } catch (err) {
        console.error("Error fetching schematic set:", err);
        Swal.fire("Error", "Failed to load schematic data", "error");
      }
    })();
  }, [router]);

  /* ---------- Handle answer placement ---------- */
  const handlePlaceAnswer = (rectId: number) => {
    if (!dragging) return;

    const correctAnswer = answers[rectId - 1];
    if (!correctAnswer) return;

    if (dragging.id === correctAnswer.id) {
      // ✅ Correct placement
      setPlaced((prev) => {
        const newPlaced = [...prev];
        newPlaced[rectId - 1] = dragging;
        return newPlaced;
      });
      setDragging(null);
      checkSuccess();
    } else {
      // ❌ Wrong attempt
      setWrongAttempt(dragging);
      setDragging(null);

      // shake for 1s and reset all
      setTimeout(() => {
        setPlaced([null, null, null, null, null]);
        setWrongAttempt(null);
      }, 1000);
    }
  };

  /* ---------- Check if all correct ---------- */
  const checkSuccess = () => {
    const allCorrect = placed.every((p, i) => p && p.id === answers[i]?.id);
    if (allCorrect) {
      Swal.fire({
        icon: "success",
        title: "✅ Set Completed!",
        text: `You’ve successfully matched all components for "${setName}"!`,
        confirmButtonColor: "#548E28",
      });
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading student data...
      </div>
    );

  return (
    <div className="flex flex-col items-center min-h-screen bg-white relative">
      {/* ✅ Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative mb-4">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push("/student/play/gametest")}
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

      {/* ✅ Game Area */}
      <main className="w-full max-w-lg flex flex-col items-center">
        <h2 className="text-xl font-bold text-[#7b2020] mb-3">{setName || "Loading..."}</h2>

        {/* Diagram Area */}
        <div
          ref={imageRef}
          className={`relative border-2 border-gray-300 rounded-lg overflow-hidden w-full aspect-square flex items-center justify-center bg-gray-50`}
        >
          {diagram ? (
            <Image src={diagram} alt="Diagram" fill className="object-contain" />
          ) : (
            <p className="text-gray-500 text-sm">Loading diagram...</p>
          )}

          {/* Drop Zones */}
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
                background: placed[r.id - 1] ? "#e5ffe5" : r.color + "99",
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

        {/* ✅ Options List */}
        <div className="flex justify-center gap-3 mt-5 flex-wrap">
          {answers.map((a, i) => (
            <div
              key={`answer-${a.id}-${i}`}
              onClick={() => !placed.some((p) => p?.id === a.id) && setDragging(a)}
              className={`w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center cursor-pointer border-2 transition-all ${
                placed.some((p) => p?.id === a.id)
                  ? "opacity-40 cursor-not-allowed"
                  : dragging?.id === a.id
                  ? "ring-4 ring-[#548E28] scale-110"
                  : "hover:scale-105"
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

      {/* ✅ Animations */}
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
