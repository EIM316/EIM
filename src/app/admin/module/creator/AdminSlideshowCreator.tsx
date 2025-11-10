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
  Image as ImageIcon,
  X,
  Trash2,
} from "lucide-react";

interface Slide {
  id: number;
  background: string;
  timer: number;
  isQuiz?: boolean;
  question?: string;
  questionImage?: string;
  options?: string[];
  optionImages?: string[];
  correctAnswer?: string;
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

        const res = await fetch(`/api/admin/modules/get?module_id=${moduleId}`);
        const data = await res.json();

        Swal.close();

        if (!data.success) {
          Swal.fire("⚠️ Error", data.error || "Failed to load module data.", "error");
          return;
        }

        if (data.module?.name) {
          const formattedName = data.module.name.replace(/_/g, " ").toUpperCase();
          setModuleName(formattedName || "Module Settings");
          localStorage.setItem("module_name", formattedName);
        } else {
          setModuleName("Module Settings");
        }

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
      text: "Please wait while we process your slides...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const uploadedSlides: Slide[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/cloudinary/uploadg5", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) continue;
        const data = await res.json();

        if (data?.url) {
          uploadedSlides.push({
            id: slides.length + i + 1,
            background: data.url,
            timer: globalTimer,
          });
        }
      }

      Swal.close();

      if (uploadedSlides.length > 0) {
        setSlides((prev) => [...prev, ...uploadedSlides]);
        setCurrentIndex(slides.length);
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

  /* ✅ Add Refresher Slide */
  const handleAddRefresherSlide = () => {
    const newRefresher: Slide = {
      id: slides.length + 1,
      background: "",
      timer: 0,
      isQuiz: true,
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
    };

    setSlides((prev) => [...prev, newRefresher]);
    setCurrentIndex(slides.length);
    Swal.fire("🧠 Added!", "A refresher quiz slide has been added at the end.", "success");
  };

  /* ✅ Upload image for refresher slide */
  const handleRefresherImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Swal.fire({
      title: "Uploading Image...",
      text: "Please wait while the image is uploaded.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cloudinary/uploadg5", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      Swal.close();

      if (data?.url) {
        setSlides((prev) =>
          prev.map((s, idx) =>
            idx === currentIndex ? { ...s, background: data.url } : s
          )
        );
        Swal.fire("✅ Uploaded!", "Image added to refresher slide.", "success");
      } else {
        Swal.fire("❌ Error", "Failed to upload image.", "error");
      }
    } catch (err) {
      Swal.close();
      Swal.fire("❌ Error", "Failed to upload refresher image.", "error");
    }
  };

  /* ✅ Remove refresher image */
  const handleRemoveRefresherImage = () => {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === currentIndex ? { ...s, background: "" } : s))
    );
  };

  /* ✅ Remove specific slide */
  const handleRemoveSlide = async () => {
    if (slides.length === 0) return;

    const confirm = await Swal.fire({
      title: "Remove this slide?",
      text: "This slide will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    setSlides((prev) => {
      const newSlides = prev.filter((_, idx) => idx !== currentIndex);
      // reassign IDs to maintain order
      return newSlides.map((s, i) => ({ ...s, id: i + 1 }));
    });

    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));

    Swal.fire("🗑 Deleted!", "Slide has been removed.", "success");
  };

  /* ✅ Update Refresher Fields */
  const updateRefresherField = (field: keyof Slide, value: any) => {
    setSlides((prev) =>
      prev.map((s, idx) =>
        idx === currentIndex ? { ...s, [field]: value } : s
      )
    );
  };

  /* ✅ Update individual option text */
  const updateRefresherOption = (index: number, value: string) => {
    setSlides((prev) =>
      prev.map((s, idx) => {
        if (idx !== currentIndex) return s;
        const updatedOptions = [...(s.options || [])];
        updatedOptions[index] = value;
        return { ...s, options: updatedOptions };
      })
    );
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
        text: "Please wait while we save your slides.",
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
    } catch {
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

        {/* Upload + Refresher Buttons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
          <label className="bg-white text-[#548E28] px-3 py-1 rounded cursor-pointer flex items-center gap-1 text-sm sm:text-base hover:bg-[#e3f0dd]">
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUploadSlides}
            />
          </label>

          <button
            onClick={handleAddRefresherSlide}
            className="bg-white text-[#548E28] px-3 py-1 rounded cursor-pointer flex items-center gap-1 text-sm sm:text-base hover:bg-[#e3f0dd]"
          >
            + Refresher
          </button>

          <button
            onClick={handleRemoveSlide}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm sm:text-base hover:bg-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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
<div className="relative w-full max-w-[800px] min-h-[320px] border-2 border-[#548E28] rounded-lg overflow-hidden shadow-md p-4 bg-gray-50">
  {slides[currentIndex]?.isQuiz ? (
    <div className="flex flex-col gap-3 items-start w-full">
      <h2 className="text-lg font-bold text-[#548E28]">🧩 Refresher Question</h2>

      {/* ✅ Question Image Upload */}
      <div className="flex flex-col w-full mb-3">
        {slides[currentIndex].questionImage ? (
          <div className="relative w-full h-40 border rounded-md overflow-hidden mb-2">
            <img
              src={slides[currentIndex].questionImage}
              alt="Question"
              className="w-full h-full object-contain bg-gray-50"
            />
            <button
              onClick={() =>
                setSlides((prev) =>
                  prev.map((s, i) =>
                    i === currentIndex ? { ...s, questionImage: "" } : s
                  )
                )
              }
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 text-[#548E28] font-semibold cursor-pointer border border-dashed border-[#548E28] px-3 py-2 rounded-md hover:bg-[#e3f0dd]">
            <ImageIcon className="w-4 h-4" /> Upload Question Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                Swal.fire({
                  title: "Uploading Image...",
                  text: "Please wait while uploading.",
                  allowOutsideClick: false,
                  didOpen: () => Swal.showLoading(),
                });
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/cloudinary/uploadg5", {
                  method: "POST",
                  body: formData,
                });
                const data = await res.json();
                Swal.close();
                if (data?.url) {
                  setSlides((prev) =>
                    prev.map((s, i) =>
                      i === currentIndex ? { ...s, questionImage: data.url } : s
                    )
                  );
                  Swal.fire("✅ Uploaded!", "Question image added!", "success");
                } else {
                  Swal.fire("❌ Error", "Upload failed", "error");
                }
              }}
            />
          </label>
        )}
      </div>

      {/* ✅ Question Text Input */}
      <input
        type="text"
        value={slides[currentIndex].question || ""}
        onChange={(e) =>
          setSlides((prev) =>
            prev.map((s, i) =>
              i === currentIndex ? { ...s, question: e.target.value } : s
            )
          )
        }
        placeholder="Enter your question here..."
        className="border border-[#548E28] rounded-md w-full p-2 text-black"
      />

      {/* ✅ Options Section */}
      {slides[currentIndex].options?.map((opt, idx) => (
        <div
          key={idx}
          className="flex flex-col sm:flex-row sm:items-center gap-3 w-full border border-[#548E28]/30 rounded-md p-2"
        >
          <div className="flex-1 flex flex-col gap-2">
            {/* Option Text */}
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const val = e.target.value;
                setSlides((prev) =>
                  prev.map((s, i) => {
                    if (i !== currentIndex) return s;
                    const newOpts = [...(s.options || [])];
                    newOpts[idx] = val;
                    return { ...s, options: newOpts };
                  })
                );
              }}
              placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
              className="border border-[#548E28] rounded-md p-2 text-black"
            />

            {/* ✅ Option Image Upload */}
            {slides[currentIndex].optionImages?.[idx] ? (
              <div className="relative w-full h-24 border rounded-md overflow-hidden">
                <img
                  src={slides[currentIndex].optionImages[idx]}
                  alt={`Option ${idx + 1}`}
                  className="w-full h-full object-contain bg-gray-50"
                />
                <button
                  onClick={() =>
                    setSlides((prev) =>
                      prev.map((s, i) => {
                        if (i !== currentIndex) return s;
                        const newImgs = [...(s.optionImages || [])];
                        newImgs[idx] = "";
                        return { ...s, optionImages: newImgs };
                      })
                    )
                  }
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 text-[#548E28] font-semibold cursor-pointer border border-dashed border-[#548E28]/60 px-2 py-1 rounded-md hover:bg-[#e3f0dd] text-sm w-fit">
                <ImageIcon className="w-4 h-4" /> Upload Option Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    Swal.fire({
                      title: "Uploading Option Image...",
                      text: "Please wait...",
                      allowOutsideClick: false,
                      didOpen: () => Swal.showLoading(),
                    });
                    const formData = new FormData();
                    formData.append("file", file);
                    const res = await fetch("/api/cloudinary/uploadg5", {
                      method: "POST",
                      body: formData,
                    });
                    const data = await res.json();
                    Swal.close();
                    if (data?.url) {
                      setSlides((prev) =>
                        prev.map((s, i) => {
                          if (i !== currentIndex) return s;
                          const newImgs = [...(s.optionImages || [])];
                          newImgs[idx] = data.url;
                          return { ...s, optionImages: newImgs };
                        })
                      );
                      Swal.fire("✅ Uploaded!", "Option image added!", "success");
                    } else {
                      Swal.fire("❌ Error", "Upload failed", "error");
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* ✅ Correct Answer Radio */}
          <div className="flex items-center gap-1 mt-1 sm:mt-0">
            <input
              type="radio"
              name="correct"
              checked={
                slides[currentIndex].correctAnswer ===
                String.fromCharCode(65 + idx)
              }
              onChange={() =>
                setSlides((prev) =>
                  prev.map((s, i) =>
                    i === currentIndex
                      ? { ...s, correctAnswer: String.fromCharCode(65 + idx) }
                      : s
                  )
                )
              }
            />
            <span className="text-[#548E28] font-semibold">Correct</span>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <img
      src={slides[currentIndex].background}
      className="absolute inset-0 w-full h-full object-contain bg-gray-50"
      alt={`Slide ${currentIndex + 1}`}
    />
  )}
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
                  setCurrentIndex((i) => (i === slides.length - 1 ? 0 : i + 1))
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
                    {s.isQuiz ? (
                      <div className="text-[#548E28] font-bold text-sm">🧩 Quiz</div>
                    ) : (
                      <img
                        src={s.background}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md mb-2 border border-[#548E28]/20"
                      />
                    )}
                    {!s.isQuiz && (
                      <>
                        <label className="text-xs text-[#548E28] font-semibold mb-1">
                          Timer (s)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={s.timer}
                          onChange={(e) =>
                            setSlides((prev) =>
                              prev.map((slide) =>
                                slide.id === s.id
                                  ? { ...slide, timer: Number(e.target.value) }
                                  : slide
                              )
                            )
                          }
                          className="border border-[#548E28] rounded-md px-2 py-1 w-16 text-center text-black text-xs"
                        />
                      </>
                    )}
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
