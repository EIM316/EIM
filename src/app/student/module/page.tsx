"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Search,
  X,
  LogOut,
  Menu,
  BookOpen,
  Play,
  CheckCircle,
} from "lucide-react";
import Swal from "sweetalert2";

interface ModuleItem {
  module_id: string;
  name: string;
  description?: string;
  coverImage?: string;
  slideCount?: number;
}

interface ProgressItem {
  module_id: number;
  current_slide: number;
  completed: boolean;
  points_earned: number;
}

export default function StudentModulePage() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [progressData, setProgressData] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [activeModule, setActiveModule] = useState<{
    id: string;
    name: string;
    completed: boolean;
  } | null>(null);

  // ✅ Load user + modules + DB progress
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    const fetchModulesAndProgress = async () => {
      try {
        const moduleRes = await fetch("/api/student/modules");
        const moduleData = await moduleRes.json();

        if (moduleData.success && Array.isArray(moduleData.modules)) {
          setModules(moduleData.modules);

          const progressRes = await fetch(
            `/api/student/modules/slides/progress/all?student_id=${parsedUser.id_number}`
          );
          const progressData = await progressRes.json();

          if (progressData.success && Array.isArray(progressData.progress)) {
            setProgressData(progressData.progress);

            // ✅ Find most recent or active module
            const latest = progressData.progress.sort(
              (a: any, b: any) => b.id - a.id
            )[0];

            if (latest) {
              const mod = moduleData.modules.find(
                (m: any) => Number(m.module_id) === Number(latest.module_id)
              );
              if (mod) {
                setActiveModule({
                  id: mod.module_id,
                  name: mod.name,
                  completed: latest.completed,
                });
              }
            }
          }
        } else {
          Swal.fire("Error", moduleData.error || "Could not load modules.", "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Server error while loading modules or progress.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchModulesAndProgress();
  }, [router]);

  // ✅ Navigation — now includes student_id in query string
  const handleOpenModule = (mod: ModuleItem) => {
    if (!user) return;
    router.push(
      `/student/module/learnmode?module_id=${mod.module_id}&student_id=${user.id_number}`
    );
  };

  const handleContinueModule = () => {
    if (activeModule && user) {
      router.push(
        `/student/module/learnmode?module_id=${activeModule.id}&student_id=${user.id_number}`
      );
    }
  };

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

  const handleBack = () => router.push("/student");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading modules...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* ✅ HEADER */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative">
        <div className="flex items-center gap-3">
          <ArrowLeft
            onClick={handleBack}
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
          />
          <h1 className="font-bold text-lg sm:text-xl tracking-wide">MODULES</h1>
        </div>

        <div className="flex items-center gap-4">
         
        </div>

        {/* ✅ SEARCH BAR */}
        {showSearch && (
          <div className="absolute inset-0 bg-[#7b2020] flex items-center justify-center px-4 z-10">
            <input
              type="text"
              placeholder="Search for a module..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-3/4 px-3 py-2 rounded-md text-white border border-white/50 placeholder-white/70 focus:outline-none"
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

      {/* ✅ MAIN CONTENT */}
      <main className="flex-1 w-full flex flex-col items-center p-6 pb-24">
        {modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-20">
            <Image
              src="/resources/modes/module.png"
              alt="No modules"
              width={160}
              height={160}
              className="opacity-60 mb-4"
            />
            <p className="text-gray-600 font-medium">
              No modules are available at the moment.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-[#7b2020] mb-6">
              Available Modules
            </h2>

            {/* ✅ Module Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
              {modules
                .filter((mod) =>
                  mod.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((mod) => {
                  const progress = progressData.find(
                    (p) => Number(p.module_id) === Number(mod.module_id)
                  );

                  return (
                    <div
                      key={mod.module_id}
                      className="group bg-white border-2 border-[#7b2020]/50 rounded-xl shadow-md overflow-hidden hover:shadow-lg hover:border-[#7b2020] transition-all hover:scale-[1.03] cursor-pointer"
                      onClick={() => handleOpenModule(mod)}
                    >
                      <div className="relative w-full h-44 bg-[#7b2020]/5">
                        <Image
                          src={mod.coverImage || "/resources/modes/module.png"}
                          alt={mod.name}
                          fill
                          className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="p-4 text-center">
                        <h3 className="font-semibold text-[#7b2020] text-lg mb-2 flex items-center justify-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          {mod.name}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {mod.description || "No description available."}
                        </p>

                        <button className="mt-1 px-4 py-1.5 bg-[#7b2020] text-white text-sm rounded-md hover:bg-[#5c1717] transition">
                          {progress?.completed
                            ? "Review Module"
                            : progress
                            ? "Continue"
                            : "Start Learning"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </main>

      {/* ✅ Bottom bar — simplified (no progress bar) */}
      {activeModule && user && (
        <div className="fixed bottom-0 left-0 w-full bg-[#7b2020] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-3 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-sm opacity-80">
              {activeModule.completed
                ? "Status: Completed"
                : "You have unfinished progress in:"}
            </span>
            <strong className="text-lg">{activeModule.name}</strong>
          </div>

          <button
            onClick={handleContinueModule}
            className={`mt-3 sm:mt-0 flex items-center gap-2 ${
              activeModule.completed
                ? "bg-green-500 hover:bg-green-600"
                : "bg-white hover:bg-gray-200 text-[#7b2020]"
            } px-4 py-2 rounded-md font-semibold text-[#7b2020] transition`}
          >
            {activeModule.completed ? (
              <>
                <CheckCircle className="w-5 h-5" /> Review
              </>
            ) : (
              <>
                <Play className="w-5 h-5" /> Continue
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
