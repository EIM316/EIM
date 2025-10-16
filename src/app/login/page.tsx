"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";

export default function LoginPage() {
  const router = useRouter();
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!idNumber || !password) {
      Swal.fire({
        title: "Missing Fields",
        text: "Please enter both ID number and password.",
        icon: "warning",
        confirmButtonColor: "#BC2A2A",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: idNumber, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        await Swal.fire({
          title: "Login Failed",
          text: data.error || "Invalid credentials. Please try again.",
          icon: "error",
          confirmButtonColor: "#BC2A2A",
        });
        return;
      }

      // ✅ Normalize and save user info
      const storedUser = {
        ...data.user,
        // Always ensure admin_id is saved (if admin)
        admin_id: data.userType === "admin" ? data.user.admin_id : null,
      };

      localStorage.setItem("user", JSON.stringify(storedUser));
      localStorage.setItem("userType", data.userType);

      await Swal.fire({
        title: "✅ Login Successful",
        text: `Welcome back, ${data.user.first_name}!`,
        icon: "success",
        confirmButtonColor: "#BC2A2A",
        timer: 1500,
        showConfirmButton: false,
      });

      // ✅ Redirect based on user type
      switch (data.userType) {
        case "admin":
          router.push("/admin");
          break;
        case "teacher":
          router.push("/teacher");
          break;
        case "student":
          router.push("/student");
          break;
       
      }
    } catch (error) {
      console.error("Login error:", error);
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6 relative">
      {/* 🔴 School Logo */}
      <div
        className="absolute top-6 left-6 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <Image
          src="/resources/logo/tupc.png"
          alt="School Logo"
          width={50}
          height={50}
          className="rounded-full hover:opacity-80 transition"
        />
      </div>

      {/* 🏫 Title */}
      <div className="text-center mt-5">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black">EIM</h1>
        <p className="text-gray-700 text-base sm:text-lg font-medium">
          <span className="font-semibold">Login now</span> to start having fun!
        </p>
      </div>

      {/* 🧍‍♂️ Avatar */}
      <div className="mt-8 mb-6">
        <Image
          src="/resources/icons/mainicon.jpeg"
          alt="User Icon"
          width={220}
          height={120}
          className="rounded-full object-cover"
        />
      </div>

      {/* 🧾 Login Form */}
      <form
        onSubmit={handleLogin}
        className="w-full max-w-xs sm:max-w-sm flex flex-col space-y-4"
      >
        <input
          type="text"
          placeholder="ID NUMBER"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          className="border border-black text-black rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#BC2A2A]"
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-black text-black rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#BC2A2A] pr-10"
            required
          />
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            <Image
              src={
                showPassword
                  ? "/resources/icons/hide.png"
                  : "/resources/icons/show.png"
              }
              alt={showPassword ? "Hide Password" : "Show Password"}
              width={27}
              height={22}
            />
          </div>
        </div>

        {/* 🔘 Login Button */}
        <button
          type="submit"
          disabled={loading}
          className={`${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#BC2A2A] hover:bg-red-700"
          } text-white font-semibold rounded-md py-2 transition text-sm sm:text-base`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* 🔗 Links */}
      <div className="text-center mt-4 text-sm sm:text-base text-gray-700">
        <p
          className="cursor-pointer hover:underline"
          onClick={() => router.push("/registration")}
        >
          Create account
        </p>
        <p className="mt-1">
          Forgot your password?{" "}
          <span
            onClick={() => router.push("/forgotpass")}
            className="text-[#BC2A2A] underline cursor-pointer"
          >
            Click here
          </span>
        </p>
      </div>
    </main>
  );
}
