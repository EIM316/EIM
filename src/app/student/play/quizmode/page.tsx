"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Swal from "sweetalert2";

interface Question {
  id: number;
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

interface GameSettings {
  total_minutes: number;
  total_points: number;
  hints_per_student: number;
  time_per_question: number;
  shuffle_mode: boolean;
  max_questions: number;
  theme_file?: string | null;
}

export default function ChallengeModePage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [usedHints, setUsedHints] = useState(0);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentQ = questions[currentIndex] || null;

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

  // ✅ Load settings + questions
  useEffect(() => {
    const init = async () => {
      try {
        const resSettings = await fetch("/api/gamemode2/settings/get2");
        if (!resSettings.ok) throw new Error("Settings missing");
        const dataSettings = await resSettings.json();
        setSettings(dataSettings);

        const [res1, res2] = await Promise.all([
          fetch("/api/gamemode1/list-all"),
          fetch("/api/gamemode2/list-all"),
        ]);

        const data1 = res1.ok ? await res1.json() : [];
        const data2 = res2.ok ? await res2.json() : [];
        const combined = [...data1, ...data2];
        if (!combined.length) throw new Error("No questions found");

        if (dataSettings.shuffle_mode) combined.sort(() => Math.random() - 0.5);
        setQuestions(combined.slice(0, dataSettings.max_questions || combined.length));
        setTimer(dataSettings.time_per_question ?? 15);
        setMusicUrl(dataSettings.theme_file ?? "/resources/music/theme1.mp3");
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load questions or settings.", "error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ✅ Timer per question
  useEffect(() => {
    if (loading || quizFinished || answered) return;
    if (timer <= 0) {
      handleNext();
      return;
    }
    const i = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [timer, answered, quizFinished, loading]);

  // ✅ Global elapsed time (auto-save when time runs out)
  useEffect(() => {
    if (!settings || !user) return;
    const totalDuration = (settings.total_minutes ?? 1) * 60;

    const i = setInterval(() => {
      setElapsedTime((prev) => {
        if (prev >= totalDuration) {
          clearInterval(i);
          console.log("🕒 Time's up! Auto-saving progress...");
          showResults(true); // 👈 auto-save mode
          return totalDuration;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(i);
  }, [settings, user]);

  // ✅ Background music
  useEffect(() => {
    if (!musicUrl) return;
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.4;
    audio.play().catch(() => {});
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [musicUrl]);

  const handleAnswer = (choice: "A" | "B" | "C" | "D") => {
    if (answered || !currentQ) return;
    setSelectedOption(choice);
    setAnswered(true);
    if (choice === currentQ.answer) {
      setScore((s) => s + 1);
    }
  };

  const handleUseHint = () => {
    if (!settings || !currentQ || usedHints >= settings.hints_per_student) return;
    const wrongs = ["A", "B", "C", "D"].filter((o) => o !== currentQ.answer);
    const toHide = wrongs.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
    setUsedHints((u) => u + 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setAnswered(false);
      setHiddenOptions([]);
      setTimer(settings?.time_per_question ?? 15);
    } else {
      showResults();
    }
  };

  // ✅ Save results (manual or auto)
  const showResults = async (autoSave = false) => {
    if (quizFinished && !autoSave) return; // prevent multiple saves
    setQuizFinished(true);

    if (audioRef.current) audioRef.current.pause();
    if (!settings || !user) return;

    const totalAllowedTime = (settings.total_minutes ?? 1) * 60;
    const correctAnswers = score;
    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    const timeBonus = Math.max(0.3, 1 - elapsedTime / totalAllowedTime);
    const totalEarnedPoints =
      totalQuestions > 0
        ? Math.floor((settings.total_points ?? 100) * accuracy * timeBonus)
        : 0;

    setPoints(totalEarnedPoints);

    try {
      await fetch("/api/gamemode2/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: user.id_number,
          points: totalEarnedPoints,
          score: correctAnswers,
          total_questions: totalQuestions,
          elapsed_time: elapsedTime,
          accuracy: accuracy.toFixed(2),
          auto_saved: autoSave,
        }),
      });

      if (!autoSave) {
        await Swal.fire({
          title: "Challenge Complete! 🧩",
          html: `
            <div style="font-size:18px; margin-bottom:8px;">
              You got <b>${correctAnswers}</b> / ${totalQuestions} correct!
            </div>
            <div style="color:#777;">Time used: ${elapsedTime}s / ${totalAllowedTime}s</div>
            <div style="color:#548E28; font-size:22px; margin-top:5px;">
              Total Points: <b>${totalEarnedPoints}</b> / ${settings.total_points}
            </div>
          `,
          icon: "success",
          confirmButtonText: "Back to Menu",
          confirmButtonColor: "#548E28",
        });
      } else {
        console.log("💾 Auto-saved partial progress");
      }

      router.push("/student/play");
    } catch (err) {
      console.error("Error saving quiz result:", err);
    }
  };

  const totalProgress =
    settings && settings.total_minutes
      ? Math.min((elapsedTime / (settings.total_minutes * 60)) * 100, 100)
      : 0;

  const isLowTime = totalProgress >= 90;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading...
      </div>
    );

  return (
    <div className="flex flex-col items-center min-h-screen bg-white text-black">
      {/* Header */}
      <header className="w-full bg-[#548E28] text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/student/play")}
          >
            <ArrowLeft className="w-6 h-6 hover:text-gray-300" />
            <span className="font-semibold text-lg">Quiz Mode</span>
          </div>
          <span>⏱ {timer}s</span>
        </div>

        <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isLowTime ? "bg-red-500 shake" : "bg-yellow-400"
            }`}
            style={{ width: `${totalProgress}%` }}
          ></div>
        </div>
      </header>

      {/* Question */}
      <main className="w-full max-w-xl px-4 text-center mt-6">
        <h2 className="text-lg font-semibold text-[#548E28] mb-2">
          Question {currentIndex + 1}/{questions.length}
        </h2>

        {currentQ?.question_image && (
          <Image
            src={currentQ.question_image}
            alt="Question"
            width={200}
            height={200}
            className="mx-auto rounded-lg border mb-3"
          />
        )}

        <p className="text-gray-800 mb-4">{currentQ?.question}</p>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {(["A", "B", "C", "D"] as const).map((key) => {
            if (!currentQ || hiddenOptions.includes(key)) return null;
            const optionKey = `option_${key.toLowerCase()}` as keyof Question;
            const optionImageKey = `option_${key.toLowerCase()}_image` as keyof Question;
            const isCorrect = key === currentQ.answer;
            const isSelected = selectedOption === key;

            let style =
              "flex flex-col items-center justify-center border-2 rounded-xl p-3 aspect-square cursor-pointer transition";
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
                  <Image
                    src={currentQ[optionImageKey] as string}
                    alt={`Option ${key}`}
                    width={60}
                    height={60}
                    className="mb-2"
                  />
                )}
                <span className="font-semibold text-[#548E28]">
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

        {/* ✅ Hint Button */}
        <div className="flex flex-col items-center mt-8">
          <button
            onClick={handleUseHint}
            disabled={
              usedHints >= (settings?.hints_per_student ?? 0) || answered
            }
            className={`flex items-center gap-3 px-6 py-3 rounded-full font-semibold transition ${
              usedHints >= (settings?.hints_per_student ?? 0) || answered
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#E9C686] hover:bg-yellow-500"
            }`}
          >
            <Image
              src="/resources/admin/game1.png"
              alt="Hint Icon"
              width={30}
              height={30}
              className="rounded-full border"
            />
            <span className="text-black text-lg">
              {`${(settings?.hints_per_student ?? 0) - usedHints}/${
                settings?.hints_per_student ?? 0
              } HINTS`}
            </span>
          </button>

          {answered && (
            <button
              onClick={handleNext}
              className="mt-5 bg-[#548E28] text-white px-6 py-2 rounded-md hover:bg-[#3e6a20]"
            >
              {currentIndex + 1 === questions.length ? "Finish" : "Next"}
            </button>
          )}
        </div>
      </main>

      {/* Shake Animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          50% { transform: translateX(3px); }
          75% { transform: translateX(-3px); }
        }
        .shake {
          animation: shake 0.5s infinite;
        }
      `}</style>
    </div>
  );
}
