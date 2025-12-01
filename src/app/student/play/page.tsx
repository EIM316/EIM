"use client";

declare global {
  interface Window {
    Android?: {
      saveBase64ToDownloads?: (base64Data: string, filename: string) => void;
    };
  }
}

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Search, X, ArrowLeft, PlayCircle } from "lucide-react";
import Swal from "sweetalert2";

export default function PlayPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string>("");
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [currentRoute, setCurrentRoute] = useState<string>("");
  const [showManualOptions, setShowManualOptions] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const pdfUrl = "https://drive.google.com/file/d/1230Pxr03zORQt-0wKX7hs1CVuICbBuwl/view?usp=sharing";
  const pdfDirectUrl = "https://drive.google.com/uc?export=download&id=1230Pxr03zORQt-0wKX7hs1CVuICbBuwl";
  const pdfEmbedUrl = "https://drive.google.com/file/d/1230Pxr03zORQt-0wKX7hs1CVuICbBuwl/preview";

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }

    setUser(JSON.parse(savedUser));
  }, [router]);

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
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        localStorage.removeItem("studentClass");
        router.push("/");
      }
    });
  };

  const openTutorial = (videoId: string, title: string, route: string) => {
    setCurrentVideo(videoId);
    setVideoTitle(title);
    setCurrentRoute(route);
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    setCurrentVideo("");
    setVideoTitle("");
    setCurrentRoute("");
  };

  const playGame = () => {
    closeTutorial();
    if (currentRoute) {
      router.push(currentRoute);
    }
  };

  const handleDownloadManual = async () => {
    try {
      // Check if running on Android app
      if (typeof window !== "undefined" && window.Android?.saveBase64ToDownloads) {
        const response = await fetch(pdfDirectUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const base64data = reader.result?.toString().split(',')[1];
          if (base64data && window.Android?.saveBase64ToDownloads) {
            window.Android.saveBase64ToDownloads(base64data, "Game_Manual.pdf");
            Swal.fire({
              icon: "success",
              title: "Downloaded!",
              text: "User manual saved to Downloads folder",
              confirmButtonColor: "#7b2020",
            });
          }
        };
        reader.readAsDataURL(blob);
      } else {
        // Regular browser download
        const link = document.createElement("a");
        link.href = pdfDirectUrl;
        link.download = "Game_Manual.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Swal.fire({
          icon: "success",
          title: "Downloading...",
          text: "User manual is being downloaded",
          confirmButtonColor: "#7b2020",
          timer: 2000,
        });
      }
      setShowManualOptions(false);
    } catch (error) {
      console.error("Download error:", error);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Could not download the manual. Please try again.",
        confirmButtonColor: "#7b2020",
      });
    }
  };

  const handleViewManual = () => {
    setShowManualOptions(false);
    setShowPdfViewer(true);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading student data...
      </div>
    );
  }

  const gameModes = [
    {
      title: "REFRESHER",
      desc: "AT YOUR OWN PACE",
      img: "/resources/modes/refresher.png",
      route: "/student/play/refresher",
      videoId: "ci7Iw5u1AoQ",
    },
    {
      title: "QUIZ MODE",
      desc: "WITH TIMER",
      img: "/resources/modes/quiz.png",
      route: "/student/play/quizmode",
      videoId: "z1bQWPVbrKg",
    },
    {
      title: "CLASS MODE",
      desc: "JOIN A CLASS",
      img: "/resources/modes/class.png",
      route: "/student/play/classmode",
      videoId: "kQ31c6amHZY",
    },
    {
      title: "SCHEMATIC BUILDER",
      desc: "CREATE & SOLVE DIAGRAMS",
      img: "/resources/modes/schematic.png",
      route: "/student/play/gametest/1",
      videoId: "JDLgaKtUdjw",
    },
    {
      title: "PHASE RUSH",
      desc: "FAST REACTION QUIZ",
      img: "/resources/modes/phaserush.png",
      route: "/student/play/gametest/2",
      videoId: "ugNiOXtfnI4",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ✅ Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative mb-8">
        <div className="flex items-center space-x-3 cursor-pointer">
          <button
            onClick={() => router.push("/student")}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
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

        {/* Tutorial Button */}
        <button
          onClick={() => setShowManualOptions(true)}
          className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md transition flex items-center gap-2"
        >
          <span className="text-sm font-medium">📖 Tutorial</span>
        </button>
      </header>

      {/* ✅ Main content */}
      <main className="mb-55 flex flex-col items-center justify-center w-full flex-1 px-4 max-w-6xl mx-auto text-center">
        <h2 className="text-xl font-bold text-[#7b2020] mb-6">
          🎮 Choose Your Mode
        </h2>

        <div className="grid grid-cols-2 gap-6 sm:gap-8 place-items-center">
          {gameModes.map((mode, i) => (
            <div
              key={i}
              className="relative w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] border border-gray-400 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white hover:scale-105 hover:shadow-lg transition-all group"
            >
              {/* Tutorial Button - Always Visible on Mobile */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openTutorial(mode.videoId, mode.title, mode.route);
                }}
                className="absolute top-2 right-2 bg-[#7b2020] hover:bg-[#5a1515] text-white p-1.5 rounded-full shadow-md transition-all z-10 sm:opacity-0 sm:group-hover:opacity-100"
                title="Watch Tutorial"
              >
                <PlayCircle className="w-4 h-4" />
              </button>

              {/* Main Card Content */}
              <div
                onClick={() => router.push(mode.route)}
                className="cursor-pointer w-full h-full flex flex-col items-center justify-center"
              >
                <div className="flex items-center justify-center h-16 mb-2">
                  <Image
                    src={mode.img}
                    alt={mode.title}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#7b2020] leading-tight">
                    {mode.title}
                  </h3>
                  <p className="text-gray-600 text-[11px] mt-[1px]">
                    {mode.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ✅ Tutorial Video Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
          <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden">
            {/* Close Button */}
            <button
              onClick={closeTutorial}
              className="absolute top-3 right-3 z-20 bg-[#7b2020] hover:bg-[#5a1515] text-white rounded-full p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Title */}
            <div className="bg-[#7b2020] text-white px-6 py-3">
              <h3 className="text-lg font-bold">
                📺 {videoTitle} Tutorial
              </h3>
            </div>

            {/* Video Player */}
            <div className="relative pt-[56.25%] bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${currentVideo}?autoplay=1&rel=0`}
                title={`${videoTitle} Tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              ></iframe>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">
                Watch this tutorial to learn how to play {videoTitle}
              </p>
              <button
                onClick={playGame}
                className="mt-3 bg-[#7b2020] hover:bg-[#5a1515] text-white px-6 py-2 rounded-md transition-all"
              >
                Got it, let's play!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Manual Options Modal */}
      {showManualOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setShowManualOptions(false)}
              className="absolute top-3 right-3 z-20 bg-[#7b2020] hover:bg-[#5a1515] text-white rounded-full p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="bg-[#7b2020] text-white px-6 py-4">
              <h3 className="text-lg font-bold">📖 Game User Manual</h3>
            </div>

            {/* Options */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 text-center mb-4">
                Choose how you want to access the game manual
              </p>

              <button
                onClick={handleViewManual}
                className="w-full bg-[#7b2020] hover:bg-[#5a1515] text-white px-6 py-3 rounded-md transition-all flex items-center justify-center gap-3"
              >
                <span className="text-2xl">👁️</span>
                <span className="font-medium">View Manual</span>
              </button>

              <button
                onClick={handleDownloadManual}
                className="w-full bg-[#548E28] hover:bg-[#3e6a20] text-white px-6 py-3 rounded-md transition-all flex items-center justify-center gap-3"
              >
                <span className="text-2xl">📥</span>
                <span className="font-medium">Download Manual</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ PDF Viewer Modal */}
      {showPdfViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
          <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setShowPdfViewer(false)}
              className="absolute top-3 right-3 z-20 bg-[#7b2020] hover:bg-[#5a1515] text-white rounded-full p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="bg-[#7b2020] text-white px-6 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">📖 Game User Manual</h3>
              <button
                onClick={handleDownloadManual}
                className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-sm transition"
              >
                📥 Download
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="w-full h-[calc(100%-60px)]">
              <iframe
                src={pdfEmbedUrl}
                className="w-full h-full border-0"
                title="Game User Manual"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}