"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [idNumber, setIdNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleContinue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (!idNumber || !email) {
      setErrorMsg("Both ID Number and Email are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/forgotpass/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: idNumber, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Invalid ID or Email. Please try again.");
        await Swal.fire({
          title: "Verification Failed",
          text: data.error || "Invalid ID or Email. Please try again.",
          icon: "error",
          confirmButtonColor: "#BC2A2A",
        });
      } else {
        router.push(
  `/forgotpass/otp?id=${encodeURIComponent(idNumber)}&email=${encodeURIComponent(email)}`
);

      }
    } catch (error) {
      console.error("Verification error:", error);
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
      {/* 🔴 School Logo (clickable to go back home) */}
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

      {/* 🏫 Title Section */}
      <div className="text-center mt-5">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black">EIM</h1>
        <p className="text-gray-700 text-base sm:text-lg font-medium">
          <span className="font-semibold">Reset your Password</span>
        </p>
      </div>

      {/* 🧍‍♂️ Illustration */}
      <div className="mt-8 mb-6">
        <Image
          src="/resources/icons/mainicon.jpeg"
          alt="Student Icon"
          width={220}
          height={120}
          className="rounded-full object-cover"
        />
      </div>

      {/* 🧾 Verification Form */}
      <form
        onSubmit={handleContinue}
        className="w-full max-w-xs sm:max-w-sm flex flex-col space-y-4"
      >
        <input
          type="text"
          placeholder="ID NUMBER"
          value={idNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setIdNumber(e.target.value)
          }
          className="border border-black text-black rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#BC2A2A]"
          required
        />

        <input
          type="email"
          placeholder="EMAIL"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          className="border border-black text-black rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#BC2A2A]"
          required
        />

        {/* 🔴 Error Message */}
        {errorMsg && (
          <p className="text-red-600 text-sm text-center">{errorMsg}</p>
        )}

        {/* 🔘 Continue Button */}
        <button
          type="submit"
          disabled={loading || !idNumber || !email}
          className={`${
            loading || !idNumber || !email
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#BC2A2A] hover:bg-red-700"
          } text-white font-semibold rounded-md py-2 transition text-sm sm:text-base`}
        >
          {loading ? "Verifying..." : "Continue"}
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
          Remembered your password?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-[#BC2A2A] underline cursor-pointer"
          >
            Go back to login
          </span>
        </p>
      </div>
    </main>
  );
}
