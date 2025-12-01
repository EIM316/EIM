"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Swal from "sweetalert2";

interface Question {
  id: number;
  level_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: "A" | "B" | "C" | "D";
  question_image?: string | null;
  option_a_image?: string | null;
  option_b_image?: string | null;
  option_c_image?: string | null;
  option_d_image?: string | null;
}

export default function RefresherLevelPage() {
  const router = useRouter();
  const params = useSearchParams();
  const levelId = params.get("id");

  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);


  const [volume, setVolume] = useState(0.6);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ✅ Load student info
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Fetch questions
  useEffect(() => {
    if (!levelId) return;
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/gamemode1/list?level_id=${levelId}`);
        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json();
        setQuestions(data);
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load questions", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [levelId]);

  // ✅ Fetch current music theme from admin settings
  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const res = await fetch("/api/gamemode1/music/get");
        if (!res.ok) throw new Error("Failed to fetch music");
        const data = await res.json();
        setMusicUrl(data.theme_file);
      } catch (err) {
        console.error("Music fetch error:", err);
      }
    };
    fetchMusic();
  }, []);

  useEffect(() => {
  const savedVol = localStorage.getItem("quizVolume");
  if (savedVol) {
    const v = parseFloat(savedVol);
    setVolume(v);
  }
}, []);


  useEffect(() => {
  if (!musicUrl) return;

  const audio = new Audio(musicUrl);
  audio.loop = true;
  audio.volume = volume; // ✅ apply saved volume
  audioRef.current = audio;

  audio.play().catch((err) => console.warn("Autoplay blocked:", err));

  return () => {
    audio.pause();
    audio.currentTime = 0;
  };
}, [musicUrl, volume]);

const handleVolumeChange = (value: number) => {
  setVolume(value);
  if (audioRef.current) audioRef.current.volume = value;
  localStorage.setItem("quizVolume", value.toString());
};


  const currentQ = questions[currentIndex];

  // ✅ Handle answer
  const handleAnswer = (choice: "A" | "B" | "C" | "D") => {
    if (answered) return;
    setSelectedOption(choice);
    setAnswered(true);

    if (choice === currentQ.answer) {
      setScore((prev) => prev + 1);
    }
  };

  // ✅ Next / finish
  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setQuizFinished(true);
      stopMusic();
      await saveProgress();
    }
  };

  // ✅ Stop music manually
  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

// ✅ Save stars + points
const saveProgress = async () => {
  const total = questions.length;
  const correctRate = (score / total) * 100;
  let stars = 0;
  let totalPoints = Number(levelId) * 10; // ✅ use let (not const)

  // ⭐ Calculate earned stars
  if (correctRate >= 90) stars = 3;
  else if (correctRate >= 70) stars = 2;
  else if (correctRate >= 50) stars = 1;
  else stars = 0;

  try {
    // 1️⃣ Fetch existing progress
    const existingRes = await fetch(
      `/api/gamemode1/progress?student_id=${user.id_number}&level_id=${levelId}`
    );

    let existingStars = 0;
    let existingPoints = 0;
    if (existingRes.ok) {
      const data = await existingRes.json();
      if (Array.isArray(data) && data.length > 0) {
        existingStars = data[0]?.stars ?? 0;
        existingPoints = data[0]?.points ?? 0;
      } else if (data?.stars !== undefined) {
        existingStars = data.stars;
        existingPoints = data.points ?? 0;
      }
    }

    // 2️⃣ Preserve highest stars & total points ever achieved
    if (stars < existingStars) stars = existingStars;
    if (totalPoints < existingPoints) totalPoints = existingPoints;

    // ✅ Only unlock next level if current earned 3 stars
    const unlockNextLevel = stars === 3;

    // 3️⃣ Save or update progress in DB
    const res = await fetch("/api/gamemode1/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: user.id_number,
        level_id: Number(levelId),
        stars,
        points: totalPoints, // ✅ new field
        unlockNext: unlockNextLevel,
      }),
    });

    if (!res.ok) throw new Error("Failed to save progress");

    // 4️⃣ Display score summary
    Swal.fire({
      title: unlockNextLevel ? "Level Cleared! 🎉" : "Level Complete!",
      html: `
        <div style="font-size:18px; margin-bottom:10px;">
          You got <b>${score}</b> out of <b>${total}</b> correct!
        </div>
        <div style="font-size:22px; color:#FFD700;">
          ${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}
        </div>
        <p style="margin-top:10px; color:#548E28; font-size:16px;">
          Total Points: <b>${totalPoints}</b>
        </p>
        ${
          unlockNextLevel
            ? `<p style="margin-top:10px; color:green;">Next level unlocked!</p>`
            : `<p style="margin-top:10px; color:#b30000;">Earn 3 stars to unlock the next level.</p>`
        }
      `,
      icon: "success",
      confirmButtonText: "Back to Levels",
      confirmButtonColor: "#7b2020",
    }).then(() => {
      stopMusic();
      router.push("/student/play/refresher");
    });
  } catch (err) {
    console.error("Progress save error:", err);
    Swal.fire("Error", "Failed to save progress.", "error");
    stopMusic();
    router.push("/student/play/refresher");
  }
};



  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading questions...
      </div>
    );

  if (!questions.length)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-600">
        <p>No questions available for this level.</p>
        <button
          onClick={() => {
            stopMusic();
            router.push("/student/play/refresher");
          }}
          className="mt-4 px-4 py-2 bg-[#7b2020] text-white rounded-md hover:bg-[#5a1515]"
        >
          Back
        </button>
      </div>
    );

  if (quizFinished)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Calculating results...
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white text-black">
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md mb-6">

  <div
    className="flex items-center gap-2 cursor-pointer"
    onClick={() => {
      stopMusic();
      router.push("/student/play/refresher");
    }}
  >
    <ArrowLeft className="w-6 h-6 hover:text-gray-300" />
    <span className="font-semibold text-lg">
      Level {currentQ ? currentQ.level_id : ""}
    </span>
  </div>

  {/* RIGHT SIDE → Volume + Progress */}
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <span className="text-sm">🔊</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
        className="w-20 cursor-pointer"
      />
    </div>

    <div className="text-sm">
      {currentIndex + 1}/{questions.length}
    </div>
  </div>
</header>


      {/* Question Section */}
      <main className="w-full max-w-xl px-4 text-center">
        <h2 className="text-lg font-semibold text-[#7b2020] mb-2">
          Question {currentIndex + 1}
        </h2>

        {currentQ.question_image && (
          <div className="mb-3">
            <Image
              src={currentQ.question_image}
              alt="Question"
              width={200}
              height={200}
              className="mx-auto rounded-lg border"
            />
          </div>
        )}

        <p className="text-gray-800 mb-4">{currentQ.question}</p>

        {/* Options - Square Layout */}
<div className="grid grid-cols-2 gap-4 mt-4">
  {(["A", "B", "C", "D"] as const).map((key) => {
    const isCorrect = key === currentQ.answer;
    const isSelected = selectedOption === key;
    const optionKey = `option_${key.toLowerCase()}` as keyof Question;
    const optionImageKey = `option_${key.toLowerCase()}_image` as keyof Question;

    let style =
      "flex flex-col items-center justify-center border-2 rounded-xl p-3 aspect-square text-center cursor-pointer transition duration-200 select-none";

    // ✅ Conditional colors
    if (answered && isSelected && isCorrect)
      style += " border-green-600 bg-green-100";
    else if (answered && isSelected && !isCorrect)
      style += " border-red-600 bg-red-100";
    else if (answered && isCorrect)
      style += " border-green-500 bg-green-50";
    else style += " border-gray-300 hover:bg-gray-100";

    return (
      <div key={key} onClick={() => handleAnswer(key)} className={style}>
        {currentQ[optionImageKey] && (
          <div className="flex items-center justify-center mb-2 w-16 h-16 bg-gray-50 border rounded-lg overflow-hidden">
            <Image
              src={currentQ[optionImageKey] as string}
              alt={`Option ${key}`}
              width={60}
              height={60}
              className="object-contain"
            />
          </div>
        )}
        <span className="font-semibold text-[#7b2020]">
          {key}. {currentQ[optionKey] as string}
        </span>

        {answered && isSelected && (
          isCorrect ? (
            <CheckCircle className="text-green-600 w-5 h-5 mt-2" />
          ) : (
            <XCircle className="text-red-600 w-5 h-5 mt-2" />
          )
        )}
      </div>
    );
  })}
</div>


        {/* Next Button */}
        {answered && (
          <button
            onClick={handleNext}
            className="mt-5 bg-[#7b2020] text-white px-6 py-2 rounded-md hover:bg-[#5a1515]"
          >
            {currentIndex + 1 === questions.length ? "Finish" : "Next"}
          </button>
        )}
      </main>
    </div>
  );
}
