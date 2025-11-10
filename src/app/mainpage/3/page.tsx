export default function Section3() {
  return (
    <section className="w-full bg-white text-center px-6 py-10">
      <h2 className="text-2xl font-bold mb-4 text-[#a32424]">LEADERBOARD & BADGES</h2>
      <p className="text-sm text-gray-700 mb-6">

        Show your potential and collect exciting badges that you can flex to your friends
        and classmates by doing your best and reach the top of the leaderboard !
      </p>

      {/* Badges */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <img
            key={n}
            src={`/resources/badges/${n}.png`}
            alt={`Badge ${n}`}
            className="w-16 h-16 object-contain"
          />
        ))}
      </div>

      {/* Leaderboard Image */}
      <div className="flex justify-center">
        <img
          src="/resources/ranking.png"
          alt="Leaderboard"
          className="w-50 max-w-lg rounded-lg shadow-md object-contain"
        />
      </div>
    </section>
  );
}
