"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mask email for privacy
  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@");
    if (!name || !domain) return email;
    const maskedName =
      name.length <= 1 ? "*" : name[0] + "*".repeat(Math.max(1, name.length - 1));
    return `${maskedName}@${domain}`;
  };

  // Load query params
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const idParam = searchParams.get("id");

    if (emailParam && idParam) {
      setEmail(emailParam);
      setIdNumber(idParam);
      setMaskedEmail(maskEmail(emailParam));
      sendInitialOtp(idParam, emailParam);
    }
  }, [searchParams]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Send OTP on page load
  const sendInitialOtp = async (id: string, emailValue: string) => {
    setInputEnabled(false);
    setOtp(Array(6).fill("")); // clear inputs
    try {
      const res = await fetch("/api/forgotpass/vcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: id, email: emailValue }),
      });

      const data = await res.json();
      

     
      // ✅ Enable input after OTP is sent
      setInputEnabled(true);
      setTimeLeft(60);
      setCanResend(false);
    } catch (err: any) {
      Swal.fire({
        title: "⚠️ Failed to Send OTP",
        text: err.message || "Please try again later.",
        icon: "error",
        confirmButtonColor: "#BC2A2A",
      });
    }
  };

  // Handle OTP input change
  const handleChange = (index: number, value: string) => {
    if (!inputEnabled) return;
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!inputEnabled) return;
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEnabled) return;

    const otpCode = otp.join("");
    console.log("🔍 OTP INPUT:", otpCode); // Debug log
    console.log("📦 Sending payload:", { id_number: idNumber, code: otpCode });

    if (otpCode.length < 6) {
      Swal.fire({
        title: "Incomplete OTP",
        text: "Please enter the 6-digit code.",
        icon: "warning",
        confirmButtonColor: "#BC2A2A",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/forgotpass/vcode2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: idNumber, code: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid or expired OTP");

      console.log("✅ OTP Verified Successfully", data);

      Swal.fire({
        title: "✅ Verified!",
        text: "OTP verified successfully.",
        icon: "success",
        confirmButtonColor: "#BC2A2A",
      }).then(() =>
        router.push(`/forgotpass/reset?id_number=${idNumber}&email=${email}`)
      );
    } catch (err: any) {
      console.error("❌ OTP Verification Error:", err);
      Swal.fire({
        title: "❌ Invalid OTP",
        text: err.message || "The code you entered is incorrect or expired.",
        icon: "error",
        confirmButtonColor: "#BC2A2A",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!email || !idNumber) return;
    setCanResend(false);
    setTimeLeft(60);
    setInputEnabled(false);
    setOtp(Array(6).fill(""));

    try {
      const res = await fetch("/api/forgotpass/vcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: idNumber, email }),
      });

      const data = await res.json();
     

      Swal.fire({
        title: "📩 OTP Sent Again",
        text: "A new verification code has been sent to your email.",
        icon: "info",
        confirmButtonColor: "#BC2A2A",
      });

      setInputEnabled(true);
    } catch (err: any) {
      Swal.fire({
        title: "⚠️ Failed",
        text: err.message || "Could not resend OTP. Please try again later.",
        icon: "error",
        confirmButtonColor: "#BC2A2A",
      });
      setCanResend(true);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6 relative">
      {/* Logo */}
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

      {/* Title */}
      <div className="text-center mt-5">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black">EIM</h1>
        <p className="text-gray-700 text-base sm:text-lg font-medium">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      {/* Masked Email */}
      <p className="text-gray-500 text-sm mt-3">{maskedEmail}</p>

      {/* OTP Input */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col items-center space-y-6"
      >
        <div className="flex space-x-3 sm:space-x-4">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}

              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={!inputEnabled}
              className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-semibold border rounded-md focus:outline-none focus:ring-2 ${
                inputEnabled
                  ? "border-gray-400 focus:ring-[#BC2A2A] text-black"
                  : "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-gray-700 text-sm sm:text-base">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-[#BC2A2A] hover:underline font-semibold"
            >
              Resend OTP
            </button>
          ) : (
            <p>Resend available in {timeLeft}s</p>
          )}
        </div>

        {/* Verify Button */}
        <button
          type="submit"
          disabled={loading || !inputEnabled}
          className={`${
            loading || !inputEnabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#BC2A2A] hover:bg-red-700"
          } text-white font-semibold rounded-md py-2 px-10 transition text-sm sm:text-base`}
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </main>
  );
}
