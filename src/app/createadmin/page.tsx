"use client";

import Swal from "sweetalert2";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CloudinaryImage {
  public_id: string;
  url: string;
}

export default function CreateAdminPage() {
  const router = useRouter();

  const [avatar, setAvatar] = useState("");
  const [icons, setIcons] = useState<{ id: string; url: string }[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [loadingIcons, setLoadingIcons] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isValidForm, setIsValidForm] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [validationMsg, setValidationMsg] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formData, setFormData] = useState({
    admin_id: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ✅ Email + Password validation
  const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|edu\.ph|edu\.com)$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    const regex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=;'/\\\[\]`~])[A-Za-z\d!@#$%^&*(),.?":{}|<>_\-+=;'/\\\[\]`~]{8,}$/;
    return regex.test(password);
  };

  // ✅ Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Live validation
  useEffect(() => {
    let emailMsg = "";
    let passMsg = "";
    let confirmMsg = "";

    if (formData.email && !validateEmail(formData.email)) {
      emailMsg = "Email must end with @gmail.com, .edu.ph, or .edu.com";
    }

    if (formData.password && !validatePassword(formData.password)) {
      passMsg =
        "Password must be at least 8 characters, include 1 capital letter, 1 number, and 1 special character.";
    }

    if (
      formData.confirmPassword &&
      formData.confirmPassword !== formData.password
    ) {
      confirmMsg = "Passwords do not match";
    }

    setValidationMsg({
      email: emailMsg,
      password: passMsg,
      confirmPassword: confirmMsg,
    });

    const allValid =
      formData.admin_id.trim() &&
      formData.first_name.trim() &&
      formData.last_name.trim() &&
      validateEmail(formData.email) &&
      validatePassword(formData.password) &&
      formData.password === formData.confirmPassword;

    setIsValidForm(Boolean(allValid));
  }, [formData]);

  // ✅ Fetch Cloudinary Avatars
  useEffect(() => {
    let mounted = true;
    setLoadingIcons(true);

    fetch("/api/cloudinary/fetch1?folder=EIM/ADMIN")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load avatars");
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        const imgs: CloudinaryImage[] = json.images || [];
        setIcons(imgs.map((i) => ({ id: i.public_id, url: i.url })));
        if (imgs.length > 0) setAvatar(imgs[0].url);
      })
      .catch((err) => {
        console.error("Error fetching Cloudinary images:", err);
      })
      .finally(() => {
        if (mounted) setLoadingIcons(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Submit Admin Registration
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidForm) return;

    setLoading(true);

    Swal.fire({
      title: "Creating Admin...",
      text: "Please wait while we register your admin account.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, avatar }),
      });

      const data = await res.json();
      Swal.close();

      if (res.ok) {
        await Swal.fire({
          title: "✅ Admin Created!",
          text: "You can now log in as admin.",
          icon: "success",
          confirmButtonColor: "#BC2A2A",
        });
        router.push("/admin/login");
      } else {
        await Swal.fire({
          title: "❌ Registration Failed",
          text: data.error || "Something went wrong.",
          icon: "error",
          confirmButtonColor: "#BC2A2A",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire({
        title: "⚠️ Network Error",
        text: "Please try again later.",
        icon: "warning",
        confirmButtonColor: "#BC2A2A",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4 sm:px-6 md:px-10 py-10 relative">
      {/* Navbar */}
      <div className="w-full bg-[#BC2A2A] text-white flex items-center justify-between px-6 py-4 sm:py-5 shadow-md fixed top-0 left-0 z-50">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/resources/logo/tupc.png"
            alt="School Logo"
            width={42}
            height={42}
            className="sm:w-11 sm:h-11 rounded-full"
          />
          <h1 className="text-base sm:text-lg md:text-xl font-semibold leading-none tracking-wide">
            EIM
          </h1>
        </div>

        <button
          onClick={() => router.push("/")}
          className="bg-white text-[#BC2A2A] px-4 py-1.5 rounded-md font-semibold text-sm hover:bg-gray-100 transition"
        >
          Back
        </button>
      </div>

      {/* Content */}
      <div className="pt-20 flex flex-col items-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Admin Setup</h1>
        <p className="text-gray-600 font-medium mb-8 text-center text-sm sm:text-base">
          Create an admin account to manage content
        </p>

        {/* Avatar */}
        <div className="mb-6 relative">
          <Image
            src={avatar || "/resources/icons/prof1.png"}
            alt="Admin Avatar"
            width={90}
            height={90}
            className="sm:w-[100px] sm:h-[100px] rounded-full border-2 border-gray-300 object-cover"
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
          onSubmit={handleSubmit}
          className="w-full max-w-xs sm:max-w-sm flex flex-col space-y-4 text-left"
        >
          {[ 
            { name: "admin_id", label: "Admin ID", type: "text" },
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
                value={formData[field.name as keyof typeof formData]}
                onChange={handleChange}
                placeholder={`Enter ${field.label}`}
                className="border border-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BC2A2A] text-black"
                required
              />
            </div>
          ))}

          {/* Password Fields */}
          {[ 
            { name: "password", label: "Password", show: showPassword, setShow: setShowPassword },
            { name: "confirmPassword", label: "Confirm Password", show: showConfirmPassword, setShow: setShowConfirmPassword }
          ].map((field) => (
            <div key={field.name} className="flex flex-col relative">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.show ? "text" : "password"}
                value={formData[field.name as keyof typeof formData]}
                onChange={handleChange}
                placeholder={`Enter ${field.label}`}
                className="border border-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BC2A2A] text-black pr-10"
                required
              />
              <button
                type="button"
                onClick={() => field.setShow((prev) => !prev)}
                className="absolute right-3 top-8 hover:scale-110 transition"
              >
                <Image
                  src={field.show ? "/resources/icons/hide.png" : "/resources/icons/show.png"}
                  alt="Toggle"
                  width={22}
                  height={22}
                />
              </button>
            </div>
          ))}

          <button
            type="submit"
            disabled={!isValidForm || loading}
            className={`${
              !isValidForm || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#BC2A2A] hover:bg-red-700"
            } text-white font-semibold rounded-md py-2 transition mt-2 text-sm`}
          >
            {loading ? "Registering..." : "Create Admin"}
          </button>
        </form>
      </div>

      {/* Avatar Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-72 sm:w-96 shadow-lg relative">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
              Choose Admin Avatar
            </h2>
            {loadingIcons ? (
              <p className="text-center">Loading avatars...</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 place-items-center">
                {icons.length > 0 ? (
                  icons.map((img) => (
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
                          avatar === img.url ? "border-[#BC2A2A]" : "border-gray-300"
                        }`}
                      />
                    </button>
                  ))
                ) : (
                  <p className="text-center text-sm text-gray-600">
                    No avatars found.
                  </p>
                )}
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
