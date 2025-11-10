import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const module_id = searchParams.get("module_id");

    if (!module_id) {
      console.log("❌ Missing module_id in request");
      return new Response(
        JSON.stringify({ success: false, error: "Missing module_id parameter." }),
        { status: 400 }
      );
    }

    console.log("📦 Fetching slides for module_id:", module_id);

    // ✅ Get latest slides for this module
    const moduleSlides = await prisma.moduleSlides.findFirst({
      where: { module_id: Number(module_id) },
      orderBy: { created_at: "desc" },
    });

    if (!moduleSlides) {
      console.log("⚠️ No slides found for module:", module_id);
      return new Response(
        JSON.stringify({ success: false, error: "No slides found for this module." }),
        { status: 404 }
      );
    }

    console.log("✅ Raw slides_data from DB:", moduleSlides.slides_data);

    // ✅ Parse JSON
    const slidesData =
      typeof moduleSlides.slides_data === "string"
        ? JSON.parse(moduleSlides.slides_data)
        : moduleSlides.slides_data;

    console.log("📊 Parsed slidesData object:", slidesData);

    // ✅ Convert to clean array
    const slidesArray = Array.isArray(slidesData.slides)
      ? slidesData.slides.map((slide, index) => ({
          id: slide.id || index,
          background: slide.background || "",
          timer: slide.timer || 5,
          isQuiz: slide.isQuiz || false,
          isRefresher: slide.isRefresher || false,
          question: slide.question || "",
          options: slide.options || [],
          correctAnswer: slide.correctAnswer || "",
          points: slide.points || 0,
        }))
      : [];

    console.log("🧩 Parsed slidesArray length:", slidesArray.length);
    console.log("🧩 Example slide object:", slidesArray[0]);

    // ✅ Compute total points
    let max_points = 0;

    // 1️⃣ Case: explicit "points" field (your DB uses this)
    if (slidesData.points) {
      max_points = slidesData.points;
      console.log("🧮 Using slidesData.points:", max_points);
    } 
    // 2️⃣ Case: explicit "max_points"
    else if (slidesData.max_points) {
      max_points = slidesData.max_points;
      console.log("🧮 Using slidesData.max_points:", max_points);
    } 
    // 3️⃣ Fallback: sum all slide points
    else {
      max_points = slidesArray.reduce((sum, s) => sum + (s.points || 0), 0);
      console.log("🧮 Summed all slide.points → max_points:", max_points);
    }

    console.log("✅ FINAL max_points computed:", max_points);

    return new Response(
      JSON.stringify({
        success: true,
        moduleName: slidesData.moduleName || "Unnamed Module",
        slides: slidesArray,
        max_points,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching slides:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error.",
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
