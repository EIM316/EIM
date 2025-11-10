"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, Plus, Copy, Settings, Users, LogOut, Trash2, X,Home, BarChart3, AlertTriangle  } from "lucide-react";
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
  const [showSettings, setShowSettings] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [newClassName, setNewClassName] = useState("");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

// disable scrolling when menu is open
useEffect(() => {
  document.body.style.overflow = menuOpen ? "hidden" : "";
  document.body.style.touchAction = menuOpen ? "none" : "";
}, [menuOpen]);


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
          if (data.success) setClassList(data.classes);
        })
        .catch(() => console.error("Failed to load classes"));
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

        const refreshRes = await fetch(`/api/class/list?teacher_id=${user.id_number}`);
        const refreshData = await refreshRes.json();

        if (refreshData.success) setClassList(refreshData.classes);

        setClassName("");
        setShowForm(false);
      } else {
        Swal.fire("Error", data.error || "Failed to create class.", "error");
      }
    } catch {
      Swal.fire("Error", "Server error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showForm) generateClassCode();
  }, [showForm]);

  // ✅ Logout confirmation
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

  // ✅ Delete class with confirmation
  const handleDeleteClass = async (classId: number, className: string) => {
    Swal.fire({
      title: "Delete Class?",
      text: `Are you sure you want to permanently delete "${className}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/class/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ class_id: classId }),
          });

          const data = await res.json();

          if (data.success) {
            Swal.fire({
              title: "Deleted!",
              text: `Class "${className}" has been deleted.`,
              icon: "success",
              confirmButtonColor: "#7b2020",
            });
            setClassList((prev) => prev.filter((cls) => cls.id !== classId));
            setShowSettings(false);
          } else {
            Swal.fire("Error", data.error || "Failed to delete class.", "error");
          }
        } catch {
          Swal.fire("Error", "Server error occurred.", "error");
        }
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
  <Menu
    className="w-7 h-7 cursor-pointer hover:opacity-80 transition"
    onClick={() => setMenuOpen(true)}
  />
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
{/* ✅ Full-Screen Hamburger Menu */}
{menuOpen && (
  <div className="fixed top-0 left-0 w-full h-full bg-[#7b2020] text-white z-50 flex flex-col transition-all">
    {/* Top bar */}
    <div className="flex items-center justify-between px-6 py-5 border-b border-white/20">
      <span className="text-xl font-bold">Menu</span>
      <X
        onClick={() => setMenuOpen(false)}
        className="w-8 h-8 cursor-pointer hover:opacity-80 transition"
      />
    </div>

    {/* Menu Items */}
    <div className="flex flex-col mt-6 px-6 space-y-6">
      <button
        onClick={() => {
          router.push("/teacher");
          setMenuOpen(false);
        }}
        className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
      >
        <Users className="w-5 h-5" /> My Classes
      </button>

      <button
        onClick={() => {
          router.push("/teacher/settings");
          setMenuOpen(false);
        }}
        className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
      >
        <Settings className="w-5 h-5" /> Profile Settings
      </button>

      

      <button
        onClick={() => {
          router.push("/teacher/reportaproblem");
          setMenuOpen(false);
        }}
        className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
      >
        <AlertTriangle className="w-5 h-5" /> Report a Problem
      </button>
    </div>

    {/* Logout Section */}
    <div className="mt-auto border-t border-white/20 px-6 py-5">
      <button
        onClick={() => {
          setMenuOpen(false);
          handleLogout();
        }}
        className="flex items-center gap-3 text-lg font-semibold hover:text-gray-300 transition"
      >
        <LogOut className="w-5 h-5" /> Log Out
      </button>
    </div>
  </div>
)}

       {showForm && (
  <div className="bg-[#7b2020] p-5 rounded-xl text-white w-[90%] max-w-sm mt-10 relative">
    

    <h2 className="text-center text-xl font-bold mb-4 mt-4">Create New Class</h2>

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
      <span className="text-black font-semibold flex-1">{classCode}</span>
      <Copy
        onClick={copyCode}
        className="text-black cursor-pointer w-5 h-5 ml-2"
      />
    </div>

    <button
      onClick={handleCreateClass}
      disabled={loading}
      className="mt-4 bg-white text-[#7b2020] px-4 py-2 rounded-lg w-full font-semibold disabled:opacity-70"
    >
      {loading ? "Creating..." : "Create"}
    </button>
    {/* 🔙 Back Button */}
    <button
      onClick={() => setShowForm(false)}
      className="mt-5 bg-white text-[#7b2020] px-4 py-2 rounded-lg w-full font-semibold disabled:opacity-70"
    >
      Back
    </button>
  </div>
)}

  {/* Class Grid */}
{!showForm && classList.length > 0 && (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full mt-6 px-3">
    {classList.map((cls) => (
      <div
        key={cls.id}
        onClick={() => router.push(`/teacher/class?class_id=${cls.id}`)}
        className="bg-[#7b2020] text-white rounded-2xl aspect-square flex flex-col justify-center items-center relative shadow-md cursor-pointer hover:bg-[#8b2a2a] transition-all overflow-hidden"
      >
        {/* ⚙️ Gear Icon */}
        <div
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-[#ffffff22] transition"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedClass(cls);
            setShowSettings(true);
          }}
        >
          <Settings className="w-5 h-5 cursor-pointer" />
        </div>

        {/* 📘 Class Name */}
        <h2
          className="text-base sm:text-lg font-bold text-center px-3 mt-1 leading-tight truncate w-[85%] max-w-[160px]"
          title={cls.name}
        >
          {cls.name}
        </h2>

        {/* 👥 Student Count */}
        <div className="flex items-center justify-center gap-1 mt-2 text-xs sm:text-sm opacity-90">
          <Users className="w-4 h-4" /> {cls.students}
        </div>

        {/* 🔢 Class Code */}
        <p className="text-[11px] sm:text-xs mt-2 opacity-80 break-all px-2 text-center">
          Code: {cls.code}
        </p>
      </div>
    ))}
  </div>
)}

      </main>

      {/* ⚙️ SETTINGS MODAL */}
      {showSettings && selectedClass && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-[90%] max-w-sm p-6 rounded-lg shadow-lg relative text-center">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✖
            </button>
            <h2 className="text-[#7b2020] font-bold text-lg mb-4">⚙️ Class Options</h2>
            <p className="text-gray-700 font-medium mb-6">{selectedClass.name}</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowRenameModal(true);
                  setNewClassName(selectedClass.name);
                }}
                className="w-full bg-[#7b2020] text-white font-semibold py-2 rounded-md hover:bg-[#5f1717]"
              >
                ✏️ Update Name
              </button>

              <button
                onClick={() =>
                  handleDeleteClass(selectedClass.id, selectedClass.name)
                }
                className="w-full bg-red-600 text-white font-semibold py-2 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ RENAME MODAL */}
      {showRenameModal && selectedClass && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-[90%] max-w-sm p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setShowRenameModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✖
            </button>

            <h2 className="text-[#7b2020] font-bold text-lg mb-4 text-center">
              ✏️ Update Class Name
            </h2>

            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Enter new class name"
              className="w-full border-2 border-[#7b2020] rounded-md p-2 text-sm mb-4 text-gray-700"
            />

            <button
              onClick={async () => {
                if (!newClassName.trim()) {
                  Swal.fire("Error", "Please enter a new class name.", "error");
                  return;
                }

                try {
                  const res = await fetch("/api/class/update", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      class_id: selectedClass.id,
                      new_name: newClassName.trim(),
                    }),
                  });

                  const data = await res.json();

                  if (data.success) {
                    Swal.fire({
                      title: "Updated!",
                      text: "Class name updated successfully.",
                      icon: "success",
                      confirmButtonColor: "#7b2020",
                    });

                    setClassList((prev) =>
                      prev.map((c) =>
                        c.id === selectedClass.id
                          ? { ...c, name: newClassName.trim() }
                          : c
                      )
                    );

                    setShowRenameModal(false);
                  } else {
                    Swal.fire("Error", data.error || "Failed to update class name.", "error");
                  }
                } catch {
                  Swal.fire("Error", "Server error occurred.", "error");
                }
              }}
              className="w-full bg-[#7b2020] text-white font-semibold py-2 rounded-md hover:bg-[#5f1717]"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ➕ Floating Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-full p-4 fixed bottom-6 right-6 shadow-lg transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
