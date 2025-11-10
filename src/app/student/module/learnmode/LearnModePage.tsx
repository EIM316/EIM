"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Trophy,
  CheckCircle,
  Lock,
} from "lucide-react";
import Swal from "sweetalert2";

interface Slide {
  id: number;
  background: string;
  timer: number;
  isQuiz?: boolean;
  isRefresher?: boolean;
  question?: string;
  options?: string[];
  correctAnswer?: string;
  points?: number;
}

export default function LearnModePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module_id");
  const studentId = searchParams.get("student_id");

  const [slides, setSlides] = useState<Slide[]>([]);
  const [moduleName, setModuleName] = useState<string>(""); // ✅ module name
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [completed, setCompleted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [moduleMaxPoints, setModuleMaxPoints] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Allow landscape orientation on mobile (safe TS-compatible version)
useEffect(() => {
  const lockOrientation = async () => {
    const orientation: any = (screen as any).orientation;

    if (orientation && typeof orientation.lock === "function") {
      try {
        await orientation.lock("landscape");
        console.log("📱 Orientation locked to landscape.");
      } catch (err) {
        console.warn("⚠️ Could not lock orientation. User may need to rotate manually.");
      }
    } else {
      console.warn("⚠️ Orientation API not supported on this device.");
    }
  };

  // Run only on mobile-like devices
  if (window.innerWidth < 1024) lockOrientation();
}, []);


  // 🧠 Fetch slides + progress
  useEffect(() => {
    if (!studentId || !moduleId) return;

    const fetchSlidesAndProgress = async () => {
      try {
        const res = await fetch(`/api/student/modules/slides?module_id=${moduleId}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.slides)) {
          setSlides(data.slides);
          setModuleMaxPoints(data.max_points || 0);
          setModuleName(data.moduleName || "Unnamed Module"); // ✅ capture name

          const progressRes = await fetch(
            `/api/student/modules/slides/progress?student_id=${studentId}&module_id=${moduleId}`
          );
          const progressData = await progressRes.json();

          if (progressData.success && progressData.progress) {
            const p = progressData.progress;

            if (p.completed) {
              setCurrentIndex(0);
              setCompleted(true);
            } else {
              setCurrentIndex(p.current_slide || 0);
              setCompleted(false);
            }

            setEarnedPoints(p.points_earned || 0);
            setRemainingTime(data.slides[p.current_slide || 0]?.timer || 5);
          } else {
            setCurrentIndex(0);
            setRemainingTime(data.slides[0]?.timer || 5);
          }
        } else {
          Swal.fire("Error", data.error || "Failed to load slides.", "error");
        }
      } catch (err) {
        console.error("❌ Error fetching slides/progress:", err);
        Swal.fire("Error", "Server error loading module slides.", "error");
      }
    };

    fetchSlidesAndProgress();
  }, [moduleId, studentId]);

  // ⏱ Timer logic
  useEffect(() => {
    if (slides.length === 0 || completed) return;
    const currentSlide = slides[currentIndex];
    if (currentSlide.isQuiz || currentSlide.isRefresher) return;
    if (isPaused) return;

    if (remainingTime <= 0) {
      nextSlide();
      return;
    }

    timerRef.current = setTimeout(() => setRemainingTime((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current!);
  }, [remainingTime, isPaused, currentIndex, completed, slides]);

  // ➡️ Navigation
  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      const ns = slides[next];
      setRemainingTime(ns.isQuiz || ns.isRefresher ? 0 : ns.timer || 5);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      const ps = slides[prev];
      setRemainingTime(ps.isQuiz || ps.isRefresher ? 0 : ps.timer || 5);
    }
  };

  const handleBack = async () => {
    try {
      if (studentId && moduleId) {
        await fetch("/api/student/modules/slides/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: studentId,
            module_id: Number(moduleId),
            current_slide: completed ? 0 : currentIndex,
            ...(completed
              ? { completed: true }
              : {
                  points_earned: earnedPoints,
                  completed: false,
                  badge_earned: false,
                }),
          }),
        });
      }
    } catch (err) {
      console.error("❌ Error saving on back:", err);
    } finally {
      router.push(`/student/module`);
    }
  };

  const togglePause = () => setIsPaused((p) => !p);

  // 🧩 Handle quiz answers
  const handleAnswer = (option: string) => {
    const currentSlide = slides[currentIndex];
    setAnswers((prev) => ({ ...prev, [currentSlide.id]: option }));

    if (currentSlide.isQuiz || currentSlide.isRefresher) {
      const correct = option === currentSlide.correctAnswer;
      Swal.fire({
        icon: correct ? "success" : "error",
        title: correct ? "Correct!" : "Wrong!",
        timer: 800,
        showConfirmButton: false,
      });
    }
  };

  // 🧮 Completion logic
  const checkCompletion = async () => {
    const quizSlides = slides.filter((s) => s.isQuiz);
    const refresherSlides = slides.filter((s) => s.isRefresher);

    let correctAnswers = 0;
    quizSlides.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correctAnswers++;
    });

    const allCorrect = correctAnswers === quizSlides.length;
    const hasRefresher = refresherSlides.length > 0;

    if (hasRefresher && !allCorrect) {
      Swal.fire({
        icon: "warning",
        title: "Retake Required!",
        html: `
          <p>You got ${correctAnswers}/${quizSlides.length} correct.</p>
          <p class="mt-2 font-semibold text-[#7b2020]">
            Please correct all refresher answers before finishing.
          </p>
        `,
        confirmButtonText: "Okay",
        confirmButtonColor: "#7b2020",
      });
      return;
    }

    let totalPoints = moduleMaxPoints;
    let badgeEarned = true;

    if (!hasRefresher && !allCorrect) {
      totalPoints = Math.round(
        (correctAnswers / quizSlides.length) * moduleMaxPoints
      );
      badgeEarned = correctAnswers === quizSlides.length;
    }

    setEarnedPoints(totalPoints);
    setCompleted(true);

    try {
      await fetch("/api/student/modules/slides/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          module_id: Number(moduleId),
          current_slide: 0,
          points_earned: totalPoints,
          completed: true,
          badge_earned: badgeEarned,
        }),
      });
    } catch (err) {
      console.error("❌ Failed to save completion:", err);
    }

    Swal.fire({
      title: "🎉 Module Completed!",
      html: `<p>You got ${correctAnswers}/${quizSlides.length} correct.</p>
        <p class="mt-2 font-bold text-lg text-[#7b2020]">Points Earned: ${totalPoints}</p>
        ${
          badgeEarned
            ? `<p class="text-green-600 font-semibold mt-2">Badge Earned ✓</p>`
            : ""
        }`,
      icon: badgeEarned ? "success" : "info",
      confirmButtonText: "Continue",
      confirmButtonColor: "#7b2020",
    }).then(() => router.push("/student/module"));
  };

  // 🧩 Disable finish if wrong refresher answers exist
  const refresherSlides = slides.filter((s) => s.isRefresher);
  const quizSlides = slides.filter((s) => s.isQuiz);
  const correctAnswers = quizSlides.filter(
    (q) => answers[q.id] === q.correctAnswer
  ).length;

  const hasRefresher = refresherSlides.length > 0;
  const allCorrect = correctAnswers === quizSlides.length;
  const disableFinish = hasRefresher && !allCorrect;

  // 🖼️ UI Rendering
  if (slides.length === 0)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading slides...
      </div>
    );

  const progress = ((currentIndex + 1) / slides.length) * 100;
  const current = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
  <div className="flex items-center gap-3">
    <ArrowLeft
      onClick={handleBack}
      className="w-6 h-6 cursor-pointer hover:text-gray-300"
    />
    <h1 className="font-bold text-lg sm:text-xl">Learning Mode</h1>
  </div>

  <div className="flex items-center gap-2">
    
    {/* ⏯ Pause/Resume Button */}
    {!current.isQuiz && !current.isRefresher && (
      <button
        onClick={togglePause}
        className={`flex items-center gap-2 px-3 py-1 rounded-md ${
          isPaused ? "bg-green-600" : "bg-red-600"
        } hover:opacity-80 transition`}
      >
        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        {isPaused ? "Resume" : "Pause"}
      </button>
    )}
  </div>
</header>


      {/* ✅ Module Name */}
      <div className="text-center py-3 bg-white shadow-sm border-b">
        <h2 className="font-bold text-xl text-[#7b2020]">{moduleName}</h2>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-200 h-2">
        <div
          className="bg-[#7b2020] h-2 transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

     {/* Slides */}
<main
  className="flex-1 flex flex-col items-center justify-center p-4 text-center 
  landscape:p-2 landscape:flex-row landscape:items-center landscape:justify-evenly"
>
  <div
    className="relative bg-gray-50 border-2 border-[#7b2020] rounded-lg shadow-md overflow-hidden
      w-full max-w-3xl min-h-[350px]
      landscape:max-w-[85vw] landscape:h-[75vh] landscape:min-h-[300px]"
  >
    {current.isQuiz || current.isRefresher ? (
      <div className="flex flex-col items-center justify-center p-6 h-full">
        <h2 className="font-bold text-[#7b2020] text-xl mb-4">{current.question}</h2>
        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
          {current.options?.map((opt, idx) => {
            const label = String.fromCharCode(65 + idx);
            const isSelected = answers[current.id] === label;
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(label)}
                className={`px-4 py-2 rounded-md border font-medium transition-all ${
                  isSelected
                    ? "bg-[#7b2020] text-white border-[#7b2020]"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-[#7b2020]/10"
                }`}
              >
                {label}. {opt}
              </button>
            );
          })}
        </div>
      </div>
    ) : (
      <Image
  src={current.background}
  alt={`Slide ${currentIndex + 1}`}
  fill
  className="object-fill"
  style={{ backgroundColor: "#fff" }}
  priority
/>

    )}
  </div>

  {/* Navigation */}
  <div
    className="flex justify-center gap-4 mt-6 flex-wrap 
    landscape:flex-col landscape:items-center landscape:gap-3 landscape:mt-0"
  >
    <button
      onClick={prevSlide}
      disabled={currentIndex === 0}
      className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-400 transition"
    >
      <ChevronLeft className="w-5 h-5" /> Back
    </button>

    <button
      onClick={isLastSlide ? checkCompletion : nextSlide}
      disabled={isLastSlide && disableFinish}
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition text-white ${
        disableFinish
          ? "bg-gray-400 cursor-not-allowed"
          : isLastSlide
          ? "bg-green-600 hover:bg-green-700"
          : "bg-[#7b2020] hover:bg-[#5c1717]"
      }`}
    >
      {isLastSlide ? (
        <>
          {disableFinish ? (
            <>
              Locked <Lock className="w-5 h-5" />
            </>
          ) : (
            <>
              Finish <CheckCircle className="w-5 h-5" />
            </>
          )}
        </>
      ) : (
        <>
          Next <ChevronRight className="w-5 h-5" />
        </>
      )}
    </button>
  </div>
</main>


      {/* Completion Footer */}
      {completed && (
        <footer className="w-full bg-[#7b2020]/90 text-white py-5 text-center font-semibold flex flex-col items-center">
          <Trophy className="w-8 h-8 mb-2 text-yellow-400" />
          <p>Congratulations! You finished the module.</p>
          <p className="text-lg font-bold mt-1">Points Earned: {earnedPoints}</p>
          <span className="text-sm opacity-90 mt-1">
            {earnedPoints === moduleMaxPoints
              ? "Badge earned ✓"
              : "Badge not yet earned"}
          </span>
        </footer>
      )}
    </div>
  );
}
