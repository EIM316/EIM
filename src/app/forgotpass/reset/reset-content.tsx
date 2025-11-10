"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
const idNumber = searchParams.get("id_number");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidForm, setIsValidForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationMsg, setValidationMsg] = useState({ password: "", confirm: "" });

  const validatePassword = (pass: string) => {
    const regex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=;'/\\\[\]`~])[A-Za-z\d!@#$%^&*(),.?":{}|<>_\-+=;'/\\\[\]`~]{8,}$/;
    return regex.test(pass);
  };

  useEffect(() => {
    let passMsg = "";
    let confirmMsg = "";

    if (password && !validatePassword(password)) {
      passMsg =
        "Password must be at least 8 characters, include 1 capital letter, 1 number, and 1 special character.";
    }

    if (confirmPassword && confirmPassword !== password) {
      confirmMsg = "Passwords do not match";
    }

    setValidationMsg({ password: passMsg, confirm: confirmMsg });
    setIsValidForm(validatePassword(password) && password === confirmPassword);
  }, [password, confirmPassword]);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidForm || !idNumber) return;

    setLoading(true);
    Swal.fire({
      title: "Resetting Password...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch("/api/forgotpass/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: idNumber, password }),
      });

      const result = await res.json();
      Swal.close();

      if (!res.ok) {
        Swal.fire({
          title: "❌ Failed",
          text: result.error || "Could not reset password.",
          icon: "error",
          confirmButtonColor: "#BC2A2A",
        });
      } else {
        Swal.fire({
          title: "✅ Password Reset!",
          text: "Your password has been updated successfully!",
          icon: "success",
          confirmButtonColor: "#BC2A2A",
        }).then(() => router.push("/login"));
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6 relative">
      {/* 🔴 School Logo */}
      <div className="absolute top-6 left-6 cursor-pointer" onClick={() => router.push("/")}>
        <Image
          src="/resources/logo/tupc.png"
          alt="School Logo"
          width={50}
          height={50}
          className="rounded-full hover:opacity-80 transition"
        />
      </div>

      {/* Title */}
      <div className="text-center mt-5">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black">EIM</h1>
        <p className="text-gray-700 text-base sm:text-lg font-medium">
          Reset your password
        </p>
      </div>

      {/* Illustration */}
      <div className="mt-8 mb-6">
        <Image
          src="/resources/icons/mainicon.jpeg"
          alt="Student Icon"
          width={220}
          height={120}
          className="rounded-full object-cover"
        />
      </div>

      {/* Reset Password Form */}
      <form onSubmit={handleReset} className="w-full max-w-xs sm:max-w-sm flex flex-col space-y-4">
        {validationMsg.password && (
          <p className="text-xs text-red-600 mt-1">{validationMsg.password}</p>
        )}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-black border border-black rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#BC2A2A] pr-10"
            required
          />
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            <Image
              src={showPassword ? "/resources/icons/hide.png" : "/resources/icons/show.png"}
              alt={showPassword ? "Hide Password" : "Show Password"}
              width={27}
              height={22}
            />
          </div>
        </div>

        {validationMsg.confirm && (
          <p className="text-xs text-red-600 mt-1">{validationMsg.confirm}</p>
        )}
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border text-black border-black rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#BC2A2A] pr-10"
            required
          />
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            <Image
              src={showConfirmPassword ? "/resources/icons/hide.png" : "/resources/icons/show.png"}
              alt={showConfirmPassword ? "Hide Password" : "Show Password"}
              width={27}
              height={22}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValidForm || loading}
          className={`${
            !isValidForm || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#BC2A2A] hover:bg-red-700"
          } text-white font-semibold rounded-md py-2 transition text-sm sm:text-base`}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </main>
  );
}