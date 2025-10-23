"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, Plus, Copy, Settings, Users, LogOut } from "lucide-react";
import Swal from "sweetalert2";

interface ClassItem {
  id: number;
  name: string;
  code: string;
  students: number;
}

export default function TeacherPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "teacher") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Generate a new class code
  const generateClassCode = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    setClassCode(code);
  };

  // ✅ Copy code to clipboard
  const copyCode = () => {
    navigator.clipboard.writeText(classCode);
    Swal.fire({
      title: "Copied!",
      text: `Class code ${classCode} copied to clipboard.`,
      icon: "success",
      confirmButtonColor: "#7b2020",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  // ✅ Fetch teacher’s class list from API
  useEffect(() => {
    if (user) {
      fetch(`/api/class/list?teacher_id=${user.id_number}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setClassList(data.classes);
          }
        })
        .catch(() => {
          console.error("Failed to load classes");
        });
    }
  }, [user]);

  // ✅ Create class via API
  const handleCreateClass = async () => {
    if (!className.trim()) {
      Swal.fire("Error", "Please enter a class name.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/class/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: user.id_number,
          class_name: className,
          class_code: classCode,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Swal.fire({
          title: "Class Created!",
          text: `Class "${className}" has been created successfully.`,
          icon: "success",
          confirmButtonColor: "#7b2020",
        });

        setClassList([...classList, data.class]);
        setClassName("");
        setShowForm(false);
      } else {
        Swal.fire("Error", data.error || "Failed to create class.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showForm) generateClassCode();
  }, [showForm]);

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
        router.push("/");
      }
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading teacher data...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center space-x-3">
          <Image
            src={user.avatar || "/teacher-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">
            Prof. {user.first_name?.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={handleLogout}
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center w-full p-5">
        {classList.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center text-center mt-40">
            <Image
              src="/resources/icons/classbg.png"
              alt="Empty class"
              width={120}
              height={120}
              className="opacity-60 mb-4"
            />
            <p className="text-gray-700 font-medium px-4">
              Your class list is empty.{" "}
              <span className="text-[#7b2020]">
                Create a new class to start managing students, lessons, and
                progress.
              </span>
            </p>
          </div>
        )}

        {/* Create Class Form */}
        {showForm && (
          <div className="bg-[#7b2020] p-5 rounded-xl text-white w-[90%] max-w-sm mt-10">
            <label className="block mb-2 font-semibold">Name of Class</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Enter class name"
              className="w-full px-3 py-2 rounded-md text-black mb-4 bg-white"
            />

            <label className="block mb-2 font-semibold">Class Code</label>
            <div className="flex items-center bg-white rounded-md px-3 py-2 mb-4">
              <span className="text-black font-semibold flex-1">
                {classCode}
              </span>
              <Copy
                onClick={copyCode}
                className="text-black cursor-pointer w-5 h-5 ml-2"
              />
            </div>

            <button
              onClick={handleCreateClass}
              disabled={loading}
              className="bg-white text-[#7b2020] px-4 py-2 rounded-lg w-full font-semibold disabled:opacity-70"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        )}

        {/* Class Grid */}
        {!showForm && classList.length > 0 && (
          <div className="grid grid-cols-2 gap-4 w-full mt-6 px-2">
            {classList.map((cls) => (
              <div
                key={cls.id}
               onClick={() => router.push(`/teacher/class?class_id=${cls.id}`)}

                className="bg-[#7b2020] text-white rounded-2xl aspect-square flex flex-col justify-center items-center relative shadow-md cursor-pointer hover:bg-[#8b2a2a] transition-all"
              >
                <Settings className="absolute top-3 right-3 cursor-pointer" />
                <h2 className="text-lg font-bold text-center px-2">
                  {cls.name}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2 text-sm">
                  <Users className="w-5 h-5" /> {cls.students}
                </div>
                <p className="text-xs mt-1">Code: {cls.code}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-full p-4 fixed bottom-6 right-6 shadow-lg transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
