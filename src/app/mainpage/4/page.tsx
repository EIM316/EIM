import Link from "next/link";

export default function Section4() {
  return (
    <section className="w-full bg-[#a32424] text-white px-6 py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
        START NOW WITH 3 BASIC STEPS!
      </h2>

      <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto">
        {/* LEFT SIDE – Text Steps */}
        <div className="flex flex-col space-y-6 w-full md:w-1/2">
          {/* Step 1 */}
          <div className="flex items-center gap-4">
            <div className="min-w-[3rem] min-h-[3rem] w-12 h-12 flex items-center justify-center rounded-full bg-white text-[#a32424] font-bold text-xl shadow-md">
              1
            </div>
            
<p className="font-semibold text-base md:text-lg leading-snug">
  Click{" "}
  <Link href="/registration" className="underline cursor-pointer text-blue-600 hover:text-blue-800">
    HERE
  </Link>{" "}
  to start creating your account
</p>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-4">
            <div className="min-w-[3rem] min-h-[3rem] w-12 h-12 flex items-center justify-center rounded-full bg-white text-[#a32424] font-bold text-xl shadow-md">
              2
            </div>
            <p className="font-semibold text-base md:text-lg leading-snug">
              Login your account
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-4">
            <div className="min-w-[3rem] min-h-[3rem] w-12 h-12 flex items-center justify-center rounded-full bg-white text-[#a32424] font-bold text-xl shadow-md">
              3
            </div>
            <p className="font-semibold text-base md:text-lg leading-snug">
              Choose <a className="underline cursor-pointer">START</a> to begin your journey and earn those badges!
            </p>
          </div>
        </div>

        {/* RIGHT SIDE – Image */}
        <div className="w-full md:w-1/2 flex justify-center mt-10 md:mt-0">
          <img
            src="/resources/others/game.png"
            alt="Boy character"
            className="w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 object-contain drop-shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}
