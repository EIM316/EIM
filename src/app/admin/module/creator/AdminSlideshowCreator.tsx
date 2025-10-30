"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Upload,
  Save,
  Play,
  Pause,
  Clock,
} from "lucide-react";

interface Slide {
  id: number;
  background: string;
  timer: number;
}

export default function AdminSlideshowCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [moduleName, setModuleName] = useState("Slideshow Creator");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [globalTimer, setGlobalTimer] = useState(5);
  const [points, setPoints] = useState(10);
  const [autoPlay, setAutoPlay] = useState(false);

 /* ✅ Fetch Module Info + Load Saved Slides */
useEffect(() => {
  const moduleId = searchParams.get("module_id");
  if (!moduleId) return;

  const fetchModuleAndSlides = async () => {
    try {
      Swal.fire({
        title: "Loading Module...",
        text: "Please wait while we fetch your slides.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // ✅ Fetch module + slides in one call
      const res = await fetch(`/api/admin/modules/get?module_id=${moduleId}`);
      const data = await res.json();

      Swal.close();

      if (!data.success) {
        Swal.fire("⚠️ Error", data.error || "Failed to load module data.", "error");
        return;
      }

      // ✅ Set module name dynamically
      if (data.module?.name) {
        const formattedName =
          data.module.name
            .replace(/_/g, " ") // clean underscores if any
            .toUpperCase(); // ensure consistent casing

        setModuleName(formattedName || "Module Settings");
        localStorage.setItem("module_name", formattedName);
      } else {
        setModuleName("Module Settings");
      }

      // ✅ Handle slides if available
      if (data.slides?.slides_data) {
        const parsed = data.slides.slides_data;
        setSlides(parsed.slides || []);
        setPoints(parsed.points || 10);
        setGlobalTimer(parsed.slides?.[0]?.timer || 5);
       
      } else {
        console.log("⚠️ No slides found for this module.");
      }
    } catch (err) {
      Swal.close();
      console.error("❌ Error loading module/slides:", err);
      Swal.fire("⚠️ Error", "Failed to load module data.", "error");
    }
  };

  fetchModuleAndSlides();
}, [searchParams]);


 /* ✅ Upload Slides to Cloudinary */
const handleUploadSlides = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  Swal.fire({
    title: "Uploading Slides...",
    text: "Please wait while we process the module for you...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const uploadedSlides: Slide[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      // ✅ Use absolute path (starts with "/")
      const res = await fetch("/api/cloudinary/uploadg5", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("❌ Upload failed:", res.status, res.statusText);
        continue;
      }

      const data = await res.json();

      if (data?.url) {
        uploadedSlides.push({
          id: i + 1,
          background: data.url, // ✅ Cloudinary URL
          timer: globalTimer,
        });
      } else {
        console.error("⚠️ Invalid Cloudinary response:", data);
      }
    }

    Swal.close();

    if (uploadedSlides.length > 0) {
      setSlides(uploadedSlides);
      setCurrentIndex(0);
      Swal.fire("✅ Slides Uploaded!", `${uploadedSlides.length} slides added.`, "success");
    } else {
      Swal.fire("⚠️ No Uploads", "No slides were successfully uploaded.", "warning");
    }
  } catch (err) {
    Swal.close();
    console.error("❌ Cloudinary upload error:", err);
    Swal.fire("❌ Error", "Failed to upload images.", "error");
  }
};

  /* ✅ Auto-play Logic */
  useEffect(() => {
    if (!autoPlay || slides.length === 0) return;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, (slides[currentIndex]?.timer || globalTimer) * 1000);
    return () => clearTimeout(timer);
  }, [autoPlay, slides, currentIndex, globalTimer]);

  /* ✅ Apply Global Timer */
  const applyTimerToAll = () => {
    setSlides((prev) => prev.map((s) => ({ ...s, timer: globalTimer })));
    Swal.fire("⏱ Applied!", "Global timer applied to all slides.", "success");
  };

  /* ✅ Change Individual Slide Timer */
  const handleSlideTimerChange = (id: number, newTimer: number) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, timer: newTimer } : s))
    );
  };

  /* ✅ Save to Database */
  const handleSave = async () => {
    const moduleId = searchParams.get("module_id");
    const adminId = searchParams.get("admin_id");

    if (!moduleId || !adminId) {
      Swal.fire("⚠️ Missing Data", "Module ID or Admin ID is missing.", "warning");
      return;
    }

    try {
      Swal.fire({
        title: "Saving Module...",
        text: "Please wait while we upload and save your slides.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch("/api/admin/modules/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: moduleId,
          admin_id: adminId,
          slides,
          points,
          moduleName,
        }),
      });

      const data = await res.json();
      Swal.close();

      if (data.success) {
        Swal.fire("✅ Saved!", "Module slides saved successfully!", "success");
      } else {
        Swal.fire("❌ Error", data.error || "Failed to save slides.", "error");
      }
    } catch (err) {
      console.error("❌ Error saving slides:", err);
      Swal.fire("❌ Error", "Something went wrong while saving.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* HEADER */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-4 py-3 shadow-md relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="text-white hover:opacity-80 text-2xl font-bold"
          >
            <ArrowLeft className="inline w-6 h-6" />
          </button>
          <h1 className="font-semibold text-base sm:text-lg truncate">
            {moduleName}
          </h1>
        </div>

        {/* Upload Button */}
        <label className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-[#548E28] px-3 py-1 rounded cursor-pointer flex items-center gap-1 text-sm sm:text-base hover:bg-[#e3f0dd]">
          <Upload className="w-4 h-4" /> Upload
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUploadSlides}
          />
        </label>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 gap-5">
        {slides.length === 0 ? (
          <p className="text-gray-600 italic text-center mt-10 px-3">
            Upload multiple images to start your module.
          </p>
        ) : (
          <>
            {/* SLIDE PREVIEW */}
            <div className="relative w-full max-w-[800px] h-[280px] border-2 border-[#548E28] rounded-lg overflow-hidden shadow-md">
              <img
                src={slides[currentIndex].background}
                className="absolute inset-0 w-full h-full object-contain bg-gray-50"
                alt={`Slide ${currentIndex + 1}`}
              />
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                Slide {currentIndex + 1} / {slides.length}
              </div>
            </div>

            {/* CONTROLS */}
            <div className="flex flex-wrap justify-center gap-3 mt-4 w-full">
              <button
                onClick={() =>
                  setCurrentIndex((i) => (i === 0 ? slides.length - 1 : i - 1))
                }
                className="px-4 py-2 bg-[#548E28] text-white rounded-md text-sm sm:text-base"
              >
                Prev
              </button>

              <button
                onClick={() =>
                  setCurrentIndex((i) =>
                    i === slides.length - 1 ? 0 : i + 1
                  )
                }
                className="px-4 py-2 bg-[#548E28] text-white rounded-md text-sm sm:text-base"
              >
                Next
              </button>

              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm sm:text-base ${
                  autoPlay ? "bg-red-600" : "bg-[#548E28]"
                } text-white`}
              >
                {autoPlay ? (
                  <>
                    <Pause className="w-4 h-4" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Play
                  </>
                )}
              </button>
            </div>

            {/* TIMER & POINTS */}
            <div className="flex flex-wrap justify-center items-center gap-3 mt-1 w-full max-w-[800px] bg-[#f8faf8] p-3 rounded-lg border border-[#548E28] text-sm sm:text-base">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#548E28]">⏱ Global Timer:</span>
                <input
                  type="number"
                  value={globalTimer}
                  min={1}
                  onChange={(e) => setGlobalTimer(Number(e.target.value))}
                  className="border border-[#548E28] rounded-md px-2 py-1 w-14 text-center text-black"
                />
                <span className="text-[#548E28] font-medium">sec</span>
                <button
                  onClick={applyTimerToAll}
                  className="bg-[#548E28] text-white px-3 py-1 rounded-md text-xs sm:text-sm hover:bg-[#3d6c1f]"
                >
                  Apply All
                </button>
              </div>

              <span className="hidden sm:inline text-[#548E28]/60">•</span>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#548E28]">🏆 Points:</span>
                <input
                  type="number"
                  value={points}
                  min={0}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="border border-[#548E28] rounded-md px-2 py-1 w-14 text-center text-black"
                />
              </div>
            </div>

            {/* SLIDE TIMER BAR */}
            <div className="mt-3 flex flex-col items-start gap-2 w-full max-w-[800px]">
              <h2 className="text-[#548E28] font-bold text-base sm:text-lg flex items-center gap-2 px-4">
                <Clock className="w-5 h-5" /> Set Timer per Slide
              </h2>

              <div
                className="flex overflow-x-auto gap-4 w-full pb-4 pl-10 pr-5 snap-x snap-mandatory scroll-smooth
                           scrollbar-thin scrollbar-thumb-[#548E28]/60 scrollbar-track-gray-200"
              >
                {slides.map((s, index) => (
                  <div
                    key={s.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`min-w-[130px] sm:min-w-[150px] border-2 rounded-xl p-2 flex-shrink-0 flex flex-col items-center 
                               transition-all snap-center cursor-pointer ${
                                 index === currentIndex
                                   ? "border-[#548E28] bg-[#f3faf0] scale-95 shadow-lg"
                                   : "border-gray-300 bg-white shadow-sm"
                               }`}
                  >
                    <img
                      src={s.background}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md mb-2 border border-[#548E28]/20"
                    />
                    <label className="text-xs text-[#548E28] font-semibold mb-1">
                      Timer (s)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={s.timer}
                      onChange={(e) =>
                        handleSlideTimerChange(s.id, Number(e.target.value))
                      }
                      className="border border-[#548E28] rounded-md px-2 py-1 w-16 text-center text-black text-xs"
                    />
                  </div>
                ))}
              </div>

              {/* SAVE BUTTON */}
              <div className="w-full flex justify-center mt-4">
                <button
                  onClick={handleSave}
                  className="bg-[#548E28] hover:bg-[#3d6c1f] text-white px-6 py-2 rounded-md flex items-center gap-2 text-sm sm:text-base shadow-md"
                >
                  <Save className="w-4 h-4" /> Save Module
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
