export default function Section2() {
  return (
    <section className="w-full bg-[#a32424] text-white text-center px-6 py-10">
      {/* 🔹 Title */}
      <h2 className="text-2xl font-bold mb-2">WHAT IS EIM?</h2>
      <p className="text-sm mb-4">
        Electrical Installation and Maintenance (EIM) focuses on helping students understand electrical systems,
        safety, and practical skills through fun learning and gamified challenges!
      </p>

      {/* 🔹 YouTube Embed (autoplay, loop, muted, new video) */}
      <div className="w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-lg mb-6">
        <div className="relative pb-[56.25%] h-0">
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src="https://www.youtube.com/embed/Lx_V_9VJyzM?autoplay=1&mute=1&loop=1&playlist=Lx_V_9VJyzM&controls=1&modestbranding=1&rel=0"
            title="What is EI?"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/* 🔹 QR Code Section */}
      <div className="flex flex-col items-center mt-4">
        <p className="text-sm mb-2 italic">To download the app, scan here:</p>
        <img
          src="/resources/EIM.png"
          alt="EIM App QR Code"
          className="w-32 h-32 object-contain rounded-md shadow-md bg-white p-2 hover:scale-105 transition-transform duration-300"
        />
        <a
          href="https://drive.google.com/uc?export=download&id=1-bEoE-UVQZmZ3jDRVPM7lE80V6Mocn4N"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-sm underline hover:text-gray-200"
        >
          Or tap here to download directly
        </a>
      </div>
    </section>
  );
}
