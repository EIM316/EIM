export default function Section5() {
  return (
    <section className="w-full bg-gray-200 text-center px-6 py-10">
      <h2 className="text-2xl font-bold mb-8 text-black">
        HAVE SUGGESTION / FEEDBACK?
      </h2>

      <div className="max-w-2xl mx-auto bg-[#a32424] rounded-2xl p-5">
        <form className="bg-gray-200 rounded-xl p-4 flex flex-col relative">
          {/* Email Field */}
          <input
            type="email"
            placeholder="Email Address"
            className="w-full bg-gray-100 text-black rounded-full px-4 py-2 text-sm font-semibold border-2 border-[#a32424] focus:outline-none mb-3"
          />

          {/* Feedback Textarea */}
          <textarea
            placeholder="Type here your inquiry..."
            className="w-full bg-gray-100 text-black rounded-xl border-2 border-[#a32424] h-48 resize-none focus:outline-none p-3 text-sm"
          ></textarea>

          {/* Submit Button */}
          <button
            type="submit"
            className="absolute bottom-5 right-5 bg-[#a32424] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#8e1f1f] transition"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
