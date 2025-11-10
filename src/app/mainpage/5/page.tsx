"use client";

import { useState } from "react";
import Swal from "sweetalert2";

export default function Section5() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !message.trim()) {
      Swal.fire("Error", "Please fill in both fields before sending.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_number: "N/A", // Feedback is general, not student/teacher-specific
          email,
          message,
          userType: "student", // use a custom type for tracking
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Swal.fire({
          title: "✅ Feedback Sent!",
          text: "Thank you for your feedback. We appreciate your input!",
          icon: "success",
          confirmButtonColor: "#a32424",
        });
        setEmail("");
        setMessage("");
      } else {
        Swal.fire("Error", data.error || "Failed to send feedback.", "error");
      }
    } catch (err) {
      console.error("❌ Error sending feedback:", err);
      Swal.fire("Error", "Network or server issue occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full bg-gray-200 text-center px-6 py-10">
      <h2 className="text-2xl font-bold mb-8 text-black">
        HAVE SUGGESTION / FEEDBACK?
      </h2>

      <div className="max-w-2xl mx-auto bg-[#a32424] rounded-2xl p-5">
        <form
          onSubmit={handleSubmit}
          className="bg-gray-200 rounded-xl p-4 flex flex-col relative"
        >
          {/* Email Field */}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-100 text-black rounded-full px-4 py-2 text-sm font-semibold border-2 border-[#a32424] focus:outline-none mb-3"
          />

          {/* Feedback Textarea */}
          <textarea
            placeholder="Type here your inquiry..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-gray-100 text-black rounded-xl border-2 border-[#a32424] h-48 resize-none focus:outline-none p-3 text-sm"
          ></textarea>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`absolute bottom-5 right-5 text-white text-sm font-semibold px-5 py-2 rounded-full transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#a32424] hover:bg-[#8e1f1f]"
            }`}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}
