"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Home,
  Menu,
  LogOut,
  X,
  Settings,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import Swal from "sweetalert2";

interface CloudinaryImage {
  id: string;
  url: string;
}

export default function StudentSettingsPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatar, setAvatar] = useState<string>("");
  const [icons, setIcons] = useState<CloudinaryImage[]>([]);
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [loadingIcons, setLoadingIcons] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    id_number: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ✅ Fetch student data from DB via API
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/");
      return;
    }

    const parsed = JSON.parse(savedUser);
    const id_number = parsed.id_number;

    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/student/get?id_number=${id_number}`);
        const data = await res.json();

        if (res.ok && data.success) {
          const student = data.student;
          setFormData({
            id_number: student.id_number,
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            password: "",
            confirmPassword: "",
          });
          setAvatar(student.avatar || "/resources/icons/stud1.jpg");
        } else {
          Swal.fire("Error", data.error || "Failed to load student info.", "error");
          router.push("/");
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
        Swal.fire("Error", "Network error while fetching profile.", "error");
      }
    };

    fetchStudent();
  }, [router]);

  // ✅ Fetch Cloudinary Avatars
  useEffect(() => {
    fetch("/api/cloudinary/fetch")
      .then((res) => res.json())
      .then((json) => {
        const imgs: CloudinaryImage[] = json.images || [];
        setIcons(imgs.map((i: any) => ({ id: i.public_id, url: i.url })));
      })
      .finally(() => setLoadingIcons(false));
  }, []);

  // ✅ Disable background scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    document.body.style.touchAction = menuOpen ? "none" : "";
  }, [menuOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Save updated student info via API
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Optional: check password confirmation
    if (formData.password !== formData.confirmPassword) {
      Swal.fire("Error", "Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    Swal.fire({
      title: "Saving...",
      text: "Updating your profile settings.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch("/api/student/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, avatar }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const updated = data.student;
        localStorage.setItem("user", JSON.stringify(updated));
        Swal.fire("✅ Success", "Profile updated successfully!", "success");
        setFormData((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
        }));
      } else {
        Swal.fire("Error", data.error || "Failed to update profile.", "error");
      }
    } catch (err) {
      console.error("❌ Update error:", err);
      Swal.fire("Error", "Network error occurred while saving.", "error");
    } finally {
      setLoading(false);
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

  return (
    <main className="min-h-screen flex flex-col items-center bg-white relative overflow-x-hidden">
      {/* ✅ Navbar */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md fixed top-0 left-0 z-50">
        <div className="flex items-center gap-3">
          <Menu
            className="w-7 h-7 cursor-pointer hover:opacity-80 transition"
            onClick={() => setMenuOpen(true)}
          />
          <Image
            src={avatar || "/student-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">
            {formData.first_name?.toUpperCase()}
          </span>
        </div>
        <LogOut
          onClick={handleLogout}
          className="w-6 h-6 cursor-pointer hover:opacity-80"
        />
      </header>

      {/* ✅ Hamburger Menu Overlay */}
      <div
        className={`fixed top-0 left-0 w-full h-full bg-[#7b2020] text-white z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
              router.push("/student");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <Home className="w-5 h-5" /> Home
          </button>

          <button
            onClick={() => {
              router.push("/student/settings");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <Settings className="w-5 h-5" /> Profile Settings
          </button>

          <button
            onClick={() => {
              router.push("/student/performance");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <BarChart3 className="w-5 h-5" /> Performance
          </button>

          <button
            onClick={() => {
              router.push("/student/reportaproblem");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <AlertTriangle className="w-5 h-5" /> Report a Problem
          </button>
        </div>

        {/* Logout */}
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

      {/* ✅ Content */}
      <div className="pt-24 flex flex-col items-center w-full px-6">
        <h1 className="text-2xl font-bold text-black mb-2">Profile Settings</h1>
        <p className="text-gray-600 mb-6 text-sm text-center">
          Update your profile information below.
        </p>

        {/* Avatar */}
        <div className="mb-6 relative">
          <Image
            src={avatar}
            alt="Student Avatar"
            width={90}
            height={90}
            className="rounded-full border-2 border-gray-300 object-cover"
          />
          <button
            onClick={() => setShowSelector(true)}
            className="absolute bottom-0 right-0 rounded-full bg-white border border-gray-300 shadow hover:scale-105 transition p-1"
          >
            <Image
              src="/resources/others/changeicon.png"
              alt="Change Avatar"
              width={24}
              height={24}
            />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSave}
          className="w-full max-w-xs sm:max-w-sm flex flex-col space-y-4 text-left"
        >
          {[ 
            { name: "id_number", label: "ID Number", type: "text", readOnly: true },
            { name: "first_name", label: "First Name", type: "text" },
            { name: "last_name", label: "Last Name", type: "text" },
            { name: "email", label: "Email", type: "email" },
          ].map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.type}
                value={(formData as any)[field.name]}
                onChange={handleChange}
                readOnly={field.readOnly}
                className={`border border-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b2020] text-black ${
                  field.readOnly ? "bg-gray-100" : ""
                }`}
              />
            </div>
          ))}

          {/* Password fields */}
          <div className="flex flex-col relative">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              New Password
            </label>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
              className="border border-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b2020] text-black pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-8 text-gray-500"
            >
              <Image
                src={
                  showPassword
                    ? "/resources/icons/hide.png"
                    : "/resources/icons/show.png"
                }
                alt="Toggle"
                width={27}
                height={22}
              />
            </button>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className="border border-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b2020] text-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#7b2020] hover:bg-red-800"
            } text-white font-semibold rounded-md py-2 transition text-sm`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* ✅ Avatar Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-72 sm:w-96 shadow-lg relative">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
              Choose Your Avatar
            </h2>
            {loadingIcons ? (
              <p className="text-center">Loading avatars...</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 place-items-center">
                {icons.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      setAvatar(img.url);
                      setShowSelector(false);
                    }}
                    className="hover:scale-110 transition"
                  >
                    <Image
                      src={img.url}
                      alt={img.id}
                      width={70}
                      height={70}
                      className={`rounded-full border-2 object-cover ${
                        avatar === img.url
                          ? "border-[#7b2020]"
                          : "border-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowSelector(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black text-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
